"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerificationActions({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(status: "APPROVED" | "SKIPPED") {
    setBusy(true); setError("");
    const response = await fetch(`/api/verifications/${verificationId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error ?? "Could not update recommendation"); return; }
    router.refresh();
  }
  return <div className="mt-3">
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => update("APPROVED")} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white">Approve</button>
      <button disabled={busy} onClick={() => update("SKIPPED")} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium">Skip</button>
    </div>
    {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
  </div>;
}
