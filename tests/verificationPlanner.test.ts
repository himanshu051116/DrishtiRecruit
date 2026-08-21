import { describe, expect, it } from "vitest";
import { planVerifications } from "../src/services/verificationPlanner";
import { CriterionStatus, EvidenceStrength, RequirementCategory, RequirementPriority, VerificationMethod } from "../src/domain/enums";
import { DEFAULT_VERIFICATION_TEMPLATES } from "../src/services/verification/templates";

describe("verification planner", () => {
  it("prefers SQL verification for an unresolved PostgreSQL criterion", () => {
    const result = planVerifications([{ id: "r1", name: "PostgreSQL", category: RequirementCategory.TECHNICAL_SKILL, priority: RequirementPriority.MUST_HAVE, weight: .4, minimumEvidenceLevel: EvidenceStrength.MEDIUM, verificationRequired: true, recruiterApproved: true }], [{ requirementId: "r1", fitScore: 80, evidenceCoverage: 30, status: CriterionStatus.WEAK, supportScore: .5, contradictionScore: 0, evidenceCount: 1, independentSourceCount: 1 }], DEFAULT_VERIFICATION_TEMPLATES);
    expect(result[0]?.method).toBe(VerificationMethod.SQL);
  });
});
