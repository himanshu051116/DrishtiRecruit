import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { cloneRecruiterAssessmentVersion } from "@/services/assessment/assessmentBuilder";

export async function POST(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { assessmentId } = await params;
    const assessment = await cloneRecruiterAssessmentVersion({ companyId: user.companyId, assessmentId });
    await writeAudit({
      actorId: user.id,
      action: "ASSESSMENT_VERSION_CREATED",
      entityType: "Assessment",
      entityId: assessment.id,
      metadata: { sourceAssessmentId: assessmentId, version: assessment.version },
    });
    return ok({ assessment }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
