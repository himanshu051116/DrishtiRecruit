"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState(""); const [devToken, setDevToken] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }); const body = await response.json(); setMessage("If that email exists, a reset message has been queued."); if (body.data?.developmentResetToken) setDevToken(body.data.developmentResetToken); }
  return <form onSubmit={submit} className="space-y-4"><label className="text-sm"><span className="mb-1 block font-medium">Email</span><input name="email" type="email" required className="w-full rounded-xl border border-zinc-300 px-3 py-3"/></label><button className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white">Request reset</button>{message && <p className="text-sm text-zinc-600">{message}</p>}{devToken && <a className="block text-sm font-medium underline" href={`/reset-password?token=${encodeURIComponent(devToken)}`}>Development: open reset form</a>}</form>;
}

export function ResetPasswordForm() {
  const router = useRouter(); const params = useSearchParams(); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { token: params.get("token") ?? "", password: String(form.get("password") ?? "") }; const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) { setMessage(body.error ?? "Reset failed"); return; } setMessage("Password reset. Redirecting to sign in…"); setTimeout(() => router.push("/login"), 800); }
  return <form onSubmit={submit} className="space-y-4"><label className="text-sm"><span className="mb-1 block font-medium">New password</span><input name="password" type="password" minLength={10} required className="w-full rounded-xl border border-zinc-300 px-3 py-3"/></label><button className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white">Reset password</button>{message && <p className="text-sm text-zinc-600">{message}</p>}</form>;
}
