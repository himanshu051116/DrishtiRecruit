import Link from "next/link";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { AvailabilityManager } from "@/components/AvailabilityManager";

export default async function InterviewAvailabilityPage() {
  const user = await requirePageUser(["RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN"]);
  if (!user.companyId) return <main className="mx-auto max-w-7xl px-6 py-10"><p>Company context required.</p></main>;
  const [interviewers, slots] = await Promise.all([
    prisma.user.findMany({ where: { companyId: user.companyId, role: "INTERVIEWER", isActive: true, emailVerifiedAt: { not: null } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.interviewAvailabilitySlot.findMany({ where: { companyId: user.companyId, startsAt: { gt: new Date() } }, include: { interviewer: { select: { id: true, name: true, email: true } } }, orderBy: { startsAt: "asc" }, take: 100 }),
  ]);
  return <main className="mx-auto max-w-7xl px-6 py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-zinc-500">Interview operations</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Availability & self-scheduling</h1><p className="mt-2 max-w-3xl text-sm text-zinc-500">Publish interviewer availability so candidates can select a valid slot without back-and-forth scheduling.</p></div><Link href={user.role === "INTERVIEWER" ? "/interviewer/interviews" : "/recruiter/dashboard"} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium">Back</Link></div><div className="mt-8"><AvailabilityManager currentUserId={user.id} currentRole={user.role} interviewers={interviewers} slots={slots.map((slot) => ({ id: slot.id, interviewer: slot.interviewer, startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), mode: slot.mode, meetingUrl: slot.meetingUrl, booked: Boolean(slot.bookedInterviewId), createdById: slot.createdById }))}/></div></main>;
}
