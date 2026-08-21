import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function issueEmailVerificationToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    prisma.emailVerificationToken.create({ data: { userId, tokenHash: hash(token), expiresAt: new Date(now.getTime() + 30 * 60_000) } }),
  ]);
  return token;
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record) return false;
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: now } });
    return true;
  }, { isolationLevel: "Serializable" });
}
