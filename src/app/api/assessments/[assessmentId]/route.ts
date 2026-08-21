import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { updateRecruiterAssessment } from "@/services/assessment/assessmentBuilder";

const UpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  durationMin: z.number().int().min(1).max(240).optional(),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "No changes supplied");

export async function PATCH(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { assessmentId } = await params;
    const body = UpdateSchema.parse(await request.json());
    const assessment = await updateRecruiterAssessment({ companyId: user.companyId, assessmentId, ...body });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_UPDATED", entityType: "Assessment", entityId: assessmentId, metadata: body });
    return ok({ assessment });
  } catch (error) { return fail(error); }
}
