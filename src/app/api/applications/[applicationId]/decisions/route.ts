import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { createDecision } from "@/services/decision/decisionService";
import { writeAudit } from "@/lib/audit";

const DecisionSchema = z.object({ humanDecision: z.enum(["HIRE", "REJECT", "HOLD"]), overrideReason: z.string().max(2000).optional() });

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("HIRING_MANAGER", "ADMIN");
    const { applicationId } = await context.params;
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) return new Response("Not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    const body = DecisionSchema.parse(await request.json());
    const result = await createDecision({ applicationId, decisionOwnerId: user.id, humanDecision: body.humanDecision, overrideReason: body.overrideReason });
    await writeAudit({ actorId: user.id, action: "HUMAN_HIRING_DECISION_RECORDED", entityType: "DecisionRecord", entityId: result.decision.id, metadata: { applicationId, humanDecision: body.humanDecision, override: result.decision.override } });
    return ok(result, { status: 201 });
  } catch (error) { return fail(error); }
}
