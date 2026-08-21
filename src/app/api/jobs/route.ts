import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { getSessionUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/security";
import { JobCreateSchema } from "@/validation/api";
import { createJobWithDraftRequirements } from "@/services/job/jobService";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getSessionUser();
    const staff = Boolean(user && ["RECRUITER","HIRING_MANAGER","ADMIN"].includes(user.role) && user.companyId);
    if (staff) {
      const jobs = await prisma.job.findMany({ where: { companyId: user!.companyId! }, orderBy: { createdAt: "desc" }, include: { _count: { select: { applications: true } }, requirements: { select: { id: true, name: true, priority: true, recruiterApproved: true } } } });
      return ok(jobs);
    }
    const jobs = await prisma.job.findMany({
      where: { status: "OPEN", OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, department: true, location: true, employmentType: true, workMode: true, deadline: true, description: true, salaryMin: true, salaryMax: true,
        company: { select: { id: true, name: true } },
        requirements: { where: { recruiterApproved: true }, select: { id: true, name: true, priority: true } },
      },
    });
    return ok(jobs);
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    if (!user.companyId) return Response.json({ ok: false, error: "COMPANY_REQUIRED" }, { status: 409 });
    const input = JobCreateSchema.parse(await request.json());
    const job = await createJobWithDraftRequirements({ ...input, companyId: user.companyId, createdById: user.id });
    await writeAudit({ actorId: user.id, action: "JOB_CREATED", entityType: "Job", entityId: job.id, metadata: { requirementDrafts: job.requirements.length } });
    return ok(job, { status: 201 });
  } catch (error) { return fail(error); }
}
