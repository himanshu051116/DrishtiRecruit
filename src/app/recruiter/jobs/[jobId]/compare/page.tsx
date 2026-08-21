import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/page";
import { getJobComparison } from "@/services/comparison/comparisonService";
import { CandidateComparison } from "@/components/CandidateComparison";

export default async function CompareCandidatesPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  const { jobId } = await params;
  const data = await getJobComparison(jobId);
  if (user.role !== "ADMIN" && data.job.companyId !== user.companyId) notFound();

  return <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="page-header"><div><p className="page-eyebrow">Candidate comparison</p><h1 className="page-title">{data.job.title}</h1><p className="page-description">Compare apparent fit separately from evidence quality and decision readiness. Pin finalists and focus on the criteria that actually differ.</p></div><Link href={`/recruiter/jobs/${jobId}/pipeline`} className="btn-secondary">Open pipeline</Link></div>
    {data.candidates.length === 0 ? <div className="surface-card mt-6 p-8 text-sm text-zinc-500">No candidates to compare yet.</div> : <div className="mt-6"><CandidateComparison requirements={data.requirements} candidates={data.candidates}/></div>}
  </main>;
}
