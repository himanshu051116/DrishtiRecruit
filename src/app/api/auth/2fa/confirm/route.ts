import { requireUser } from "@/lib/auth/rbac";
import { TwoFactorCodeSchema } from "@/validation/api";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { generateRecoveryCodes, hashRecoveryCodes } from "@/lib/auth/recoveryCodes";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireUser();
    rateLimit(`2fa-confirm:${session.id}:${clientAddress(request)}`, 10, 60_000);
    const input = TwoFactorCodeSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { twoFactorEnabled: true, twoFactorSecretEncrypted: true } });
    if (user?.twoFactorEnabled) return Response.json({ ok: false, error: "TWO_FACTOR_ALREADY_ENABLED" }, { status: 409 });
    if (!user?.twoFactorSecretEncrypted) return Response.json({ ok: false, error: "TWO_FACTOR_SETUP_REQUIRED" }, { status: 409 });
    const secret = decryptTotpSecret(user.twoFactorSecretEncrypted);
    if (!verifyTotp(secret, input.code)) return Response.json({ ok: false, error: "INVALID_TWO_FACTOR_CODE" }, { status: 400 });
    const recoveryCodes = generateRecoveryCodes();
    const hashes = await hashRecoveryCodes(recoveryCodes);
    await prisma.user.update({ where: { id: session.id }, data: { twoFactorEnabled: true, twoFactorRecoveryCodeHashes: hashes } });
    await writeAudit({ actorId: session.id, action: "TWO_FACTOR_ENABLED", entityType: "User", entityId: session.id });
    return ok({ recoveryCodes });
  } catch (error) { return fail(error); }
}
