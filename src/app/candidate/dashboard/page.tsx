import Link from "next/link";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/MetricCard";

function alignmentLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Promising";
  if (score >= 50) return "Partial";
  return score > 0 ? "Emerging" : "Not evaluated";
}

export default async function CandidateDashboardPage() {
  const user = await requirePageUser(["CANDIDATE"]);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id }, include: { resumes: { where: { isActive: true } }, applications: { include: { job: { include: { company: true } }, attempts: true, interviews: true, offers: true }, orderBy: { createdAt: "desc" } } } });
  if (!candidate) return null;
  const applications = candidate.applications;
  const bestFit = Math.max(0, ...applications.map((application) => application.fitScore ?? 0));
  const profileFields = [candidate.phone, candidate.location, candidate.education, candidate.experience, candidate.portfolioUrl, candidate.githubUrl, candidate.linkedinUrl, candidate.resumes.length > 0];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const pendingAssessments = applications.flatMap((application) => application.attempts).filter((attempt) => !attempt.submittedAt).length;
  const upcomingInterviews = applications.flatMap((application) => application.interviews).filter((interview) => interview.status === "SCHEDULED" && interview.scheduledAt >= new Date()).length;
  const pendingOffers = applications.flatMap((application) => application.offers).filter((offer) => offer.status === "SENT").length;

  return <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="page-header"><div><p className="page-eyebrow">Candidate workspace</p><h1 className="page-title">Welcome, {user.name}</h1><p className="page-description">Track what is happening next in each application without treating an internal score as a judgment of your overall ability.</p></div></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Profile readiness" value={`${profileCompletion}%`} progress={profileCompletion} detail="Profile details that can support applications"/><MetricCard kind="fit" label="Strongest role alignment" value={alignmentLabel(bestFit)} detail="Based only on evidence currently available"/><MetricCard kind="evidence" label="Pending verification" value={String(pendingAssessments)} detail="Assessments that can add evidence"/><MetricCard kind="decision" label="Interviews / offers" value={`${upcomingInterviews} / ${pendingOffers}`} detail="Upcoming interviews / open offers"/></div>
    <section className="surface-card mt-6 p-5"><p className="section-kicker">Next actions</p><h2 className="section-heading mt-1">Keep your applications moving</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><Action href="/candidate/assessments" title="Complete verification" text="Assessments can add evidence for criteria that are still unverified."/><Action href="/candidate/applications" title="Review application progress" text="See stage, evaluated evidence, interviews, and next actions."/><Action href="/candidate/offers" title="Review offers" text="Download and respond to active offer letters."/></div></section>
    <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-900"><strong>How to read DrishtiRecruit:</strong> missing or weak evidence means the system has not seen enough proof yet. It does not mean you lack the underlying ability.</div>
  </main>;
}
function Action({ href, title, text }: { href: string; title: string; text: string }) { return <Link href={href} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"><p className="font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p></Link>; }
