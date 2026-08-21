import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { fail, ok } from "@/lib/http/route";
import { listOpenSlots } from "@/services/interview/availabilityService";

export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await requireVerifiedRole("CANDIDATE");
    const { applicationId } = await params;
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { candidate: true, job: true } });
    if (!application || application.candidate.userId !== user.id) throw new Response("Application not found", { status: 404 });
    const slots = await listOpenSlots(application.job.companyId);
    return ok({ slots });
  } catch (error) { return fail(error); }
}
