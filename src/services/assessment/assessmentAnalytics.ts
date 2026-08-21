import { prisma } from "@/lib/prisma";
import { textSimilarity } from "@/services/assessment/similarity";

export async function getAssessmentAnalytics(companyId?: string | null) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: companyId ? { application: { job: { companyId } } } : {},
    include: { assessment: { include: { questions: true } }, application: { include: { job: true, candidate: { include: { user: true } } } }, answers: true },
    orderBy: { createdAt: "desc" },
  });
  const assigned = attempts.length;
  const submitted = attempts.filter((a) => Boolean(a.submittedAt));
  const started = attempts.filter((a) => Boolean(a.startedAt));
  const scores = submitted.flatMap((a) => a.maxScore && a.score != null ? [(a.score / a.maxScore) * 100] : []);
  const byMethod = new Map<string, { method: string; attempts: number; submitted: number; scoreTotal: number; scoreCount: number }>();
  const byRequirement = new Map<string, { name: string; attempts: number; scoreTotal: number; scoreCount: number }>();
  for (const attempt of attempts) {
    const answerByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
    for (const question of attempt.assessment.questions) {
      const method = question.method ?? "UNKNOWN";
      const methodRow = byMethod.get(method) ?? { method, attempts: 0, submitted: 0, scoreTotal: 0, scoreCount: 0 };
      methodRow.attempts += 1;
      if (attempt.submittedAt) methodRow.submitted += 1;
      const answer = answerByQuestion.get(question.id);
      if (attempt.submittedAt && answer?.score != null && question.maxScore > 0) { methodRow.scoreTotal += (answer.score / question.maxScore) * 100; methodRow.scoreCount += 1; }
      byMethod.set(method, methodRow);

      const name = question.requirementName ?? "Unlinked criterion";
      const reqRow = byRequirement.get(name) ?? { name, attempts: 0, scoreTotal: 0, scoreCount: 0 };
      reqRow.attempts += 1;
      if (attempt.submittedAt && answer?.score != null && question.maxScore > 0) { reqRow.scoreTotal += (answer.score / question.maxScore) * 100; reqRow.scoreCount += 1; }
      byRequirement.set(name, reqRow);
    }
  }
  const answersByQuestion = new Map<string, Array<{ attemptId: string; candidate: string; assessment: string; question: string; answer: string }>>();
  for (const attempt of submitted) {
    const questionById = new Map(attempt.assessment.questions.map((q) => [q.id, q]));
    for (const answer of attempt.answers) {
      const question = questionById.get(answer.questionId);
      const text = answer.answerText?.trim();
      if (!question || !text || question.rubric && typeof question.rubric === "object" && (question.rubric as { type?: string }).type === "single_choice") continue;
      const rows = answersByQuestion.get(question.id) ?? [];
      rows.push({ attemptId: attempt.id, candidate: attempt.application.candidate.user.name, assessment: attempt.assessment.title, question: question.prompt, answer: text });
      answersByQuestion.set(question.id, rows);
    }
  }
  const similaritySignals: Array<{ candidateA: string; candidateB: string; assessment: string; question: string; similarity: number; shared: number }> = [];
  for (const rows of answersByQuestion.values()) {
    for (let i = 0; i < rows.length; i += 1) for (let j = i + 1; j < rows.length; j += 1) {
      if (rows[i].attemptId === rows[j].attemptId || rows[i].candidate === rows[j].candidate) continue;
      const comparison = textSimilarity(rows[i].answer, rows[j].answer);
      if (comparison.comparable && comparison.similarity >= 0.82) similaritySignals.push({ candidateA: rows[i].candidate, candidateB: rows[j].candidate, assessment: rows[i].assessment, question: rows[i].question, similarity: comparison.similarity * 100, shared: comparison.shared });
    }
  }
  similaritySignals.sort((a, b) => b.similarity - a.similarity);

  return {
    totals: { assigned, started: started.length, submitted: submitted.length, completionRate: assigned ? (submitted.length / assigned) * 100 : 0, averageScore: scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0, averageTabSwitches: started.length ? started.reduce((sum,a)=>sum+a.tabSwitchCount,0)/started.length : 0 },
    byMethod: [...byMethod.values()].map((row) => ({ ...row, averageScore: row.scoreCount ? row.scoreTotal / row.scoreCount : 0 })).sort((a,b)=>b.attempts-a.attempts),
    byRequirement: [...byRequirement.values()].map((row) => ({ ...row, averageScore: row.scoreCount ? row.scoreTotal / row.scoreCount : 0 })).sort((a,b)=>b.attempts-a.attempts).slice(0,12),
    recent: attempts.slice(0,20).map((a) => ({ id: a.id, job: a.application.job.title, assessment: a.assessment.title, status: a.status, score: a.maxScore && a.score != null ? (a.score/a.maxScore)*100 : null, tabSwitches: a.tabSwitchCount, createdAt: a.createdAt })),
    similaritySignals: similaritySignals.slice(0, 20),
  };
}
