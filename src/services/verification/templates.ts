import { RequirementCategory, VerificationMethod } from "@/domain/enums";
import type { VerificationTemplate } from "@/domain/types";

export const DEFAULT_VERIFICATION_TEMPLATES: VerificationTemplate[] = [
  { id: "tech-practical-medium", name: "Technical practical verification", category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.PRACTICAL, difficulty: "MEDIUM", estimatedMinutes: 8, active: true },
  { id: "tech-sql-medium", name: "SQL verification", category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.SQL, difficulty: "MEDIUM", estimatedMinutes: 10, active: true },
  { id: "tech-coding-medium", name: "Coding verification", category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.CODING, difficulty: "MEDIUM", estimatedMinutes: 12, active: true },
  { id: "tech-mcq-medium", name: "Technical knowledge check", category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.MCQ, difficulty: "MEDIUM", estimatedMinutes: 6, active: true },
  { id: "tech-debug-medium", name: "Technical debugging task", category: RequirementCategory.TECHNICAL_SKILL, method: VerificationMethod.DEBUGGING, difficulty: "MEDIUM", estimatedMinutes: 10, active: true },
  { id: "competency-interview-medium", name: "Competency interview probe", category: RequirementCategory.COMPETENCY, method: VerificationMethod.INTERVIEW, difficulty: "MEDIUM", estimatedMinutes: 8, active: true },
  { id: "communication-interview", name: "Structured communication probe", category: RequirementCategory.COMMUNICATION, method: VerificationMethod.INTERVIEW, difficulty: "MEDIUM", estimatedMinutes: 6, active: true },
  { id: "experience-interview", name: "Experience verification interview", category: RequirementCategory.EXPERIENCE, method: VerificationMethod.INTERVIEW, difficulty: "MEDIUM", estimatedMinutes: 8, active: true },
  { id: "education-document", name: "Education document check", category: RequirementCategory.EDUCATION, method: VerificationMethod.DOCUMENT_CHECK, difficulty: "EASY", estimatedMinutes: 5, active: true },
  { id: "leadership-interview", name: "Structured leadership probe", category: RequirementCategory.LEADERSHIP, method: VerificationMethod.INTERVIEW, difficulty: "MEDIUM", estimatedMinutes: 8, active: true },
  { id: "human-review", name: "Human evidence review", category: RequirementCategory.OTHER, method: VerificationMethod.HUMAN_REVIEW, difficulty: "MEDIUM", estimatedMinutes: 10, active: true },
];
