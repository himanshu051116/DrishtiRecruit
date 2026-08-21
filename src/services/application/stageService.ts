import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";

import { canForceTransition, canTransition, type Stage } from "@/services/application/stagePolicy";

export async function transitionApplicationStage(input: {
  applicationId: string;
  toStage: Stage;
  actorId?: string;
  reason?: string;
  force?: boolean;
  notifyCandidate?: boolean;
}) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { candidate: { include: { user: true } }, job: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  const fromStage = application.stage as Stage;
  const transitionAllowed = input.force
    ? canForceTransition(fromStage, input.toStage)
    : canTransition(fromStage, input.toStage);
  if (!transitionAllowed) {
    throw new Response(`Invalid stage transition: ${fromStage} -> ${input.toStage}`, { status: 409 });
  }
  if (fromStage === input.toStage) return application;

  const updated = await prisma.$transaction(async (tx) => {
    // Optimistic stage guard: only the caller that still observes fromStage may transition it.
    // This prevents two concurrent workflow actions from both recording incompatible stage events.
    const changed = await tx.application.updateMany({
      where: { id: application.id, stage: fromStage },
      data: { stage: input.toStage },
    });
    if (changed.count !== 1) throw new Response("Application stage changed concurrently; refresh and retry", { status: 409 });
    await tx.applicationStageEvent.create({
      data: { applicationId: application.id, fromStage, toStage: input.toStage, actorId: input.actorId, reason: input.reason?.trim() || null },
    });
    return tx.application.findUniqueOrThrow({ where: { id: application.id } });
  });

  if (input.notifyCandidate !== false) {
    const subject = `${application.job.title}: application updated`;
    const body = `Your application moved from ${fromStage.replaceAll("_", " ")} to ${input.toStage.replaceAll("_", " ")}.`;
    await notifyUser(application.candidate.userId, "APPLICATION_STAGE", subject, body);
    await sendTransactionalEmail({ to: application.candidate.user.email, subject, text: body, template: "APPLICATION_STAGE" });
  }
  return updated;
}
