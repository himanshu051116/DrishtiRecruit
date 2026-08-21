export type RequirementGovernanceIssue = {
  code: string;
  label: string;
  matchedText: string;
};

const BLOCKED_PATTERNS: Array<{ code: string; label: string; pattern: RegExp }> = [
  { code: "AGE", label: "age or date-of-birth criterion", pattern: /\b(age|aged|date of birth|dob)\b/i },
  { code: "SEX_GENDER", label: "sex or gender criterion", pattern: /\b(sex|gender|male only|female only|man only|woman only)\b/i },
  { code: "RACE_ETHNICITY", label: "race or ethnicity criterion", pattern: /\b(race|racial|ethnicity|ethnic origin)\b/i },
  { code: "RELIGION", label: "religion criterion", pattern: /\b(religion|religious belief|faith)\b/i },
  { code: "CASTE", label: "caste criterion", pattern: /\b(caste)\b/i },
  { code: "DISABILITY", label: "disability or medical-status criterion", pattern: /\b(disability|disabled|medical condition|health condition)\b/i },
  { code: "PREGNANCY", label: "pregnancy criterion", pattern: /\b(pregnan(?:t|cy)|maternity status)\b/i },
  { code: "MARITAL_STATUS", label: "marital-status criterion", pattern: /\b(marital status|married|unmarried|single only)\b/i },
  { code: "SEXUAL_ORIENTATION", label: "sexual-orientation criterion", pattern: /\b(sexual orientation|gay|lesbian|bisexual)\b/i },
];

/**
 * Product safeguard, not a claim of legal compliance. DrishtiRecruit intentionally
 * blocks obvious sensitive-trait criteria from entering automated scoring.
 * Employment-law/privacy review is still required for real deployments.
 */
export function inspectRequirementGovernance(name: string, description?: string | null): RequirementGovernanceIssue[] {
  const text = `${name}\n${description ?? ""}`;
  return BLOCKED_PATTERNS.flatMap(({ code, label, pattern }) => {
    const match = text.match(pattern);
    return match ? [{ code, label, matchedText: match[0] }] : [];
  });
}

export function assertRequirementCanBeApproved(name: string, description?: string | null) {
  const issues = inspectRequirementGovernance(name, description);
  if (!issues.length) return;
  throw new Response(
    `Requirement cannot be approved for automated evaluation: ${issues.map((issue) => issue.label).join(", ")}. Edit the criterion to a job-related, assessable requirement.`,
    { status: 409 },
  );
}
