"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AssignAssessmentButton({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function assign() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/verifications/${verificationId}/assign-assessment`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(body.error ?? "Could not assign assessment"); return; }
    setMessage("Assessment assigned to candidate."); router.refresh();
  }
  return <div className="mt-3"><button onClick={assign} disabled={busy} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium disabled:opacity-50">{busy ? "Assigning…" : "Assign standardized assessment"}</button>{message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}</div>;
}
