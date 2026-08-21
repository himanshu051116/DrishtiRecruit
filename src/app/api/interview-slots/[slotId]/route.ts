import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { deleteAvailabilitySlot } from "@/services/interview/availabilityService";

export async function DELETE(request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { slotId } = await params;
    await deleteAvailabilitySlot(slotId, user.id, user.companyId);
    await writeAudit({ actorId: user.id, action: "INTERVIEW_AVAILABILITY_DELETED", entityType: "InterviewAvailabilitySlot", entityId: slotId });
    return ok({ deleted: true });
  } catch (error) { return fail(error); }
}
