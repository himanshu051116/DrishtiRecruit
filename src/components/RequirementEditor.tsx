"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { humanizeEnum } from "@/lib/ui/labels";

type RequirementRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: string;
  weight: number;
  minimumEvidenceLevel: string;
  verificationRequired: boolean;
  recruiterApproved: boolean;
  aiGenerated: boolean;
  interviewQuestion?: string | null;
  interviewQuestionSource?: string | null;
  interviewQuestionApproved?: boolean;
};

export function RequirementEditor({ jobId, initial, status }: { jobId: string; initial: RequirementRow[]; status: string }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const totalWeight = useMemo(() => items.reduce((sum, item) => sum + Number(item.weight || 0), 0), [items]);

  function patchLocal(id: string, patch: Partial<RequirementRow>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function save(requirement: RequirementRow) {
    setBusy(requirement.id); setMessage("");
    try {
      const response = await fetch(`/api/jobs/${jobId}/requirements`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requirementId: requirement.id, patch: serialize(requirement) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Save failed");
      setMessage(`${requirement.name} saved.`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed"); }
    finally { setBusy(null); }
  }

  async function approvePublish() {
    setBusy("all"); setMessage("");
    try {
      const response = await fetch(`/api/jobs/${jobId}/requirements`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "APPROVE_AND_PUBLISH", requirements: items.map((requirement) => ({ id: requirement.id, ...serialize(requirement), recruiterApproved: undefined })) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not approve and publish criteria");
      setItems((current) => current.map((item) => ({ ...item, recruiterApproved: true })));
      setMessage("Current edits were saved atomically, criteria approved, and the job published.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not publish"); }
    finally { setBusy(null); }
  }

  async function generateInterviewDrafts() {
    setBusy("questions"); setMessage("");
    try {
      const response = await fetch(`/api/jobs/${jobId}/interview-question-drafts`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Question drafting failed");
      const drafts = new Map<string, { question: string; source: string }>((body.data?.drafts ?? []).map((draft: { requirementId: string; question: string; source: string }) => [draft.requirementId, { question: draft.question, source: draft.source }] as const));
      setItems((current) => current.map((item) => { const draft = drafts.get(item.id); return draft ? { ...item, interviewQuestion: draft.question, interviewQuestionSource: draft.source, interviewQuestionApproved: false } : item; }));
      setMessage("Interview question drafts are ready. Review each one before approval.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Question drafting failed"); }
    finally { setBusy(null); }
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div><p className="section-kicker">RequirementGraph</p><h2 className="section-heading mt-1">Evaluation criteria</h2><p className="section-description">Review the full role definition at a glance. Open a row to edit details, evidence rules, and interview guidance.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="status-pill status-neutral">{humanizeEnum(status)}</span><button onClick={generateInterviewDrafts} disabled={busy !== null || !items.some((item) => item.recruiterApproved)} className="btn-secondary disabled:opacity-40">{busy === "questions" ? "Drafting…" : "Draft interview questions"}</button><button onClick={approvePublish} disabled={busy !== null} className="btn-primary disabled:opacity-40">Approve & publish</button></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs text-zinc-500"><span><strong className="text-zinc-700">{items.length}</strong> approved/draft criteria</span><span>Relative weight total <strong className="text-zinc-700">{totalWeight.toFixed(2)}</strong> · normalized during scoring</span></div>
      <div className="overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr><th>Criterion</th><th>Type</th><th>Priority</th><th>Weight</th><th>Evidence</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className={`cursor-pointer ${item.id === selectedId ? "bg-indigo-50/60" : "hover:bg-zinc-50"}`} onClick={() => setSelectedId(item.id)}><td><div className="font-semibold text-zinc-900">{item.name}</div><div className="mt-0.5 text-[10px] text-zinc-400">{item.aiGenerated ? "AI-assisted draft" : "Manual criterion"}</div></td><td>{humanizeEnum(item.category)}</td><td><span className={`status-pill ${item.priority === "MUST_HAVE" ? "status-danger" : item.priority === "IMPORTANT" ? "status-warning" : "status-neutral"}`}>{humanizeEnum(item.priority)}</span></td><td className="metric-number font-semibold">{Number(item.weight).toFixed(2)}</td><td>{humanizeEnum(item.minimumEvidenceLevel)}</td><td><span className={`status-pill ${item.recruiterApproved ? "status-success" : "status-neutral"}`}>{item.recruiterApproved ? "Approved" : "Draft"}</span></td></tr>)}</tbody></table></div>
      {!items.length && <p className="p-6 text-sm text-zinc-500">No criteria are available yet.</p>}
    </section>

    <aside className="surface-card h-fit xl:sticky xl:top-[84px]">
      {!selected ? <p className="p-6 text-sm text-zinc-500">Select a criterion to edit it.</p> : <div>
        <div className="border-b border-zinc-200 p-5"><p className="section-kicker">Criterion details</p><input aria-label="Criterion name" value={selected.name} onChange={(event) => patchLocal(selected.id, { name: event.target.value })} className="mt-2 w-full border-0 bg-transparent p-0 text-xl font-bold tracking-tight outline-none"/><p className="mt-1 text-xs text-zinc-500">Changes remain local until saved or published.</p></div>
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><Field label="Priority"><Select value={selected.priority} options={["MUST_HAVE", "IMPORTANT", "PREFERRED"]} onChange={(value) => patchLocal(selected.id, { priority: value })}/></Field><Field label="Category"><Select value={selected.category} options={["TECHNICAL_SKILL","EXPERIENCE","EDUCATION","COMPETENCY","COMMUNICATION","LEADERSHIP","OTHER"]} onChange={(value) => patchLocal(selected.id, { category: value })}/></Field><Field label="Relative weight"><input type="number" step="0.01" min="0" max="1" value={selected.weight} onChange={(event) => patchLocal(selected.id, { weight: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm"/></Field><Field label="Minimum evidence"><Select value={selected.minimumEvidenceLevel} options={["WEAK","MEDIUM","STRONG"]} onChange={(value) => patchLocal(selected.id, { minimumEvidenceLevel: value })}/></Field></div>
          <Field label="Assessable description"><textarea rows={3} value={selected.description ?? ""} onChange={(event) => patchLocal(selected.id, { description: event.target.value })} className="w-full rounded-xl border border-zinc-300 p-3 text-sm" placeholder="Describe what would count as evidence for this criterion."/></Field>
          <div className="grid gap-2"><Toggle checked={selected.recruiterApproved} onChange={(checked) => patchLocal(selected.id, { recruiterApproved: checked })} label="Approved for scoring" detail="Only approved criteria influence evaluation."/><Toggle checked={selected.verificationRequired} onChange={(checked) => patchLocal(selected.id, { verificationRequired: checked })} label="Verification expected" detail="DrishtiRecruit may recommend assessment or interview evidence."/></div>
          <div className="rounded-2xl bg-zinc-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold">Interview guidance</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">Draft a criterion-specific evidence-seeking question. Generated text never becomes active without recruiter approval.</p></div>{selected.interviewQuestionSource && <span className="status-pill status-neutral">{humanizeEnum(selected.interviewQuestionSource)}</span>}</div><textarea rows={5} value={selected.interviewQuestion ?? ""} onChange={(event) => patchLocal(selected.id, { interviewQuestion: event.target.value, interviewQuestionSource: "MANUAL", interviewQuestionApproved: false })} className="mt-3 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm" placeholder="Example: Ask the candidate to explain a real decision that demonstrates this criterion…"/><Toggle checked={Boolean(selected.interviewQuestionApproved)} disabled={!selected.interviewQuestion?.trim()} onChange={(checked) => patchLocal(selected.id, { interviewQuestionApproved: checked })} label="Approved for interview kits" detail="Interviewers only receive approved questions."/></div>
          <button onClick={() => save(selected)} disabled={busy !== null} className="btn-primary w-full disabled:opacity-40">{busy === selected.id ? "Saving…" : "Save criterion"}</button>
          {message && <p role="status" className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">{message}</p>}
        </div>
      </div>}
    </aside>
  </div>;
}

function serialize(requirement: RequirementRow) {
  return {
    name: requirement.name,
    description: requirement.description,
    category: requirement.category,
    priority: requirement.priority,
    weight: Number(requirement.weight),
    minimumEvidenceLevel: requirement.minimumEvidenceLevel,
    verificationRequired: requirement.verificationRequired,
    recruiterApproved: requirement.recruiterApproved,
    interviewQuestion: requirement.interviewQuestion?.trim() || null,
    interviewQuestionSource: requirement.interviewQuestion?.trim() ? (requirement.interviewQuestionSource || "MANUAL") : null,
    interviewQuestionApproved: Boolean(requirement.interviewQuestion?.trim() && requirement.interviewQuestionApproved),
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-[11px] font-semibold text-zinc-500"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm">{options.map((option) => <option key={option} value={option}>{humanizeEnum(option)}</option>)}</select>; }
function Toggle({ checked, onChange, label, detail, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail: string; disabled?: boolean }) { return <label className={`flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 ${disabled ? "opacity-50" : ""}`}><input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5"/><span><span className="block text-xs font-semibold text-zinc-800">{label}</span><span className="mt-0.5 block text-[10px] leading-4 text-zinc-500">{detail}</span></span></label>; }
