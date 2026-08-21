import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function issuePasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(now.getTime() + 20 * 60_000) } }),
  ]);
  return { token, user };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hash(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return false;
  const passwordHash = await hashPassword(password);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: now } });
    return true;
  }, { isolationLevel: "Serializable" });
}
