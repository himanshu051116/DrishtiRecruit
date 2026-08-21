import { describe, expect, it } from "vitest";
import { canForceTransition, canTransition } from "../src/services/application/stagePolicy";

describe("application stage policy", () => {
  it("allows normal forward workflow", () => {
    expect(canTransition("APPLIED", "RESUME_SCREENING")).toBe(true);
    expect(canTransition("SHORTLISTED", "ASSESSMENT")).toBe(true);
    expect(canTransition("HR_INTERVIEW", "OFFER")).toBe(true);
  });

  it("does not allow reopening terminal states through generic transition policy", () => {
    expect(canTransition("HIRED", "SHORTLISTED")).toBe(false);
    expect(canTransition("REJECTED", "ASSESSMENT")).toBe(false);
  });

  it("allows forced forward jumps without allowing workflow regression", () => {
    expect(canForceTransition("APPLIED", "ASSESSMENT")).toBe(true);
    expect(canForceTransition("SHORTLISTED", "TECHNICAL_INTERVIEW")).toBe(true);
    expect(canForceTransition("TECHNICAL_INTERVIEW", "ASSESSMENT")).toBe(false);
    expect(canForceTransition("OFFER", "ASSESSMENT")).toBe(false);
  });

  it("allows rejection from an active stage but never reopens terminal states", () => {
    expect(canForceTransition("ASSESSMENT", "REJECTED")).toBe(true);
    expect(canForceTransition("HIRED", "REJECTED")).toBe(false);
    expect(canForceTransition("HIRED", "TECHNICAL_INTERVIEW")).toBe(false);
    expect(canForceTransition("REJECTED", "OFFER")).toBe(false);
  });
});
