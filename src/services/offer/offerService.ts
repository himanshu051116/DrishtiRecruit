import { prisma } from "@/lib/prisma";
import { notifyCompanyRoles, notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";

export async function createAndSendOffer(input: {
  applicationId: string;
  actorId: string;
  roleTitle: string;
  salary?: number;
  joiningDate?: string;
  location?: string;
  benefits: string[];
}) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { candidate: { include: { user: true } }, job: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  if (application.stage !== "OFFER") throw new Response("Application must be in offer stage", { status: 409 });
  const activeOffer = await prisma.offerLetter.findFirst({ where: { applicationId: application.id, status: "SENT" } });
  if (activeOffer) throw new Response("An active offer already exists for this application", { status: 409 });

  const offer = await prisma.offerLetter.create({
    data: {
      applicationId: application.id,
      roleTitle: input.roleTitle,
      salary: input.salary,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
      location: input.location,
      benefits: input.benefits,
      status: "SENT",
      sentAt: new Date(),
    },
  });
  await notifyUser(application.candidate.userId, "OFFER_SENT", `${application.job.title}: offer received`, "A new offer letter is available in your DrishtiRecruit candidate portal.");
  await sendTransactionalEmail({ to: application.candidate.user.email, subject: `${application.job.title}: offer received`, text: "A new offer letter is available in your DrishtiRecruit candidate portal.", template: "OFFER_SENT" });
  return offer;
}

export async function respondToOffer(input: { offerId: string; candidateUserId: string; action: "ACCEPT" | "REJECT" }) {
  const offer = await prisma.offerLetter.findUnique({
    where: { id: input.offerId },
    include: { application: { include: { candidate: { include: { user: true } }, job: true } } },
  });
  if (!offer || offer.application.candidate.userId !== input.candidateUserId) throw new Response("Offer not found", { status: 404 });
  if (offer.status !== "SENT") throw new Response("Offer has already been answered", { status: 409 });
  if (offer.application.stage !== "OFFER") throw new Response("Application is no longer in the offer stage", { status: 409 });

  const status = input.action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.offerLetter.updateMany({
      where: { id: offer.id, status: "SENT" },
      data: { status, respondedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Response("Offer was answered concurrently; refresh and retry", { status: 409 });

    if (input.action === "ACCEPT") {
      const stageChanged = await tx.application.updateMany({
        where: { id: offer.applicationId, stage: "OFFER" },
        data: { stage: "HIRED" },
      });
      if (stageChanged.count !== 1) throw new Response("Application state changed while the offer was being accepted", { status: 409 });
      await tx.applicationStageEvent.create({
        data: { applicationId: offer.applicationId, fromStage: "OFFER", toStage: "HIRED", actorId: input.candidateUserId, reason: "Candidate accepted offer" },
      });
      await tx.offerLetter.updateMany({
        where: { applicationId: offer.applicationId, id: { not: offer.id }, status: "SENT" },
        data: { status: "WITHDRAWN", respondedAt: new Date() },
      });
    }
    return tx.offerLetter.findUniqueOrThrow({ where: { id: offer.id } });
  }, { isolationLevel: "Serializable" });

  if (input.action === "ACCEPT") {
    const joiningParts = [
      `Your offer for ${offer.roleTitle} has been accepted.`,
      offer.joiningDate ? `Joining date: ${offer.joiningDate.toLocaleDateString()}.` : null,
      offer.location ? `Location: ${offer.location}.` : null,
      "The hiring team will contact you if any additional onboarding documents are required.",
    ].filter(Boolean).join(" ");
    await notifyUser(offer.application.candidate.userId, "JOINING_INSTRUCTIONS", `${offer.application.job.title}: joining instructions`, joiningParts);
    await sendTransactionalEmail({ to: offer.application.candidate.user.email, subject: `${offer.application.job.title}: joining instructions`, text: joiningParts, template: "JOINING_INSTRUCTIONS" });
  }
  await notifyCompanyRoles(offer.application.job.companyId, ["RECRUITER", "HIRING_MANAGER"], "OFFER_RESPONSE", `${offer.application.job.title}: offer ${status.toLowerCase()}`, `The candidate has ${status.toLowerCase()} the offer.`);
  return updated;
}
