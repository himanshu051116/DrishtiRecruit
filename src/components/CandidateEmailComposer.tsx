"use client";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function CandidateEmailComposer({ applicationId, candidateName, jobTitle }: { applicationId: string; candidateName: string; jobTitle: string }) {
  const [subject, setSubject] = useState(`${jobTitle} application update`);
  const [message, setMessage] = useState(`Hello ${candidateName},\n\n`);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function send() {
    setBusy(true); setStatus("");
    const response = await fetch(`/api/applications/${applicationId}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, message }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { const text = body.error ?? "Could not queue message"; setStatus(text); toast(text, "error"); return; }
    const text = body.data.status === "SENT" ? "Message delivered." : "Message queued in transactional outbox."; setStatus(text); toast(text, "success");
  }
  return <div className="grid gap-3"><input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm" placeholder="Subject"/><textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-xl border border-zinc-300 p-3 text-sm" placeholder="Message"/><div className="flex items-center gap-3"><button disabled={busy || !subject.trim() || !message.trim()} onClick={send} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy ? "Sending…" : "Send candidate message"}</button>{status && <span className="text-xs text-zinc-500">{status}</span>}</div></div>;
}
