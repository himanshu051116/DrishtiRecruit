import { LoginSchema } from "@/validation/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { beginTwoFactorChallenge } from "@/lib/auth/twoFactorChallenge";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(`login:${clientAddress(request)}`, 12, 60_000);
    const input = LoginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    if (!user.isActive) return Response.json({ ok: false, error: "ACCOUNT_INACTIVE" }, { status: 403 });
    if (user.twoFactorEnabled) {
      await beginTwoFactorChallenge(user.id);
      return ok({ requiresTwoFactor: true });
    }
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, emailVerified: Boolean(user.emailVerifiedAt) });
    await writeAudit({ actorId: user.id, action: "PASSWORD_LOGIN", entityType: "User", entityId: user.id });
    return ok({ id: user.id, name: user.name, role: user.role, emailVerified: Boolean(user.emailVerifiedAt), requiresTwoFactor: false });
  } catch (error) { return fail(error); }
}
