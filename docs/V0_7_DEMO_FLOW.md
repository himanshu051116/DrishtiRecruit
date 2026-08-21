# DrishtiRecruit v0.7 demo flow

Target: 4–5 minutes. The goal is to show a state change, not a tour of every page.

## 1. Recruiter starts with a candidate who looks strong but is under-verified
Open the seeded Backend Engineer application for Priya.

Show:
- Fit Score is comparatively high.
- Evidence Coverage is lower.
- Decision Coverage remains incomplete.
- At least one must-have criterion is weak/missing.

Key sentence: **A high match is not the same thing as a well-supported hiring decision.**

## 2. Show reusable Assessment Studio
Open `/recruiter/assessments`.

Demonstrate:
- a job-level assessment can contain MCQ, SQL, debugging, coding/pseudocode or practical tasks;
- a question can link to an approved requirement;
- once candidates are assigned the assessment, its questions/timing become locked for comparability.

Return to Priya and assign the reusable assessment.

## 3. Candidate completes verification
Log in as the candidate and complete the assigned test.

Return to the recruiter evidence matrix and show the linked criterion receiving assessment evidence and recalculated coverage.

## 4. Candidate self-schedules interview
As recruiter/interviewer, open `/recruiter/interviews/availability` and publish a future 45-minute slot.

As candidate, open My Applications and book that slot.

Explain the engineering point briefly:
- overlapping interviewer availability is rejected;
- the booking is atomically claimed;
- the booking service re-checks interviewer conflicts before committing.

## 5. Interview closes remaining evidence gap
Open interviewer workspace, use the criterion-driven kit, and submit a structured scorecard with observable evidence.

Return to the recruiter application and show Decision Coverage increasing again.

## 6. Human decision and DecisionTrace
Open the Hiring Manager view.

Show:
- system readiness state;
- unresolved/conflicting criteria if any;
- final decision remains human-owned;
- incomplete-coverage override requires a written reason;
- DecisionTrace keeps the evidence snapshot that existed at decision time.

End with:

**DrishtiRecruit does not simply ask who appears to match. It asks whether enough traceable, comparable evidence exists to support the decision, and it helps the hiring team close exactly the gaps that remain.**
