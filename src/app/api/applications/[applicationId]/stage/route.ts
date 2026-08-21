import { StageUpdateSchema } from "@/validation/api";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";
import { transitionApplicationStage } from "@/services/application/stageService";
import { writeAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await params;
    const input = StageUpdateSchema.parse(await request.json());
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) throw new Response("Application not found", { status: 404 });
    if (user.role !== "ADMIN" && application.job.companyId !== user.companyId) throw new Response("Forbidden", { status: 403 });
    if (["OFFER", "HIRED", "REJECTED"].includes(input.stage)) throw new Response("Use DecisionTrace/offer workflow for terminal hiring stages", { status: 409 });

    const updated = await transitionApplicationStage({ applicationId, toStage: input.stage, actorId: user.id, reason: input.reason });
    await writeAudit({ actorId: user.id, action: "APPLICATION_STAGE_CHANGED", entityType: "Application", entityId: applicationId, metadata: { stage: input.stage, reason: input.reason } });
    return ok({ application: updated });
  } catch (error) { return fail(error); }
}
