import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { saveAssessmentDraftAnswers } from "@/services/assessment/assessmentService";

const Schema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string().max(50_000) })).max(200),
});

export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { attemptId } = await params;
    const body = Schema.parse(await request.json());
    const saved = await saveAssessmentDraftAnswers(attemptId, user.id, body.answers);
    return ok({ saved });
  } catch (error) { return fail(error); }
}
