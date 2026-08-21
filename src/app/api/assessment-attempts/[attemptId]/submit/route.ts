import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { submitAssessmentAttempt } from "@/services/assessment/assessmentService";
import { writeAudit } from "@/lib/audit";

const SubmitSchema = z.object({ answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string().max(8000) })).max(50) });

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { attemptId } = await context.params;
    const body = SubmitSchema.parse(await request.json());
    const result = await submitAssessmentAttempt(attemptId, user.id, body.answers);
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_SUBMITTED", entityType: "AssessmentAttempt", entityId: attemptId, metadata: { percent: result.percent, timedOut: result.timedOut } });
    return ok(result);
  } catch (error) { return fail(error); }
}
