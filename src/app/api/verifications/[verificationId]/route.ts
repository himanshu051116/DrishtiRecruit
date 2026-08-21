import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http/route";

const PatchSchema = z.object({ status: z.enum(["APPROVED", "SKIPPED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ verificationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { verificationId } = await context.params;
    const verification = await prisma.verificationItem.findUnique({
      where: { id: verificationId },
      include: { application: { include: { job: true } } },
    });
    if (!verification) return new Response("Not found", { status: 404 });
    assertSameCompany(user, verification.application.job.companyId);
    if (verification.status !== "RECOMMENDED") {
      return Response.json({ ok: false, error: "VERIFICATION_ALREADY_RESOLVED" }, { status: 409 });
    }
    const { status } = PatchSchema.parse(await request.json());
    const updated = await prisma.verificationItem.update({
      where: { id: verificationId },
      data: { status, approvedById: status === "APPROVED" ? user.id : null },
    });
    await writeAudit({
      actorId: user.id,
      action: status === "APPROVED" ? "VERIFICATION_APPROVED" : "VERIFICATION_SKIPPED",
      entityType: "VerificationItem",
      entityId: verificationId,
      metadata: { applicationId: verification.applicationId, requirementId: verification.requirementId },
    });
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
