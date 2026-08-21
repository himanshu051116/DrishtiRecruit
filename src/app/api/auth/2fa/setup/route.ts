import { requireUser } from "@/lib/auth/rbac";
import { generateTotpSecret, buildOtpAuthUri, encryptTotpSecret } from "@/lib/auth/totp";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { TwoFactorSetupSchema } from "@/validation/api";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireUser();
    rateLimit(`2fa-setup:${session.id}:${clientAddress(request)}`, 5, 60_000);
    const input = TwoFactorSetupSchema.parse(await request.json().catch(() => ({})));
    const current = await prisma.user.findUnique({ where: { id: session.id }, select: { twoFactorEnabled: true, passwordHash: true } });
    if (current?.twoFactorEnabled) return Response.json({ ok: false, error: "TWO_FACTOR_ALREADY_ENABLED" }, { status: 409 });
    if (current?.passwordHash && (!input.password || !(await verifyPassword(input.password, current.passwordHash)))) {
      return Response.json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
    }
    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: session.id }, data: { twoFactorSecretEncrypted: encryptTotpSecret(secret), twoFactorRecoveryCodeHashes: [] } });
    await writeAudit({ actorId: session.id, action: "TWO_FACTOR_SETUP_STARTED", entityType: "User", entityId: session.id });
    return ok({ secret, otpauthUri: buildOtpAuthUri(secret, session.email) });
  } catch (error) { return fail(error); }
}
