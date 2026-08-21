import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { AnalyzeSchema } from "@/validation/api";
import { analyseApplication } from "@/services/application/applicationService";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await context.params;
    const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!app) return new Response("Not found", { status: 404 });
    assertSameCompany(user, app.job.companyId);
    const body = AnalyzeSchema.parse(await request.json().catch(() => ({})));
    const result = await analyseApplication(applicationId, body.resumeText, user.id);
    await writeAudit({ actorId: user.id, action: "APPLICATION_EVIDENCE_ANALYSED", entityType: "Application", entityId: applicationId, metadata: { fitScore: result.fitScore, evidenceCoverage: result.evidenceCoverage, decisionCoverage: result.decisionCoverage } });
    return ok(result);
  } catch (error) { return fail(error); }
}
