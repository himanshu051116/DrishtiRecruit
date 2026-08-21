import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { isDeadlinePassed } from "@/services/job/jobAvailability";
const Schema = z.object({ status: z.enum(["DRAFT", "OPEN", "CLOSED"]) });
export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    const { jobId } = await context.params;
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { requirements: true } });
    if (!job) return new Response("Not found", { status: 404 });
    assertSameCompany(user, job.companyId);
    const { status } = Schema.parse(await request.json());
    if (status === "OPEN" && (!job.requirements.length || job.requirements.some((r) => !r.recruiterApproved))) {
      return Response.json({ ok: false, error: "APPROVE_ALL_REQUIREMENTS_BEFORE_PUBLISH" }, { status: 409 });
    }
    if (status === "OPEN" && isDeadlinePassed(job.deadline)) {
      return Response.json({ ok: false, error: "APPLICATION_DEADLINE_PASSED" }, { status: 409 });
    }
    return ok(await prisma.job.update({ where: { id: jobId }, data: { status } }));
  } catch (error) { return fail(error); }
}
