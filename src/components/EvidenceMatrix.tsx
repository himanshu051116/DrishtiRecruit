import { humanizeEnum } from "@/lib/ui/labels";

type Evidence = { id: string; sourceType: string; sourceExcerpt: string | null; strength: string; confidence: number; verified: boolean };
type Matrix = { requirements: Array<{ id: string; name: string; priority: string; evaluation: null | { status: string; fitScore: number; evidenceCoverage: number; independentSourceCount: number }; evidence: Evidence[] }> };

function statusTone(status: string) {
  if (status === "VERIFIED") return "status-success";
  if (status === "MISSING" || status === "CONFLICTING") return "status-danger";
  if (status === "WEAK" || status === "PARTIAL") return "status-warning";
  return "status-neutral";
}

function groupEvidence(evidence: Evidence[], kind: "RESUME" | "ASSESSMENT" | "INTERVIEW" | "OTHER") {
  if (kind === "OTHER") return evidence.filter((item) => !["RESUME", "ASSESSMENT", "INTERVIEW"].includes(item.sourceType));
  return evidence.filter((item) => item.sourceType === kind);
}

function SourceCell({ evidence, label }: { evidence: Evidence[]; label: string }) {
  if (!evidence.length) return <span className="source-empty" aria-label={`${label}: no evidence`}>—</span>;
  return <div className="source-cell" aria-label={`${label}: ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"}`}>
    {evidence.slice(0, 3).map((item) => <span key={item.id} title={`${humanizeEnum(item.strength)}${item.verified ? " · verified" : ""}`} className={`source-dot ${item.strength.toLowerCase()} ${item.verified ? "verified" : ""}`}/>) }
    {evidence.length > 3 && <span className="text-[10px] font-semibold text-zinc-500">+{evidence.length - 3}</span>}
  </div>;
}

export function EvidenceMatrix({ matrix }: { matrix: Matrix }) {
  return <div className="evidence-matrix">
    <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">Requirement × evidence map</p><h2 className="section-heading mt-1">What supports each hiring criterion?</h2><p className="section-description">Dots show evidence by source. A ring indicates verified evidence. Expand any row to inspect provenance.</p></div><div className="flex flex-wrap gap-3 text-[10px] text-zinc-500"><span className="inline-flex items-center gap-1.5"><i className="source-dot weak"/>Weak</span><span className="inline-flex items-center gap-1.5"><i className="source-dot medium"/>Medium</span><span className="inline-flex items-center gap-1.5"><i className="source-dot strong"/>Strong</span><span className="inline-flex items-center gap-1.5"><i className="source-dot strong verified"/>Verified</span></div></div>
    </div>
    <div className="evidence-grid-head"><span>Requirement</span><span>Resume</span><span>Assessment</span><span>Interview</span><span>Coverage & status</span></div>
    {matrix.requirements.map((requirement) => {
      const status = requirement.evaluation?.status ?? "MISSING";
      const resume = groupEvidence(requirement.evidence, "RESUME");
      const assessment = groupEvidence(requirement.evidence, "ASSESSMENT");
      const interview = groupEvidence(requirement.evidence, "INTERVIEW");
      const other = groupEvidence(requirement.evidence, "OTHER");
      return <details key={requirement.id}>
        <summary className="evidence-grid-row">
          <span className="evidence-requirement"><strong>{requirement.name}</strong><small>{humanizeEnum(requirement.priority)}{requirement.evaluation ? ` · fit ${Math.round(requirement.evaluation.fitScore)}%` : ""}</small></span>
          <SourceCell evidence={resume} label="Resume"/>
          <SourceCell evidence={assessment} label="Assessment"/>
          <SourceCell evidence={interview} label="Interview"/>
          <span className="flex flex-wrap items-center gap-2"><span className={`status-pill ${statusTone(status)}`}>{humanizeEnum(status)}</span>{requirement.evaluation && <span className="text-[10px] font-semibold text-zinc-500">{Math.round(requirement.evaluation.evidenceCoverage)}%</span>}</span>
        </summary>
        <div className="evidence-detail">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold text-zinc-700">Evidence provenance</p><p className="text-[10px] text-zinc-500">{requirement.evaluation?.independentSourceCount ?? 0} independent source type{requirement.evaluation?.independentSourceCount === 1 ? "" : "s"}{other.length ? ` · ${other.length} additional evidence item${other.length === 1 ? "" : "s"}` : ""}</p></div>
          {requirement.evidence.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No evidence is recorded for this criterion yet.</p> : <div className="grid gap-2 lg:grid-cols-2">{requirement.evidence.map((item) => <article key={item.id} className="provenance-card"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{humanizeEnum(item.sourceType)} · {humanizeEnum(item.strength)}</span><span className={`status-pill ${item.verified ? "status-success" : "status-neutral"}`}>{item.verified ? "Verified" : `${Math.round(item.confidence * 100)}% confidence`}</span></div><p className="mt-2 text-xs leading-6 text-zinc-700">{item.sourceExcerpt ?? "Source excerpt unavailable"}</p></article>)}</div>}
        </div>
      </details>;
    })}
  </div>;
}
