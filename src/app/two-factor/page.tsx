import Link from "next/link";
import { TwoFactorChallenge } from "@/components/TwoFactorChallenge";

export default function TwoFactorPage() {
  return <main className="mx-auto max-w-md px-6 py-16"><p className="text-sm font-medium text-zinc-500">Security check</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Two-factor authentication</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Your password or Google account has already been verified. Complete the second factor to create a DrishtiRecruit session.</p><div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6"><TwoFactorChallenge/></div><Link href="/login" className="mt-5 block text-center text-sm text-zinc-500 underline">Return to sign in</Link></main>;
}
