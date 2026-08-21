import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

const Schema = z.object({
  role: z.enum(["CANDIDATE", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.isActive !== undefined, "No changes supplied");

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireVerifiedRole("ADMIN");
    const { userId } = await params;
    if (userId === admin.id) throw new Response("Administrators cannot change their own role or active state from this endpoint", { status: 409 });
    const body = Schema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new Response("User not found", { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id: userId }, data: body, select: { id: true, name: true, email: true, role: true, isActive: true, companyId: true } });
      if (body.isActive === false) await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      return result;
    });

    await writeAudit({ actorId: admin.id, action: "ADMIN_USER_UPDATED", entityType: "User", entityId: userId, metadata: { before: { role: existing.role, isActive: existing.isActive }, after: body } });
    return ok(updated);
  } catch (error) { return fail(error); }
}
