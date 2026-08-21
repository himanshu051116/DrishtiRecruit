import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { startAssessmentAttempt } from "@/services/assessment/assessmentService";

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { attemptId } = await context.params;
    return ok(await startAssessmentAttempt(attemptId, user.id));
  } catch (error) { return fail(error); }
}
