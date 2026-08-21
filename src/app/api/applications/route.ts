import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { ApplicationCreateSchema } from "@/validation/api";
import { fail, ok } from "@/lib/http/route";
import { notifyCompanyRoles } from "@/services/notification/notificationService";
import { writeAudit } from "@/lib/audit";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { isJobAcceptingApplications } from "@/services/job/jobAvailability";
import { hasPrismaCode } from "@/lib/prismaError";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const input = ApplicationCreateSchema.parse(await request.json());
    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidate) return Response.json({ ok: false, error: "CANDIDATE_PROFILE_REQUIRED" }, { status: 409 });
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job || !isJobAcceptingApplications(job)) return Response.json({ ok: false, error: job?.status === "OPEN" ? "APPLICATION_DEADLINE_PASSED" : "JOB_NOT_OPEN" }, { status: 409 });

    const existing = await prisma.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: candidate.id } } });
    if (existing) return Response.json({ ok: false, error: "ALREADY_APPLIED" }, { status: 409 });

    let resumeId = input.resumeId;
    if (resumeId) {
      const ownedResume = await prisma.resume.findFirst({ where: { id: resumeId, candidateId: candidate.id, isActive: true } });
      if (!ownedResume) return Response.json({ ok: false, error: "INVALID_RESUME" }, { status: 403 });
    }
    if (!resumeId && input.resumeText?.trim()) {
      if (process.env.NODE_ENV === "production") return Response.json({ ok: false, error: "INLINE_RESUME_DISABLED" }, { status: 400 });
      const resume = await prisma.resume.create({ data: { candidateId: candidate.id, fileUrl: "inline://resume", fileName: "Development inline resume", mimeType: "text/plain", parsedText: input.resumeText } });
      resumeId = resume.id;
    }
    if (!resumeId) return Response.json({ ok: false, error: "RESUME_REQUIRED" }, { status: 400 });

    const application = await prisma.$transaction(async (tx) => {
      const stillOpen = await tx.job.findFirst({ where: { id: job.id, status: "OPEN", OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }, select: { id: true } });
      if (!stillOpen) throw new Response("Job is no longer accepting applications", { status: 409 });
      const created = await tx.application.create({ data: { jobId: job.id, candidateId: candidate.id, resumeId, source: "CAREERS_PAGE" } });
      await tx.applicationStageEvent.create({ data: { applicationId: created.id, toStage: "APPLIED", actorId: user.id, reason: "Candidate submitted application" } });
      return created;
    });
    await notifyCompanyRoles(job.companyId, ["RECRUITER", "HIRING_MANAGER"], "NEW_APPLICATION", `${job.title}: new application`, `${user.name} submitted an application.`);
    await sendTransactionalEmail({ to: user.email, subject: `${job.title}: application received`, text: `Your application for ${job.title} has been received. You can track progress in DrishtiRecruit.`, template: "APPLICATION_CONFIRMATION" });
    await writeAudit({ actorId: user.id, action: "APPLICATION_SUBMITTED", entityType: "Application", entityId: application.id, metadata: { jobId: job.id } });
    return ok(application, { status: 201 });
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) return Response.json({ ok: false, error: "ALREADY_APPLIED" }, { status: 409 });
    return fail(error);
  }
}
