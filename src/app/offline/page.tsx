import Link from "next/link";
export default function OfflinePage() {
  return <main className="mx-auto max-w-xl px-6 py-24 text-center"><p className="text-sm font-medium text-zinc-500">Offline</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">DrishtiRecruit needs a connection for hiring data</h1><p className="mt-4 text-sm leading-7 text-zinc-600">Sensitive candidate, assessment and decision data are intentionally not cached by the service worker. Reconnect to continue.</p><Link href="/" className="mt-8 inline-block rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white">Retry</Link></main>;
}
