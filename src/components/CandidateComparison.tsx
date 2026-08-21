"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { humanizeEnum } from "@/lib/ui/labels";

type Requirement = { id: string; name: string; priority: string };
type Criterion = { requirementId: string; status: string; fitScore: number; evidenceCoverage: number; independentSources: number };
type Candidate = { applicationId: string; name: string; email: string; stage: string; fitScore: number; evidenceCoverage: number; decisionCoverage: number; criteria: Criterion[] };

type Props = { requirements: Requirement[]; candidates: Candidate[] };

function statusTone(status: string) {
  if (status === "VERIFIED") return "status-success";
  if (["MISSING", "CONFLICTING"].includes(status)) return "status-danger";
  if (["WEAK", "PARTIAL"].includes(status)) return "status-warning";
  return "status-neutral";
}

export function CandidateComparison({ requirements, candidates }: Props) {
  const [filter, setFilter] = useState<"ALL" | "MUST_HAVE" | "UNRESOLVED">("ALL");
  const [sort, setSort] = useState<"DECISION" | "FIT" | "EVIDENCE">("DECISION");
  const [selected, setSelected] = useState<string[]>(candidates.slice(0, Math.min(3, candidates.length)).map((candidate) => candidate.applicationId));

  const visibleCandidates = useMemo(() => {
    const picked = candidates.filter((candidate) => selected.includes(candidate.applicationId));
    return [...picked].sort((a, b) => sort === "FIT" ? b.fitScore - a.fitScore : sort === "EVIDENCE" ? b.evidenceCoverage - a.evidenceCoverage : b.decisionCoverage - a.decisionCoverage);
  }, [candidates, selected, sort]);

  const visibleRequirements = useMemo(() => requirements.filter((requirement) => {
    if (filter === "MUST_HAVE") return requirement.priority === "MUST_HAVE";
    if (filter === "UNRESOLVED") return visibleCandidates.some((candidate) => {
      const criterion = candidate.criteria.find((item) => item.requirementId === requirement.id);
      return criterion && criterion.status !== "VERIFIED" && criterion.status !== "OPTIONAL";
    });
    return true;
  }), [requirements, filter, visibleCandidates]);

  function toggleCandidate(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 4 ? current : [...current, id]);
  }

  return <div>
    <div className="surface-card p-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">Comparison controls</p><p className="mt-1 text-xs text-zinc-500">Pin up to four finalists, filter criteria, and sort the comparison by the signal you care about.</p></div><div className="flex flex-wrap gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs"><option value="ALL">All criteria</option><option value="MUST_HAVE">Must-haves only</option><option value="UNRESOLVED">Unresolved only</option></select><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs"><option value="DECISION">Sort by decision readiness</option><option value="EVIDENCE">Sort by evidence coverage</option><option value="FIT">Sort by fit</option></select></div></div><div className="mt-4 flex flex-wrap gap-2">{candidates.map((candidate) => <label key={candidate.applicationId} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${selected.includes(candidate.applicationId) ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-zinc-200 bg-white text-zinc-600"}`}><input type="checkbox" checked={selected.includes(candidate.applicationId)} onChange={() => toggleCandidate(candidate.applicationId)} disabled={!selected.includes(candidate.applicationId) && selected.length >= 4}/>{candidate.name}</label>)}</div></div>

    {visibleCandidates.length === 0 ? <div className="surface-card mt-4 p-6 text-sm text-zinc-500">Select at least one candidate to compare.</div> : <div className="table-shell mt-4 overflow-x-auto"><table className="data-table min-w-[880px]"><thead><tr><th className="sticky left-0 z-20 min-w-56 border-r border-zinc-200 bg-zinc-50">Criterion</th>{visibleCandidates.map((candidate) => <th key={candidate.applicationId} className="min-w-56 align-top"><Link href={`/recruiter/applications/${candidate.applicationId}`} className="text-sm font-bold normal-case tracking-normal text-zinc-900 hover:underline">{candidate.name}</Link><div className="mt-1 text-[10px] font-normal normal-case tracking-normal text-zinc-500">{humanizeEnum(candidate.stage)}</div><div className="mt-3 grid grid-cols-3 gap-1 normal-case tracking-normal"><Signal label="Fit" value={candidate.fitScore} tone="fit"/><Signal label="Evidence" value={candidate.evidenceCoverage} tone="evidence"/><Signal label="Decision" value={candidate.decisionCoverage} tone="decision"/></div>{candidate.fitScore >= 70 && candidate.fitScore - candidate.evidenceCoverage >= 15 && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[9px] font-semibold normal-case tracking-normal text-amber-800">High fit, weaker evidence</p>}</th>)}</tr></thead><tbody>{visibleRequirements.map((requirement) => <tr key={requirement.id}><td className="sticky left-0 z-10 border-r border-zinc-200 bg-white"><div className="font-semibold text-zinc-900">{requirement.name}</div><div className="mt-1 text-[10px] text-zinc-400">{humanizeEnum(requirement.priority)}</div></td>{visibleCandidates.map((candidate) => { const criterion = candidate.criteria.find((item) => item.requirementId === requirement.id); if (!criterion) return <td key={candidate.applicationId}>—</td>; return <td key={candidate.applicationId} className={criterion.status === "MISSING" || criterion.status === "CONFLICTING" ? "bg-red-50/40" : criterion.status === "PARTIAL" || criterion.status === "WEAK" ? "bg-amber-50/35" : ""}><span className={`status-pill ${statusTone(criterion.status)}`}>{humanizeEnum(criterion.status)}</span><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500"><span>Fit <strong className="text-zinc-700">{Math.round(criterion.fitScore)}%</strong></span><span>Evidence <strong className="text-zinc-700">{Math.round(criterion.evidenceCoverage)}%</strong></span></div><p className="mt-1 text-[10px] text-zinc-400">{criterion.independentSources} independent source{criterion.independentSources === 1 ? "" : "s"}</p></td>})}</tr>)}</tbody></table></div>}
  </div>;
}

function Signal({ label, value, tone }: { label: string; value: number; tone: "fit" | "evidence" | "decision" }) {
  const cls = tone === "fit" ? "bg-[var(--fit-soft)] text-[var(--fit)]" : tone === "evidence" ? "bg-[var(--evidence-soft)] text-[var(--evidence)]" : "bg-[var(--decision-soft)] text-[var(--decision)]";
  return <div className={`rounded-lg px-1.5 py-1.5 text-center ${cls}`}><span className="block text-[8px] font-bold uppercase tracking-wide opacity-70">{label}</span><strong className="metric-number mt-0.5 block text-[11px]">{Math.round(value)}%</strong></div>;
}
