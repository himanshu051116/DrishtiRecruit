"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Assessment = { id: string; title: string; durationMin: number; questionCount: number };
export function ManualAssessmentAssign({ applicationId, assessments }: { applicationId: string; assessments: Assessment[] }) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function assign() {
    if (!assessmentId) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/assessments/${assessmentId}/assign`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not assign assessment");
    setMessage("Assessment assigned."); router.refresh();
  }
  if (!assessments.length) return <p className="text-sm text-zinc-500">No active recruiter assessments exist for this job. Create one in Assessment Studio.</p>;
  return <div className="flex flex-wrap items-center gap-3"><select value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} className="min-w-72 rounded-xl border border-zinc-300 bg-white p-3 text-sm">{assessments.map((a) => <option key={a.id} value={a.id}>{a.title} · {a.questionCount} Q · {a.durationMin} min</option>)}</select><button onClick={assign} disabled={busy} className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium disabled:opacity-40">{busy ? "Assigning…" : "Assign assessment"}</button>{message && <p className="text-xs text-zinc-500">{message}</p>}</div>;
}
