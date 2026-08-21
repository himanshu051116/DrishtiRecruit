import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { notifyUser } from "@/services/notification/notificationService";
import { writeAudit } from "@/lib/audit";

const Schema = z.object({ subject: z.string().trim().min(2).max(180), message: z.string().trim().min(2).max(5000) });

export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await params;
    const body = Schema.parse(await request.json());
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true, candidate: { include: { user: true } } } });
    if (!application) throw new Response("Application not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    const delivery = await sendTransactionalEmail({ to: application.candidate.user.email, subject: body.subject, text: body.message, template: "RECRUITER_MESSAGE" });
    await notifyUser(application.candidate.userId, "RECRUITER_MESSAGE", body.subject, body.message.slice(0, 600));
    await writeAudit({ actorId: user.id, action: "CANDIDATE_EMAIL_QUEUED", entityType: "Application", entityId: applicationId, metadata: { subject: body.subject, messageId: delivery.message.id, deliveryMode: delivery.mode } });
    return ok({ id: delivery.message.id, status: delivery.message.status, mode: delivery.mode }, { status: 201 });
  } catch (error) { return fail(error); }
}
