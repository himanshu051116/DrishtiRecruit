import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { publicJobStatus } from "@/services/job/jobAvailability";

export default async function RecruiterJobs() {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  const jobs = await prisma.job.findMany({
    where: user.role === "ADMIN" ? {} : { companyId: user.companyId! },
    include: { requirements: true, applications: { include: { candidate: { include: { user: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return <main className="mx-auto max-w-7xl px-6 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-zinc-500">Recruiter workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Jobs & candidate evidence</h1></div><div className="flex flex-wrap gap-2"><Link href="/recruiter/analytics" className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium">Analytics</Link><Link href="/notifications" className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium">Notifications</Link>{user.role !== "HIRING_MANAGER" && <Link href="/recruiter/jobs/new" className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white">New job</Link>}</div></div>
    <div className="mt-8 space-y-5">{jobs.map((job) => <section key={job.id} className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold">{job.title}</h2><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs">{publicJobStatus(job)}</span></div>{job.deadline && <p className="mt-1 text-xs text-zinc-500">Deadline {job.deadline.toLocaleString()}</p>}<p className="mt-1 text-sm text-zinc-500">{job.requirements.filter((r) => r.recruiterApproved).length}/{job.requirements.length} criteria approved · {job.applications.length} applications</p></div><div className="flex flex-wrap gap-3 text-sm font-medium"><Link className="underline underline-offset-4" href={`/recruiter/jobs/${job.id}/requirements`}>Criteria</Link><Link className="underline underline-offset-4" href={`/recruiter/jobs/${job.id}/pipeline`}>Pipeline</Link><Link className="underline underline-offset-4" href={`/recruiter/jobs/${job.id}/compare`}>Compare</Link></div></div>
      <div className="mt-5 border-t border-zinc-100 pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Applications</p>{job.applications.length === 0 ? <p className="text-sm text-zinc-500">No applications yet.</p> : <div className="grid gap-2 md:grid-cols-2">{job.applications.map((application) => <Link key={application.id} href={`/recruiter/applications/${application.id}`} className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 text-sm hover:bg-zinc-50"><span>{application.candidate.user.name}</span><span className="text-zinc-500">{application.fitScore == null ? "Analyse" : `${Math.round(application.fitScore)}% fit · ${Math.round(application.decisionCoverage ?? 0)}% decision`}</span></Link>)}</div>}</div>
    </section>)}</div>
  </main>;
}
