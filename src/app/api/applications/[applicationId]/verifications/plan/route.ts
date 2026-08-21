import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { planApplicationVerifications } from "@/services/verification/verificationService";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http/route";

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await context.params;
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) return new Response("Not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    const recommendations = await planApplicationVerifications(applicationId);
    await writeAudit({ actorId: user.id, action: "VERIFICATION_PLAN_CREATED", entityType: "Application", entityId: applicationId, metadata: { count: recommendations.length } });
    return ok(recommendations);
  } catch (error) {
    return fail(error);
  }
}
