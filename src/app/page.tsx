import Link from "next/link";

export default function Home() {
  return <main>
    <section className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
      <div>
        <p className="page-eyebrow">Hiring, in one place</p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-[-.05em] text-zinc-950 md:text-7xl">Run a clearer hiring process.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600">Manage roles, applications, assessments, interviews, and hiring decisions from one workspace.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="/register" className="btn-primary px-5 py-3">Create workspace</Link><Link href="/login" className="btn-secondary px-5 py-3">Sign in</Link></div>
      </div>
      <ProductPreview/>
    </section>

    <section className="border-y border-zinc-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-6"><div className="grid gap-4 md:grid-cols-3"><Feature title="Manage roles" text="Create openings and keep the requirements for each role in one place."/><Feature title="Review candidates" text="Track applications, assessments, interviews, and notes without losing context."/><Feature title="Make decisions" text="Bring the relevant hiring information together when the team is ready to decide."/></div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6"><div className="rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-700 p-8 text-white shadow-xl md:p-12"><p className="text-sm opacity-70">DrishtiRecruit</p><h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">Ready to organize your next hire?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">Create a workspace and invite your team when you are ready.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/register" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-800">Create workspace</Link><Link href="/jobs" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold">View open roles</Link></div></div></section>
    <footer className="border-t border-zinc-200"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-500 sm:px-6"><span>DrishtiRecruit</span><div className="flex gap-4"><Link href="/jobs">Open roles</Link><Link href="/login">Sign in</Link></div></div></footer>
  </main>;
}

function Feature({ title, text }: { title: string; text: string }) { return <div className="surface-card p-5"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p></div>; }

function ProductPreview() { const rows = [["Node.js","strong","strong","medium","Verified"],["PostgreSQL","strong","medium","strong","Verified"],["Docker","weak","strong","none","Partial"],["Security design","none","none","none","Missing"]]; return <div className="surface-card overflow-hidden rounded-[26px] p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-zinc-500">Backend Engineer</p><h2 className="mt-1 text-lg font-bold">Priya Sharma</h2></div><span className="status-pill status-warning">In review</span></div><div className="mt-5 grid grid-cols-3 gap-2"><PreviewScore label="Fit" value="89%" tone="fit"/><PreviewScore label="Evidence" value="68%" tone="evidence"/><PreviewScore label="Decision" value="41%" tone="decision"/></div><div className="mt-5 overflow-hidden rounded-xl border border-zinc-200"><div className="grid grid-cols-[1.3fr_repeat(3,.6fr)_1fr] bg-zinc-50 px-3 py-2 text-[8px] font-bold uppercase tracking-wide text-zinc-400"><span>Criterion</span><span>Resume</span><span>Test</span><span>Interview</span><span>Status</span></div>{rows.map(([name,a,b,c,status])=><div key={name} className="grid grid-cols-[1.3fr_repeat(3,.6fr)_1fr] items-center border-t border-zinc-100 px-3 py-3 text-[10px]"><strong>{name}</strong><Dot strength={a}/><Dot strength={b}/><Dot strength={c}/><span className={status==="Verified"?"text-emerald-700":status==="Missing"?"text-red-600":"text-amber-700"}>{status}</span></div>)}</div><div className="mt-4 rounded-xl bg-indigo-50 p-4"><p className="text-[9px] font-bold uppercase tracking-wide text-indigo-500">Next step</p><p className="mt-1 text-sm font-bold text-indigo-950">Review security design</p><p className="mt-1 text-[11px] leading-5 text-indigo-700">Add an assessment or interview note before making a decision.</p></div></div>; }
function PreviewScore({label,value,tone}:{label:string;value:string;tone:"fit"|"evidence"|"decision"}) { const cls=tone==="fit"?"bg-[var(--fit-soft)] text-[var(--fit)]":tone==="evidence"?"bg-[var(--evidence-soft)] text-[var(--evidence)]":"bg-[var(--decision-soft)] text-[var(--decision)]"; return <div className={`rounded-xl p-3 ${cls}`}><p className="text-[8px] font-bold uppercase tracking-wide opacity-70">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
function Dot({strength}:{strength:string}) { if(strength==="none") return <span className="text-zinc-300">—</span>; return <span className={`source-dot ${strength}`}/>; }
