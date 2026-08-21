import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicJobsPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const location = filters.location?.trim() ?? "";
  const jobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      AND: [
        { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
        ...(q ? [{ OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { company: { name: { contains: q, mode: "insensitive" as const } } },
          { requirements: { some: { recruiterApproved: true, name: { contains: q, mode: "insensitive" as const } } } },
        ] }] : []),
      ],
      ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
    },
    include: { company: true, requirements: { where: { recruiterApproved: true }, orderBy: { weight: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:py-14">
    <div className="page-header"><div><p className="page-eyebrow">Public careers</p><h1 className="page-title !text-4xl">Open roles</h1><p className="page-description text-sm sm:text-base">Browse roles that are still accepting applications. Sign in as a candidate to submit a resume and track the hiring process.</p></div></div>
    <form className="surface-card mt-7 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]" role="search"><label><span className="sr-only">Search role, skill, or company</span><input name="q" defaultValue={q} placeholder="Role, skill, or company" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"/></label><label><span className="sr-only">Location</span><input name="location" defaultValue={location} placeholder="Location" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"/></label><button className="btn-primary px-5 py-3">Search</button></form>
    <div className="mt-7 grid gap-4">{jobs.length === 0 ? <div className="surface-card p-8"><h2 className="font-semibold">No open roles right now</h2><p className="mt-2 text-sm leading-6 text-zinc-500">There are no roles accepting applications at the moment. Please check back soon.</p></div> : jobs.map((job) => <article key={job.id} className="surface-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><Link href={`/careers/${job.companyId}`} className="text-xs font-semibold text-zinc-500 hover:text-indigo-600">{job.company.name}</Link><h2 className="mt-1 text-xl font-bold tracking-tight">{job.title}</h2><p className="mt-2 text-sm text-zinc-600">{job.location ?? "Location flexible"}{job.workMode ? ` · ${job.workMode}` : ""}{job.employmentType ? ` · ${job.employmentType}` : ""}</p>{job.deadline && <p className="mt-2 text-xs text-zinc-500">Apply by {job.deadline.toLocaleDateString()}</p>}<p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{job.description}</p><div className="mt-4 flex flex-wrap gap-2">{job.requirements.slice(0, 8).map((requirement) => <span key={requirement.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium">{requirement.name}</span>)}</div></div><Link href="/login" className="btn-primary">Sign in to apply</Link></div></article>)}</div>
  </main>;
}
