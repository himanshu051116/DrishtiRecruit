import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { getEvidenceMatrix } from "@/services/application/applicationService";
import { MetricCard } from "@/components/MetricCard";
import { EvidenceMatrix } from "@/components/EvidenceMatrix";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { PlanVerificationButton } from "@/components/PlanVerificationButton";
import { VerificationActions } from "@/components/VerificationActions";
import { AssignAssessmentButton } from "@/components/AssignAssessmentButton";
import { InterviewScheduler } from "@/components/InterviewScheduler";
import { DecisionPanel } from "@/components/DecisionPanel";
import { OfferComposer } from "@/components/OfferComposer";
import { CandidateEmailComposer } from "@/components/CandidateEmailComposer";
import { ManualAssessmentAssign } from "@/components/ManualAssessmentAssign";
import { getDecisionIntegrityAudit } from "@/services/decision/integrityAudit";
import { decisionLabel, humanizeEnum } from "@/lib/ui/labels";

const ASSESSMENT_METHODS = new Set(["MCQ", "CODING", "SQL", "DEBUGGING", "PRACTICAL"]);

export default async function ApplicationEvidencePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  const { applicationId } = await params;
  const found = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      verifications: { where: { status: { in: ["RECOMMENDED", "APPROVED", "ASSIGNED"] } }, include: { requirement: true, assessmentAttempt: true }, orderBy: { priorityScore: "desc" } },
      interviews: { include: { interviewer: true, scorecards: { orderBy: { createdAt: "asc" } } }, orderBy: { scheduledAt: "desc" } },
      decisions: { include: { decisionOwner: true }, orderBy: { createdAt: "desc" }, take: 5 },
      offers: { orderBy: { createdAt: "desc" } },
      stageEvents: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!found || (user.role !== "ADMIN" && found.job.companyId !== user.companyId)) notFound();

  const [matrix, integrityAudit] = await Promise.all([getEvidenceMatrix(applicationId), getDecisionIntegrityAudit(applicationId)]);
  const analysed = matrix.requirements.some((requirement) => requirement.evaluation);
  const unresolved = matrix.requirements.filter((requirement) => ["MISSING", "WEAK", "PARTIAL"].includes(requirement.evaluation?.status ?? "MISSING") && requirement.priority === "MUST_HAVE");
  const conflicts = matrix.requirements.filter((requirement) => requirement.evaluation?.status === "CONFLICTING" && requirement.priority === "MUST_HAVE");
  const decision = decisionLabel(matrix.application.decisionCoverage, conflicts.length > 0, unresolved.length);
  const readiness = decision.key;
  const [interviewers, recruiterAssessments] = await Promise.all([
    prisma.user.findMany({ where: { companyId: found.job.companyId, role: "INTERVIEWER", emailVerifiedAt: { not: null }, isActive: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.assessment.findMany({ where: { jobId: found.jobId, active: true, source: "RECRUITER" }, include: { _count: { select: { questions: true } } }, orderBy: { updatedAt: "desc" } }),
  ]);

  const nextGap = conflicts[0] ?? unresolved[0] ?? matrix.requirements.find((requirement) => ["MISSING", "WEAK", "PARTIAL"].includes(requirement.evaluation?.status ?? ""));
  const nextVerification = found.verifications[0];
  const decisionTone = decision.tone === "success" ? "success" : decision.tone === "danger" ? "danger" : "warning";

  return <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="page-header">
      <div><p className="page-eyebrow">{matrix.job.title}</p><h1 className="page-title">{matrix.candidate.name}</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span>{matrix.candidate.email}</span><span aria-hidden>·</span><span className="status-pill status-neutral">{humanizeEnum(matrix.application.stage)}</span></div></div>
      <div className="flex flex-wrap gap-2"><AnalyzeButton applicationId={applicationId}/><a href={`/api/applications/${applicationId}/decision-report.pdf`} className="btn-secondary">Decision evidence PDF</a></div>
    </div>

    <section className="decision-hero mt-6" aria-labelledby="decision-readiness-heading">
      <div className={`decision-state ${decisionTone}`}><div><p className="text-[10px] font-bold uppercase tracking-[.08em] opacity-70">Decision readiness</p><strong id="decision-readiness-heading">{decision.label}</strong><p>{conflicts.length ? `${conflicts.length} must-have criterion${conflicts.length === 1 ? " has" : " have"} conflicting evidence.` : unresolved.length ? `${unresolved.length} must-have criterion${unresolved.length === 1 ? " still needs" : " still need"} sufficient evidence.` : matrix.application.decisionCoverage < 85 ? "Required evidence exists, but overall decision coverage still needs review." : "Required criteria are sufficiently evaluated for an authorized human decision."}</p></div><span className="metric-number text-2xl font-bold">{Math.round(matrix.application.decisionCoverage)}%</span></div>
      <div className="grid gap-3 sm:grid-cols-3"><MetricCard kind="fit" label="Fit" value={`${Math.round(matrix.application.fitScore)}%`} progress={matrix.application.fitScore} detail="How strongly current evidence aligns with the role."/><MetricCard kind="evidence" label="Evidence coverage" value={`${Math.round(matrix.application.evidenceCoverage)}%`} progress={matrix.application.evidenceCoverage} detail="How much usable, traceable evidence exists."/><MetricCard kind="decision" label="Decision coverage" value={`${Math.round(matrix.application.decisionCoverage)}%`} progress={matrix.application.decisionCoverage} detail="Whether required criteria are sufficiently evaluated."/></div>
    </section>

    <nav className="workspace-nav" aria-label="Decision workspace sections"><a href="#evidence">Evidence</a><a href="#verification">Verification</a><a href="#interviews">Interviews</a><a href="#decision">Decision</a><a href="#audit">Audit & activity</a></nav>

    {!analysed && <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600"><strong>Evidence analysis has not run yet.</strong><p className="mt-1 text-xs text-zinc-500">Run analysis to create the first requirement-by-evidence map and decision coverage state.</p></div>}

    <section id="evidence" className="scroll-mt-32 mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <EvidenceMatrix matrix={matrix}/>
      <aside className="next-action-card"><p className="section-kicker">Next best action</p>{nextGap ? <><h3>{nextGap.name}</h3><p className="mt-2 text-xs leading-6 text-zinc-600">{nextGap.evaluation?.status === "CONFLICTING" ? "Evidence conflicts across sources. Keep the criterion human-reviewed before advancing the decision." : `${humanizeEnum(nextGap.evaluation?.status ?? "MISSING")} · ${Math.round(nextGap.evaluation?.evidenceCoverage ?? 0)}% evidence coverage. DrishtiRecruit recommends closing this gap before the final decision.`}</p>{nextVerification && <div className="mt-4 rounded-xl border border-indigo-100 bg-white/80 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Recommended verification</p><p className="mt-1 text-sm font-semibold">{humanizeEnum(nextVerification.method)}</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">{nextVerification.reason}</p></div>}<div className="mt-4"><PlanVerificationButton applicationId={applicationId} disabled={!analysed}/></div></> : <><h3>Evidence complete</h3><p className="mt-2 text-xs leading-6 text-zinc-600">No unresolved criterion is currently prioritized. Review DecisionTrace and keep the final decision human-owned.</p><a href="#decision" className="btn-primary mt-4">Review decision</a></>}</aside>
    </section>

    <section id="verification" className="scroll-mt-32 mt-8"><div className="mb-4"><p className="section-kicker">Verification plan</p><h2 className="section-heading mt-1">Close evidence gaps consistently</h2><p className="section-description">Verification recommendations stay recruiter-approved and criterion-linked so comparable candidates are not evaluated by arbitrary ad-hoc tests.</p></div>
      {found.verifications.length > 0 && <div className="grid gap-3 lg:grid-cols-2">{found.verifications.map((verification) => <article key={verification.id} className="surface-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{verification.requirement.name}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{verification.reason}</p></div><span className="status-pill status-neutral">{humanizeEnum(verification.method)}</span></div><p className="mt-3 text-[10px] text-zinc-400">Priority {verification.priorityScore.toFixed(2)} · {humanizeEnum(verification.status)}</p>{verification.status === "RECOMMENDED" ? <VerificationActions verificationId={verification.id}/> : verification.status === "APPROVED" ? <>{ASSESSMENT_METHODS.has(verification.method) ? <AssignAssessmentButton verificationId={verification.id}/> : <p className="mt-3 text-xs font-medium text-amber-700">Approved for interview or human verification. Continue in the interview section.</p>}</> : verification.assessmentAttempt ? <p className="mt-3 text-xs font-medium text-emerald-700">Assessment assigned · {humanizeEnum(verification.assessmentAttempt.status)}</p> : <p className="mt-3 text-xs text-zinc-500">Verification assigned.</p>}</article>)}</div>}
      <div className="surface-card mt-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="section-heading">Structured assessment library</h3><p className="section-description">Assign a reusable job-level assessment when you want the same criterion-linked questions across comparable candidates.</p></div><Link href="/recruiter/assessments" className="btn-secondary">Assessment Studio</Link></div><div className="mt-4"><ManualAssessmentAssign applicationId={applicationId} assessments={recruiterAssessments.map((assessment) => ({ id: assessment.id, title: assessment.title, durationMin: assessment.durationMin, questionCount: assessment._count.questions }))}/></div></div>
    </section>

    <section id="interviews" className="scroll-mt-32 mt-8"><div className="mb-4"><p className="section-kicker">Interview coverage</p><h2 className="section-heading mt-1">Ask what the evidence still cannot answer</h2><p className="section-description">Interview kits prioritize unresolved criteria instead of repeating already-covered topics.</p></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"><div className="surface-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Schedule interview</h3><Link href="/recruiter/interviews/availability" className="text-xs font-semibold text-indigo-600 hover:underline">Publish self-scheduling slots</Link></div><div className="mt-4"><InterviewScheduler applicationId={applicationId} interviewers={interviewers}/></div>{found.interviews.length > 0 && <div className="mt-5 space-y-2">{found.interviews.map((interview) => <div key={interview.id} className="flex flex-wrap items-center justify-between rounded-xl bg-zinc-50 p-3 text-xs"><span><strong>{interview.interviewer.name}</strong> · {interview.scheduledAt.toLocaleString()}</span><div className="flex items-center gap-3"><a className="font-semibold text-indigo-600 hover:underline" href={`/api/interviews/${interview.id}/calendar`}>Calendar</a><span className="status-pill status-neutral">{humanizeEnum(interview.status)}</span></div></div>)}</div>}</div>
        <div className="surface-card p-5"><h3 className="font-semibold">Structured feedback</h3><p className="mt-1 text-xs text-zinc-500">Individual criterion evidence stays visible instead of collapsing into an opaque interview rating.</p>{found.interviews.some((interview) => interview.scorecards.length > 0) ? <div className="mt-4 grid gap-3">{found.interviews.filter((interview) => interview.scorecards.length > 0).map((interview) => <article key={interview.id} className="rounded-xl border border-zinc-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{interview.interviewer.name}</p><p className="mt-1 text-[10px] text-zinc-500">{humanizeEnum(interview.type)} · {interview.scheduledAt.toLocaleString()}</p></div><span className="status-pill status-neutral">{humanizeEnum(interview.status)}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{interview.scorecards.map((scorecard) => <div key={scorecard.id} className="rounded-lg bg-zinc-50 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{scorecard.criterion}</span><span className="metric-number font-bold">{scorecard.score}/5</span></div>{scorecard.evidenceNote && <p className="mt-2 leading-5 text-zinc-600">{scorecard.evidenceNote}</p>}{scorecard.comments && <p className="mt-1 text-zinc-400">{scorecard.comments}</p>}</div>)}</div></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No structured interview evidence has been submitted yet.</p>}</div></div>
    </section>

    <section id="decision" className="scroll-mt-32 mt-8"><div className="mb-4"><p className="section-kicker">DecisionTrace</p><h2 className="section-heading mt-1">Human-owned final decision</h2><p className="section-description">The system can show readiness and evidence context, but authorized people own the hiring decision.</p></div>
      {(user.role === "HIRING_MANAGER" || user.role === "ADMIN") ? <DecisionPanel applicationId={applicationId} readiness={readiness} decisionCoverage={matrix.application.decisionCoverage} unresolved={unresolved.map((requirement) => requirement.name)} conflicts={conflicts.map((requirement) => requirement.name)}/> : <div className="surface-card p-5 text-sm text-zinc-500">Final decision controls are available to Hiring Managers and Admins. Recruiters can continue evidence collection and verification.</div>}
      {found.decisions.length > 0 && <div className="surface-card mt-4 p-5"><h3 className="font-semibold">Decision history</h3><div className="mt-3 space-y-2">{found.decisions.map((record) => <div key={record.id} className="flex flex-wrap justify-between gap-3 border-t border-zinc-100 pt-3 first:border-0 first:pt-0 text-sm"><span><strong>{humanizeEnum(record.humanDecision)}</strong> · {record.decisionOwner.name}</span><span className="text-xs text-zinc-500">Coverage {Math.round(record.decisionCoverage)}% · {record.override ? "override recorded" : "standard path"}</span></div>)}</div></div>}
      {["OFFER", "HIRED"].includes(found.stage) && <div className="surface-card mt-4 p-5"><h3 className="font-semibold">{found.stage === "OFFER" ? "Generate and send offer" : "Offer history"}</h3>{found.stage === "OFFER" && <div className="mt-4"><OfferComposer applicationId={applicationId} defaultRole={found.job.title} defaultLocation={found.job.location}/></div>}{found.offers.length > 0 && <div className="mt-4 space-y-2">{found.offers.map((offer) => <div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-sm"><span>{offer.roleTitle} · {humanizeEnum(offer.status)}</span><a className="text-xs font-semibold text-indigo-600 hover:underline" href={`/api/offers/${offer.id}/pdf`}>Offer PDF</a></div>)}</div>}</div>}
    </section>

    <section id="audit" className="scroll-mt-32 mt-8 grid gap-5 xl:grid-cols-2">
      <details className="surface-card p-5"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">Decision integrity</p><h2 className="section-heading mt-1">Inspect the decision path</h2><p className="section-description">Review criteria, source records, calculation freshness, snapshots, and workflow consistency.</p></div><div className="flex gap-1 text-[10px]"><span className="status-pill status-success">{integrityAudit.summary.pass} pass</span><span className="status-pill status-warning">{integrityAudit.summary.warn} warn</span><span className="status-pill status-danger">{integrityAudit.summary.fail} fail</span></div></div></summary><div className="mt-4 grid gap-2">{integrityAudit.checks.map((check) => <div key={check.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{check.label}</span><span className={`status-pill ${check.status === "PASS" ? "status-success" : check.status === "WARN" ? "status-warning" : "status-danger"}`}>{check.status}</span></div><p className="mt-2 text-xs leading-5 text-zinc-500">{check.detail}</p></div>)}</div><div className="mt-4 flex gap-3"><a className="text-xs font-semibold text-indigo-600 hover:underline" href={`/api/applications/${applicationId}/integrity-audit`}>JSON audit</a><Link className="text-xs font-semibold text-indigo-600 hover:underline" href="/recruiter/ai-transparency">Processing history</Link></div></details>
      <div className="surface-card p-5"><p className="section-kicker">Candidate communication</p><h2 className="section-heading mt-1">Send application message</h2><p className="section-description">Messages are persisted in the transactional outbox and mirrored into candidate notifications.</p><div className="mt-4"><CandidateEmailComposer applicationId={applicationId} candidateName={matrix.candidate.name} jobTitle={matrix.job.title}/></div></div>
      {found.stageEvents.length > 0 && <div className="surface-card p-5 xl:col-span-2"><p className="section-kicker">Workflow history</p><h2 className="section-heading mt-1">Application timeline</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{found.stageEvents.map((event) => <div key={event.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{event.fromStage ? `${humanizeEnum(event.fromStage)} → ` : ""}{humanizeEnum(event.toStage)}</p>{event.reason && <p className="mt-1 text-xs text-zinc-500">{event.reason}</p>}</div><div className="text-right text-[10px] text-zinc-400"><p>{event.createdAt.toLocaleString()}</p><p className="mt-1">{event.actor?.name ?? "System"}</p></div></div></div>)}</div></div>}
    </section>
  </main>;
}
