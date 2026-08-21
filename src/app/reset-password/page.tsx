import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/PasswordResetForms";
export default function ResetPasswordPage() { return <main className="mx-auto max-w-md px-6 py-16"><h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1><div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6"><Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}><ResetPasswordForm/></Suspense></div></main>; }
