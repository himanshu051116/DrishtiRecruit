import { OfferResponseSchema } from "@/validation/api";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { respondToOffer } from "@/services/offer/offerService";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { offerId } = await params;
    const input = OfferResponseSchema.parse(await request.json());
    const offer = await respondToOffer({ offerId, candidateUserId: user.id, action: input.action });
    await writeAudit({ actorId: user.id, action: `OFFER_${offer.status}`, entityType: "OfferLetter", entityId: offer.id });
    return ok({ offer });
  } catch (error) { return fail(error); }
}
