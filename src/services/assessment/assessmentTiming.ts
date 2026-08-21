export const ASSESSMENT_SUBMISSION_GRACE_MS = 5_000;

export function assessmentDeadline(startedAt: Date, durationMin: number) {
  return new Date(startedAt.getTime() + Math.max(1, durationMin) * 60_000);
}

export function assessmentIsExpired(startedAt: Date, durationMin: number, now = new Date(), graceMs = ASSESSMENT_SUBMISSION_GRACE_MS) {
  return now.getTime() > assessmentDeadline(startedAt, durationMin).getTime() + Math.max(0, graceMs);
}

export function assessmentTimeRemainingMs(startedAt: Date, durationMin: number, now = new Date()) {
  return Math.max(0, assessmentDeadline(startedAt, durationMin).getTime() - now.getTime());
}
