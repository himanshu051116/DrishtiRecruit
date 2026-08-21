import { z } from "zod";
import { OptionalHttpUrlSchema } from "@/validation/common";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { createInterview } from "@/services/interview/interviewService";
import { writeAudit } from "@/lib/audit";

const CreateSchema = z.object({ applicationId: z.string().min(1), interviewerId: z.string().min(1), scheduledAt: z.string().datetime(), meetingUrl: OptionalHttpUrlSchema.optional(), durationMin: z.number().int().min(15).max(240).optional(), type: z.string().max(40).optional() });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const body = CreateSchema.parse(await request.json());
    const application = await prisma.application.findUnique({ where: { id: body.applicationId }, include: { job: true } });
    if (!application) return new Response("Not found", { status: 404 });
    assertSameCompany(user, application.job.companyId);
    const interview = await createInterview({ ...body, scheduledAt: new Date(body.scheduledAt), meetingUrl: body.meetingUrl || undefined });
    await writeAudit({ actorId: user.id, action: "INTERVIEW_SCHEDULED", entityType: "Interview", entityId: interview.id, metadata: { applicationId: body.applicationId, interviewerId: body.interviewerId } });
    return ok(interview, { status: 201 });
  } catch (error) { return fail(error); }
}
