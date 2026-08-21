import { prisma } from "@/lib/prisma";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { findRecoveryCodeIndex } from "@/lib/auth/recoveryCodes";

export async function verifyUserSecondFactor(userId: string, code: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user?.isActive || !user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      return { ok: false as const, reason: "NOT_CONFIGURED" as const };
    }

    const secret = decryptTotpSecret(user.twoFactorSecretEncrypted);
    if (verifyTotp(secret, code)) return { ok: true as const, recoveryCodeUsed: false };

    const hashes = user.twoFactorRecoveryCodeHashes;
    const index = await findRecoveryCodeIndex(code, hashes);
    if (index < 0) return { ok: false as const, reason: "INVALID_CODE" as const };

    const remaining = hashes.filter((_, itemIndex) => itemIndex !== index);
    await tx.user.update({
      where: { id: user.id },
      data: { twoFactorRecoveryCodeHashes: remaining },
    });
    return { ok: true as const, recoveryCodeUsed: true, remainingRecoveryCodes: remaining.length };
  }, { isolationLevel: "Serializable" });
}
