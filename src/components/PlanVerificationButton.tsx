"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlanVerificationButton({ applicationId, disabled=false }: { applicationId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function plan() {
    setBusy(true); setError("");
    const response = await fetch(`/api/applications/${applicationId}/verifications/plan`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error ?? "Could not plan verification"); return; }
    router.refresh();
  }
  return <div>
    <button disabled={disabled || busy} onClick={plan} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? "Planning…" : "Plan next verification"}</button>
    {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
  </div>;
}
