import { z } from "zod";
import { OptionalHttpUrlSchema } from "@/validation/common";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

const Schema = z.object({ name: z.string().trim().min(2).max(160), industry: z.string().trim().max(120).optional(), website: OptionalHttpUrlSchema.optional(), size: z.string().trim().max(80).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    assertSameOrigin(request); const admin = await requireVerifiedRole("ADMIN"); const { companyId } = await params; const body = Schema.parse(await request.json());
    const company = await prisma.company.update({ where: { id: companyId }, data: { name: body.name, industry: body.industry || null, website: body.website || null, size: body.size || null } });
    await writeAudit({ actorId: admin.id, action: "ADMIN_COMPANY_UPDATED", entityType: "Company", entityId: companyId, metadata: body });
    return ok(company);
  } catch (error) { return fail(error); }
}
