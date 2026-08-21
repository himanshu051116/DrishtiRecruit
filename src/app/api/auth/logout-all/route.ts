import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/rbac";
import { revokeCurrentSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await prisma.authSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await revokeCurrentSession();
    return ok({ loggedOutEverywhere: true });
  } catch (error) {
    return fail(error);
  }
}
