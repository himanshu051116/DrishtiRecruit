"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Slot = { id: string; startsAt: string; endsAt: string; mode: string; interviewerName: string };
export function CandidateInterviewBooking({ applicationId, slots }: { applicationId: string; slots: Slot[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(slots[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function book() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/applications/${applicationId}/interview-slots/book`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slotId: selectedId, type: "TECHNICAL" }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not book this slot");
    setMessage("Interview booked."); router.refresh();
  }
  if (!slots.length) return <p className="mt-2 text-xs text-zinc-500">No self-scheduling slots are currently available. The hiring team can still schedule an interview directly.</p>;
  return <div className="mt-3 rounded-xl bg-zinc-50 p-4"><p className="text-xs font-medium text-zinc-500">Choose an available interview slot</p><div className="mt-2 flex flex-wrap gap-2"><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="min-w-72 rounded-xl border border-zinc-300 bg-white p-3 text-sm">{slots.map((slot) => <option key={slot.id} value={slot.id}>{new Date(slot.startsAt).toLocaleString()} · {slot.interviewerName} · {slot.mode}</option>)}</select><button disabled={busy || !selectedId} onClick={book} className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-40">{busy ? "Booking…" : "Book interview"}</button></div>{message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}</div>;
}
