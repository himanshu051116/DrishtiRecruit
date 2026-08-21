import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { assignAssessmentForVerification } from "@/services/assessment/assessmentService";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ verificationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { verificationId } = await context.params;
    const verification = await prisma.verificationItem.findUnique({ where: { id: verificationId }, include: { application: { include: { job: true } } } });
    if (!verification) return new Response("Not found", { status: 404 });
    assertSameCompany(user, verification.application.job.companyId);
    const attempt = await assignAssessmentForVerification(verificationId);
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_ASSIGNED", entityType: "AssessmentAttempt", entityId: attempt.id, metadata: { verificationId } });
    return ok(attempt, { status: 201 });
  } catch (error) { return fail(error); }
}
