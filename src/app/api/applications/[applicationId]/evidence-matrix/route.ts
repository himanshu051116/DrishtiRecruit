import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { getEvidenceMatrix } from "@/services/application/applicationService";
import { fail, ok } from "@/lib/http/route";

export async function GET(_: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await context.params;
    const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!app) return new Response("Not found", { status: 404 });
    assertSameCompany(user, app.job.companyId);
    return ok(await getEvidenceMatrix(applicationId));
  } catch (error) { return fail(error); }
}
