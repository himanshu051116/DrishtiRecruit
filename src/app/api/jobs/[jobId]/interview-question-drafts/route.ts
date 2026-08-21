import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { draftInterviewQuestions } from "@/services/ai/interviewQuestionDrafts";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    rateLimit(`interview-question-drafts:${user.id}:${clientAddress(request)}`, 8, 60_000);
    const { jobId } = await params;
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { requirements: { orderBy: { createdAt: "asc" } } } });
    if (!job) return new Response("Not found", { status: 404 });
    assertSameCompany(user, job.companyId);
    const approved = job.requirements.filter((requirement) => requirement.recruiterApproved);
    if (!approved.length) return Response.json({ ok: false, error: "APPROVED_REQUIREMENTS_REQUIRED" }, { status: 409 });
    const drafts = await draftInterviewQuestions({ jobTitle: job.title, jobDescription: job.description, requirements: approved }, { companyId: job.companyId, jobId: job.id, actorId: user.id });
    await prisma.$transaction(drafts.map((draft) => prisma.jobRequirement.update({
      where: { id: draft.requirementId },
      data: { interviewQuestion: draft.question, interviewQuestionSource: draft.source, interviewQuestionApproved: false },
    })));
    await writeAudit({ actorId: user.id, action: "INTERVIEW_QUESTION_DRAFTS_GENERATED", entityType: "Job", entityId: job.id, metadata: { count: drafts.length } });
    return ok({ drafts, approvalRequired: true });
  } catch (error) { return fail(error); }
}
