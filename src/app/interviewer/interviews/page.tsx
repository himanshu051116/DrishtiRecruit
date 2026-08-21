import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";

export default async function InterviewerInterviews() {
  const user = await requirePageUser(["INTERVIEWER"]);
  const interviews = await prisma.interview.findMany({ where: { interviewerId: user.id }, include: { application: { include: { candidate: { include: { user: true } }, job: true } } }, orderBy: { scheduledAt: "asc" } });
  return <main className="mx-auto max-w-5xl px-6 py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-zinc-500">Interviewer workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Assigned interviews</h1></div><Link href="/recruiter/interviews/availability" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium">Manage availability</Link></div><div className="mt-8 space-y-3">{interviews.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">No interviews assigned.</div> : interviews.map((interview) => <Link key={interview.id} href={`/interviewer/interviews/${interview.id}`} className="block rounded-2xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-zinc-500">{interview.application.job.title}</p><h2 className="mt-1 font-semibold">{interview.application.candidate.user.name}</h2><p className="mt-1 text-xs text-zinc-400">{interview.scheduledAt.toLocaleString()}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{interview.status}</span></div></Link>)}</div></main>;
}
