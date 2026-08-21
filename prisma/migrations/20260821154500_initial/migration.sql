-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CANDIDATE', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('MUST_HAVE', 'IMPORTANT', 'PREFERRED');

-- CreateEnum
CREATE TYPE "RequirementCategory" AS ENUM ('TECHNICAL_SKILL', 'EXPERIENCE', 'EDUCATION', 'COMPETENCY', 'COMMUNICATION', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('RESUME', 'PORTFOLIO', 'ASSESSMENT', 'INTERVIEW', 'RECRUITER', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "EvidenceStrength" AS ENUM ('WEAK', 'MEDIUM', 'STRONG');

-- CreateEnum
CREATE TYPE "CriterionStatus" AS ENUM ('VERIFIED', 'PARTIAL', 'WEAK', 'MISSING', 'CONFLICTING', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('MCQ', 'CODING', 'SQL', 'DEBUGGING', 'PRACTICAL', 'INTERVIEW', 'HUMAN_REVIEW', 'DOCUMENT_CHECK');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('RECOMMENDED', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('APPLIED', 'RESUME_SCREENING', 'SHORTLISTED', 'ASSESSMENT', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HumanDecision" AS ENUM ('HIRE', 'REJECT', 'HOLD');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletionRequestedAt" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretEncrypted" TEXT,
    "twoFactorRecoveryCodeHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "description" TEXT,
    "socialLinks" JSONB,
    "officeLocations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "salaryMin" DECIMAL(65,30),
    "salaryMax" DECIMAL(65,30),
    "experienceText" TEXT,
    "employmentType" TEXT,
    "workMode" TEXT,
    "deadline" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequirement" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "RequirementCategory" NOT NULL,
    "priority" "RequirementPriority" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "minimumEvidenceLevel" "EvidenceStrength" NOT NULL,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "recruiterApproved" BOOLEAN NOT NULL DEFAULT false,
    "interviewQuestion" TEXT,
    "interviewQuestionSource" TEXT,
    "interviewQuestionApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "education" JSONB,
    "experience" JSONB,
    "skills" TEXT[],
    "certifications" JSONB,
    "portfolioUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "coverLetter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "parsedText" TEXT,
    "sha256" TEXT,
    "storageKey" TEXT,
    "sizeBytes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "extracted" JSONB NOT NULL,
    "modelName" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeId" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'APPLIED',
    "source" TEXT NOT NULL DEFAULT 'CAREERS_PAGE',
    "fitScore" DOUBLE PRECISION,
    "evidenceCoverage" DOUBLE PRECISION,
    "decisionCoverage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceExcerpt" TEXT,
    "strength" "EvidenceStrength" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "supportsRequirement" BOOLEAN NOT NULL DEFAULT true,
    "contradictsRequirement" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" "VerificationMethod",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionEvaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fitScore" DOUBLE PRECISION NOT NULL,
    "evidenceCoverage" DOUBLE PRECISION NOT NULL,
    "supportScore" DOUBLE PRECISION NOT NULL,
    "contradictionScore" DOUBLE PRECISION NOT NULL,
    "status" "CriterionStatus" NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "independentSourceCount" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CriterionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'RECRUITER',
    "version" INTEGER NOT NULL DEFAULT 1,
    "versionGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "requirementId" TEXT,
    "requirementName" TEXT,
    "category" "RequirementCategory" NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "rubric" JSONB,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verificationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "score" DOUBLE PRECISION,
    "graderNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "meetingUrl" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "kit" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'VIDEO',
    "meetingUrl" TEXT,
    "bookedInterviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewScorecard" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "evidenceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "templateId" TEXT,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "approvedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLetter" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "salary" DECIMAL(65,30),
    "joiningDate" TIMESTAMP(3),
    "location" TEXT,
    "benefits" JSONB,
    "pdfUrl" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStageEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "systemRecommendation" TEXT,
    "decisionCoverage" DOUBLE PRECISION NOT NULL,
    "evidenceSnapshot" JSONB NOT NULL,
    "humanDecision" "HumanDecision" NOT NULL,
    "decisionOwnerId" TEXT NOT NULL,
    "override" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "evidenceSnapshotSha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "jobId" TEXT,
    "applicationId" TEXT,
    "actorId" TEXT,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL,
    "inputSha256" TEXT NOT NULL,
    "outputSha256" TEXT,
    "status" TEXT NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER NOT NULL,
    "errorClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL DEFAULT 'GLOBAL',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_role_isActive_idx" ON "User"("companyId", "role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_usedAt_idx" ON "EmailVerificationToken"("userId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_usedAt_idx" ON "PasswordResetToken"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "EmailMessage_status_createdAt_idx" ON "EmailMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_recipient_createdAt_idx" ON "EmailMessage"("recipient", "createdAt");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Job_companyId_status_idx" ON "Job"("companyId", "status");

-- CreateIndex
CREATE INDEX "JobRequirement_jobId_priority_idx" ON "JobRequirement"("jobId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "Resume_candidateId_isActive_idx" ON "Resume"("candidateId", "isActive");

-- CreateIndex
CREATE INDEX "Resume_candidateId_sha256_idx" ON "Resume"("candidateId", "sha256");

-- CreateIndex
CREATE INDEX "Application_jobId_stage_idx" ON "Application"("jobId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_candidateId_key" ON "Application"("jobId", "candidateId");

-- CreateIndex
CREATE INDEX "EvidenceItem_applicationId_requirementId_idx" ON "EvidenceItem"("applicationId", "requirementId");

-- CreateIndex
CREATE INDEX "EvidenceItem_requirementId_sourceType_idx" ON "EvidenceItem"("requirementId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionEvaluation_applicationId_requirementId_key" ON "CriterionEvaluation"("applicationId", "requirementId");

-- CreateIndex
CREATE INDEX "Assessment_versionGroupId_version_idx" ON "Assessment"("versionGroupId", "version");

-- CreateIndex
CREATE INDEX "Assessment_jobId_active_idx" ON "Assessment"("jobId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_verificationId_key" ON "AssessmentAttempt"("verificationId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_applicationId_status_idx" ON "AssessmentAttempt"("applicationId", "status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_applicationId_idx" ON "AssessmentAttempt"("assessmentId", "applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_attemptId_questionId_key" ON "AssessmentAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Interview_interviewerId_status_scheduledAt_idx" ON "Interview"("interviewerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Interview_applicationId_status_idx" ON "Interview"("applicationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAvailabilitySlot_bookedInterviewId_key" ON "InterviewAvailabilitySlot"("bookedInterviewId");

-- CreateIndex
CREATE INDEX "InterviewAvailabilitySlot_companyId_startsAt_idx" ON "InterviewAvailabilitySlot"("companyId", "startsAt");

-- CreateIndex
CREATE INDEX "InterviewAvailabilitySlot_interviewerId_startsAt_idx" ON "InterviewAvailabilitySlot"("interviewerId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewScorecard_interviewId_requirementId_key" ON "InterviewScorecard"("interviewId", "requirementId");

-- CreateIndex
CREATE INDEX "VerificationItem_applicationId_status_idx" ON "VerificationItem"("applicationId", "status");

-- CreateIndex
CREATE INDEX "OfferLetter_applicationId_status_idx" ON "OfferLetter"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ApplicationStageEvent_applicationId_createdAt_idx" ON "ApplicationStageEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationStageEvent_toStage_createdAt_idx" ON "ApplicationStageEvent"("toStage", "createdAt");

-- CreateIndex
CREATE INDEX "DecisionRecord_applicationId_createdAt_idx" ON "DecisionRecord"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_companyId_createdAt_idx" ON "AiRun"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_jobId_createdAt_idx" ON "AiRun"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_applicationId_createdAt_idx" ON "AiRun"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_purpose_createdAt_idx" ON "AiRun"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_scope_scopeId_key_key" ON "Setting"("scope", "scopeId", "key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequirement" ADD CONSTRAINT "JobRequirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "JobRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionEvaluation" ADD CONSTRAINT "CriterionEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionEvaluation" ADD CONSTRAINT "CriterionEvaluation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "JobRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "JobRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "VerificationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAvailabilitySlot" ADD CONSTRAINT "InterviewAvailabilitySlot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAvailabilitySlot" ADD CONSTRAINT "InterviewAvailabilitySlot_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAvailabilitySlot" ADD CONSTRAINT "InterviewAvailabilitySlot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAvailabilitySlot" ADD CONSTRAINT "InterviewAvailabilitySlot_bookedInterviewId_fkey" FOREIGN KEY ("bookedInterviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "JobRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "JobRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageEvent" ADD CONSTRAINT "ApplicationStageEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageEvent" ADD CONSTRAINT "ApplicationStageEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionRecord" ADD CONSTRAINT "DecisionRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionRecord" ADD CONSTRAINT "DecisionRecord_decisionOwnerId_fkey" FOREIGN KEY ("decisionOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
