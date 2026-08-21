"use client";

export default function JobsError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:py-14"><div className="surface-card max-w-xl p-8"><p className="page-eyebrow">Open roles</p><h1 className="mt-2 text-2xl font-bold">We could not load roles right now.</h1><p className="mt-3 text-sm leading-6 text-zinc-600">Please try again in a moment.</p><button onClick={reset} className="btn-primary mt-6">Try again</button></div></main>;
}
