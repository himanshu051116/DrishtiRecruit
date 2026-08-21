import { prisma } from "@/lib/prisma";
import { chooseQuestion } from "./questionBank";
import { EvidenceStrength, VerificationMethod } from "@/domain/enums";
import { recalculateApplicationCoverage } from "@/services/application/applicationService";
import { transitionApplicationStage } from "@/services/application/stageService";
import { notifyUser } from "@/services/notification/notificationService";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { assessmentIsExpired } from "@/services/assessment/assessmentTiming";
import { canForceTransition, isHiringActivityClosed, type Stage } from "@/services/application/stagePolicy";

const ASSESSMENT_METHODS = new Set(["MCQ", "CODING", "SQL", "DEBUGGING", "PRACTICAL"]);

export async function assignAssessmentForVerification(verificationId: string) {
  const verification = await prisma.verificationItem.findUnique({
    where: { id: verificationId },
    include: { requirement: true, application: { include: { job: true } }, assessmentAttempt: true },
  });
  if (!verification) throw new Response("Verification not found", { status: 404 });
  if (isHiringActivityClosed(verification.application.stage as Stage)) {
    throw new Response("Assessment assignment is closed for this application", { status: 409 });
  }
  if (verification.status !== "APPROVED") throw new Response("Verification must be approved first", { status: 409 });
  if (!ASSESSMENT_METHODS.has(verification.method)) throw new Response("This verification is not an assessment method", { status: 409 });
  if (verification.assessmentAttempt) return verification.assessmentAttempt;

  const blueprint = chooseQuestion(verification.requirement.name, verification.requirement.category, verification.method as VerificationMethod)
    ?? chooseQuestion(verification.requirement.name, verification.requirement.category);
  if (!blueprint) throw new Response("No standardized question is available for this criterion", { status: 409 });

  const attempt = await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        jobId: verification.application.jobId,
        title: `${verification.requirement.name} verification`,
        description: `Standardized verification for ${verification.requirement.name}`,
        durationMin: blueprint.difficulty === "EASY" ? 5 : 10,
        source: "SYSTEM",
        questions: { create: [{ requirementId: verification.requirementId, requirementName: verification.requirement.name, category: blueprint.category, method: blueprint.method, difficulty: blueprint.difficulty, prompt: blueprint.prompt, rubric: blueprint.rubric, maxScore: blueprint.maxScore }] },
      },
    });
    const createdAttempt = await tx.assessmentAttempt.create({ data: { assessmentId: assessment.id, applicationId: verification.applicationId, verificationId: verification.id, status: "ASSIGNED" } });
    await tx.verificationItem.update({ where: { id: verification.id }, data: { status: "ASSIGNED" } });
    return createdAttempt;
  });
  if (canForceTransition(verification.application.stage as Stage, "ASSESSMENT")) {
    await transitionApplicationStage({ applicationId: verification.applicationId, toStage: "ASSESSMENT", reason: `${verification.requirement.name} verification assigned`, force: true });
  }
  const candidate = await prisma.application.findUnique({ where: { id: verification.applicationId }, include: { candidate: true, job: true } });
  if (candidate) {
    const candidateUser = await prisma.user.findUnique({ where: { id: candidate.candidate.userId } });
    await notifyUser(candidate.candidate.userId, "ASSESSMENT_ASSIGNED", `${candidate.job.title}: assessment assigned`, `${verification.requirement.name} verification is ready in your candidate portal.`);
    if (candidateUser) await sendTransactionalEmail({ to: candidateUser.email, subject: `${candidate.job.title}: assessment assigned`, text: `${verification.requirement.name} verification is ready in your DrishtiRecruit candidate portal.`, template: "ASSESSMENT_ASSIGNED" });
  }
  return attempt;
}

export async function startAssessmentAttempt(attemptId: string, candidateUserId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { application: { include: { candidate: true } } } });
  if (!attempt || attempt.application.candidate.userId !== candidateUserId) throw new Response("Assessment not found", { status: 404 });
  if (attempt.submittedAt) throw new Response("Assessment already submitted", { status: 409 });
  if (attempt.startedAt) return attempt;
  return prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(), status: "STARTED" } });
}

type Submission = { questionId: string; answer: string };

function grade(rubric: unknown, answer: string, maxScore: number) {
  const value = rubric as { type?: string; choices?: string[]; correctIndex?: number; keywords?: string[]; minimumHits?: number } | null;
  if (value?.type === "single_choice" && Number.isInteger(value.correctIndex)) {
    return Number(answer) === value.correctIndex ? maxScore : 0;
  }
  if (value?.type === "keyword" && Array.isArray(value.keywords)) {
    const normalized = answer.toLowerCase();
    const uniqueHits = new Set(value.keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()))).size;
    const target = Math.max(1, value.minimumHits ?? value.keywords.length);
    return Math.min(maxScore, maxScore * (uniqueHits / target));
  }
  return 0;
}

function evidenceStrength(percent: number): EvidenceStrength {
  if (percent >= 80) return EvidenceStrength.STRONG;
  if (percent >= 55) return EvidenceStrength.MEDIUM;
  return EvidenceStrength.WEAK;
}


export async function saveAssessmentDraftAnswers(attemptId: string, candidateUserId: string, submissions: Submission[]) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { application: { include: { candidate: true } }, assessment: { include: { questions: true } } },
  });
  if (!attempt || attempt.application.candidate.userId !== candidateUserId) throw new Response("Assessment not found", { status: 404 });
  if (!attempt.startedAt) throw new Response("Start the assessment first", { status: 409 });
  if (attempt.submittedAt) throw new Response("Assessment already submitted", { status: 409 });
  if (assessmentIsExpired(attempt.startedAt, attempt.assessment.durationMin, new Date(), 0)) throw new Response("Assessment time has expired", { status: 409 });
  const allowed = new Set(attempt.assessment.questions.map((question) => question.id));
  const unique = new Map<string, string>();
  for (const item of submissions) if (allowed.has(item.questionId)) unique.set(item.questionId, item.answer);
  await prisma.$transaction([...unique.entries()].map(([questionId, answerText]) => prisma.assessmentAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, answerText, score: null, graderNotes: "Draft autosave" },
    update: { answerText, score: null, graderNotes: "Draft autosave" },
  })));
  return unique.size;
}

export async function submitAssessmentAttempt(attemptId: string, candidateUserId: string, submissions: Submission[]) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { application: { include: { candidate: true } }, assessment: { include: { questions: true } }, verification: true, answers: true },
  });
  if (!attempt || attempt.application.candidate.userId !== candidateUserId) throw new Response("Assessment not found", { status: 404 });
  if (!attempt.startedAt) throw new Response("Start the assessment first", { status: 409 });
  if (attempt.submittedAt) throw new Response("Assessment already submitted", { status: 409 });

  const timedOut = assessmentIsExpired(attempt.startedAt, attempt.assessment.durationMin, new Date(), 0);
  const byQuestion = new Map(attempt.answers.map((item) => [item.questionId, item.answerText ?? ""]));
  // After the server-side deadline, only previously autosaved answers are accepted.
  // This prevents a modified client from extending the assessment timer locally.
  if (!timedOut) for (const item of submissions) byQuestion.set(item.questionId, item.answer);
  let score = 0;
  let maxScore = 0;
  const graded = attempt.assessment.questions.map((question) => {
    const answerText = byQuestion.get(question.id) ?? "";
    const itemScore = grade(question.rubric, answerText, question.maxScore);
    score += itemScore; maxScore += question.maxScore;
    return { question, answerText, itemScore };
  });
  const percent = maxScore ? (score / maxScore) * 100 : 0;

  await prisma.$transaction(async (tx) => {
    await tx.assessmentAnswer.deleteMany({ where: { attemptId } });
    for (const item of graded) {
      await tx.assessmentAnswer.create({ data: { attemptId, questionId: item.question.id, answerText: item.answerText, score: item.itemScore, graderNotes: "Deterministic standardized rubric" } });
    }
    await tx.assessmentAttempt.update({ where: { id: attemptId }, data: { submittedAt: new Date(), score, maxScore, status: timedOut ? "TIMED_OUT_SUBMITTED" : "SUBMITTED" } });
    if (attempt.verification) await tx.verificationItem.update({ where: { id: attempt.verification.id }, data: { status: "COMPLETED", completedAt: new Date() } });

    for (const item of graded) {
      if (!item.question.requirementId) continue;
      const itemPercent = item.question.maxScore ? (item.itemScore / item.question.maxScore) * 100 : 0;
      await tx.evidenceItem.deleteMany({ where: { applicationId: attempt.applicationId, requirementId: item.question.requirementId, sourceType: "ASSESSMENT", sourceId: attemptId } });
      await tx.evidenceItem.create({
        data: {
          applicationId: attempt.applicationId,
          requirementId: item.question.requirementId,
          sourceType: "ASSESSMENT",
          sourceId: attemptId,
          sourceExcerpt: `Standardized assessment: ${Math.round(itemPercent)}% on ${item.question.requirementName ?? "linked criterion"}.`,
          strength: evidenceStrength(itemPercent),
          confidence: 0.95,
          supportsRequirement: itemPercent >= 40,
          contradictsRequirement: itemPercent < 35,
          verified: true,
          verificationMethod: item.question.method,
          metadata: { score: item.itemScore, maxScore: item.question.maxScore, assessmentId: attempt.assessmentId },
        },
      });
    }
  });

  const coverage = await recalculateApplicationCoverage(attempt.applicationId, "ASSESSMENT");
  return { score, maxScore, percent: Math.round(percent * 100) / 100, coverage, timedOut };
}
