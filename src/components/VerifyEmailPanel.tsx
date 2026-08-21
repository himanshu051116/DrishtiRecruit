"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerifyEmailPanel({ token }: { token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(token ? "Verification link loaded. Confirm below." : "Open the verification link from your email, or resend it while signed in.");

  async function verify() {
    if (!token) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Verification failed");
      setMessage("Email verified. Redirecting…");
      router.replace("/dashboard"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed"); }
    finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not resend verification");
      if (body.data?.developmentVerificationToken) setMessage(`Development token issued: ${body.data.developmentVerificationToken}`);
      else setMessage(body.data?.alreadyVerified ? "This email is already verified." : "A fresh verification message was queued.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not resend verification"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">{token && <button onClick={verify} disabled={busy} className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? "Verifying…" : "Verify email"}</button>}<button onClick={resend} disabled={busy} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium disabled:opacity-50">Resend verification email</button>{message && <p className="rounded-xl bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-600 break-words">{message}</p>}</div>;
}
