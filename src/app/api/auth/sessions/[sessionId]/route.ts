import { requireUser } from "@/lib/auth/rbac";
import { getCurrentSessionId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { sessionId } = await params;
    const owned = await prisma.authSession.findFirst({ where: { id: sessionId, userId: user.id, revokedAt: null } });
    if (!owned) return new Response("Session not found", { status: 404 });
    const currentSessionId = await getCurrentSessionId();
    if (sessionId === currentSessionId) return Response.json({ ok: false, error: "USE_LOGOUT_FOR_CURRENT_SESSION" }, { status: 409 });
    await prisma.authSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    await writeAudit({ actorId: user.id, action: "DEVICE_SESSION_REVOKED", entityType: "AuthSession", entityId: sessionId });
    return ok({ revoked: true });
  } catch (error) { return fail(error); }
}
