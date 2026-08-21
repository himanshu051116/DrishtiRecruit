import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/MetricCard";
import { AdminUserActions } from "@/components/AdminUserActions";
import { AdminPlatformSettings } from "@/components/AdminPlatformSettings";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import { AdminAssessmentToggle, AdminJobStatus } from "@/components/AdminJobAssessmentActions";
import { getPlatformSettings } from "@/services/settings/platformSettings";
import { getRetentionPreview } from "@/services/privacy/retentionService";
import { AdminRetentionPanel } from "@/components/AdminRetentionPanel";

export default async function AdminPage() {
  const current = await requirePageUser(["ADMIN"]);
  const [users, userCount, companyCount, jobCount, applicationCount, logs, emails, companies, jobs, assessments, settings, retention] = await Promise.all([
    prisma.user.findMany({ include: { company: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.count(), prisma.company.count(), prisma.job.count(), prisma.application.count(),
    prisma.activityLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.emailMessage.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.company.findMany({ include: { _count: { select: { users: true, jobs: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.job.findMany({ include: { company: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.assessment.findMany({ include: { job: { include: { company: true } }, _count: { select: { questions: true, attempts: true } } }, orderBy: { updatedAt: "desc" }, take: 30 }),
    getPlatformSettings(),
    getRetentionPreview(),
  ]);

  return <main className="mx-auto max-w-7xl px-6 py-10">
    <div className="page-header"><div><p className="page-eyebrow">Platform administration</p><h1 className="page-title">Admin control center</h1><p className="page-description">Manage access, organizations, jobs, assessments and platform behavior while preserving an auditable change trail.</p></div></div>
    <div className="mt-8 grid gap-4 md:grid-cols-4"><MetricCard label="Users" value={String(userCount)} detail={`${users.filter((u) => !u.isActive).length} inactive in recent set`}/><MetricCard label="Companies" value={String(companyCount)} detail="Registered organizations"/><MetricCard label="Jobs" value={String(jobCount)} detail="All platform jobs"/><MetricCard label="Applications" value={String(applicationCount)} detail="All applications"/></div>

    <nav className="workspace-nav mt-4" aria-label="Admin sections"><a href="#settings">Settings</a><a href="#retention">Retention</a><a href="#users">Users</a><a href="#organizations">Organizations</a><a href="#resources">Jobs & assessments</a><a href="#email">Email</a></nav>

    <section id="settings" className="scroll-mt-32 mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Platform settings</p><h2 className="mt-1 text-lg font-semibold">Runtime controls</h2><p className="mt-1 text-sm text-zinc-500">Self-scheduling is enforced by the booking service. The retention window drives a conservative operational-cleanup workflow. Candidate hiring evidence is never deleted by the generic cleanup job.</p></div><div className="mt-4"><AdminPlatformSettings initial={settings}/></div></section>

    <section id="retention" className="scroll-mt-32 mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Data lifecycle</p><h2 className="mt-1 text-lg font-semibold">Retention operations</h2><p className="mt-1 text-sm text-zinc-500">Preview and prune expired operational records without silently deleting hiring evidence or audit history.</p></div><div className="mt-4"><AdminRetentionPanel initial={retention}/></div></section>

    <div id="users" className="scroll-mt-32 mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Users & access</h2><p className="mt-1 text-sm text-zinc-500">Role and account-state controls are audit logged.</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{current.email}</span></div><div className="mt-4 divide-y divide-zinc-100">{users.map((user) => <div key={user.id} className="py-4 text-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{user.name}</p><p className="text-xs text-zinc-500">{user.email} · {user.company?.name ?? "No company"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{user.isActive ? "ACTIVE" : "INACTIVE"}</span></div>{user.deletionRequestedAt && <p className="mt-2 text-xs font-medium text-amber-700">Candidate requested account deletion {user.deletionRequestedAt.toLocaleString()}</p>}{user.id !== current.id ? <AdminUserActions userId={user.id} role={user.role} isActive={user.isActive}/> : <p className="mt-2 text-xs text-zinc-400">Current admin account · self-modification disabled here</p>}</div>)}</div></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6"><h2 className="text-lg font-semibold">Audit log</h2><div className="mt-4 max-h-[720px] divide-y divide-zinc-100 overflow-auto">{logs.map((log) => <div key={log.id} className="py-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{log.action}</span><span className="text-xs text-zinc-400">{log.createdAt.toLocaleString()}</span></div><p className="mt-1 text-xs text-zinc-500">{log.actor?.name ?? "System"} · {log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p></div>)}</div></section>
    </div>

    <section id="organizations" className="scroll-mt-32 mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><h2 className="text-lg font-semibold">Organizations</h2><p className="mt-1 text-sm text-zinc-500">Edit core organization metadata without assuming membership in the target company.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{companies.map((company) => <article key={company.id} className="rounded-xl border border-zinc-200 p-4 text-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{company.name}</p><p className="mt-1 text-xs text-zinc-500">{company.industry ?? "Industry not set"} · {company._count.users} users · {company._count.jobs} jobs</p></div></div><AdminCompanyActions company={{ id: company.id, name: company.name, industry: company.industry, website: company.website, size: company.size }}/></article>)}</div></section>

    <div id="resources" className="scroll-mt-32 mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6"><h2 className="text-lg font-semibold">Jobs</h2><div className="mt-4 divide-y divide-zinc-100">{jobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{job.title}</p><p className="text-xs text-zinc-500">{job.company.name} · {job._count.applications} applications</p></div><AdminJobStatus jobId={job.id} status={job.status}/></div>)}</div></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6"><h2 className="text-lg font-semibold">Assessments</h2><div className="mt-4 divide-y divide-zinc-100">{assessments.map((assessment) => <div key={assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{assessment.title}</p><p className="text-xs text-zinc-500">{assessment.job?.company.name ?? "No company"} · {assessment._count.questions} questions · {assessment._count.attempts} attempts · {assessment.source}</p></div><AdminAssessmentToggle assessmentId={assessment.id} active={assessment.active}/></div>)}</div></section>
    </div>

    <section id="email" className="scroll-mt-32 mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Transactional email outbox</h2><p className="mt-1 text-sm text-zinc-500">If EMAIL_WEBHOOK_URL is unset, messages remain queued for local demonstration.</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{emails.filter((email) => email.status === "QUEUED").length} queued</span></div><div className="mt-4 divide-y divide-zinc-100">{emails.length === 0 ? <p className="text-sm text-zinc-500">No email messages yet.</p> : emails.map((email) => <div key={email.id} className="flex flex-wrap items-start justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{email.subject}</p><p className="mt-1 text-xs text-zinc-500">{email.recipient} · {email.template ?? "GENERIC"}</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs">{email.status}</span></div>)}</div></section>
  </main>;
}
