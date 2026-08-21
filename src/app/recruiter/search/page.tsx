import { humanizeEnum } from "@/lib/ui/labels";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";

export default async function RecruiterSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  const { q = "" } = await searchParams;
  const query = q.trim();
  const companyId = user.role === "ADMIN" ? null : user.companyId;

  const [jobs, candidates, people, interviews, companies] = query ? await Promise.all([
    prisma.job.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { department: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.application.findMany({
      where: {
        ...(companyId ? { job: { companyId } } : {}),
        candidate: {
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
      include: { candidate: { include: { user: true } }, job: true },
      take: 15,
    }),
    prisma.user.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        role: { in: ["RECRUITER", "HIRING_MANAGER", "INTERVIEWER"] },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.interview.findMany({
      where: {
        ...(companyId ? { application: { job: { companyId } } } : {}),
        OR: [
          { type: { contains: query, mode: "insensitive" } },
          { application: { candidate: { user: { name: { contains: query, mode: "insensitive" } } } } },
          { application: { job: { title: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: {
        interviewer: true,
        application: { include: { candidate: { include: { user: true } }, job: true } },
      },
      take: 10,
    }),
    prisma.company.findMany({ where: { ...(companyId ? { id: companyId } : {}), OR: [{ name: { contains: query, mode: "insensitive" } }, { industry: { contains: query, mode: "insensitive" } }] }, take: 10 }),
  ]) : [[], [], [], [], []];

  return <main className="mx-auto max-w-6xl px-6 py-10">
    <div><p className="text-sm text-zinc-500">Workspace search</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Global search</h1></div>
    <form className="mt-6 flex gap-2"><input name="q" defaultValue={query} placeholder="Search candidates, jobs, recruiters or interviews" className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3"/><button className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white">Search</button></form>
    {!query ? <p className="mt-8 text-sm text-zinc-500">Enter a search term.</p> : <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Result title="Candidates">{candidates.map((item) => <Link key={item.id} href={`/recruiter/applications/${item.id}`} className="block rounded-xl bg-zinc-50 p-3"><p className="font-medium">{item.candidate.user.name}</p><p className="mt-1 text-xs text-zinc-500">{item.job.title} · {humanizeEnum(item.stage)}</p></Link>)}</Result>
      <Result title="Jobs">{jobs.map((job) => <Link key={job.id} href={`/recruiter/jobs/${job.id}/pipeline`} className="block rounded-xl bg-zinc-50 p-3"><p className="font-medium">{job.title}</p><p className="mt-1 text-xs text-zinc-500">{job.department ?? "No department"} · {job.status}</p></Link>)}</Result>
      <Result title="People">{people.map((person) => <div key={person.id} className="rounded-xl bg-zinc-50 p-3"><p className="font-medium">{person.name}</p><p className="mt-1 text-xs text-zinc-500">{person.email} · {person.role}</p></div>)}</Result>
      <Result title="Companies">{companies.map((company) => <div key={company.id} className="rounded-xl bg-zinc-50 p-3"><p className="font-medium">{company.name}</p><p className="mt-1 text-xs text-zinc-500">{company.industry ?? "Industry not set"} · {company.website ?? "No website"}</p></div>)}</Result>
      <Result title="Interviews">{interviews.map((interview) => <div key={interview.id} className="rounded-xl bg-zinc-50 p-3"><p className="font-medium">{interview.application.candidate.user.name} · {interview.application.job.title}</p><p className="mt-1 text-xs text-zinc-500">{interview.interviewer.name} · {interview.scheduledAt.toLocaleString()} · {interview.status}</p></div>)}</Result>
    </div>}
  </main>;
}

function Result({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4 space-y-2">{children}</div></section>;
}