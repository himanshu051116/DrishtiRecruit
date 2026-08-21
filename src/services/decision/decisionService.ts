import { prisma } from "@/lib/prisma";
import { DecisionReadiness } from "@/domain/enums";
import { recalculateApplicationCoverage, getEvidenceMatrix } from "@/services/application/applicationService";
import { canForceTransition, type Stage } from "@/services/application/stagePolicy";
import { notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { sha256Json } from "@/lib/integrity/canonicalJson";

export async function getDecisionReadiness(applicationId: string) {
  const coverage = await recalculateApplicationCoverage(applicationId);
  const matrix = await getEvidenceMatrix(applicationId);
  const systemRecommendation = coverage.readiness === DecisionReadiness.READY
    ? "READY_FOR_HUMAN_DECISION"
    : coverage.readiness === DecisionReadiness.REVIEW_REQUIRED
      ? "HUMAN_REVIEW_REQUIRED"
      : "MORE_EVIDENCE_RECOMMENDED";
  return { coverage, matrix, systemRecommendation };
}

export async function createDecision(input: { applicationId: string; decisionOwnerId: string; humanDecision: "HIRE" | "REJECT" | "HOLD"; overrideReason?: string }) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { candidate: { include: { user: true } }, job: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  if (["HIRED", "REJECTED"].includes(application.stage)) throw new Response("A terminal application cannot receive another hiring decision", { status: 409 });

  const state = await getDecisionReadiness(input.applicationId);
  const override = input.humanDecision !== "HOLD" && state.coverage.readiness !== DecisionReadiness.READY;
  if (override && !input.overrideReason?.trim()) throw new Response("An override reason is required while decision coverage is incomplete", { status: 400 });

  const evidenceSnapshot = {
    capturedAt: new Date().toISOString(),
    fitScore: state.coverage.fitScore,
    evidenceCoverage: state.coverage.evidenceCoverage,
    decisionCoverage: state.coverage.decisionCoverage,
    readiness: state.coverage.readiness,
    verifiedMustHaves: state.coverage.verifiedMustHaves,
    totalMustHaves: state.coverage.totalMustHaves,
    unresolvedMustHaves: state.coverage.unresolvedMustHaves,
    conflictingMustHaves: state.coverage.conflictingMustHaves,
    criteria: state.matrix.requirements.map((r) => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      evaluation: r.evaluation ? { status: r.evaluation.status, fitScore: r.evaluation.fitScore, evidenceCoverage: r.evaluation.evidenceCoverage } : null,
      evidenceCount: r.evidence.length,
    })),
  };

  const evidenceSnapshotSha256 = sha256Json(evidenceSnapshot);

  const targetStage: Stage | null = input.humanDecision === "HIRE"
    ? "OFFER"
    : input.humanDecision === "REJECT"
      ? "REJECTED"
      : null;

  // Decision record + workflow transition are committed atomically. This avoids
  // a race where a DecisionTrace exists for a transition that failed (or vice versa).
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.application.findUnique({ where: { id: input.applicationId }, select: { stage: true } });
    if (!current) throw new Response("Application not found", { status: 404 });
    const fromStage = current.stage as Stage;
    if (fromStage === "HIRED" || fromStage === "REJECTED") {
      throw new Response("A terminal application cannot receive another hiring decision", { status: 409 });
    }
    if (targetStage && !canForceTransition(fromStage, targetStage)) {
      throw new Response(`Invalid decision transition: ${fromStage} -> ${targetStage}`, { status: 409 });
    }

    const decision = await tx.decisionRecord.create({
      data: {
        applicationId: input.applicationId,
        systemRecommendation: state.systemRecommendation,
        decisionCoverage: state.coverage.decisionCoverage,
        evidenceSnapshot,
        humanDecision: input.humanDecision,
        decisionOwnerId: input.decisionOwnerId,
        override,
        overrideReason: input.overrideReason?.trim() || null,
        evidenceSnapshotSha256,
      },
    });

    if (targetStage && targetStage !== fromStage) {
      const changed = await tx.application.updateMany({
        where: { id: input.applicationId, stage: fromStage },
        data: { stage: targetStage },
      });
      if (changed.count !== 1) throw new Response("Application changed concurrently; refresh and retry", { status: 409 });
      await tx.applicationStageEvent.create({
        data: {
          applicationId: input.applicationId,
          fromStage,
          toStage: targetStage,
          actorId: input.decisionOwnerId,
          reason: input.humanDecision === "HIRE" ? "Human hiring decision: proceed to offer" : "Human hiring decision: reject",
        },
      });
    }

    return { decision, fromStage, targetStage };
  }, { isolationLevel: "Serializable" });

  if (result.targetStage && result.targetStage !== result.fromStage) {
    const subject = `${application.job.title}: application updated`;
    const body = `Your application moved from ${result.fromStage.replaceAll("_", " ")} to ${result.targetStage.replaceAll("_", " ")}.`;
    await notifyUser(application.candidate.userId, "APPLICATION_STAGE", subject, body);
    await sendTransactionalEmail({ to: application.candidate.user.email, subject, text: body, template: "APPLICATION_STAGE" });
  }

  return { decision: result.decision, state };
}
