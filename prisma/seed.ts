import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const PASSWORD = "DrishtiRecruit123!";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_DEMO_SEED !== "true") {
  throw new Error("Refusing destructive demo seed in production. Set ALLOW_DESTRUCTIVE_DEMO_SEED=true only for an intentional disposable demo database.");
}

async function createCandidate(name: string, email: string, passwordHash: string, skills: string[], resumeText: string) {
  const user = await prisma.user.create({ data: { name, email, passwordHash, role: "CANDIDATE", emailVerifiedAt: new Date() } });
  const candidate = await prisma.candidateProfile.create({ data: { userId: user.id, location: "Bengaluru", skills } });
  const resume = await prisma.resume.create({ data: { candidateId: candidate.id, fileUrl: `inline://${email}`, fileName: `${name.toLowerCase().replaceAll(" ", "-")}-resume.txt`, mimeType: "text/plain", parsedText: resumeText } });
  return { user, candidate, resume };
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await prisma.aiRun.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.decisionRecord.deleteMany();
  await prisma.applicationStageEvent.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.interviewAvailabilitySlot.deleteMany();
  await prisma.interviewScorecard.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.verificationItem.deleteMany();
  await prisma.criterionEvaluation.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({ data: { name: "Northstar Systems", industry: "Software", size: "51-200", description: "B2B software company building secure cloud products.", website: "https://example.com", socialLinks: ["https://www.linkedin.com"], officeLocations: ["Bengaluru", "Remote"] } });
  const recruiter = await prisma.user.create({ data: { name: "Riya Recruiter", email: "recruiter@drishtirecruit.local", passwordHash, role: "RECRUITER", companyId: company.id, emailVerifiedAt: new Date() } });
  const manager = await prisma.user.create({ data: { name: "Harsh Hiring Manager", email: "manager@drishtirecruit.local", passwordHash, role: "HIRING_MANAGER", companyId: company.id, emailVerifiedAt: new Date() } });
  const interviewer = await prisma.user.create({ data: { name: "Ira Interviewer", email: "interviewer@drishtirecruit.local", passwordHash, role: "INTERVIEWER", companyId: company.id, emailVerifiedAt: new Date() } });
  await prisma.user.create({ data: { name: "DrishtiRecruit Admin", email: "admin@drishtirecruit.local", passwordHash, role: "ADMIN", emailVerifiedAt: new Date() } });

  const job = await prisma.job.create({
    data: {
      companyId: company.id, createdById: recruiter.id, title: "Backend Engineer", department: "Engineering", location: "Bengaluru / Hybrid", employmentType: "Full Time", workMode: "Hybrid", status: "OPEN", deadline: new Date(Date.now() + 30 * 86_400_000),
      description: "Build secure Node.js REST APIs using PostgreSQL. Docker experience is important. Security design and clear communication are must-have requirements. AWS is preferred.",
      requirements: { create: [
        { name: "Node.js", category: "TECHNICAL_SKILL", priority: "MUST_HAVE", weight: .22, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "PostgreSQL", category: "TECHNICAL_SKILL", priority: "MUST_HAVE", weight: .18, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "REST API Design", category: "COMPETENCY", priority: "MUST_HAVE", weight: .18, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "Docker", category: "TECHNICAL_SKILL", priority: "IMPORTANT", weight: .14, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "Security Design", category: "COMPETENCY", priority: "MUST_HAVE", weight: .13, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "Communication", category: "COMMUNICATION", priority: "MUST_HAVE", weight: .10, minimumEvidenceLevel: "MEDIUM", verificationRequired: true, aiGenerated: true, recruiterApproved: true },
        { name: "AWS", category: "TECHNICAL_SKILL", priority: "PREFERRED", weight: .05, minimumEvidenceLevel: "WEAK", verificationRequired: false, aiGenerated: true, recruiterApproved: true },
      ] }
    }, include: { requirements: true }
  });
  const req = Object.fromEntries(job.requirements.map((item) => [item.name, item]));

  const priya = await createCandidate("Priya Sharma", "candidate@drishtirecruit.local", passwordHash, ["Node.js", "PostgreSQL", "Docker"], "Backend engineer with two years building Node.js and Express services. Built REST APIs backed by PostgreSQL and implemented authentication controls. Containerized development using Docker. Basic AWS exposure.");
  const arjun = await createCandidate("Arjun Rao", "arjun@drishtirecruit.local", passwordHash, ["Node.js", "PostgreSQL", "Docker", "Security"], "Backend engineer with production Node.js, PostgreSQL, REST design, Docker, security reviews, and AWS deployments. Led architecture reviews and stakeholder demos.");
  const meera = await createCandidate("Meera Iyer", "meera@drishtirecruit.local", passwordHash, ["JavaScript", "MongoDB"], "Full-stack developer focused on JavaScript and MongoDB with frontend-heavy experience. Some API work and cloud exposure.");

  const appPriya = await prisma.application.create({ data: { jobId: job.id, candidateId: priya.candidate.id, resumeId: priya.resume.id, stage: "ASSESSMENT", fitScore: 91, evidenceCoverage: 63, decisionCoverage: 45 } });
  const appArjun = await prisma.application.create({ data: { jobId: job.id, candidateId: arjun.candidate.id, resumeId: arjun.resume.id, stage: "HR_INTERVIEW", fitScore: 86, evidenceCoverage: 93, decisionCoverage: 94 } });
  const appMeera = await prisma.application.create({ data: { jobId: job.id, candidateId: meera.candidate.id, resumeId: meera.resume.id, stage: "RESUME_SCREENING", fitScore: 58, evidenceCoverage: 54, decisionCoverage: 38 } });

  const reusableAssessment = await prisma.assessment.create({
    data: {
      jobId: job.id,
      title: "Backend Evidence Verification",
      description: "Reusable recruiter-authored assessment linked to approved role requirements.",
      durationMin: 20,
      source: "RECRUITER",
      active: true,
      questions: { create: [
        { requirementId: req["PostgreSQL"].id, requirementName: "PostgreSQL", category: "TECHNICAL_SKILL", method: "SQL", difficulty: "MEDIUM", prompt: "Write a PostgreSQL query that returns each customer_id and total paid order value for completed orders, including only customers whose total exceeds 1000. Assume orders(customer_id, total_amount, status).", maxScore: 10, rubric: { type: "keyword", keywords: ["select", "customer_id", "sum", "group by", "having", "completed"], minimumHits: 5 } },
        { requirementId: req["Docker"].id, requirementName: "Docker", category: "TECHNICAL_SKILL", method: "PRACTICAL", difficulty: "MEDIUM", prompt: "Describe how you would containerize a Node.js service while keeping dependencies reproducible and avoiding unnecessary files in the image.", maxScore: 10, rubric: { type: "keyword", keywords: ["dockerfile", "package-lock", "npm ci", ".dockerignore", "multi-stage", "non-root"], minimumHits: 2 } },
        { requirementId: req["Security Design"].id, requirementName: "Security Design", category: "COMPETENCY", method: "PRACTICAL", difficulty: "MEDIUM", prompt: "Name and explain at least three controls you would use to protect a multi-user REST API from unauthorized access and abusive requests.", maxScore: 10, rubric: { type: "keyword", keywords: ["authorization", "authentication", "rate limit", "validation", "rbac", "csrf", "xss", "audit"], minimumHits: 3 } },
      ] },
    },
  });
  await prisma.assessmentAttempt.create({ data: { assessmentId: reusableAssessment.id, applicationId: appPriya.id, status: "ASSIGNED" } });

  const availabilityStarts = [
    { dayOffset: 1, hour: 15 },
    { dayOffset: 2, hour: 11 },
    { dayOffset: 2, hour: 16 },
  ];
  for (const item of availabilityStarts) {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + item.dayOffset);
    startsAt.setHours(item.hour, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 45 * 60_000);
    await prisma.interviewAvailabilitySlot.create({ data: { companyId: company.id, interviewerId: interviewer.id, createdById: recruiter.id, startsAt, endsAt, mode: "VIDEO", meetingUrl: "https://meet.example/drishtirecruit-demo" } });
  }

  await prisma.setting.createMany({ data: [
    { scope: "PLATFORM", scopeId: "GLOBAL", key: "candidateSelfSchedulingEnabled", value: true },
    { scope: "PLATFORM", scopeId: "GLOBAL", key: "maintenanceNotice", value: "" },
    { scope: "PLATFORM", scopeId: "GLOBAL", key: "dataRetentionDays", value: 365 },
  ] });

  const statusData: Array<{ appId: string; name: string; status: "VERIFIED"|"PARTIAL"|"WEAK"|"MISSING"|"OPTIONAL"; fit: number; coverage: number; sources: number }> = [
    { appId: appPriya.id, name: "Node.js", status: "VERIFIED", fit: 95, coverage: 96, sources: 2 }, { appId: appPriya.id, name: "PostgreSQL", status: "VERIFIED", fit: 92, coverage: 91, sources: 2 }, { appId: appPriya.id, name: "REST API Design", status: "PARTIAL", fit: 90, coverage: 68, sources: 1 }, { appId: appPriya.id, name: "Docker", status: "WEAK", fit: 88, coverage: 34, sources: 1 }, { appId: appPriya.id, name: "Security Design", status: "PARTIAL", fit: 86, coverage: 61, sources: 1 }, { appId: appPriya.id, name: "Communication", status: "MISSING", fit: 0, coverage: 0, sources: 0 }, { appId: appPriya.id, name: "AWS", status: "OPTIONAL", fit: 45, coverage: 25, sources: 1 },
    { appId: appArjun.id, name: "Node.js", status: "VERIFIED", fit: 90, coverage: 100, sources: 3 }, { appId: appArjun.id, name: "PostgreSQL", status: "VERIFIED", fit: 87, coverage: 96, sources: 2 }, { appId: appArjun.id, name: "REST API Design", status: "VERIFIED", fit: 88, coverage: 96, sources: 3 }, { appId: appArjun.id, name: "Docker", status: "VERIFIED", fit: 84, coverage: 94, sources: 2 }, { appId: appArjun.id, name: "Security Design", status: "VERIFIED", fit: 86, coverage: 93, sources: 2 }, { appId: appArjun.id, name: "Communication", status: "VERIFIED", fit: 82, coverage: 91, sources: 2 }, { appId: appArjun.id, name: "AWS", status: "VERIFIED", fit: 78, coverage: 88, sources: 2 },
    { appId: appMeera.id, name: "Node.js", status: "PARTIAL", fit: 62, coverage: 58, sources: 1 }, { appId: appMeera.id, name: "PostgreSQL", status: "MISSING", fit: 0, coverage: 0, sources: 0 }, { appId: appMeera.id, name: "REST API Design", status: "PARTIAL", fit: 65, coverage: 52, sources: 1 }, { appId: appMeera.id, name: "Docker", status: "MISSING", fit: 0, coverage: 0, sources: 0 }, { appId: appMeera.id, name: "Security Design", status: "WEAK", fit: 40, coverage: 28, sources: 1 }, { appId: appMeera.id, name: "Communication", status: "PARTIAL", fit: 75, coverage: 60, sources: 1 }, { appId: appMeera.id, name: "AWS", status: "OPTIONAL", fit: 50, coverage: 35, sources: 1 },
  ];
  for (const item of statusData) {
    const requirement = req[item.name];
    await prisma.criterionEvaluation.create({ data: { applicationId: item.appId, requirementId: requirement.id, fitScore: item.fit, evidenceCoverage: item.coverage, supportScore: item.fit / 100, contradictionScore: 0, status: item.status, evidenceCount: item.sources, independentSourceCount: item.sources } });
    const sources = ["RESUME", "ASSESSMENT", "INTERVIEW"].slice(0, item.sources) as Array<"RESUME"|"ASSESSMENT"|"INTERVIEW">;
    for (const sourceType of sources) await prisma.evidenceItem.create({ data: { applicationId: item.appId, requirementId: requirement.id, sourceType, sourceExcerpt: `${sourceType} evidence for ${item.name}`, strength: item.coverage >= 80 ? "STRONG" : item.coverage >= 50 ? "MEDIUM" : "WEAK", confidence: .9, supportsRequirement: true, verified: sourceType !== "RESUME", verificationMethod: sourceType === "ASSESSMENT" ? "PRACTICAL" : sourceType === "INTERVIEW" ? "INTERVIEW" : null } });
  }

  for (const [applicationId, stage] of [[appPriya.id, "ASSESSMENT"], [appArjun.id, "HR_INTERVIEW"], [appMeera.id, "RESUME_SCREENING"]] as const) {
    await prisma.applicationStageEvent.create({ data: { applicationId, fromStage: "APPLIED", toStage: stage, actorId: recruiter.id, reason: "Seeded demo progression" } });
  }
  await prisma.notification.create({ data: { userId: priya.user.id, type: "ASSESSMENT_ASSIGNED", title: "Backend Engineer: assessment assigned", body: "Backend Evidence Verification is ready in your candidate portal." } });

  console.log("DrishtiRecruit v1.1 demo seeded");
  console.log(`Recruiter: recruiter@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Candidate A: candidate@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Candidate B: arjun@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Candidate C: meera@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Manager: manager@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Interviewer: interviewer@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Admin: admin@drishtirecruit.local / ${PASSWORD}`);
  console.log(`Job ID: ${job.id}`);
}

main().finally(async () => prisma.$disconnect());
