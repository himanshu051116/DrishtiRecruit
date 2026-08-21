import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { CandidateInterviewBooking } from "@/components/CandidateInterviewBooking";
import { getPlatformSettings } from "@/services/settings/platformSettings";
import { humanizeEnum } from "@/lib/ui/labels";

function alignmentLabel(value: number | null) { if (value == null) return "Pending"; if (value >= 85) return "Strong"; if (value >= 70) return "Promising"; if (value >= 50) return "Partial"; return "Limited evidence"; }

export default async function CandidateApplications() {
  const user = await requirePageUser(["CANDIDATE"]);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  if (!candidate) return <main className="mx-auto max-w-5xl px-6 py-10"><p>Candidate profile not found.</p></main>;
  const platform = await getPlatformSettings();
  const applications = await prisma.application.findMany({ where: { candidateId: candidate.id }, include: { job: { include: { company: true } }, interviews: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" } } }, orderBy: { createdAt: "desc" } });
  const companyIds = [...new Set(applications.map((application) => application.job.companyId))];
  const slots = companyIds.length ? await prisma.interviewAvailabilitySlot.findMany({ where: { companyId: { in: companyIds }, bookedInterviewId: null, startsAt: { gt: new Date() } }, include: { interviewer: { select: { name: true } } }, orderBy: { startsAt: "asc" }, take: 100 }) : [];

  return <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="page-header"><div><p className="page-eyebrow">Candidate workspace</p><h1 className="page-title">My applications</h1><p className="page-description">Track each hiring process and understand what has been evaluated so far. Evidence coverage reflects the process, not your overall ability.</p></div><Link href="/candidate/jobs" className="btn-primary">Browse jobs</Link></div>
    <div className="mt-6 space-y-4">{applications.length === 0 ? <p className="surface-card p-6 text-sm text-zinc-500">No applications yet.</p> : applications.map((application) => { const available = slots.filter((slot) => slot.companyId === application.job.companyId).slice(0, 12); const canSelfSchedule = platform.candidateSelfSchedulingEnabled && !application.interviews.length && !["APPLIED", "RESUME_SCREENING", "OFFER", "HIRED", "REJECTED"].includes(application.stage); const decisionReady = (application.decisionCoverage ?? 0) >= 85; return <article key={application.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium text-zinc-500">{application.job.company.name}</p><h2 className="mt-1 text-lg font-bold">{application.job.title}</h2><p className="mt-2 text-xs text-zinc-500">Applied {application.createdAt.toLocaleDateString()}</p></div><span className="status-pill status-neutral">{humanizeEnum(application.stage)}</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[var(--fit-soft)] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Role alignment</p><p className="mt-1 text-sm font-bold text-[var(--fit)]">{alignmentLabel(application.fitScore)}</p></div><div className="rounded-xl bg-[var(--evidence-soft)] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Evaluation evidence</p><p className="metric-number mt-1 text-sm font-bold text-[var(--evidence)]">{application.evidenceCoverage == null ? "Pending" : `${Math.round(application.evidenceCoverage)}% covered`}</p></div><div className="rounded-xl bg-[var(--decision-soft)] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Hiring process</p><p className="mt-1 text-sm font-bold text-[var(--decision)]">{decisionReady ? "Ready for human decision" : "Still being evaluated"}</p></div></div>
      {application.interviews.length > 0 && <div className="mt-4 border-t border-zinc-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Upcoming interview</p>{application.interviews.slice(0,1).map((interview) => <div key={interview.id} className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{interview.scheduledAt.toLocaleString()}</span><div className="flex gap-3">{interview.meetingUrl && <a className="text-xs font-semibold text-indigo-600 hover:underline" href={interview.meetingUrl}>Meeting link</a>}<a className="text-xs font-semibold text-indigo-600 hover:underline" href={`/api/interviews/${interview.id}/calendar`}>Add to calendar</a></div></div>)}</div>}
      {canSelfSchedule && <div className="mt-4 border-t border-zinc-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Choose interview time</p><CandidateInterviewBooking applicationId={application.id} slots={available.map((slot) => ({ id: slot.id, startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), mode: slot.mode, interviewerName: slot.interviewer.name }))}/></div>}
    </article>; })}</div>
  </main>;
}
