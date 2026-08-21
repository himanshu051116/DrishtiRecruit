import { prisma } from "@/lib/prisma";
import { extractRequirementDrafts } from "@/services/ai/requirementExtractor";

export async function createJobWithDraftRequirements(input: {
  companyId: string;
  createdById: string;
  title: string;
  description: string;
  department?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  experienceText?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
}) {
  const drafts = await extractRequirementDrafts(input.description, { companyId: input.companyId, actorId: input.createdById });
  return prisma.job.create({
    data: {
      companyId: input.companyId,
      createdById: input.createdById,
      title: input.title,
      description: input.description,
      department: input.department,
      location: input.location,
      employmentType: input.employmentType,
      workMode: input.workMode,
      experienceText: input.experienceText,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      requirements: {
        create: drafts.map((d) => ({ ...d, aiGenerated: true, recruiterApproved: false })),
      },
    },
    include: { requirements: true },
  });
}
