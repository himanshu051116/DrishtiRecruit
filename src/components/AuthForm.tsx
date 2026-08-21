"use client";
import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, googleEnabled = false }: { mode: "login" | "register"; googleEnabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Request failed");
      let developmentVerified = false;
      if (mode === "register" && body.data?.developmentVerificationToken) {
        const verify = await fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: body.data.developmentVerificationToken }) });
        if (!verify.ok) throw new Error("Email verification failed");
        developmentVerified = true;
      }
      if (mode === "register" && !developmentVerified) {
        const delivery = body.data?.emailDelivery;
        router.push(delivery === "not_configured" || delivery === "failed" ? `/verify-email?delivery=${delivery}` : "/verify-email");
      } else if (mode === "login" && body.data?.requiresTwoFactor) router.push("/two-factor"); else router.push("/dashboard");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Request failed"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">{googleEnabled && <><a href="/api/auth/google/start" className="btn-secondary w-full py-3">Continue with Google</a><div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"><span className="h-px flex-1 bg-zinc-200"/><span>or use email</span><span className="h-px flex-1 bg-zinc-200"/></div></>}<form onSubmit={submit} className="space-y-4">
    {mode === "register" && <><Field name="name" label="Name" autoComplete="name"/><SelectField name="role" label="Account type" options={[{ value: "CANDIDATE", label: "Candidate" }, { value: "RECRUITER", label: "Recruiter" }]}/><Field name="companyName" label="Company" hint="Required for recruiter accounts" autoComplete="organization" optional/></>}
    <Field name="email" label="Email" type="email" autoComplete="email"/>
    <Field name="password" label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}/>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="btn-primary w-full py-3 disabled:opacity-50">{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>
  </form></div>;
}

function Field({ name, label, type = "text", hint, optional = false, autoComplete }: { name: string; label: string; type?: string; hint?: string; optional?: boolean; autoComplete?: string }) {
  const uid = useId(); const id = `${name}-${uid}`;
  return <div><label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}{optional && <span className="ml-1 font-normal text-zinc-400">optional</span>}</label><input id={id} required={!optional} name={name} type={type} autoComplete={autoComplete} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500"/>{hint && <p className="mt-1 text-[10px] text-zinc-400">{hint}</p>}</div>;
}
function SelectField({ name, label, options }: { name: string; label: string; options: Array<{ value: string; label: string }> }) { const uid = useId(); const id = `${name}-${uid}`; return <div><label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}</label><select id={id} name={name} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>; }
