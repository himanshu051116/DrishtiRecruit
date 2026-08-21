import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { InterviewScorecard } from "@/components/InterviewScorecard";

export default async function InterviewPage({ params }: { params: Promise<{ interviewId: string }> }) {
  const user = await requirePageUser(["INTERVIEWER"]); const { interviewId } = await params;
  const interview = await prisma.interview.findUnique({ where: { id: interviewId }, include: { application: { include: { candidate: { include: { user: true } }, job: true } }, scorecards: true } });
  if (!interview || interview.interviewerId !== user.id) notFound();
  const kit = interview.kit as { items?: Array<{ requirementId: string; name: string; question: string; reason: string }> } | null;
  const items = kit?.items ?? [];
  return <main className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm text-zinc-500">{interview.application.job.title}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{interview.application.candidate.user.name}</h1><p className="mt-2 text-sm text-zinc-500">The interview kit targets unresolved evidence gaps. Score only job-related criteria and record observable evidence.</p><div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">{interview.meetingUrl && <a href={interview.meetingUrl} className="underline underline-offset-4">Open meeting link</a>}<a href={`/api/interviews/${interview.id}/calendar`} className="underline underline-offset-4">Add to calendar</a></div><div className="mt-8">{interview.status === "COMPLETED" ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">Scorecard completed with {interview.scorecards.length} criterion evaluations.</div> : items.length ? <InterviewScorecard interviewId={interview.id} items={items}/> : <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500">No unresolved criteria were available when this interview was scheduled.</div>}</div></main>;
}
