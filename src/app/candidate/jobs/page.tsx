import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { ApplyPanel } from "@/components/ApplyPanel";
import { ResumeUpload } from "@/components/ResumeUpload";

export default async function CandidateJobs({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; workMode?: string; employmentType?: string; minSalary?: string }> }) {
  const user = await requirePageUser(["CANDIDATE"]);
  const filters = await searchParams;
  const q = filters.q?.trim() ?? ""; const location = filters.location?.trim() ?? ""; const workMode = filters.workMode?.trim() ?? ""; const employmentType = filters.employmentType?.trim() ?? ""; const minSalary = Number(filters.minSalary ?? 0) || 0;
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id }, include: { resumes: { where: { isActive: true }, orderBy: { createdAt: "desc" } } } });
  const jobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      AND: [
        { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
        ...(q ? [{ OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { company: { name: { contains: q, mode: "insensitive" } } }, { requirements: { some: { recruiterApproved: true, name: { contains: q, mode: "insensitive" } } } }] }] : []),
      ],
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(workMode ? { workMode: { equals: workMode, mode: "insensitive" } } : {}),
      ...(employmentType ? { employmentType: { equals: employmentType, mode: "insensitive" } } : {}),
      ...(minSalary ? { salaryMax: { gte: minSalary } } : {}),
    },
    include: { company: true, requirements: { where: { recruiterApproved: true } } }, orderBy: { createdAt: "desc" },
  });
  const resumes = (candidate?.resumes ?? []).map((resume) => ({ id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt }));

  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm text-zinc-500">Candidate portal</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Open roles</h1>
    <form className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-6"><input name="q" defaultValue={q} placeholder="Role, skill or company" className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm"/><input name="location" defaultValue={location} placeholder="Location" className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm"/><select name="workMode" defaultValue={workMode} className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm"><option value="">Any work mode</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="Onsite">Onsite</option></select><select name="employmentType" defaultValue={employmentType} className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm"><option value="">Any employment type</option><option value="Full Time">Full Time</option><option value="Internship">Internship</option><option value="Part Time">Part Time</option></select><input name="minSalary" type="number" min="0" defaultValue={minSalary || ""} placeholder="Minimum salary" className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm"/><button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white">Search jobs</button></form>
    <div className="mt-6"><ResumeUpload /></div>{resumes.length > 0 && <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600"><span className="font-medium text-zinc-900">Available resumes:</span> {resumes.map((r) => r.fileName).join(", ")}</div>}
    <div className="mt-8 grid gap-4">{jobs.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">No matching open roles.</div> : jobs.map((job) => <article key={job.id} className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-sm text-zinc-500">{job.company.name}</p><h2 className="mt-1 text-xl font-semibold">{job.title}</h2><p className="mt-2 text-sm text-zinc-600">{job.location ?? "Location flexible"} · {job.workMode ?? "Work mode unspecified"}</p><div className="mt-4 flex flex-wrap gap-2">{job.requirements.slice(0, 6).map((r) => <span key={r.id} className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{r.name}</span>)}</div></div><div className="w-full max-w-md"><ApplyPanel jobId={job.id} resumes={resumes}/></div></div></article>)}</div>
  </main>;
}
