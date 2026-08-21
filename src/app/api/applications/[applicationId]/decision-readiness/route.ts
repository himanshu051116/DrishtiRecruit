import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { fail, ok } from "@/lib/http/route";
import { getDecisionReadiness } from "@/services/decision/decisionService";

export async function GET(_request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await context.params;
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) return new Response("Not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    return ok(await getDecisionReadiness(applicationId));
  } catch (error) { return fail(error); }
}
