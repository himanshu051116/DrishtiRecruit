import { requireUser } from "@/lib/auth/rbac";
import { issueEmailVerificationToken } from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireUser();
    rateLimit(`resend-verification:${session.id}:${clientAddress(request)}`, 3, 10 * 60_000);
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user?.isActive) return new Response("Account unavailable", { status: 403 });
    if (user.emailVerifiedAt) return ok({ alreadyVerified: true });
    const token = await issueEmailVerificationToken(user.id);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const delivery = await sendTransactionalEmail({
      to: user.email,
      subject: "Verify your DrishtiRecruit email",
      text: `Verify your email: ${appUrl}/verify-email?token=${encodeURIComponent(token)}. This link expires in 30 minutes.`,
      template: "EMAIL_VERIFICATION",
    });
    const emailDelivery = delivery.delivered ? "sent" : delivery.mode === "outbox" ? "not_configured" : "failed";
    return ok({ sent: delivery.delivered, emailDelivery, developmentVerificationToken: process.env.NODE_ENV === "production" ? undefined : token });
  } catch (error) { return fail(error); }
}
