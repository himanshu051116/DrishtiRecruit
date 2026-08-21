import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { fail } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/http/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireVerifiedRole("CANDIDATE");
    rateLimit(`candidate-data-export:${user.id}`, 3, 5 * 60_000);
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true, updatedAt: true, deletionRequestedAt: true,
        candidate: {
          include: {
            resumes: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, isActive: true, createdAt: true } },
            applications: {
              include: {
                job: { select: { id: true, title: true, company: { select: { id: true, name: true } } } },
                evaluations: { select: { requirementId: true, fitScore: true, evidenceCoverage: true, status: true, calculatedAt: true } },
                decisions: { select: { humanDecision: true, decisionCoverage: true, override: true, createdAt: true } },
                interviews: { select: { scheduledAt: true, durationMin: true, type: true, status: true } },
                offers: { select: { roleTitle: true, salary: true, joiningDate: true, location: true, status: true, createdAt: true } },
                stageEvents: { select: { fromStage: true, toStage: true, reason: true, createdAt: true } },
              },
            },
          },
        },
        notifications: { select: { type: true, title: true, body: true, readAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 },
        sessions: { select: { createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true, userAgent: true } },
      },
    });
    if (!record) return new Response("Not found", { status: 404 });
    const applicationIds = record.candidate?.applications.map((application) => application.id) ?? [];
    const aiRuns = applicationIds.length ? await prisma.aiRun.findMany({
      where: { applicationId: { in: applicationIds } },
      select: { applicationId: true, purpose: true, provider: true, model: true, promptVersion: true, status: true, usedFallback: true, durationMs: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }) : [];
    await writeAudit({ actorId: user.id, action: "CANDIDATE_DATA_EXPORTED", entityType: "User", entityId: user.id });
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), formatVersion: 2, data: { ...record, aiExecutionMetadata: aiRuns } }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="drishtirecruit-data-${user.id}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) { return fail(error); }
}
