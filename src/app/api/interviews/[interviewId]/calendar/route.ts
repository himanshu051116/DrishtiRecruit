import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/rbac";
import { interviewIcs } from "@/lib/calendar/ics";
import { canViewInterviewCalendar } from "@/services/access/policies";

export async function GET(_request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  const user = await requireUser();
  const { interviewId } = await params;
  const interview = await prisma.interview.findUnique({ where: { id: interviewId }, include: { interviewer: true, application: { include: { candidate: { include: { user: true } }, job: { include: { company: true } } } } } });
  if (!interview) return new Response("Not found", { status: 404 });
  if (!canViewInterviewCalendar(user, { candidateUserId: interview.application.candidate.userId, interviewerId: interview.interviewerId, companyId: interview.application.job.companyId })) return new Response("Forbidden", { status: 403 });
  const title = `${interview.application.job.title} interview — ${interview.application.job.company.name}`;
  const description = `DrishtiRecruit interview for ${interview.application.candidate.user.name}. Interviewer: ${interview.interviewer.name}.`;
  const ics = interviewIcs({ id: interview.id, title, description, start: interview.scheduledAt, durationMinutes: interview.durationMin, location: interview.application.job.location ?? undefined, url: interview.meetingUrl ?? undefined });
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="tracehire-interview-${interview.id}.ics"`, "cache-control": "private, no-store" } });
}
