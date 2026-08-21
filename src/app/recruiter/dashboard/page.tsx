import Link from "next/link";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/MetricCard";
import { getRecruitingAnalytics } from "@/services/analytics/analyticsService";
import { humanizeEnum } from "@/lib/ui/labels";

export default async function RecruiterDashboardPage() {
  const user = await requirePageUser(["RECRUITER","HIRING_MANAGER"]);
  if (!user.companyId) return null;
  const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1);
  const [analytics, interviewsToday, pendingReviews, readyDecisions, recentApplications] = await Promise.all([
    getRecruitingAnalytics(user.companyId),
    prisma.interview.count({ where: { application: { job: { companyId: user.companyId } }, scheduledAt: { gte: start, lt: end } } }),
    prisma.verificationItem.count({ where: { application: { job: { companyId: user.companyId } }, status: { in: ["RECOMMENDED","APPROVED"] } } }),
    prisma.application.count({ where: { job: { companyId: user.companyId }, decisionCoverage: { gte: 85 }, stage: { notIn: ["HIRED", "REJECTED"] } } }),
    prisma.application.findMany({ where: { job: { companyId: user.companyId } }, include: { candidate: { include: { user: true } }, job: true }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const active = analytics.totals.applications - analytics.totals.hired - analytics.totals.rejected;

  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="page-header"><div><p className="page-eyebrow">Recruiter workspace</p><h1 className="page-title">What needs attention?</h1><p className="page-description">Prioritize verification gaps, interviews, and decision-ready candidates instead of scanning a generic KPI dashboard.</p></div><div className="flex gap-2"><Link href="/recruiter/jobs" className="btn-secondary">Jobs</Link><Link href="/recruiter/analytics" className="btn-primary">Analytics</Link></div></div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Active candidates" value={String(active)} detail={`${analytics.totals.applications} total applications`}/><MetricCard kind="evidence" label="Need verification" value={String(pendingReviews)} detail="Verification items awaiting action"/><MetricCard label="Interviews today" value={String(interviewsToday)} detail="Scheduled for today"/><MetricCard kind="decision" label="Decision ready" value={String(readyDecisions)} detail="85%+ decision coverage, still active"/></div>

    <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="surface-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="section-kicker">Priority review</p><h2 className="section-heading mt-1">High fit, weaker supporting evidence</h2><p className="section-description">These candidates look promising on current evidence, but the support behind that fit is incomplete. Review before treating the match score as decisive.</p></div><Link href="/recruiter/analytics" className="text-xs font-semibold text-indigo-600 hover:underline">Full review queue</Link></div><div className="mt-4 space-y-2">{analytics.evidenceRiskCandidates.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">No high-fit evidence gaps currently meet the review threshold.</p> : analytics.evidenceRiskCandidates.slice(0, 5).map((row) => <Link key={row.applicationId} href={`/recruiter/applications/${row.applicationId}`} className="block rounded-xl border border-zinc-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{row.candidate}</p><p className="mt-0.5 text-xs text-zinc-500">{row.job}</p></div><span className="status-pill status-warning">{Math.round(row.gap)}pt evidence gap</span></div><div className="mt-3 grid grid-cols-3 gap-2"><Signal label="Fit" value={row.fitScore} tone="fit"/><Signal label="Evidence" value={row.evidenceCoverage} tone="evidence"/><Signal label="Decision" value={row.decisionCoverage} tone="decision"/></div></Link>)}</div></section>

      <section className="surface-card p-5"><div className="flex items-center justify-between"><div><p className="section-kicker">Recent activity</p><h2 className="section-heading mt-1">Latest applications</h2></div><Link className="text-xs font-semibold text-indigo-600 hover:underline" href="/recruiter/jobs">All jobs</Link></div><div className="mt-3 divide-y divide-zinc-100">{recentApplications.map((application) => <Link key={application.id} href={`/recruiter/applications/${application.id}`} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{application.candidate.user.name}</p><p className="mt-0.5 truncate text-[10px] text-zinc-500">{application.job.title} · {humanizeEnum(application.stage)}</p></div><div className="text-right"><p className="metric-number text-xs font-semibold text-[var(--fit)]">Fit {Math.round(application.fitScore ?? 0)}%</p><p className="metric-number mt-1 text-[10px] text-[var(--decision)]">Decision {Math.round(application.decisionCoverage ?? 0)}%</p></div></Link>)}</div></section>
    </div>

    <section className="mt-5 grid gap-3 md:grid-cols-3"><ActionCard href="/recruiter/assessments" title="Assessment Studio" description="Build reusable criterion-linked verification."/><ActionCard href="/recruiter/interviews/availability" title="Interview availability" description="Publish slots for candidate self-scheduling."/><ActionCard href="/recruiter/ai-transparency" title="Processing history" description="Inspect provider, fallback, duration, and hashes."/></section>
  </main>;
}

function Signal({ label, value, tone }: { label: string; value: number; tone: "fit" | "evidence" | "decision" }) { const cls = tone === "fit" ? "bg-[var(--fit-soft)] text-[var(--fit)]" : tone === "evidence" ? "bg-[var(--evidence-soft)] text-[var(--evidence)]" : "bg-[var(--decision-soft)] text-[var(--decision)]"; return <div className={`rounded-lg p-2 ${cls}`}><p className="text-[9px] font-bold uppercase tracking-wide opacity-70">{label}</p><p className="metric-number mt-0.5 text-sm font-bold">{Math.round(value)}%</p></div>; }
function ActionCard({ href, title, description }: { href: string; title: string; description: string }) { return <Link href={href} className="surface-card p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></Link>; }
