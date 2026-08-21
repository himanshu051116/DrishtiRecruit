# DrishtiRecruit ER diagram — v1.3

The Prisma schema is the source of truth. This diagram highlights the main recruitment, evidence, assessment and scheduling relationships used in the demo.

```mermaid
erDiagram
  COMPANY ||--o{ USER : employs
  COMPANY ||--o{ JOB : owns
  COMPANY ||--o{ INTERVIEW_AVAILABILITY_SLOT : publishes
  USER ||--o{ JOB : creates
  USER ||--o| CANDIDATE_PROFILE : has
  USER ||--o{ INTERVIEW_AVAILABILITY_SLOT : interviewer
  CANDIDATE_PROFILE ||--o{ RESUME : uploads
  JOB ||--o{ JOB_REQUIREMENT : defines
  JOB ||--o{ APPLICATION : receives
  JOB ||--o{ ASSESSMENT : owns
  CANDIDATE_PROFILE ||--o{ APPLICATION : submits
  RESUME ||--o{ APPLICATION : supports
  APPLICATION ||--o{ EVIDENCE_ITEM : contains
  JOB_REQUIREMENT ||--o{ EVIDENCE_ITEM : evaluates
  APPLICATION ||--o{ CRITERION_EVALUATION : derives
  JOB_REQUIREMENT ||--o{ CRITERION_EVALUATION : maps
  APPLICATION ||--o{ VERIFICATION_ITEM : plans
  JOB_REQUIREMENT ||--o{ VERIFICATION_ITEM : targets
  VERIFICATION_ITEM ||--o| ASSESSMENT_ATTEMPT : triggers
  ASSESSMENT ||--o{ ASSESSMENT_QUESTION : contains
  ASSESSMENT ||--o{ ASSESSMENT_ATTEMPT : assigned
  ASSESSMENT_ATTEMPT ||--o{ ASSESSMENT_ANSWER : records
  APPLICATION ||--o{ INTERVIEW : schedules
  USER ||--o{ INTERVIEW : conducts
  INTERVIEW ||--o| INTERVIEW_AVAILABILITY_SLOT : books
  INTERVIEW ||--o{ INTERVIEW_SCORECARD : records
  JOB_REQUIREMENT ||--o{ INTERVIEW_SCORECARD : scores
  APPLICATION ||--o{ APPLICATION_STAGE_EVENT : tracks
  APPLICATION ||--o{ DECISION_RECORD : preserves
  APPLICATION ||--o{ AI_RUN : traces_analysis
  USER ||--o{ DECISION_RECORD : owns
  APPLICATION ||--o{ OFFER_LETTER : produces
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUTH_SESSION : authenticates
  USER ||--o{ ACTIVITY_LOG : acts
  SETTING }o--|| COMPANY : optional_scope
```

## Evidence backbone
`JOB_REQUIREMENT -> EVIDENCE_ITEM -> CRITERION_EVALUATION` is the core DrishtiRecruit relationship. Resume, assessment and interview modules all write evidence against the same recruiter-approved criterion. Decision Coverage is derived from those criterion evaluations rather than stored as an opaque model judgment.

## AI provenance backbone
`AI_RUN` stores operational metadata plus SHA-256 hashes of model/heuristic inputs and outputs. Raw candidate/job text is deliberately not duplicated into this ledger. `DECISION_RECORD.evidenceSnapshotSha256` makes the historical DecisionTrace snapshot tamper-evident within the application data model.

## Scheduling backbone
`INTERVIEW_AVAILABILITY_SLOT -> INTERVIEW` is one-to-one only after a candidate books a slot. Unbooked slots remain available; booked slots retain their relation for auditability.
