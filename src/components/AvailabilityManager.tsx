"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Interviewer = { id: string; name: string; email: string };
type Slot = { id: string; interviewer: Interviewer; startsAt: string; endsAt: string; mode: string; meetingUrl: string | null; booked: boolean; createdById: string };

export function AvailabilityManager({ interviewers, slots, currentUserId, currentRole }: { interviewers: Interviewer[]; slots: Slot[]; currentUserId: string; currentRole: string }) {
  const router = useRouter();
  const allowedInterviewers = currentRole === "INTERVIEWER" ? interviewers.filter((i) => i.id === currentUserId) : interviewers;
  const [interviewerId, setInterviewerId] = useState(allowedInterviewers[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [mode, setMode] = useState("VIDEO");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function create() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/interview-slots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ interviewerId, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), mode, meetingUrl }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not create availability");
    setStartsAt(""); setEndsAt(""); setMessage("Availability published."); router.refresh();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/interview-slots/${id}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.error ?? "Could not delete slot"); }
    router.refresh();
  }

  return <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <section className="rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="text-lg font-semibold">Publish availability</h2><p className="mt-1 text-sm text-zinc-500">Candidates can self-select only from open slots. Overlapping availability for the same interviewer is blocked.</p><div className="mt-4 grid gap-3">
      <select value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} className="rounded-xl border border-zinc-300 bg-white p-3 text-sm">{allowedInterviewers.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.email}</option>)}</select>
      <label className="text-xs text-zinc-500">Start<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-sm"/></label>
      <label className="text-xs text-zinc-500">End<input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-sm"/></label>
      <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-xl border border-zinc-300 bg-white p-3 text-sm"><option>VIDEO</option><option>PHONE</option><option>ONSITE</option></select>
      <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="Meeting URL (optional)" className="rounded-xl border border-zinc-300 p-3 text-sm"/>
      <button onClick={create} disabled={busy || !interviewerId || !startsAt || !endsAt} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy ? "Publishing…" : "Publish slot"}</button>
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div></section>

    <section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Upcoming availability</h2><p className="mt-1 text-sm text-zinc-500">Booked slots are retained for auditability and cannot be deleted.</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{slots.filter((s) => !s.booked).length} open</span></div><div className="mt-4 space-y-2">{slots.length === 0 ? <p className="text-sm text-zinc-500">No upcoming availability.</p> : slots.map((slot) => <article key={slot.id} className="rounded-xl border border-zinc-200 p-4 text-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{slot.interviewer.name}</p><p className="mt-1 text-xs text-zinc-500">{new Date(slot.startsAt).toLocaleString()} → {new Date(slot.endsAt).toLocaleTimeString()} · {slot.mode}</p>{slot.meetingUrl && <p className="mt-1 text-xs text-zinc-400">Meeting link configured</p>}</div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs ${slot.booked ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100"}`}>{slot.booked ? "BOOKED" : "OPEN"}</span>{!slot.booked && <button onClick={() => remove(slot.id)} className="ml-3 text-xs font-medium text-red-600">Delete</button>}</div></div></article>)}</div></section>
  </div>;
}
