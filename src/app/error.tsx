"use client";
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-6 py-20"><div className="rounded-2xl border border-red-200 bg-white p-8"><p className="text-sm font-medium text-red-700">Something went wrong</p><h1 className="mt-2 text-2xl font-semibold">DrishtiRecruit could not complete this view.</h1><p className="mt-3 text-sm leading-6 text-zinc-600">No hiring decision has been changed by this display error. Retry the request or return to your dashboard.</p><button onClick={reset} className="mt-6 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">Try again</button></div></main>;
}
