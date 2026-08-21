import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page";
import { ApplicationKanban } from "@/components/ApplicationKanban";

export default async function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  const { jobId } = await params;
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { applications: { include: { candidate: { include: { user: true } } }, orderBy: { createdAt: "asc" } } } });
  if (!job || (user.role !== "ADMIN" && job.companyId !== user.companyId)) notFound();
  const applications = job.applications.map((app) => ({ id: app.id, name: app.candidate.user.name, email: app.candidate.user.email, stage: app.stage, fitScore: app.fitScore ?? 0, evidenceCoverage: app.evidenceCoverage ?? 0, decisionCoverage: app.decisionCoverage ?? 0 }));
  return <main className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="page-header"><div><p className="page-eyebrow">Application pipeline</p><h1 className="page-title">{job.title}</h1><p className="page-description">Move candidates through valid stages. Drag-and-drop is optional; every card includes an accessible stage control. Final hire/reject actions remain manager-controlled.</p></div><Link href={`/recruiter/jobs/${job.id}/compare`} className="btn-primary">Compare candidates</Link></div><div className="mt-6"><ApplicationKanban initialApplications={applications}/></div></main>;
}
