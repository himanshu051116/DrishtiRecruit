"use client";
import { useState } from "react";

export function PrivacyActions({ requestedAt }: { requestedAt?: string | null }) {
  const [pending, setPending] = useState(Boolean(requestedAt));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function mutate(method: "POST" | "DELETE") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/candidate/privacy/deletion-request", { method });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error ?? "Request failed");
      setPending(method === "POST");
      setMessage(method === "POST" ? "Deletion request recorded for administrator review." : "Deletion request cancelled.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4"><a href="/api/candidate/privacy/export" className="inline-flex rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium">Download my DrishtiRecruit data</a><div className="rounded-xl border border-zinc-200 p-4"><p className="font-medium">Account deletion request</p><p className="mt-1 text-sm text-zinc-500">DrishtiRecruit records the request instead of immediately destroying hiring records. An administrator can review retention obligations and complete the request under the organization&apos;s policy.</p>{pending ? <button disabled={busy} onClick={() => mutate("DELETE")} className="mt-3 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50">Cancel deletion request</button> : <button disabled={busy} onClick={() => mutate("POST")} className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50">Request account deletion</button>}{message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}</div></div>;
}
