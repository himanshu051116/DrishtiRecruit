import { prisma } from "@/lib/prisma";
import { calculateDecisionCoverage } from "@/services/decisionCoverage";
import { extractResumeEvidence } from "@/services/ai/evidenceExtractor";
import type { EvidenceItem, JobRequirement } from "@/domain/types";
import type { EvidenceSourceType, EvidenceStrength, RequirementCategory, RequirementPriority } from "@/domain/enums";
import { transitionApplicationStage } from "@/services/application/stageService";
import { canForceTransition, type Stage } from "@/services/application/stagePolicy";

function asDomainRequirement(r: {
  id: string; name: string; description: string | null; category: RequirementCategory; priority: RequirementPriority;
  weight: number; minimumEvidenceLevel: EvidenceStrength; verificationRequired: boolean; recruiterApproved: boolean;
}): JobRequirement {
  return { id: r.id, name: r.name, description: r.description ?? undefined, category: r.category as RequirementCategory, priority: r.priority as RequirementPriority, weight: r.weight, minimumEvidenceLevel: r.minimumEvidenceLevel as EvidenceStrength, verificationRequired: r.verificationRequired, recruiterApproved: r.recruiterApproved };
}

function asDomainEvidence(e: {
  id: string; requirementId: string; sourceType: EvidenceSourceType; sourceId: string | null; sourceExcerpt: string | null;
  strength: EvidenceStrength; confidence: number; supportsRequirement: boolean; contradictsRequirement: boolean; verified: boolean;
}): EvidenceItem {
  return { id: e.id, requirementId: e.requirementId, sourceType: e.sourceType as EvidenceSourceType, sourceId: e.sourceId ?? undefined, sourceExcerpt: e.sourceExcerpt ?? undefined, strength: e.strength as EvidenceStrength, confidence: e.confidence, supportsRequirement: e.supportsRequirement, contradictsRequirement: e.contradictsRequirement, verified: e.verified };
}

export async function analyseApplication(applicationId: string, resumeTextOverride?: string, actorId?: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { requirements: true } }, resume: true, evidence: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });

  const requirements = application.job.requirements.filter((r) => r.recruiterApproved).map(asDomainRequirement);
  if (!requirements.length) throw new Response("No recruiter-approved requirements", { status: 409 });

  const resumeText = resumeTextOverride ?? application.resume?.parsedText ?? "";
  if (!resumeText.trim()) throw new Response("Resume text is required for analysis", { status: 400 });

  const extracted = await extractResumeEvidence(resumeText, requirements, { companyId: application.job.companyId, jobId: application.jobId, applicationId, actorId });
  await prisma.evidenceItem.deleteMany({ where: { applicationId, sourceType: "RESUME" } });
  if (extracted.length) {
    await prisma.evidenceItem.createMany({
      data: extracted.map((e) => ({ applicationId, ...e })),
    });
  }

  return recalculateApplicationCoverage(applicationId, "RESUME_SCREENING");
}

export async function recalculateApplicationCoverage(applicationId: string, stage?: "RESUME_SCREENING" | "ASSESSMENT" | "TECHNICAL_INTERVIEW" | "HR_INTERVIEW") {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { requirements: true } }, evidence: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  const requirements = application.job.requirements.filter((r) => r.recruiterApproved).map(asDomainRequirement);
  const result = calculateDecisionCoverage(requirements, application.evidence.map(asDomainEvidence));
  await prisma.$transaction([
    prisma.criterionEvaluation.deleteMany({ where: { applicationId } }),
    ...result.criteria.map((c) => prisma.criterionEvaluation.create({ data: { applicationId, ...c } })),
    prisma.application.update({
      where: { id: applicationId },
      data: { fitScore: result.fitScore, evidenceCoverage: result.evidenceCoverage, decisionCoverage: result.decisionCoverage },
    }),
  ]);
  if (stage && application.stage !== stage && canForceTransition(application.stage as Stage, stage)) {
    await transitionApplicationStage({ applicationId, toStage: stage, reason: "Evidence coverage recalculated", force: true, notifyCandidate: false });
  }
  return result;
}

export async function getEvidenceMatrix(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { requirements: { where: { recruiterApproved: true }, orderBy: { createdAt: "asc" } } } },
      candidate: { include: { user: true } },
      evidence: true,
      evaluations: true,
    },
  });
  if (!app) throw new Response("Application not found", { status: 404 });
  const evalMap = new Map(app.evaluations.map((e) => [e.requirementId, e]));
  return {
    application: { id: app.id, stage: app.stage, fitScore: app.fitScore ?? 0, evidenceCoverage: app.evidenceCoverage ?? 0, decisionCoverage: app.decisionCoverage ?? 0 },
    candidate: { id: app.candidateId, name: app.candidate.user.name, email: app.candidate.user.email },
    job: { id: app.jobId, title: app.job.title },
    requirements: app.job.requirements.map((r) => ({
      id: r.id, name: r.name, priority: r.priority,
      evaluation: evalMap.get(r.id) ?? null,
      evidence: app.evidence.filter((e) => e.requirementId === r.id).map((e) => ({ id: e.id, sourceType: e.sourceType, sourceExcerpt: e.sourceExcerpt, strength: e.strength as EvidenceStrength, confidence: e.confidence, verified: e.verified })),
    })),
  };
}
