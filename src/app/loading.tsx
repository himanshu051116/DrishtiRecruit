export default function Loading() {
  return <main className="mx-auto max-w-7xl px-6 py-10" aria-busy="true" aria-label="Loading"><div className="h-4 w-36 animate-pulse rounded bg-zinc-200"/><div className="mt-3 h-9 w-72 animate-pulse rounded bg-zinc-200"/><div className="mt-8 grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white"/>)}</div><div className="mt-6 h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white"/></main>;
}
