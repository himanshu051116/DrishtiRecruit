import { describe, expect, it } from "vitest";
import { inspectRequirementGovernance } from "../src/services/job/requirementGovernance";

describe("requirement governance", () => {
  it("does not flag ordinary job-related criteria", () => {
    expect(inspectRequirementGovernance("PostgreSQL", "Design reliable relational queries")).toEqual([]);
    expect(inspectRequirementGovernance("Experience", "At least 2 years of backend engineering experience")).toEqual([]);
  });

  it("flags obvious sensitive-trait criteria", () => {
    expect(inspectRequirementGovernance("Age", "Candidate must be under 30").map((x) => x.code)).toContain("AGE");
    expect(inspectRequirementGovernance("Team preference", "Male only").map((x) => x.code)).toContain("SEX_GENDER");
    expect(inspectRequirementGovernance("Background", "Specific caste preferred").map((x) => x.code)).toContain("CASTE");
  });
});
