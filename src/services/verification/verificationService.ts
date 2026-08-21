import { prisma } from "@/lib/prisma";
import { planVerifications } from "@/services/verificationPlanner";
import { DEFAULT_VERIFICATION_TEMPLATES } from "./templates";
import type { CriterionEvaluation, JobRequirement } from "@/domain/types";
import type { CriterionStatus, EvidenceStrength, RequirementCategory, RequirementPriority } from "@/domain/enums";

function requirementToDomain(r: {
  id: string; name: string; description: string | null; category: RequirementCategory; priority: RequirementPriority;
  weight: number; minimumEvidenceLevel: EvidenceStrength; verificationRequired: boolean; recruiterApproved: boolean;
}): JobRequirement {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    category: r.category as RequirementCategory,
    priority: r.priority as RequirementPriority,
    weight: r.weight,
    minimumEvidenceLevel: r.minimumEvidenceLevel as EvidenceStrength,
    verificationRequired: r.verificationRequired,
    recruiterApproved: r.recruiterApproved,
  };
}

function evaluationToDomain(e: {
  requirementId: string; fitScore: number; evidenceCoverage: number; status: CriterionStatus;
  supportScore: number; contradictionScore: number; evidenceCount: number; independentSourceCount: number;
}): CriterionEvaluation {
  return {
    requirementId: e.requirementId,
    fitScore: e.fitScore,
    evidenceCoverage: e.evidenceCoverage,
    status: e.status as CriterionStatus,
    supportScore: e.supportScore,
    contradictionScore: e.contradictionScore,
    evidenceCount: e.evidenceCount,
    independentSourceCount: e.independentSourceCount,
  };
}

export async function planApplicationVerifications(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { requirements: true } }, evaluations: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  if (!application.evaluations.length) throw new Response("Run evidence analysis first", { status: 409 });

  const requirements = application.job.requirements.map(requirementToDomain);
  const evaluations = application.evaluations.map(evaluationToDomain);
  const recommendations = planVerifications(requirements, evaluations, DEFAULT_VERIFICATION_TEMPLATES)
    .filter((x) => x.priorityScore > 0)
    .slice(0, 5);

  await prisma.verificationItem.deleteMany({
    where: { applicationId, status: "RECOMMENDED" },
  });
  if (recommendations.length) {
    await prisma.verificationItem.createMany({
      data: recommendations.map((r) => ({
        applicationId,
        requirementId: r.requirementId,
        reason: r.reason,
        method: r.method,
        templateId: r.templateId,
        priorityScore: r.priorityScore,
        status: "RECOMMENDED",
      })),
    });
  }
  return recommendations;
}
