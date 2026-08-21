import Link from "next/link";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { AssessmentStudio } from "@/components/AssessmentStudio";

export default async function RecruiterAssessmentStudioPage() {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "ADMIN"]);
  if (!user.companyId) return <main className="mx-auto max-w-7xl px-6 py-10"><p>Company context required.</p></main>;
  const [jobs, assessments] = await Promise.all([
    prisma.job.findMany({ where: { companyId: user.companyId }, include: { requirements: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } }),
    prisma.assessment.findMany({ where: { job: { companyId: user.companyId } }, include: { job: true, questions: { orderBy: { createdAt: "asc" } }, _count: { select: { attempts: true } } }, orderBy: { updatedAt: "desc" } }),
  ]);
  return <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="page-header"><div><p className="page-eyebrow">Assessment Studio</p><h1 className="page-title">Build comparable hiring assessments</h1><p className="page-description">Create multiple-choice, coding, SQL, debugging and practical tasks without exposing implementation details to recruiters. Link each question to an approved criterion so completed tests feed the evidence record automatically.</p></div><div className="flex gap-2"><Link href="/recruiter/assessments/analytics" className="btn-secondary">Assessment analytics</Link><Link href="/recruiter/jobs" className="btn-secondary">Jobs</Link></div></div>
    <div className="mt-6"><AssessmentStudio jobs={jobs.map((job) => ({ id: job.id, title: job.title, requirements: job.requirements.map((r) => ({ id: r.id, name: r.name, category: r.category, recruiterApproved: r.recruiterApproved })) }))} assessments={assessments.map((assessment) => ({ id: assessment.id, jobId: assessment.jobId, title: assessment.title, description: assessment.description, durationMin: assessment.durationMin, active: assessment.active, source: assessment.source, version: assessment.version, versionGroupId: assessment.versionGroupId, questions: assessment.questions.map((q) => ({ id: q.id, requirementId: q.requirementId, requirementName: q.requirementName, category: q.category, method: q.method, difficulty: q.difficulty, prompt: q.prompt, maxScore: q.maxScore })), job: assessment.job ? { id: assessment.job.id, title: assessment.job.title } : null, _count: assessment._count }))}/></div>
  </main>;
}
