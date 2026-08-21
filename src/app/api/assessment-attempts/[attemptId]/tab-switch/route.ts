import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) { try { assertSameOrigin(request); const user = await requireVerifiedRole("CANDIDATE"); const { attemptId } = await params; const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { application: { include: { candidate: true } } } }); if (!attempt || attempt.application.candidate.userId !== user.id) throw new Response("Assessment not found", { status: 404 }); if (attempt.submittedAt) return ok({ ignored: true }); const updated = await prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { tabSwitchCount: { increment: 1 } } }); return ok({ tabSwitchCount: updated.tabSwitchCount }); } catch (error) { return fail(error); } }
