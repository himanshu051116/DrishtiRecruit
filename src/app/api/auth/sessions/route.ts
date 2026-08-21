import { requireUser } from "@/lib/auth/rbac";
import { getCurrentSessionId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http/route";

export async function GET() {
  try {
    const user = await requireUser();
    const currentSessionId = await getCurrentSessionId();
    const sessions = await prisma.authSession.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true },
      orderBy: { lastSeenAt: "desc" },
    });
    return ok(sessions.map((session) => ({ ...session, current: session.id === currentSessionId })));
  } catch (error) { return fail(error); }
}
