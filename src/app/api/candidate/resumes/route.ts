import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { validateResumeFile, storeResumeLocal } from "@/lib/storage/resumeStorage";
import { extractResumeText } from "@/services/resume/textExtractor";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireVerifiedRole("CANDIDATE");
    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidate) return new Response("Candidate profile required", { status: 409 });
    const resumes = await prisma.resume.findMany({
      where: { candidateId: candidate.id },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(resumes);
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("CANDIDATE");
    rateLimit(`resume-upload:${user.id}`, 6, 60_000);
    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidate) return new Response("Candidate profile required", { status: 409 });

    const form = await request.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) return new Response("Resume file is required", { status: 400 });

    const validated = await validateResumeFile(file);
    const duplicate = await prisma.resume.findFirst({ where: { candidateId: candidate.id, sha256: validated.sha256 } });
    if (duplicate) {
      const restored = duplicate.isActive ? duplicate : await prisma.resume.update({ where: { id: duplicate.id }, data: { isActive: true } });
      return ok({ resume: restored, duplicate: true, reactivated: !duplicate.isActive });
    }

    const parsedText = await extractResumeText(validated.buffer, validated.mimeType);
    const stored = await storeResumeLocal(candidate.id, validated);
    const resume = await prisma.resume.create({
      data: {
        candidateId: candidate.id,
        fileUrl: stored.fileUrl,
        storageKey: stored.storageKey,
        fileName: validated.originalName,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        sha256: validated.sha256,
        parsedText,
      },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true, createdAt: true },
    });
    await writeAudit({ actorId: user.id, action: "RESUME_UPLOADED", entityType: "Resume", entityId: resume.id, metadata: { mimeType: resume.mimeType, sizeBytes: resume.sizeBytes } });
    return ok({ resume, duplicate: false }, { status: 201 });
  } catch (error) { return fail(error); }
}
