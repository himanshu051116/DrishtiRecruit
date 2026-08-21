"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function OfferResponseActions({ offerId }: { offerId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState("");
  async function act(action: "ACCEPT" | "REJECT") { setBusy(action); setError(""); try { const res = await fetch(`/api/offers/${offerId}/respond`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) }); const body = await res.json(); if (!res.ok) throw new Error(body.error ?? "Could not respond"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not respond"); } finally { setBusy(null); } }
  return <div><div className="flex gap-2"><button disabled={Boolean(busy)} onClick={() => act("ACCEPT")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Accept</button><button disabled={Boolean(busy)} onClick={() => act("REJECT")} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50">Decline</button></div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}
