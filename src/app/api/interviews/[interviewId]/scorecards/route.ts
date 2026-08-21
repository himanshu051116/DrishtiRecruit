import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { submitInterviewScorecards } from "@/services/interview/interviewService";
import { writeAudit } from "@/lib/audit";

const ScorecardSchema = z.object({ scores: z.array(z.object({ requirementId: z.string().min(1), score: z.number().min(1).max(5), comments: z.string().max(2000).optional(), evidenceNote: z.string().max(2000).optional() })).min(1).max(20) });

export async function POST(request: Request, context: { params: Promise<{ interviewId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("INTERVIEWER");
    const { interviewId } = await context.params;
    const body = ScorecardSchema.parse(await request.json());
    const coverage = await submitInterviewScorecards(interviewId, user.id, body.scores);
    await writeAudit({ actorId: user.id, action: "INTERVIEW_SCORECARD_SUBMITTED", entityType: "Interview", entityId: interviewId, metadata: { decisionCoverage: coverage.decisionCoverage } });
    return ok(coverage);
  } catch (error) { return fail(error); }
}
