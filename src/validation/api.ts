import { z } from "zod";
import { EvidenceStrength, RequirementCategory, RequirementPriority, UserRole } from "@/domain/enums";
import { HttpUrlSchema, OptionalHttpUrlSchema } from "@/validation/common";

export const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
  role: z.nativeEnum(UserRole).refine((r) => [UserRole.CANDIDATE, UserRole.RECRUITER].includes(r), "Only candidate/recruiter self-registration is enabled"),
  companyName: z.preprocess((v) => v === "" ? undefined : v, z.string().trim().min(2).max(120).optional()),
});

export const LoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const JobCreateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(40).max(12_000),
  department: z.string().max(120).optional(),
  location: z.string().max(160).optional(),
  employmentType: z.string().max(80).optional(),
  workMode: z.string().max(80).optional(),
  experienceText: z.string().max(500).optional(),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  deadline: z.string().datetime().optional(),
}).refine((value) => value.salaryMin == null || value.salaryMax == null || value.salaryMax >= value.salaryMin, { message: "Maximum salary must be greater than or equal to minimum salary", path: ["salaryMax"] });

export const RequirementUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.nativeEnum(RequirementCategory).optional(),
  priority: z.nativeEnum(RequirementPriority).optional(),
  weight: z.number().min(0).max(1).optional(),
  minimumEvidenceLevel: z.nativeEnum(EvidenceStrength).optional(),
  verificationRequired: z.boolean().optional(),
  recruiterApproved: z.boolean().optional(),
  interviewQuestion: z.string().trim().min(10).max(1200).nullable().optional(),
  interviewQuestionSource: z.enum(["AI_DRAFT", "MANUAL", "SYSTEM_TEMPLATE"]).nullable().optional(),
  interviewQuestionApproved: z.boolean().optional(),
});

export const ApplicationCreateSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().optional(),
  resumeText: z.string().max(80_000).optional(),
});

export const AnalyzeSchema = z.object({ resumeText: z.string().min(20).max(80_000).optional() });

export const StageUpdateSchema = z.object({
  stage: z.enum(["APPLIED","RESUME_SCREENING","SHORTLISTED","ASSESSMENT","TECHNICAL_INTERVIEW","HR_INTERVIEW","OFFER","HIRED","REJECTED"]),
  reason: z.string().trim().max(1000).optional(),
});

export const OfferCreateSchema = z.object({
  roleTitle: z.string().trim().min(2).max(160),
  salary: z.number().nonnegative().optional(),
  joiningDate: z.string().datetime().optional(),
  location: z.string().trim().max(160).optional(),
  benefits: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
});

export const OfferResponseSchema = z.object({ action: z.enum(["ACCEPT", "REJECT"]) });

export const ForgotPasswordSchema = z.object({ email: z.string().email().transform((value) => value.toLowerCase()) });
export const ResetPasswordSchema = z.object({ token: z.string().min(20).max(500), password: z.string().min(10).max(128) });

export const CompanyUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  website: OptionalHttpUrlSchema.optional(),
  industry: z.string().trim().max(120).optional(),
  size: z.string().trim().max(80).optional(),
  description: z.string().trim().max(3000).optional(),
  socialLinks: z.array(HttpUrlSchema).max(10).default([]),
  officeLocations: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
});

export const CandidateProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(160).optional(),
  education: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  experience: z.array(z.string().trim().min(1).max(700)).max(30).default([]),
  skills: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  certifications: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  portfolioUrl: OptionalHttpUrlSchema.optional(),
  githubUrl: OptionalHttpUrlSchema.optional(),
  linkedinUrl: OptionalHttpUrlSchema.optional(),
  coverLetter: z.string().max(5000).optional(),
});

export const TwoFactorCodeSchema = z.object({
  code: z.string().trim().min(6).max(32),
});

export const TwoFactorDisableSchema = z.object({
  code: z.string().trim().min(6).max(32),
  password: z.string().max(128).optional(),
});
export const TwoFactorSetupSchema = z.object({ password: z.string().max(128).optional() });
