"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TwoFactorChallenge() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/2fa/login/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Verification failed");
      router.replace("/dashboard"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Verification failed"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div><label className="mb-1 block text-sm font-medium">Authenticator or recovery code</label><input autoFocus autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-mono tracking-widest" placeholder="123456"/></div>
    <p className="text-xs leading-5 text-zinc-500">Enter the six-digit code from your authenticator. A one-time recovery code also works if you cannot access the authenticator.</p>
    {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={busy || code.trim().length < 6} className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? "Verifying…" : "Verify and sign in"}</button>
  </form>;
}
