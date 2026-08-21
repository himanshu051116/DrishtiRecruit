import { CandidateProfileUpdateSchema } from "@/validation/api";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireVerifiedRole("CANDIDATE"); const input = CandidateProfileUpdateSchema.parse(await request.json());
    const profile = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { name: input.name } });
      return tx.candidateProfile.update({ where: { userId: user.id }, data: { phone: input.phone || null, location: input.location || null, education: input.education, experience: input.experience, skills: input.skills, certifications: input.certifications, portfolioUrl: input.portfolioUrl || null, githubUrl: input.githubUrl || null, linkedinUrl: input.linkedinUrl || null, coverLetter: input.coverLetter || null } });
    });
    await writeAudit({ actorId: user.id, action: "CANDIDATE_PROFILE_UPDATED", entityType: "CandidateProfile", entityId: profile.id });
    return ok({ profile });
  } catch (error) { return fail(error); }
}
