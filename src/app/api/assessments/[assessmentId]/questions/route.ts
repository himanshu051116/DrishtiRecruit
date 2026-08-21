import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { addRecruiterAssessmentQuestion } from "@/services/assessment/assessmentBuilder";

const Base = z.object({
  requirementId: z.string().min(1).optional(),
  category: z.enum(["TECHNICAL_SKILL", "EXPERIENCE", "EDUCATION", "COMPETENCY", "COMMUNICATION", "LEADERSHIP", "OTHER"]),
  method: z.enum(["MCQ", "CODING", "SQL", "DEBUGGING", "PRACTICAL"]),
  difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED"]),
  prompt: z.string().trim().min(10).max(5000),
  maxScore: z.number().positive().max(100),
});
const Rubric = z.discriminatedUnion("type", [
  z.object({ type: z.literal("single_choice"), choices: z.array(z.string().trim().min(1).max(500)).min(2).max(8), correctIndex: z.number().int().min(0) }),
  z.object({ type: z.literal("keyword"), keywords: z.array(z.string().trim().min(1).max(100)).min(1).max(30), minimumHits: z.number().int().min(1).max(30) }),
]);
const Schema = Base.extend({ rubric: Rubric }).superRefine((value, ctx) => {
  if (value.rubric.type === "single_choice" && value.rubric.correctIndex >= value.rubric.choices.length) {
    ctx.addIssue({ code: "custom", message: "Correct choice is outside the choices list", path: ["rubric", "correctIndex"] });
  }
  if (value.rubric.type === "keyword" && value.rubric.minimumHits > value.rubric.keywords.length) {
    ctx.addIssue({ code: "custom", message: "Minimum keyword hits cannot exceed keyword count", path: ["rubric", "minimumHits"] });
  }
});

export async function POST(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const { assessmentId } = await params;
    const body = Schema.parse(await request.json());
    const question = await addRecruiterAssessmentQuestion({ companyId: user.companyId, assessmentId, question: body });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_QUESTION_CREATED", entityType: "AssessmentQuestion", entityId: question.id, metadata: { assessmentId, method: body.method } });
    return ok({ question }, { status: 201 });
  } catch (error) { return fail(error); }
}
