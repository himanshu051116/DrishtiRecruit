"use client";
import { useEffect, useState } from "react";

type Status = { enabled: boolean; recoveryCodesRemaining: number };
type Setup = { secret: string; otpauthUri: string };

export function TwoFactorSettings({ hasPassword }: { hasPassword: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/auth/2fa/status", { cache: "no-store" });
    const body = await response.json();
    if (response.ok) setStatus(body.data);
  }
  useEffect(() => { void refresh(); }, []);

  async function begin() {
    setBusy(true); setMessage(""); setRecoveryCodes([]);
    try {
      const response = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: setupPassword || undefined }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Setup failed");
      setSetup(body.data); setMessage("Add this account to your authenticator, then verify one code below.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Setup failed"); }
    finally { setBusy(false); }
  }

  async function confirm() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/2fa/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Verification failed");
      setRecoveryCodes(body.data.recoveryCodes ?? []); setSetup(null); setCode(""); setMessage("Two-factor authentication is enabled. Store the recovery codes somewhere safe; they are shown only now."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed"); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/2fa/disable", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, password: password || undefined }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Disable failed");
      setCode(""); setPassword(""); setRecoveryCodes([]); setMessage("Two-factor authentication is disabled."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Disable failed"); }
    finally { setBusy(false); }
  }

  if (!status) return <div className="h-28 animate-pulse rounded-2xl bg-zinc-100"/>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Authenticator app</p><p className="mt-1 text-sm text-zinc-500">TOTP protects password and Google sign-ins with a second factor.</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${status.enabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{status.enabled ? `Enabled · ${status.recoveryCodesRemaining} recovery codes` : "Not enabled"}</span></div>
    {!status.enabled && !setup && <div className="space-y-3">{hasPassword && <input type="password" value={setupPassword} onChange={(event) => setSetupPassword(event.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5" placeholder="Current password required to enable 2FA"/>}<button onClick={begin} disabled={busy || (hasPassword && !setupPassword)} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Preparing…" : "Enable two-factor authentication"}</button></div>}
    {setup && <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Manual authenticator key</p><code className="mt-2 block break-all rounded-xl bg-white p-3 text-sm">{setup.secret}</code><p className="mt-2 text-xs text-zinc-500">Issuer: DrishtiRecruit · Time-based · SHA-1 · 6 digits · 30 seconds</p><a href={setup.otpauthUri} className="mt-3 inline-block text-xs font-medium underline underline-offset-4">Open in authenticator app</a></div><div><label className="mb-1 block text-sm font-medium">Verification code</label><input autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-mono tracking-widest" placeholder="123456"/></div><div className="flex gap-2"><button onClick={confirm} disabled={busy || code.trim().length !== 6} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">Verify & enable</button><button onClick={() => { setSetup(null); setCode(""); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm">Cancel</button></div></div>}
    {recoveryCodes.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-medium text-amber-950">Save these one-time recovery codes</p><p className="mt-1 text-xs text-amber-800">Each code can be used once. They are stored as hashes and cannot be shown again.</p><div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">{recoveryCodes.map((item) => <code key={item} className="rounded-lg bg-white px-3 py-2">{item}</code>)}</div></div>}
    {status.enabled && <div className="space-y-3 rounded-2xl border border-zinc-200 p-5"><p className="font-medium">Disable two-factor authentication</p><p className="text-xs leading-5 text-zinc-500">Confirm with an authenticator or unused recovery code.{hasPassword ? " Your current password is also required." : " This Google-only account has no local password."}</p><input value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 font-mono" placeholder="Authenticator / recovery code"/>{hasPassword && <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5" placeholder="Current password"/>}<button onClick={disable} disabled={busy || code.trim().length < 6 || (hasPassword && !password)} className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-50">Disable 2FA</button></div>}
    {message && <p className="text-sm text-zinc-600">{message}</p>}
  </div>;
}
