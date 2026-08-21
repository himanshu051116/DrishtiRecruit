import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { bookAvailabilitySlot } from "@/services/interview/availabilityService";

const Schema = z.object({ slotId: z.string().min(1), type: z.string().trim().max(40).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { applicationId } = await params;
    const body = Schema.parse(await request.json());
    const interview = await bookAvailabilitySlot({ applicationId, candidateUserId: user.id, slotId: body.slotId, type: body.type });
    await writeAudit({ actorId: user.id, action: "CANDIDATE_INTERVIEW_SLOT_BOOKED", entityType: "Interview", entityId: interview.id, metadata: { applicationId, slotId: body.slotId } });
    return ok({ interview }, { status: 201 });
  } catch (error) { return fail(error); }
}
