"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { humanizeEnum, shortStageLabel } from "@/lib/ui/labels";

const STAGES = ["APPLIED","RESUME_SCREENING","SHORTLISTED","ASSESSMENT","TECHNICAL_INTERVIEW","HR_INTERVIEW","OFFER","HIRED","REJECTED"] as const;
type Stage = typeof STAGES[number];
type Card = { id: string; name: string; email: string; stage: Stage; fitScore: number; evidenceCoverage: number; decisionCoverage: number };

function decisionText(card: Card) {
  if (card.stage === "HIRED") return { label: "Hired", tone: "status-success" };
  if (card.stage === "REJECTED") return { label: "Closed", tone: "status-neutral" };
  if (card.decisionCoverage >= 85) return { label: "Decision ready", tone: "status-success" };
  if (card.fitScore >= 70 && card.fitScore - card.evidenceCoverage >= 15) return { label: "Evidence gap", tone: "status-warning" };
  return { label: "Not ready", tone: "status-warning" };
}

export function ApplicationKanban({ initialApplications }: { initialApplications: Card[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const grouped = useMemo(() => Object.fromEntries(STAGES.map((stage) => [stage, applications.filter((app) => app.stage === stage)])) as Record<Stage, Card[]>, [applications]);

  async function move(applicationId: string, stage: Stage) {
    const current = applications.find((item) => item.id === applicationId);
    if (!current || current.stage === stage) return;
    setBusy(applicationId); setError("");
    const previous = applications;
    setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, stage } : item));
    try {
      const response = await fetch(`/api/applications/${applicationId}/stage`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ stage }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? `Cannot move to ${humanizeEnum(stage)}`);
    } catch (cause) {
      setApplications(previous);
      setError(cause instanceof Error ? cause.message : "Stage update failed");
    } finally { setBusy(null); }
  }

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">Drag cards between stages or use the accessible <strong>Move to</strong> control on each card.</p><p className="text-xs text-zinc-400">{applications.length} candidate{applications.length === 1 ? "" : "s"}</p></div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="kanban-board" aria-label="Application pipeline">
      {STAGES.map((stage) => <section key={stage} className="kanban-column" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/application-id"); if (id) move(id, stage); }}>
        <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-[10px] font-bold uppercase tracking-[.08em] text-zinc-600">{shortStageLabel(stage)}</h2><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500">{grouped[stage].length}</span></div>
        <div className="min-h-24 space-y-2">{grouped[stage].map((card) => { const decision = decisionText(card); return <article key={card.id} draggable={busy !== card.id} onDragStart={(event) => event.dataTransfer.setData("text/application-id", card.id)} className={`kanban-card ${busy === card.id ? "opacity-50" : "cursor-grab"}`}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link href={`/recruiter/applications/${card.id}`} className="block truncate text-sm font-semibold hover:underline">{card.name}</Link><p className="mt-0.5 truncate text-[10px] text-zinc-400">{card.email}</p></div><span className={`status-pill ${decision.tone}`}>{decision.label}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-[var(--fit-soft)] px-2.5 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Fit</p><p className="metric-number mt-0.5 text-sm font-bold text-[var(--fit)]">{Math.round(card.fitScore)}%</p></div><div className="rounded-lg bg-[var(--evidence-soft)] px-2.5 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Evidence</p><p className="metric-number mt-0.5 text-sm font-bold text-[var(--evidence)]">{Math.round(card.evidenceCoverage)}%</p></div></div>
          {card.fitScore >= 70 && card.fitScore - card.evidenceCoverage >= 15 && <p className="mt-2 text-[10px] font-medium text-amber-700">High apparent fit, but supporting evidence is incomplete.</p>}
          <label className="mt-3 block text-[10px] font-semibold text-zinc-500"><span className="sr-only">Move {card.name} to another stage</span><select aria-label={`Move ${card.name} to another stage`} disabled={busy === card.id} value={card.stage} onChange={(event) => move(card.id, event.target.value as Stage)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] font-medium"><option value={card.stage}>{humanizeEnum(card.stage)}</option>{STAGES.filter((option) => option !== card.stage).map((option) => <option key={option} value={option}>{humanizeEnum(option)}</option>)}</select></label>
        </article>})}</div>
      </section>)}
    </div>
  </div>;
}
