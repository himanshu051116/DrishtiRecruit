import { prisma } from "@/lib/prisma";

export async function getJobComparison(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      requirements: { where: { recruiterApproved: true }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
      applications: {
        include: {
          candidate: { include: { user: true } },
          evaluations: true,
          evidence: true,
        },
        orderBy: [{ decisionCoverage: "desc" }, { fitScore: "desc" }],
      },
    },
  });
  if (!job) throw new Response("Job not found", { status: 404 });

  return {
    job: { id: job.id, title: job.title, companyId: job.companyId },
    requirements: job.requirements.map((r) => ({ id: r.id, name: r.name, priority: r.priority })),
    candidates: job.applications.map((application) => {
      const evaluationMap = new Map(application.evaluations.map((item) => [item.requirementId, item]));
      const evidenceByRequirement = new Map<string, Set<string>>();
      for (const evidence of application.evidence) {
        const set = evidenceByRequirement.get(evidence.requirementId) ?? new Set<string>();
        set.add(evidence.sourceType);
        evidenceByRequirement.set(evidence.requirementId, set);
      }
      return {
        applicationId: application.id,
        name: application.candidate.user.name,
        email: application.candidate.user.email,
        stage: application.stage,
        fitScore: application.fitScore ?? 0,
        evidenceCoverage: application.evidenceCoverage ?? 0,
        decisionCoverage: application.decisionCoverage ?? 0,
        criteria: job.requirements.map((requirement) => {
          const evaluation = evaluationMap.get(requirement.id);
          return {
            requirementId: requirement.id,
            status: evaluation?.status ?? "MISSING",
            fitScore: evaluation?.fitScore ?? 0,
            evidenceCoverage: evaluation?.evidenceCoverage ?? 0,
            independentSources: evidenceByRequirement.get(requirement.id)?.size ?? 0,
          };
        }),
      };
    }),
  };
}
