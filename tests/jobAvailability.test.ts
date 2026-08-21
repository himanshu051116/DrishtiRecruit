import { describe, expect, it } from "vitest";
import { isDeadlinePassed, isJobAcceptingApplications, publicJobStatus } from "../src/services/job/jobAvailability.js";

describe("job application availability", () => {
  const now = new Date("2026-08-15T10:00:00.000Z");
  it("accepts open jobs without a deadline", () => {
    expect(isJobAcceptingApplications({ status: "OPEN", deadline: null }, now)).toBe(true);
  });
  it("rejects an open job after its deadline", () => {
    const job = { status: "OPEN", deadline: new Date("2026-08-15T09:59:59.000Z") };
    expect(isDeadlinePassed(job.deadline, now)).toBe(true);
    expect(isJobAcceptingApplications(job, now)).toBe(false);
    expect(publicJobStatus(job, now)).toBe("EXPIRED");
  });
  it("accepts a future deadline and respects explicit closed status", () => {
    expect(isJobAcceptingApplications({ status: "OPEN", deadline: new Date("2026-08-16T10:00:00.000Z") }, now)).toBe(true);
    expect(isJobAcceptingApplications({ status: "CLOSED", deadline: new Date("2026-08-16T10:00:00.000Z") }, now)).toBe(false);
  });
});
