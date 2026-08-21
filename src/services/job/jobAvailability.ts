export type PublicJobState = {
  status: string;
  deadline: Date | null;
};

export function isDeadlinePassed(deadline: Date | null | undefined, now = new Date()) {
  return Boolean(deadline && deadline.getTime() < now.getTime());
}

export function isJobAcceptingApplications(job: PublicJobState, now = new Date()) {
  return job.status === "OPEN" && !isDeadlinePassed(job.deadline, now);
}

export function publicJobStatus(job: PublicJobState, now = new Date()) {
  if (job.status !== "OPEN") return job.status;
  if (isDeadlinePassed(job.deadline, now)) return "EXPIRED";
  return "OPEN";
}
