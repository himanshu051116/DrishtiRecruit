import { TwoFactorCodeSchema } from "@/validation/api";
import { readTwoFactorChallenge, clearTwoFactorChallenge } from "@/lib/auth/twoFactorChallenge";
import { verifyUserSecondFactor } from "@/services/auth/twoFactorService";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(`2fa-login:${clientAddress(request)}`, 12, 60_000);
    const input = TwoFactorCodeSchema.parse(await request.json());
    const userId = await readTwoFactorChallenge();
    if (!userId) return Response.json({ ok: false, error: "TWO_FACTOR_CHALLENGE_EXPIRED" }, { status: 401 });
    const result = await verifyUserSecondFactor(userId, input.code);
    if (!result.ok) return Response.json({ ok: false, error: "INVALID_TWO_FACTOR_CODE" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) return Response.json({ ok: false, error: "ACCOUNT_INACTIVE" }, { status: 403 });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, emailVerified: Boolean(user.emailVerifiedAt) });
    await clearTwoFactorChallenge();
    await writeAudit({ actorId: user.id, action: result.recoveryCodeUsed ? "TWO_FACTOR_LOGIN_RECOVERY" : "TWO_FACTOR_LOGIN", entityType: "User", entityId: user.id });
    return ok({ id: user.id, name: user.name, role: user.role, recoveryCodeUsed: result.recoveryCodeUsed });
  } catch (error) { return fail(error); }
}
