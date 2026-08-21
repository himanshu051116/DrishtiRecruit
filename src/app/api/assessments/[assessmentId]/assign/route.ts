import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { assignRecruiterAssessment } from "@/services/assessment/assessmentBuilder";

const Schema = z.object({ applicationId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { assessmentId } = await params;
    const body = Schema.parse(await request.json());
    const attempt = await assignRecruiterAssessment({ companyId: user.companyId, assessmentId, applicationId: body.applicationId });
    await writeAudit({ actorId: user.id, action: "RECRUITER_ASSESSMENT_ASSIGNED", entityType: "AssessmentAttempt", entityId: attempt.id, metadata: { assessmentId, applicationId: body.applicationId } });
    return ok({ attempt }, { status: 201 });
  } catch (error) { return fail(error); }
}
