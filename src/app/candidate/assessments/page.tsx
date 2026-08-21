import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";

export default async function CandidateAssessmentsPage() {
  const user = await requirePageUser(["CANDIDATE"]);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  if (!candidate) return <main className="mx-auto max-w-5xl px-6 py-10">Candidate profile not found.</main>;
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { application: { candidateId: candidate.id } },
    include: { assessment: true, application: { include: { job: { include: { company: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return <main className="mx-auto max-w-5xl px-6 py-10">
    <p className="text-sm text-zinc-500">Candidate portal</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Assessments</h1>
    <div className="mt-8 space-y-3">{attempts.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">No assessment has been assigned.</div> : attempts.map((attempt) => <article key={attempt.id} className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-zinc-500">{attempt.application.job.company.name} · {attempt.application.job.title}</p><h2 className="mt-1 font-semibold">{attempt.assessment.title}</h2><p className="mt-1 text-xs text-zinc-400">{attempt.assessment.durationMin} minutes · {attempt.status}</p></div>{attempt.submittedAt ? <div className="text-right"><p className="text-xs text-zinc-400">Score</p><p className="font-semibold">{attempt.score ?? 0}/{attempt.maxScore ?? 0}</p></div> : <Link href={`/candidate/assessments/${attempt.id}`} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">Open assessment</Link>}</div></article>)}</div>
  </main>;
}
