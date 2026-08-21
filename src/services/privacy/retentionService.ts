import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/services/settings/platformSettings";

export type RetentionPreview = {
  policyDays: number;
  cutoff: string;
  expiredVerificationTokens: number;
  expiredPasswordResetTokens: number;
  expiredSessions: number;
  oldDeliveredEmails: number;
  oldReadNotifications: number;
  pendingDeletionRequests: number;
};

export async function getRetentionPreview(now = new Date()): Promise<RetentionPreview> {
  const { dataRetentionDays } = await getPlatformSettings();
  const cutoff = new Date(now.getTime() - dataRetentionDays * 86_400_000);
  const [expiredVerificationTokens, expiredPasswordResetTokens, expiredSessions, oldDeliveredEmails, oldReadNotifications, pendingDeletionRequests] = await Promise.all([
    prisma.emailVerificationToken.count({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }], createdAt: { lt: cutoff } } }),
    prisma.passwordResetToken.count({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }], createdAt: { lt: cutoff } } }),
    prisma.authSession.count({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }], createdAt: { lt: cutoff } } }),
    prisma.emailMessage.count({ where: { status: { in: ["SENT", "FAILED"] }, createdAt: { lt: cutoff } } }),
    prisma.notification.count({ where: { readAt: { not: null }, createdAt: { lt: cutoff } } }),
    prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
  ]);
  return { policyDays: dataRetentionDays, cutoff: cutoff.toISOString(), expiredVerificationTokens, expiredPasswordResetTokens, expiredSessions, oldDeliveredEmails, oldReadNotifications, pendingDeletionRequests };
}

export async function runOperationalRetentionCleanup(now = new Date()) {
  const preview = await getRetentionPreview(now);
  const cutoff = new Date(preview.cutoff);
  const result = await prisma.$transaction(async (tx) => {
    const [verification, reset, sessions, emails, notifications] = await Promise.all([
      tx.emailVerificationToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }], createdAt: { lt: cutoff } } }),
      tx.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }], createdAt: { lt: cutoff } } }),
      tx.authSession.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }], createdAt: { lt: cutoff } } }),
      tx.emailMessage.deleteMany({ where: { status: { in: ["SENT", "FAILED"] }, createdAt: { lt: cutoff } } }),
      tx.notification.deleteMany({ where: { readAt: { not: null }, createdAt: { lt: cutoff } } }),
    ]);
    return {
      verificationTokensDeleted: verification.count,
      passwordResetTokensDeleted: reset.count,
      sessionsDeleted: sessions.count,
      emailMessagesDeleted: emails.count,
      notificationsDeleted: notifications.count,
    };
  });
  return { policyDays: preview.policyDays, cutoff: preview.cutoff, ...result, candidateHiringRecordsDeleted: 0 };
}
