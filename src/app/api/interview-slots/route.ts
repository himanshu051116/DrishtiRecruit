import { z } from "zod";
import { OptionalHttpUrlSchema } from "@/validation/common";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { createAvailabilitySlot, listOpenSlots } from "@/services/interview/availabilityService";

const CreateSchema = z.object({
  interviewerId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  meetingUrl: OptionalHttpUrlSchema.optional(),
  mode: z.enum(["VIDEO", "PHONE", "ONSITE"]).default("VIDEO"),
});

export async function GET() {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN");
    if (!user.companyId && user.role !== "ADMIN") throw new Response("Company context required", { status: 409 });
    if (user.role === "ADMIN" && !user.companyId) return ok({ slots: [] });
    return ok({ slots: await listOpenSlots(user.companyId!) });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const body = CreateSchema.parse(await request.json());
    if (user.role === "INTERVIEWER" && body.interviewerId !== user.id) {
      throw new Response("Interviewers can create availability only for themselves", { status: 403 });
    }
    const slot = await createAvailabilitySlot({
      companyId: user.companyId,
      interviewerId: body.interviewerId,
      createdById: user.id,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      meetingUrl: body.meetingUrl || undefined,
      mode: body.mode,
    });
    await writeAudit({ actorId: user.id, action: "INTERVIEW_AVAILABILITY_CREATED", entityType: "InterviewAvailabilitySlot", entityId: slot.id, metadata: { interviewerId: body.interviewerId, startsAt: body.startsAt } });
    return ok({ slot }, { status: 201 });
  } catch (error) { return fail(error); }
}
