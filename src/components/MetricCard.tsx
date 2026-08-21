export function MetricCard({ label, value, detail, kind = "neutral", progress }: { label: string; value: string; detail?: string; kind?: "neutral" | "fit" | "evidence" | "decision"; progress?: number }) {
  const tone = kind === "fit" ? "score-fit" : kind === "evidence" ? "score-evidence" : kind === "decision" ? "score-decision" : "";
  return <div className={`score-card ${tone}`}>
    <p className="score-label">{label}</p>
    <p className="score-value">{value}</p>
    {detail && <p className="score-detail">{detail}</p>}
    {typeof progress === "number" && <div className="score-progress" aria-hidden><span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}/></div>}
  </div>;
}
