import { ForgotPasswordSchema } from "@/validation/api";
import { issuePasswordResetToken } from "@/lib/auth/passwordReset";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { sendTransactionalEmail } from "@/services/email/emailService";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); rateLimit(`forgot:${clientAddress(request)}`, 8, 60_000);
    const input = ForgotPasswordSchema.parse(await request.json());
    const issued = await issuePasswordResetToken(input.email);
    if (issued) {
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      await sendTransactionalEmail({ to: issued.user.email, subject: "Reset your DrishtiRecruit password", text: `Use this link within 20 minutes: ${appUrl}/reset-password?token=${encodeURIComponent(issued.token)}`, template: "PASSWORD_RESET" });
    }
    return ok({ accepted: true, developmentResetToken: process.env.NODE_ENV === "production" ? undefined : issued?.token });
  } catch (error) { return fail(error); }
}
