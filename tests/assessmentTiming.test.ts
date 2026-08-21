import { describe, expect, it } from "vitest";
import { assessmentDeadline, assessmentIsExpired, assessmentTimeRemainingMs } from "../src/services/assessment/assessmentTiming.js";

describe("assessment timing", () => {
  const start = new Date("2026-08-14T00:00:00.000Z");

  it("derives the authoritative deadline from server start time", () => {
    expect(assessmentDeadline(start, 10).toISOString()).toBe("2026-08-14T00:10:00.000Z");
  });

  it("treats the deadline itself as valid but rejects changes after it when grace is zero", () => {
    expect(assessmentIsExpired(start, 10, new Date("2026-08-14T00:10:00.000Z"), 0)).toBe(false);
    expect(assessmentIsExpired(start, 10, new Date("2026-08-14T00:10:00.001Z"), 0)).toBe(true);
  });

  it("never returns negative time remaining", () => {
    expect(assessmentTimeRemainingMs(start, 10, new Date("2026-08-14T00:20:00.000Z"))).toBe(0);
  });
});
