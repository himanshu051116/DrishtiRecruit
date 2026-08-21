import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http/route";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { twoFactorEnabled: true, twoFactorRecoveryCodeHashes: true } });
    const hashes = user?.twoFactorRecoveryCodeHashes ?? [];
    return ok({ enabled: Boolean(user?.twoFactorEnabled), recoveryCodesRemaining: hashes.length });
  } catch (error) { return fail(error); }
}
