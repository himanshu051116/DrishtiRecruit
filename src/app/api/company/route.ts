import { CompanyUpdateSchema } from "@/validation/api";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    const input = CompanyUpdateSchema.parse(await request.json());
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const company = await prisma.company.update({ where: { id: user.companyId }, data: { name: input.name, website: input.website || null, industry: input.industry || null, size: input.size || null, description: input.description || null, socialLinks: input.socialLinks, officeLocations: input.officeLocations } });
    await writeAudit({ actorId: user.id, action: "COMPANY_UPDATED", entityType: "Company", entityId: company.id });
    return ok({ company });
  } catch (error) { return fail(error); }
}
