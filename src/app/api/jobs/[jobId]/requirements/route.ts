import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { RequirementUpdateSchema } from "@/validation/api";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { assertRequirementCanBeApproved } from "@/services/job/requirementGovernance";
import { EvidenceStrength, RequirementCategory, RequirementPriority } from "@/domain/enums";

const PatchSchema = z.object({ requirementId: z.string().min(1), patch: RequirementUpdateSchema });
const PublishRequirementSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullable(),
  category: z.nativeEnum(RequirementCategory),
  priority: z.nativeEnum(RequirementPriority),
  weight: z.number().min(0.01).max(1),
  minimumEvidenceLevel: z.nativeEnum(EvidenceStrength),
  verificationRequired: z.boolean(),
  interviewQuestion: z.string().trim().min(10).max(1200).nullable(),
  interviewQuestionSource: z.enum(["AI_DRAFT", "MANUAL", "SYSTEM_TEMPLATE"]).nullable(),
  interviewQuestionApproved: z.boolean(),
});
const BulkSchema = z.object({ action: z.literal("APPROVE_AND_PUBLISH"), requirements: z.array(PublishRequirementSchema).min(1).max(30) });

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { jobId } = await context.params;
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { requirements: { orderBy: { createdAt: "asc" } } } });
    if (!job) return new Response("Not found", { status: 404 });
    assertSameCompany(user, job.companyId);
    return ok(job.requirements);
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    const { jobId } = await context.params;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return new Response("Not found", { status: 404 });
    assertSameCompany(user, job.companyId);
    const { requirementId, patch } = PatchSchema.parse(await request.json());
    const exists = await prisma.jobRequirement.findFirst({ where: { id: requirementId, jobId } });
    if (!exists) return new Response("Requirement not found", { status: 404 });
    if (patch.recruiterApproved === true) {
      assertRequirementCanBeApproved(patch.name ?? exists.name, patch.description === undefined ? exists.description : patch.description);
    }
    const updated = await prisma.jobRequirement.update({ where: { id: requirementId }, data: patch });
    await writeAudit({ actorId: user.id, action: "JOB_REQUIREMENT_UPDATED", entityType: "JobRequirement", entityId: requirementId, metadata: { jobId } });
    return ok(updated);
  } catch (error) { return fail(error); }
}

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireVerifiedRole("RECRUITER", "ADMIN");
    const { jobId } = await context.params;
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { requirements: { select: { id: true } } } });
    if (!job) return new Response("Not found", { status: 404 });
    assertSameCompany(user, job.companyId);
    if (job.deadline && job.deadline.getTime() <= Date.now()) throw new Response("Application deadline has passed; choose a future deadline before publishing", { status: 409 });

    const input = BulkSchema.parse(await request.json());
    const persistedIds = new Set(job.requirements.map((item) => item.id));
    const suppliedIds = new Set(input.requirements.map((item) => item.id));
    if (persistedIds.size !== suppliedIds.size || [...persistedIds].some((id) => !suppliedIds.has(id))) {
      throw new Response("Requirement list changed; refresh before publishing", { status: 409 });
    }

    const names = input.requirements.map((item) => item.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) throw new Response("Duplicate requirement names must be merged before publishing", { status: 400 });
    for (const requirement of input.requirements) {
      assertRequirementCanBeApproved(requirement.name, requirement.description);
      if (requirement.interviewQuestionApproved && !requirement.interviewQuestion) {
        throw new Response(`Approved interview question is missing for ${requirement.name}`, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const requirement of input.requirements) {
        await tx.jobRequirement.update({
          where: { id: requirement.id },
          data: {
            name: requirement.name,
            description: requirement.description,
            category: requirement.category,
            priority: requirement.priority,
            weight: requirement.weight,
            minimumEvidenceLevel: requirement.minimumEvidenceLevel,
            verificationRequired: requirement.verificationRequired,
            recruiterApproved: true,
            interviewQuestion: requirement.interviewQuestion,
            interviewQuestionSource: requirement.interviewQuestion ? requirement.interviewQuestionSource : null,
            interviewQuestionApproved: Boolean(requirement.interviewQuestion && requirement.interviewQuestionApproved),
          },
        });
      }
      const opened = await tx.job.update({ where: { id: jobId }, data: { status: "OPEN" } });
      return opened;
    }, { isolationLevel: "Serializable" });

    await writeAudit({
      actorId: user.id,
      action: "JOB_REQUIREMENTS_APPROVED_AND_PUBLISHED",
      entityType: "Job",
      entityId: jobId,
      metadata: { requirementCount: input.requirements.length },
    });
    return ok({ approved: true, status: updated.status });
  } catch (error) { return fail(error); }
}
