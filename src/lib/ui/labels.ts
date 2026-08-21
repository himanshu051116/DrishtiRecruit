const LABELS: Record<string, string> = {
  APPLIED: "Applied",
  RESUME_SCREENING: "Resume screening",
  SHORTLISTED: "Shortlisted",
  ASSESSMENT: "Assessment",
  TECHNICAL_INTERVIEW: "Technical interview",
  HR_INTERVIEW: "HR interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  MUST_HAVE: "Must-have",
  IMPORTANT: "Important",
  PREFERRED: "Preferred",
  VERIFIED: "Verified",
  PARTIAL: "Partial",
  WEAK: "Weak evidence",
  MISSING: "Missing evidence",
  CONFLICTING: "Conflicting evidence",
  OPTIONAL: "Optional",
  READY: "Ready",
  REVIEW_REQUIRED: "Review required",
  NOT_READY: "Not ready",
  TECHNICAL_SKILL: "Technical skill",
  COMMUNICATION: "Communication",
  LEADERSHIP: "Leadership",
  EXPERIENCE: "Experience",
  EDUCATION: "Education",
  COMPETENCY: "Competency",
  MCQ: "Multiple choice",
  CODING: "Coding",
  SQL: "SQL",
  DEBUGGING: "Debugging",
  PRACTICAL: "Practical",
  EASY: "Easy",
  MEDIUM: "Medium",
  ADVANCED: "Advanced",
  MANUAL: "Manual",
  AI: "AI-assisted",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  APPROVED: "Approved",
  RECOMMENDED: "Recommended",
  ASSIGNED: "Assigned",
  HUMAN_REVIEW: "Human review",
  DOCUMENT_CHECK: "Document check",
  RESUME: "Resume",
  INTERVIEW: "Interview",
  RECRUITER: "Recruiter",
  CANDIDATE: "Candidate",
  PORTFOLIO: "Portfolio",
  AI_REQUIREMENT_EXTRACTION: "Requirement extraction",
  RESUME_EVIDENCE_EXTRACTION: "Resume evidence extraction",
  INTERVIEW_QUESTION_DRAFTING: "Interview question drafting",
};

export function humanizeEnum(value: string | null | undefined) {
  if (!value) return "—";
  return LABELS[value] ?? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function shortStageLabel(value: string) {
  const labels: Record<string, string> = {
    RESUME_SCREENING: "Screening",
    TECHNICAL_INTERVIEW: "Tech interview",
    HR_INTERVIEW: "HR interview",
  };
  return labels[value] ?? humanizeEnum(value);
}

export function decisionLabel(coverage: number, hasConflict = false, unresolved = 0) {
  if (hasConflict) return { key: "REVIEW_REQUIRED", label: "Review required", tone: "danger" as const };
  if (unresolved > 0) return { key: "NOT_READY", label: "Not ready", tone: "warning" as const };
  if (coverage < 85) return { key: "REVIEW_REQUIRED", label: "Review required", tone: "warning" as const };
  return { key: "READY", label: "Ready", tone: "success" as const };
}
