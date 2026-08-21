"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResumeHistoryActions({ resumeId, isActive }: { resumeId: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch(`/api/candidate/resumes/${resumeId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
      if (!response.ok) throw new Error("Unable to update resume status");
      router.refresh();
    } finally { setBusy(false); }
  }
  return <button onClick={toggle} disabled={busy} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50">{busy ? "Saving…" : isActive ? "Deactivate" : "Reactivate"}</button>;
}
