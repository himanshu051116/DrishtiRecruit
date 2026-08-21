import { requireUser } from "@/lib/auth/rbac";
import { TwoFactorDisableSchema } from "@/validation/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { verifyUserSecondFactor } from "@/services/auth/twoFactorService";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireUser();
    rateLimit(`2fa-disable:${session.id}:${clientAddress(request)}`, 8, 60_000);
    const input = TwoFactorDisableSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user?.twoFactorEnabled) return Response.json({ ok: false, error: "TWO_FACTOR_NOT_ENABLED" }, { status: 409 });
    if (user.passwordHash && (!input.password || !(await verifyPassword(input.password, user.passwordHash)))) {
      return Response.json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
    }
    const verification = await verifyUserSecondFactor(session.id, input.code);
    if (!verification.ok) return Response.json({ ok: false, error: "INVALID_TWO_FACTOR_CODE" }, { status: 401 });
    await prisma.user.update({ where: { id: session.id }, data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null, twoFactorRecoveryCodeHashes: [] } });
    await writeAudit({ actorId: session.id, action: "TWO_FACTOR_DISABLED", entityType: "User", entityId: session.id });
    return ok({ disabled: true });
  } catch (error) { return fail(error); }
}
