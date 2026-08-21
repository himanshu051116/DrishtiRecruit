import { prisma } from "@/lib/prisma";
import { buildInterviewKit, sendInterviewNotifications } from "@/services/interview/interviewService";
import { transitionApplicationStage } from "@/services/application/stageService";
import { getPlatformSettings } from "@/services/settings/platformSettings";
import { intervalEnd, intervalsOverlap } from "@/services/interview/schedulingPolicy";

export async function createAvailabilitySlot(input: {
  companyId: string;
  interviewerId: string;
  createdById: string;
  startsAt: Date;
  endsAt: Date;
  meetingUrl?: string;
  mode?: string;
}) {
  if (input.startsAt <= new Date()) throw new Response("Availability must be in the future", { status: 400 });
  if (input.endsAt <= input.startsAt) throw new Response("End time must be after start time", { status: 400 });
  if (input.endsAt.getTime() - input.startsAt.getTime() > 4 * 60 * 60 * 1000) {
    throw new Response("Availability slots cannot exceed four hours", { status: 400 });
  }

  const interviewer = await prisma.user.findUnique({ where: { id: input.interviewerId } });
  if (!interviewer || interviewer.role !== "INTERVIEWER" || interviewer.companyId !== input.companyId || !interviewer.isActive) {
    throw new Response("Active interviewer from the same company required", { status: 400 });
  }

  const nearbyInterviews = await prisma.interview.findMany({
    where: {
      interviewerId: input.interviewerId,
      status: "SCHEDULED",
      scheduledAt: { gte: new Date(input.startsAt.getTime() - 4 * 60 * 60 * 1000), lt: input.endsAt },
    },
    select: { scheduledAt: true, durationMin: true },
  });
  const interviewOverlap = nearbyInterviews.some((interview) => {
    const interviewEnd = intervalEnd(interview.scheduledAt, interview.durationMin);
    return intervalsOverlap(input.startsAt, input.endsAt, interview.scheduledAt, interviewEnd);
  });
  if (interviewOverlap) throw new Response("This interviewer already has a scheduled interview during the requested slot", { status: 409 });

  const overlap = await prisma.interviewAvailabilitySlot.findFirst({
    where: {
      interviewerId: input.interviewerId,
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
  });
  if (overlap) throw new Response("This interviewer already has overlapping availability", { status: 409 });

  return prisma.interviewAvailabilitySlot.create({
    data: {
      companyId: input.companyId,
      interviewerId: input.interviewerId,
      createdById: input.createdById,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      meetingUrl: input.meetingUrl,
      mode: input.mode ?? "VIDEO",
    },
    include: { interviewer: { select: { id: true, name: true, email: true } } },
  });
}

export async function listOpenSlots(companyId: string, from = new Date()) {
  return prisma.interviewAvailabilitySlot.findMany({
    where: { companyId, bookedInterviewId: null, startsAt: { gt: from } },
    include: { interviewer: { select: { id: true, name: true, email: true } } },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
}

export async function deleteAvailabilitySlot(slotId: string, actorId: string, companyId: string) {
  const slot = await prisma.interviewAvailabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.companyId !== companyId) throw new Response("Availability slot not found", { status: 404 });
  if (slot.bookedInterviewId) throw new Response("Booked availability cannot be deleted", { status: 409 });
  if (slot.createdById !== actorId) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || !["RECRUITER", "HIRING_MANAGER", "ADMIN"].includes(actor.role)) {
      throw new Response("Only the creator or hiring team can delete this slot", { status: 403 });
    }
  }
  await prisma.interviewAvailabilitySlot.delete({ where: { id: slotId } });
}

export async function bookAvailabilitySlot(input: {
  applicationId: string;
  candidateUserId: string;
  slotId: string;
  type?: string;
}) {
  const platform = await getPlatformSettings();
  if (!platform.candidateSelfSchedulingEnabled) throw new Response("Candidate self-scheduling is disabled by the platform administrator", { status: 409 });

  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { candidate: true, job: true, interviews: { where: { status: "SCHEDULED" } } },
  });
  if (!application || application.candidate.userId !== input.candidateUserId) {
    throw new Response("Application not found", { status: 404 });
  }
  if (["OFFER", "HIRED", "REJECTED"].includes(application.stage)) {
    throw new Response("Interview scheduling is closed for this application", { status: 409 });
  }
  if (application.interviews.length > 0) throw new Response("An interview is already scheduled", { status: 409 });

  const { kit } = await buildInterviewKit(input.applicationId);

  const result = await prisma.$transaction(async (tx) => {
    const slot = await tx.interviewAvailabilitySlot.findUnique({ where: { id: input.slotId } });
    if (!slot || slot.companyId !== application.job.companyId || slot.bookedInterviewId || slot.startsAt <= new Date()) {
      throw new Response("This interview slot is no longer available", { status: 409 });
    }
    const scheduled = await tx.interview.findMany({
      where: { interviewerId: slot.interviewerId, status: "SCHEDULED", scheduledAt: { gte: new Date(slot.startsAt.getTime() - 4 * 60 * 60 * 1000), lt: slot.endsAt } },
      select: { scheduledAt: true, durationMin: true },
    });
    const conflict = scheduled.some((item) => intervalsOverlap(slot.startsAt, slot.endsAt, item.scheduledAt, intervalEnd(item.scheduledAt, item.durationMin)));
    if (conflict) throw new Response("The interviewer is no longer available for this slot", { status: 409 });

    const interview = await tx.interview.create({
      data: {
        applicationId: input.applicationId,
        interviewerId: slot.interviewerId,
        scheduledAt: slot.startsAt,
        durationMin: Math.max(15, Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60_000)),
        meetingUrl: slot.meetingUrl,
        type: input.type ?? "TECHNICAL",
        kit,
      },
    });

    const claimed = await tx.interviewAvailabilitySlot.updateMany({
      where: { id: input.slotId, bookedInterviewId: null },
      data: { bookedInterviewId: interview.id },
    });
    if (claimed.count !== 1) throw new Response("This interview slot was just booked by another candidate", { status: 409 });
    return { interview, slot };
  }, { isolationLevel: "Serializable" });

  await transitionApplicationStage({
    applicationId: input.applicationId,
    toStage: "TECHNICAL_INTERVIEW",
    reason: "Candidate selected an available interview slot",
    actorId: input.candidateUserId,
    force: true,
  });
  await sendInterviewNotifications({
    applicationId: input.applicationId,
    interviewerId: result.interview.interviewerId,
    scheduledAt: result.interview.scheduledAt,
    meetingUrl: result.interview.meetingUrl ?? undefined,
  });
  return result.interview;
}
