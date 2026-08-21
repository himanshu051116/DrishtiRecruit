import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { AssessmentRunner } from "@/components/AssessmentRunner";

export default async function AssessmentPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requirePageUser(["CANDIDATE"]);
  const { attemptId } = await params;
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { application: { include: { candidate: true, job: true } }, assessment: { include: { questions: true } }, answers: true } });
  if (!attempt || attempt.application.candidate.userId !== user.id) notFound();
  if (attempt.submittedAt) redirect("/candidate/assessments");
  const questions = attempt.assessment.questions.map((question) => {
    const rubric = question.rubric as { type?: string; choices?: string[] } | null;
    return { id: question.id, prompt: question.prompt, maxScore: question.maxScore, method: question.method, difficulty: question.difficulty, type: rubric?.type === "single_choice" ? "single_choice" as const : "text" as const, choices: rubric?.type === "single_choice" ? rubric.choices ?? [] : undefined };
  });
  const initialAnswers = Object.fromEntries(attempt.answers.map((answer) => [answer.questionId, answer.answerText ?? ""]));
  return <main className="mx-auto max-w-3xl px-6 py-10"><p className="text-sm text-zinc-500">{attempt.application.job.title}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{attempt.assessment.title}</h1><p className="mt-2 text-sm text-zinc-500">Standardized evidence verification. Your result updates the linked criterion rather than making the final hiring decision.</p><div className="mt-8"><AssessmentRunner attemptId={attempt.id} startedAt={attempt.startedAt?.toISOString() ?? null} durationMin={attempt.assessment.durationMin} questions={questions} initialAnswers={initialAnswers}/></div></main>;
}
