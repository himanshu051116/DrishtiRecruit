"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Interviewer = { id: string; name: string; email: string };
export function InterviewScheduler({ applicationId, interviewers }: { applicationId: string; interviewers: Interviewer[] }) {
  const router = useRouter();
  const [interviewerId, setInterviewerId] = useState(interviewers[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function schedule() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/interviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId, interviewerId, scheduledAt: new Date(scheduledAt).toISOString(), meetingUrl, durationMin }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setMessage(body.error ?? "Could not schedule interview"); return; }
    setMessage("Interview scheduled with a criterion-driven kit."); router.refresh();
  }
  if (!interviewers.length) return <p className="text-sm text-zinc-500">Create an interviewer user for this company before scheduling.</p>;
  return <div className="grid gap-3 md:grid-cols-4"><select value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} className="rounded-xl border border-zinc-300 bg-white p-3 text-sm">{interviewers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-xl border border-zinc-300 bg-white p-3 text-sm"/><input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="Meeting URL (optional)" className="rounded-xl border border-zinc-300 bg-white p-3 text-sm"/><select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="rounded-xl border border-zinc-300 bg-white p-3 text-sm"><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select><div className="md:col-span-4"><button disabled={busy || !scheduledAt || !interviewerId} onClick={schedule} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy ? "Scheduling…" : "Schedule interview + build kit"}</button>{message && <p className="mt-2 text-sm text-zinc-500">{message}</p>}</div></div>;
}
