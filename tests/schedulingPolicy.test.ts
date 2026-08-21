import { describe, expect, it } from "vitest";
import { intervalEnd, intervalsOverlap, validInterviewDuration } from "../src/services/interview/schedulingPolicy";

describe("interview scheduling policy", () => {
  it("detects overlapping windows but allows back-to-back interviews", () => {
    const a = new Date("2026-08-20T10:00:00Z");
    const aEnd = intervalEnd(a, 45);
    expect(intervalsOverlap(a, aEnd, new Date("2026-08-20T10:30:00Z"), new Date("2026-08-20T11:00:00Z"))).toBe(true);
    expect(intervalsOverlap(a, aEnd, new Date("2026-08-20T10:45:00Z"), new Date("2026-08-20T11:15:00Z"))).toBe(false);
  });
  it("accepts bounded interview durations", () => {
    expect(validInterviewDuration(15)).toBe(true);
    expect(validInterviewDuration(45)).toBe(true);
    expect(validInterviewDuration(240)).toBe(true);
    expect(validInterviewDuration(10)).toBe(false);
    expect(validInterviewDuration(300)).toBe(false);
  });
});
