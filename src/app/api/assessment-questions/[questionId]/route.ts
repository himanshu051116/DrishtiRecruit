import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { deleteRecruiterQuestion } from "@/services/assessment/assessmentBuilder";

export async function DELETE(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { questionId } = await params;
    await deleteRecruiterQuestion({ companyId: user.companyId, questionId });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_QUESTION_DELETED", entityType: "AssessmentQuestion", entityId: questionId });
    return ok({ deleted: true });
  } catch (error) { return fail(error); }
}
