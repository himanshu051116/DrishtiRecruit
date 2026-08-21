import { prisma } from "@/lib/prisma";
import { EvidenceStrength } from "@/domain/enums";
import { recalculateApplicationCoverage } from "@/services/application/applicationService";
import { transitionApplicationStage } from "@/services/application/stageService";
import { notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { intervalEnd, intervalsOverlap } from "@/services/interview/schedulingPolicy";
import { defaultInterviewQuestion } from "@/services/ai/interviewQuestionDrafts";
import { isHiringActivityClosed, type Stage } from "@/services/application/stagePolicy";

export async function buildInterviewKit(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { requirements: true } }, evaluations: true },
  });
  if (!application) throw new Response("Application not found", { status: 404 });

  const evalById = new Map(application.evaluations.map((evaluation) => [evaluation.requirementId, evaluation]));
  const targets = application.job.requirements
    .filter((requirement) => requirement.recruiterApproved && requirement.priority !== "PREFERRED")
    .map((requirement) => ({ requirement, evaluation: evalById.get(requirement.id) }))
    .filter(({ evaluation }) => !evaluation || ["MISSING", "WEAK", "PARTIAL", "CONFLICTING"].includes(evaluation.status))
    .sort((a, b) =>
      (b.requirement.priority === "MUST_HAVE" ? 1 : 0) - (a.requirement.priority === "MUST_HAVE" ? 1 : 0) ||
      b.requirement.weight - a.requirement.weight,
    )
    .slice(0, 4);

  const kit = {
    generatedAt: new Date().toISOString(),
    items: targets.map(({ requirement, evaluation }) => ({
      requirementId: requirement.id,
      name: requirement.name,
      question: requirement.interviewQuestionApproved && requirement.interviewQuestion ? requirement.interviewQuestion : defaultInterviewQuestion(requirement.name),
      reason: evaluation ? `${evaluation.status} · ${Math.round(evaluation.evidenceCoverage)}% evidence coverage` : "Not yet evaluated",
    })),
  };

  return { application, kit };
}

async function sendInterviewNotifications(input: {
  applicationId: string;
  interviewerId: string;
  scheduledAt: Date;
  meetingUrl?: string;
}) {
  const candidate = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { candidate: true, job: true },
  });
  if (candidate) {
    const candidateUser = await prisma.user.findUnique({ where: { id: candidate.candidate.userId } });
    await notifyUser(
      candidate.candidate.userId,
      "INTERVIEW_SCHEDULED",
      `${candidate.job.title}: interview scheduled`,
      `Your interview is scheduled for ${input.scheduledAt.toLocaleString()}.`,
    );
    if (candidateUser) {
      await sendTransactionalEmail({
        to: candidateUser.email,
        subject: `${candidate.job.title}: interview scheduled`,
        text: `Your interview is scheduled for ${input.scheduledAt.toLocaleString()}.${input.meetingUrl ? ` Meeting link: ${input.meetingUrl}` : ""}`,
        template: "INTERVIEW_INVITE",
      });
    }
  }
  await notifyUser(
    input.interviewerId,
    "INTERVIEW_ASSIGNED",
    "Interview assigned",
    `You have been assigned an interview scheduled for ${input.scheduledAt.toLocaleString()}.`,
  );
}

export async function createInterview(input: {
  applicationId: string;
  interviewerId: string;
  scheduledAt: Date;
  meetingUrl?: string;
  durationMin?: number;
  type?: string;
}) {
  const { application, kit } = await buildInterviewKit(input.applicationId);
  if (isHiringActivityClosed(application.stage as Stage)) {
    throw new Response("Interview scheduling is closed for this application", { status: 409 });
  }
  const interviewer = await prisma.user.findUnique({ where: { id: input.interviewerId } });
  if (!interviewer || interviewer.role !== "INTERVIEWER" || interviewer.companyId !== application.job.companyId) {
    throw new Response("Interviewer must belong to the same company", { status: 400 });
  }
  const durationMin = input.durationMin ?? 45;
  const proposedEnd = intervalEnd(input.scheduledAt, durationMin);
  const interview = await prisma.$transaction(async (tx) => {
    const nearby = await tx.interview.findMany({
      where: { interviewerId: input.interviewerId, status: "SCHEDULED", scheduledAt: { gte: new Date(input.scheduledAt.getTime() - 4 * 60 * 60 * 1000), lt: proposedEnd } },
      select: { scheduledAt: true, durationMin: true },
    });
    const overlap = nearby.some((item) => intervalsOverlap(input.scheduledAt, proposedEnd, item.scheduledAt, intervalEnd(item.scheduledAt, item.durationMin)));
    if (overlap) throw new Response("Interviewer already has an overlapping scheduled interview", { status: 409 });

    const created = await tx.interview.create({
      data: {
        applicationId: input.applicationId,
        interviewerId: input.interviewerId,
        scheduledAt: input.scheduledAt,
        durationMin,
        meetingUrl: input.meetingUrl,
        type: input.type ?? "TECHNICAL",
        kit,
      },
    });
    await tx.interviewAvailabilitySlot.deleteMany({
      where: {
        interviewerId: input.interviewerId,
        bookedInterviewId: null,
        startsAt: { lt: proposedEnd },
        endsAt: { gt: input.scheduledAt },
      },
    });
    return created;
  }, { isolationLevel: "Serializable" });

  await transitionApplicationStage({
    applicationId: input.applicationId,
    toStage: "TECHNICAL_INTERVIEW",
    reason: "Interview scheduled",
    force: true,
  });
  await sendInterviewNotifications(input);
  return interview;
}

export { sendInterviewNotifications };

function strengthForScore(score: number): EvidenceStrength {
  if (score >= 4) return EvidenceStrength.STRONG;
  if (score >= 3) return EvidenceStrength.MEDIUM;
  return EvidenceStrength.WEAK;
}

export async function submitInterviewScorecards(
  interviewId: string,
  interviewerUserId: string,
  scores: Array<{ requirementId: string; score: number; comments?: string; evidenceNote?: string }>,
) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: { include: { requirements: true } } } } },
  });
  if (!interview) throw new Response("Interview not found", { status: 404 });
  if (interview.interviewerId !== interviewerUserId) {
    throw new Response("Only the assigned interviewer can submit this scorecard", { status: 403 });
  }
  if (interview.status === "COMPLETED") throw new Response("Interview scorecard is already finalized", { status: 409 });
  const kit = interview.kit as { items?: Array<{ requirementId: string }> } | null;
  const kitRequirementIds = new Set((kit?.items ?? []).map((item) => item.requirementId));
  const allowed = new Map(
    interview.application.job.requirements
      .filter((r) => r.recruiterApproved && kitRequirementIds.has(r.id))
      .map((r) => [r.id, r]),
  );

  await prisma.$transaction(async (tx) => {
    for (const item of scores) {
      const requirement = allowed.get(item.requirementId);
      if (!requirement) throw new Response("Invalid interview criterion", { status: 400 });
      await tx.interviewScorecard.upsert({
        where: { interviewId_requirementId: { interviewId, requirementId: item.requirementId } },
        create: {
          interviewId,
          requirementId: item.requirementId,
          criterion: requirement.name,
          score: item.score,
          comments: item.comments,
          evidenceNote: item.evidenceNote,
        },
        update: { score: item.score, comments: item.comments, evidenceNote: item.evidenceNote },
      });
      await tx.evidenceItem.deleteMany({
        where: {
          applicationId: interview.applicationId,
          requirementId: item.requirementId,
          sourceType: "INTERVIEW",
          sourceId: interviewId,
        },
      });
      await tx.evidenceItem.create({
        data: {
          applicationId: interview.applicationId,
          requirementId: item.requirementId,
          sourceType: "INTERVIEW",
          sourceId: interviewId,
          sourceExcerpt: item.evidenceNote?.trim() || `Structured interviewer score: ${item.score}/5.`,
          strength: strengthForScore(item.score),
          confidence: 0.9,
          supportsRequirement: item.score >= 3,
          contradictsRequirement: item.score <= 2,
          verified: true,
          verificationMethod: "INTERVIEW",
          metadata: { score: item.score, comments: item.comments ?? null },
        },
      });
    }
    await tx.interview.update({ where: { id: interviewId }, data: { status: "COMPLETED", completedAt: new Date() } });
  });

  return recalculateApplicationCoverage(interview.applicationId, "TECHNICAL_INTERVIEW");
}
