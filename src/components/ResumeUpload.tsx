"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResumeUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(formData: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/candidate/resumes", { method: "POST", body: formData });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(body.error ?? "Resume upload failed"); return; }
    setMessage(body.data?.duplicate ? "This resume is already in your profile." : "Resume uploaded and text extracted.");
    router.refresh();
  }

  return <form action={upload} className="rounded-2xl border border-zinc-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="font-medium">Resume library</p><p className="mt-1 text-sm text-zinc-500">Upload PDF or DOCX, up to 10 MB. Files are validated before parsing.</p></div>
      <label className="cursor-pointer rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
        {busy ? "Uploading…" : "Upload resume"}
        <input name="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (!file) return; const fd = new FormData(); fd.set("resume", file); void upload(fd); }} />
      </label>
    </div>
    {message && <p className="mt-3 text-sm text-zinc-600">{message}</p>}
  </form>;
}
