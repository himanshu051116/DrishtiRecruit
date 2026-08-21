import { prisma } from "@/lib/prisma";
import { transitionApplicationStage } from "@/services/application/stageService";
import { canForceTransition, isHiringActivityClosed, type Stage } from "@/services/application/stagePolicy";
import { notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";

export type RecruiterQuestionInput = {
  requirementId?: string;
  category: "TECHNICAL_SKILL" | "EXPERIENCE" | "EDUCATION" | "COMPETENCY" | "COMMUNICATION" | "LEADERSHIP" | "OTHER";
  method: "MCQ" | "CODING" | "SQL" | "DEBUGGING" | "PRACTICAL";
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  prompt: string;
  maxScore: number;
  rubric:
    | { type: "single_choice"; choices: string[]; correctIndex: number }
    | { type: "keyword"; keywords: string[]; minimumHits: number };
};

export async function createRecruiterAssessment(input: {
  companyId: string;
  jobId: string;
  title: string;
  description?: string;
  durationMin: number;
}) {
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job || job.companyId !== input.companyId) throw new Response("Job not found", { status: 404 });
  return prisma.assessment.create({
    data: {
      jobId: input.jobId,
      title: input.title,
      description: input.description,
      durationMin: input.durationMin,
      source: "RECRUITER",
      active: true,
    },
  });
}

export async function addRecruiterAssessmentQuestion(input: {
  companyId: string;
  assessmentId: string;
  question: RecruiterQuestionInput;
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: input.assessmentId },
    include: { job: { include: { requirements: true } }, _count: { select: { attempts: true } } },
  });
  if (!assessment?.job || assessment.job.companyId !== input.companyId) throw new Response("Assessment not found", { status: 404 });
  if (assessment._count.attempts > 0) throw new Response("This assessment has already been assigned and is locked for comparability. Create a new assessment version instead.", { status: 409 });

  const requirement = input.question.requirementId
    ? assessment.job.requirements.find((item) => item.id === input.question.requirementId)
    : undefined;
  if (input.question.requirementId && !requirement) throw new Response("Requirement must belong to the assessment job", { status: 400 });

  return prisma.assessmentQuestion.create({
    data: {
      assessmentId: input.assessmentId,
      requirementId: requirement?.id,
      requirementName: requirement?.name,
      category: input.question.category,
      method: input.question.method,
      difficulty: input.question.difficulty,
      prompt: input.question.prompt,
      maxScore: input.question.maxScore,
      rubric: input.question.rubric,
    },
  });
}

export async function updateRecruiterAssessment(input: {
  companyId: string;
  assessmentId: string;
  title?: string;
  description?: string | null;
  durationMin?: number;
  active?: boolean;
}) {
  const assessment = await prisma.assessment.findUnique({ where: { id: input.assessmentId }, include: { job: true, _count: { select: { attempts: true } } } });
  if (!assessment?.job || assessment.job.companyId !== input.companyId) throw new Response("Assessment not found", { status: 404 });
  const contentChange = input.title !== undefined || input.description !== undefined || input.durationMin !== undefined;
  if (contentChange && assessment._count.attempts > 0) throw new Response("Assigned assessments are immutable. Only active/inactive state can change after first assignment.", { status: 409 });
  return prisma.assessment.update({
    where: { id: input.assessmentId },
    data: { title: input.title, description: input.description, durationMin: input.durationMin, active: input.active },
  });
}

export async function deleteRecruiterQuestion(input: { companyId: string; questionId: string }) {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: input.questionId },
    include: { assessment: { include: { job: true, _count: { select: { attempts: true } } } } },
  });
  if (!question?.assessment.job || question.assessment.job.companyId !== input.companyId) throw new Response("Question not found", { status: 404 });
  if (question.assessment._count.attempts > 0) throw new Response("Questions cannot be changed after an assessment has been assigned", { status: 409 });
  await prisma.assessmentQuestion.delete({ where: { id: input.questionId } });
}

export async function assignRecruiterAssessment(input: {
  companyId: string;
  assessmentId: string;
  applicationId: string;
}) {
  const [assessment, application] = await Promise.all([
    prisma.assessment.findUnique({ where: { id: input.assessmentId }, include: { questions: true, job: true } }),
    prisma.application.findUnique({ where: { id: input.applicationId }, include: { candidate: true, job: true } }),
  ]);
  if (!assessment?.job || assessment.job.companyId !== input.companyId) throw new Response("Assessment not found", { status: 404 });
  if (!application || application.job.companyId !== input.companyId || application.jobId !== assessment.jobId) {
    throw new Response("Assessment and application must belong to the same job", { status: 400 });
  }
  if (isHiringActivityClosed(application.stage as Stage)) {
    throw new Response("Assessment assignment is closed for this application", { status: 409 });
  }
  if (!assessment.active) throw new Response("Assessment is inactive", { status: 409 });
  if (!assessment.questions.length) throw new Response("Assessment must contain at least one question", { status: 409 });

  const existing = await prisma.assessmentAttempt.findFirst({
    where: { assessmentId: assessment.id, applicationId: application.id, submittedAt: null },
  });
  if (existing) return existing;

  const attempt = await prisma.assessmentAttempt.create({
    data: { assessmentId: assessment.id, applicationId: application.id, status: "ASSIGNED" },
  });
  if (canForceTransition(application.stage as Stage, "ASSESSMENT")) {
    await transitionApplicationStage({ applicationId: application.id, toStage: "ASSESSMENT", reason: `Assessment assigned: ${assessment.title}`, force: true });
  }

  const candidateUser = await prisma.user.findUnique({ where: { id: application.candidate.userId } });
  await notifyUser(application.candidate.userId, "ASSESSMENT_ASSIGNED", `${application.job.title}: assessment assigned`, `${assessment.title} is ready in your candidate portal.`);
  if (candidateUser) {
    await sendTransactionalEmail({
      to: candidateUser.email,
      subject: `${application.job.title}: assessment assigned`,
      text: `${assessment.title} is ready in your DrishtiRecruit candidate portal.`,
      template: "ASSESSMENT_ASSIGNED",
    });
  }
  return attempt;
}

/**
 * Clone an assessment into a new immutable-comparability version.
 * Historical attempts remain bound to the exact assessment version candidates saw.
 */
export async function cloneRecruiterAssessmentVersion(input: {
  companyId: string;
  assessmentId: string;
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: input.assessmentId },
    include: { job: true, questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!assessment?.job || assessment.job.companyId !== input.companyId) {
    throw new Response("Assessment not found", { status: 404 });
  }

  const latest = await prisma.assessment.findFirst({
    where: { versionGroupId: assessment.versionGroupId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? assessment.version) + 1;

  const clone = await prisma.assessment.create({
    data: {
      jobId: assessment.jobId,
      title: assessment.title,
      description: assessment.description,
      durationMin: assessment.durationMin,
      source: assessment.source,
      version: nextVersion,
      versionGroupId: assessment.versionGroupId,
      active: false,
      questions: {
        create: assessment.questions.map((question) => ({
          requirementId: question.requirementId,
          requirementName: question.requirementName,
          category: question.category,
          method: question.method,
          difficulty: question.difficulty,
          prompt: question.prompt,
          rubric: question.rubric ?? undefined,
          maxScore: question.maxScore,
        })),
      },
    },
    include: { questions: true },
  });

  return clone;
}
