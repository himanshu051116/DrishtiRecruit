import Link from "next/link";
import { VerifyEmailPanel } from "@/components/VerifyEmailPanel";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; delivery?: string }> }) {
  const { token, delivery } = await searchParams;
  const deliveryStatus = delivery === "not_configured" || delivery === "failed" ? delivery : undefined;
  return <main className="mx-auto max-w-md px-6 py-16"><p className="text-sm font-medium text-zinc-500">Account activation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Verify your email</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Recruiter and protected workspace features stay unavailable until the account email is verified.</p><div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6"><VerifyEmailPanel token={token} deliveryStatus={deliveryStatus}/></div><Link href="/login" className="mt-5 block text-center text-sm text-zinc-500 underline">Return to sign in</Link></main>;
}
