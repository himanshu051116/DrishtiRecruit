import type { SessionUser } from "@/lib/auth/session";

export function canViewOfferDocument(user: SessionUser, input: { candidateUserId: string; companyId: string }) {
  if (user.id === input.candidateUserId) return true;
  if (user.role === "ADMIN") return true;
  return Boolean(user.companyId === input.companyId && ["RECRUITER", "HIRING_MANAGER"].includes(user.role));
}

export function canViewInterviewCalendar(user: SessionUser, input: { candidateUserId: string; interviewerId: string; companyId: string }) {
  if (user.id === input.candidateUserId || user.id === input.interviewerId) return true;
  if (user.role === "ADMIN") return true;
  return Boolean(user.companyId === input.companyId && ["RECRUITER", "HIRING_MANAGER"].includes(user.role));
}
