# DrishtiRecruit Architecture — v1.3

## Product invariant
AI assists interpretation and coverage analysis; final hiring decisions remain human-owned.

## Core evidence architecture

```text
Job Description
      |
      v
RequirementGraph ---- recruiter approval boundary
      |
      v
Resume / Portfolio / Assessment / Interview
      |
      v
EvidenceLedger
      |
      +----> Fit Score
      +----> Evidence Coverage
      +----> Decision Coverage
      |
      v
Coverage Gap
      |
      +----> Controlled VerifyLoop
      |           |
      |           +---- standardized/reusable assessment
      |           +---- criterion-driven interview
      |
      v
New Evidence -> Recalculation -> DecisionTrace -> Human Decision
```

## v0.7 assessment architecture
Recruiter-authored assessments are job-scoped and can link each question to a recruiter-approved requirement. The grading pathway is deterministic in the hackathon build. Once an assessment has been assigned to any candidate, question content and timing become immutable so later candidates are not silently evaluated against a changed test.

## v0.7 scheduling architecture

```text
Interviewer / hiring team
      |
      v
Availability Slot
      |
      +---- overlap check against published availability
      +---- overlap check against scheduled interviews
      |
      v
Candidate chooses slot
      |
      v
Serializable transaction
      |
      +---- re-check slot still open
      +---- re-check interviewer conflict
      +---- create interview
      +---- atomically claim slot
      |
      v
Stage event + notifications + ICS
```

Direct recruiter scheduling also checks interviewer overlap and removes overlapping unbooked availability so stale slots are not shown to candidates.

## AI may
- propose requirements;
- extract resume facts and evidence spans;
- map evidence semantically to approved requirements;
- draft assessment/interview questions;
- summarize interview notes.

## Deterministic code controls
- authentication/RBAC;
- application state;
- scoring arithmetic;
- decision coverage;
- assessment grading in the hackathon build;
- assessment immutability after assignment;
- verification approval;
- interview slot booking/concurrency control;
- decision records;
- audit history.

## Guardrails
- do not score protected/sensitive traits;
- absence of evidence is not proof of inability;
- contradictory evidence is an inconsistency, not proof of deception;
- AI-proposed criteria cannot affect scoring until recruiter approval;
- use standardized or locked reusable assessments for comparability;
- tab switches are monitoring signals, not automatic misconduct findings;
- final hiring authority remains with an authorized human.

## v0.8 reliability and concurrency boundaries

- Application-stage changes use optimistic stage predicates inside a transaction; stale concurrent transitions return 409.
- Offer acceptance uses a serializable transaction and atomically commits both offer state and `OFFER -> HIRED` history.
- Candidate assessment time is derived on the server from the persisted start timestamp; the browser countdown is presentation only.
- Interview scorecards are finalized once and restricted to criteria included in the generated interview kit.
- External user-controlled URLs are HTTP(S)-only.
- AI provider calls are time-bounded and may fall back to deterministic extraction; permissions, workflow state and final decision logic remain deterministic application responsibilities.

## v0.9 authentication boundary

When 2FA is enabled, successful password verification or Google OAuth does **not** create an application session immediately:

```text
Primary authentication
  -> short-lived HttpOnly 2FA challenge
  -> TOTP / one-time recovery code
  -> challenge cleared
  -> database-backed DrishtiRecruit session
```

TOTP secrets are encrypted before database storage. Recovery codes are bcrypt-hashed and consumed one time. A local-password account must re-enter its current password before beginning 2FA enrollment.

## v0.9 PWA boundary

The service worker exists only for installability and a safe offline shell. It excludes `/api/*`, does not pre-cache personalized routes, and never intentionally persists candidate/assessment/decision responses. Sensitive application behavior remains network-bound.


## v1.2 integrity and AI provenance layer

```text
AI / heuristic interpretation
        |
        +--> AiRun ledger
        |      provider / model / prompt version
        |      status / fallback / duration
        |      SHA-256(input) / SHA-256(output)
        |      no duplicated raw resume/job text
        |
        v
EvidenceLedger --> CriterionEvaluation --> DecisionCoverage
                                      |
                                      v
                               DecisionTrace
                                      |
                                      +--> canonical evidence snapshot SHA-256
                                      |
                                      v
                             Decision Integrity Audit
```

The integrity audit deliberately returns independent PASS/WARN/FAIL checks rather than another composite model score. It checks structure and provenance, not whether a hiring decision is substantively correct or legally compliant.
