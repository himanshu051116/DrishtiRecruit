export type Stage = "APPLIED" | "RESUME_SCREENING" | "SHORTLISTED" | "ASSESSMENT" | "TECHNICAL_INTERVIEW" | "HR_INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";

export const STAGE_ORDER: Stage[] = ["APPLIED","RESUME_SCREENING","SHORTLISTED","ASSESSMENT","TECHNICAL_INTERVIEW","HR_INTERVIEW","OFFER","HIRED","REJECTED"];

const ALLOWED: Record<Stage, Stage[]> = {
  APPLIED: ["RESUME_SCREENING", "SHORTLISTED", "REJECTED"],
  RESUME_SCREENING: ["SHORTLISTED", "ASSESSMENT", "REJECTED"],
  SHORTLISTED: ["ASSESSMENT", "TECHNICAL_INTERVIEW", "REJECTED"],
  ASSESSMENT: ["TECHNICAL_INTERVIEW", "HR_INTERVIEW", "REJECTED"],
  TECHNICAL_INTERVIEW: ["HR_INTERVIEW", "OFFER", "REJECTED"],
  HR_INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

export function canTransition(from: Stage, to: Stage) {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}
const FORCE_RANK: Record<Exclude<Stage, "REJECTED">, number> = {
  APPLIED: 0,
  RESUME_SCREENING: 1,
  SHORTLISTED: 2,
  ASSESSMENT: 3,
  TECHNICAL_INTERVIEW: 4,
  HR_INTERVIEW: 5,
  OFFER: 6,
  HIRED: 7,
};

/**
 * Internal workflow services occasionally need to advance over one or more
 * intermediate UI stages (for example, assigning an assessment directly from
 * screening). `force` is intentionally *not* an unrestricted override:
 * - terminal applications can never be reopened;
 * - active applications may be rejected;
 * - all other forced moves must be forward-only.
 * This prevents late analysis/assessment/interview jobs from silently moving an
 * OFFER/HIRED/REJECTED application backwards in the pipeline.
 */
export function canForceTransition(from: Stage, to: Stage) {
  if (from === to) return true;
  if (from === "HIRED" || from === "REJECTED") return false;
  if (to === "REJECTED") return true;
  if (to === "HIRED") return from === "OFFER";
  return FORCE_RANK[to] >= FORCE_RANK[from as Exclude<Stage, "REJECTED">];
}

export function isTerminalStage(stage: Stage) {
  return stage === "HIRED" || stage === "REJECTED";
}

export function isHiringActivityClosed(stage: Stage) {
  return stage === "OFFER" || isTerminalStage(stage);
}
