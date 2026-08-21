import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { fail, ok } from "@/lib/http/route";
import { getDecisionIntegrityAudit } from "@/services/decision/integrityAudit";

export async function GET(_: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await params;
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) return new Response("Not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    return ok(await getDecisionIntegrityAudit(applicationId));
  } catch (error) { return fail(error); }
}
