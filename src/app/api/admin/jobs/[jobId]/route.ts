import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

const Schema = z.object({ status: z.enum(["DRAFT", "OPEN", "CLOSED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireVerifiedRole("ADMIN");
    const { jobId } = await params;
    const body = Schema.parse(await request.json());
    const existing = await prisma.job.findUnique({ where: { id: jobId }, include: { requirements: true } });
    if (!existing) throw new Response("Job not found", { status: 404 });
    if (body.status === "OPEN" && (!existing.requirements.length || existing.requirements.some((requirement) => !requirement.recruiterApproved))) {
      throw new Response("All job requirements must be recruiter-approved before opening the job", { status: 409 });
    }
    const job = await prisma.job.update({ where: { id: jobId }, data: { status: body.status } });
    await writeAudit({ actorId: admin.id, action: "ADMIN_JOB_STATUS_UPDATED", entityType: "Job", entityId: jobId, metadata: { before: existing.status, after: body.status } });
    return ok(job);
  } catch (error) { return fail(error); }
}
