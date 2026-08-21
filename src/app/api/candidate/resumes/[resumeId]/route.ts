import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";

const UpdateResumeSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ resumeId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    const { resumeId } = await params;
    const input = UpdateResumeSchema.parse(await request.json());
    const resume = await prisma.resume.findUnique({ where: { id: resumeId }, include: { candidate: true } });
    if (!resume || resume.candidate.userId !== user.id) return new Response("Not found", { status: 404 });
    const updated = await prisma.resume.update({ where: { id: resume.id }, data: { isActive: input.isActive }, select: { id: true, fileName: true, isActive: true, createdAt: true } });
    await writeAudit({ actorId: user.id, action: input.isActive ? "RESUME_ACTIVATED" : "RESUME_DEACTIVATED", entityType: "Resume", entityId: resume.id });
    return ok(updated);
  } catch (error) { return fail(error); }
}
