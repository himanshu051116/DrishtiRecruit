import { describe, expect, it } from "vitest";
import { canViewInterviewCalendar, canViewOfferDocument } from "../src/services/access/policies.js";
import type { SessionUser } from "../src/lib/auth/session.js";

function user(role: SessionUser["role"], id = role.toLowerCase(), companyId: string | null = "company-1"): SessionUser {
  return { id, email: `${id}@example.test`, name: id, role, companyId, emailVerified: true };
}

describe("least-privilege document access", () => {
  it("does not allow an unrelated same-company interviewer to read an offer with salary data", () => {
    expect(canViewOfferDocument(user("INTERVIEWER"), { candidateUserId: "candidate", companyId: "company-1" })).toBe(false);
  });

  it("allows the candidate, recruiter, hiring manager and admin to read the offer", () => {
    expect(canViewOfferDocument(user("CANDIDATE", "candidate", null), { candidateUserId: "candidate", companyId: "company-1" })).toBe(true);
    expect(canViewOfferDocument(user("RECRUITER"), { candidateUserId: "candidate", companyId: "company-1" })).toBe(true);
    expect(canViewOfferDocument(user("HIRING_MANAGER"), { candidateUserId: "candidate", companyId: "company-1" })).toBe(true);
    expect(canViewOfferDocument(user("ADMIN", "admin", null), { candidateUserId: "candidate", companyId: "company-1" })).toBe(true);
  });

  it("limits interview calendars to the candidate, assigned interviewer, authorized hiring roles or admin", () => {
    expect(canViewInterviewCalendar(user("INTERVIEWER", "assigned"), { candidateUserId: "candidate", interviewerId: "assigned", companyId: "company-1" })).toBe(true);
    expect(canViewInterviewCalendar(user("INTERVIEWER", "other"), { candidateUserId: "candidate", interviewerId: "assigned", companyId: "company-1" })).toBe(false);
  });
});
