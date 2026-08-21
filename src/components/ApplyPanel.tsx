"use client";
import { useState } from "react";

type ResumeOption = { id: string; fileName: string; createdAt: string | Date };

export function ApplyPanel({ jobId, resumes }: { jobId: string; resumes: ResumeOption[] }) {
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true); setMsg("");
    const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId, resumeId }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) { setMsg("Application submitted. Your uploaded resume is ready for evidence analysis."); setOpen(false); }
    else setMsg(body.error ?? "Could not apply");
  }

  if (!resumes.length) return <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Upload a PDF or DOCX resume above before applying.</p>;

  return <div>
    {!open ? <button onClick={() => setOpen(true)} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">Apply</button> :
      <div className="rounded-xl bg-zinc-50 p-4">
        <label className="text-sm font-medium">Choose resume</label>
        <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">
          {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.fileName}</option>)}
        </select>
        <div className="mt-3 flex gap-2">
          <button disabled={busy || !resumeId} onClick={apply} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white disabled:opacity-40">{busy ? "Submitting…" : "Submit application"}</button>
          <button onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">Cancel</button>
        </div>
      </div>}
    {msg && <p className="mt-3 text-sm text-zinc-600">{msg}</p>}
  </div>;
}
