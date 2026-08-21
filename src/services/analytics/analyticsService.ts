import { prisma } from "@/lib/prisma";

const GAP_STATUSES = new Set(["MISSING", "WEAK", "PARTIAL", "CONFLICTING"]);

type CoverageBand = "0-49" | "50-69" | "70-84" | "85-100";

function coverageBand(value: number | null): CoverageBand {
  const score = value ?? 0;
  if (score < 50) return "0-49";
  if (score < 70) return "50-69";
  if (score < 85) return "70-84";
  return "85-100";
}

function emptyBands(): Record<CoverageBand, number> {
  return { "0-49": 0, "50-69": 0, "70-84": 0, "85-100": 0 };
}

export async function getRecruitingAnalytics(companyId?: string | null) {
  const jobWhere = companyId ? { companyId } : {};
  const jobs = await prisma.job.findMany({
    where: jobWhere,
    include: {
      createdBy: true,
      requirements: { where: { recruiterApproved: true } },
      applications: {
        include: {
          evaluations: true,
          evidence: true,
          offers: true,
          stageEvents: true,
          interviews: true,
          candidate: { include: { user: true } },
        },
      },
    },
  });
  const applications = jobs.flatMap((job) => job.applications.map((application) => ({ job, application })));
  const stageCounts: Record<string, number> = {};
  const candidateSources: Record<string, number> = {};
  for (const { application } of applications) {
    stageCounts[application.stage] = (stageCounts[application.stage] ?? 0) + 1;
    candidateSources[application.source] = (candidateSources[application.source] ?? 0) + 1;
  }

  const offers = applications.flatMap(({ application }) => application.offers);
  const interviews = applications.flatMap(({ application }) => application.interviews);
  const completedInterviews = interviews.filter((interview) => interview.status === "COMPLETED").length;
  const acceptedOffers = offers.filter((offer) => offer.status === "ACCEPTED").length;
  const respondedOffers = offers.filter((offer) => ["ACCEPTED", "REJECTED"].includes(offer.status)).length;

  const hireDurations = applications.flatMap(({ application }) => {
    const hired = application.stageEvents.filter((event) => event.toStage === "HIRED").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    return hired ? [(hired.createdAt.getTime() - application.createdAt.getTime()) / 86_400_000] : [];
  });

  const gaps = new Map<string, { name: string; count: number; mustHaveCount: number }>();
  const redundancy = new Map<string, { name: string; count: number }>();
  for (const { job, application } of applications) {
    const requirementMap = new Map(job.requirements.map((requirement) => [requirement.id, requirement]));
    for (const evaluation of application.evaluations) {
      const requirement = requirementMap.get(evaluation.requirementId);
      if (!requirement) continue;
      if (GAP_STATUSES.has(evaluation.status)) {
        const current = gaps.get(requirement.name) ?? { name: requirement.name, count: 0, mustHaveCount: 0 };
        current.count += 1;
        if (requirement.priority === "MUST_HAVE") current.mustHaveCount += 1;
        gaps.set(requirement.name, current);
      }
    }
    const sourcesByRequirement = new Map<string, Set<string>>();
    for (const evidence of application.evidence) {
      const set = sourcesByRequirement.get(evidence.requirementId) ?? new Set<string>();
      set.add(evidence.sourceType); sourcesByRequirement.set(evidence.requirementId, set);
    }
    for (const [requirementId, sources] of sourcesByRequirement) {
      if (sources.size < 3) continue;
      const requirement = requirementMap.get(requirementId); if (!requirement) continue;
      const current = redundancy.get(requirement.name) ?? { name: requirement.name, count: 0 };
      current.count += 1; redundancy.set(requirement.name, current);
    }
  }

  const fitBands = emptyBands();
  const evidenceBands = emptyBands();
  const decisionBands = emptyBands();
  for (const { application } of applications) {
    fitBands[coverageBand(application.fitScore)] += 1;
    evidenceBands[coverageBand(application.evidenceCoverage)] += 1;
    decisionBands[coverageBand(application.decisionCoverage)] += 1;
  }

  const evidenceRiskCandidates = applications
    .filter(({ application }) => (application.fitScore ?? 0) >= 70 && (application.fitScore ?? 0) - (application.evidenceCoverage ?? 0) >= 15)
    .map(({ job, application }) => ({
      applicationId: application.id,
      candidate: application.candidate.user.name,
      job: job.title,
      fitScore: application.fitScore ?? 0,
      evidenceCoverage: application.evidenceCoverage ?? 0,
      decisionCoverage: application.decisionCoverage ?? 0,
      gap: (application.fitScore ?? 0) - (application.evidenceCoverage ?? 0),
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 8);

  return {
    coverageBands: { fit: fitBands, evidence: evidenceBands, decision: decisionBands },
    evidenceRiskCandidates,
    totals: {
      jobs: jobs.length,
      applications: applications.length,
      hired: stageCounts.HIRED ?? 0,
      rejected: stageCounts.REJECTED ?? 0,
      activeOffers: offers.filter((offer) => offer.status === "SENT").length,
    },
    stageCounts,
    offerAcceptanceRate: respondedOffers ? (acceptedOffers / respondedOffers) * 100 : 0,
    averageTimeToHireDays: hireDurations.length ? hireDurations.reduce((sum, days) => sum + days, 0) / hireDurations.length : 0,
    interviewCompletionRate: interviews.length ? (completedInterviews / interviews.length) * 100 : 0,
    candidateSources,
    recruiterPerformance: jobs.map((job) => ({ recruiter: job.createdBy.name, jobs: 1, applications: job.applications.length, hires: job.applications.filter((application) => application.stage === "HIRED").length }))
      .reduce<Array<{ recruiter: string; jobs: number; applications: number; hires: number }>>((acc, item) => {
        const found = acc.find((row) => row.recruiter === item.recruiter);
        if (found) { found.jobs += 1; found.applications += item.applications; found.hires += item.hires; } else acc.push(item);
        return acc;
      }, []).sort((a, b) => b.applications - a.applications),
    evidenceGaps: [...gaps.values()].sort((a, b) => b.mustHaveCount - a.mustHaveCount || b.count - a.count).slice(0, 10),
    evaluationRedundancy: [...redundancy.values()].sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
