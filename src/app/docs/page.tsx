import Link from "next/link";

const groups = [
  ["Jobs & requirements", "Create jobs, extract requirement drafts, require recruiter approval before scoring."],
  ["Applications & evidence", "Apply, upload resumes, analyze evidence and inspect the Requirement × Evidence matrix."],
  ["Assessments", "Build versioned comparable assessments, assign attempts, autosave answers and recalculate coverage."],
  ["Interviews", "Publish availability, self-book slots, generate criterion-driven kits and submit scorecards."],
  ["Decisions & offers", "Inspect decision readiness, record the human DecisionTrace and manage offer acceptance."],
  ["Admin & operations", "Manage platform settings, accounts, organizations, audit history and service health."],
];

export default function ApiDocsPage() {
  return <main className="mx-auto max-w-6xl px-6 py-14">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-medium text-zinc-500">Developer resources</p><h1 className="mt-1 text-4xl font-semibold tracking-tight">DrishtiRecruit API</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">OpenAPI 3.1 documentation for the hackathon build. Protected routes require an authenticated DrishtiRecruit session and role/tenant authorization.</p></div>
      <div className="flex flex-wrap gap-2"><a href="/openapi.yaml" className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white">OpenAPI YAML</a><a href="/DrishtiRecruit.postman_collection.json" className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium">Postman collection</a></div>
    </div>
    <section className="mt-10 grid gap-4 md:grid-cols-2">{groups.map(([title, body]) => <article key={title} className="rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p></article>)}</section>
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6"><h2 className="font-semibold">Operational check</h2><p className="mt-2 text-sm text-zinc-600">The public health route reports only service/database reachability and build version; it does not expose connection details.</p><div className="mt-4 flex flex-wrap gap-3"><a href="/api/health" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium">GET /api/health</a><Link href="/" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium">Back to product</Link></div></section>
  </main>;
}
