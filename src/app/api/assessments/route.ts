import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { createRecruiterAssessment } from "@/services/assessment/assessmentBuilder";

const CreateSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  durationMin: z.number().int().min(1).max(240),
});

export async function GET() {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const assessments = await prisma.assessment.findMany({
      where: { job: { companyId: user.companyId } },
      include: { job: true, questions: true, _count: { select: { attempts: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return ok({ assessments });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    if (!user.companyId) throw new Response("Company context required", { status: 409 });
    const body = CreateSchema.parse(await request.json());
    const assessment = await createRecruiterAssessment({ companyId: user.companyId, ...body });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_CREATED", entityType: "Assessment", entityId: assessment.id, metadata: { jobId: body.jobId } });
    return ok({ assessment }, { status: 201 });
  } catch (error) { return fail(error); }
}
