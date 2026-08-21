import { RegisterSchema } from "@/validation/api";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { issueEmailVerificationToken } from "@/lib/auth/verification";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { sendTransactionalEmail } from "@/services/email/emailService";
import { hasPrismaCode } from "@/lib/prismaError";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(`register:${clientAddress(request)}`, 8, 60_000);
    const input = RegisterSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return Response.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
    if (input.role === "RECRUITER" && !input.companyName) return Response.json({ ok: false, error: "COMPANY_REQUIRED" }, { status: 400 });

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.$transaction(async (tx) => {
      const company = input.role === "RECRUITER" ? await tx.company.create({ data: { name: input.companyName! } }) : null;
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash, role: input.role, companyId: company?.id ?? null },
      });
      if (input.role === "CANDIDATE") {
        await tx.candidateProfile.create({ data: { userId: created.id, skills: [] } });
      }
      return created;
    });

    const verificationToken = await issueEmailVerificationToken(user.id);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const delivery = await sendTransactionalEmail({
      to: user.email,
      subject: "Verify your DrishtiRecruit email",
      text: `Verify your email to activate protected DrishtiRecruit workflows: ${appUrl}/verify-email?token=${encodeURIComponent(verificationToken)}. This link expires in 30 minutes.`,
      template: "EMAIL_VERIFICATION",
    });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, emailVerified: false });
    const emailDelivery = delivery.delivered ? "sent" : delivery.mode === "outbox" ? "not_configured" : "failed";
    return ok({ user: { id: user.id, name: user.name, role: user.role, emailVerified: false }, emailDelivery, developmentVerificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken }, { status: 201 });
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) return Response.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
    return fail(error);
  }
}
