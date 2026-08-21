import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
const Schema = z.object({ active: z.boolean() });
export async function PATCH(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try { assertSameOrigin(request); const admin = await requireVerifiedRole("ADMIN"); const { assessmentId } = await params; const body = Schema.parse(await request.json()); const assessment = await prisma.assessment.update({ where: { id: assessmentId }, data: { active: body.active } }); await writeAudit({ actorId: admin.id, action: "ADMIN_ASSESSMENT_UPDATED", entityType: "Assessment", entityId: assessmentId, metadata: body }); return ok(assessment); }
  catch (error) { return fail(error); }
}
