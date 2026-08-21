import { OfferCreateSchema } from "@/validation/api";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";
import { createAndSendOffer } from "@/services/offer/offerService";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await params;
    const input = OfferCreateSchema.parse(await request.json());
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
    if (!application) throw new Response("Application not found", { status: 404 });
    if (user.role !== "ADMIN" && application.job.companyId !== user.companyId) throw new Response("Forbidden", { status: 403 });
    const offer = await createAndSendOffer({ applicationId, actorId: user.id, ...input });
    await writeAudit({ actorId: user.id, action: "OFFER_SENT", entityType: "OfferLetter", entityId: offer.id, metadata: { applicationId } });
    return ok({ offer }, { status: 201 });
  } catch (error) { return fail(error); }
}
