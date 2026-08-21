import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const now = new Date();
    await prisma.user.update({ where: { id: user.id }, data: { deletionRequestedAt: now } });
    await writeAudit({ actorId: user.id, action: "ACCOUNT_DELETION_REQUESTED", entityType: "User", entityId: user.id });
    return ok({ deletionRequestedAt: now.toISOString(), status: "PENDING_REVIEW" });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    await prisma.user.update({ where: { id: user.id }, data: { deletionRequestedAt: null } });
    await writeAudit({ actorId: user.id, action: "ACCOUNT_DELETION_REQUEST_CANCELLED", entityType: "User", entityId: user.id });
    return ok({ deletionRequestedAt: null });
  } catch (error) { return fail(error); }
}
