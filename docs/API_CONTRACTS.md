# API Contract v0.1

Protected routes must enforce tenant + role checks.

- `POST /api/jobs` — create job.
- `POST /api/jobs/:id/requirements/extract` — AI creates **draft** requirements only.
- `PATCH /api/jobs/:id/requirements/:rid` — recruiter edits/approves requirement.
- `POST /api/jobs/:id/applications` — candidate applies.
- `POST /api/applications/:id/resume` — attach resume.
- `POST /api/applications/:id/analyse` — parse facts, extract evidence, map to approved requirements, recalculate scores.
- `GET /api/applications/:id/evidence-matrix` — fit + evidence coverage + decision coverage + provenance.
- `POST /api/applications/:id/verifications/plan` — ranked verification recommendations.
- `PATCH /api/verifications/:id` — recruiter approves/changes/skips recommendation.
- `POST /api/assessment-attempts/:id/submit` — grade, create evidence, recalculate coverage.
- `POST /api/interviews` — schedule interview.
- `GET /api/interviews/:id/kit` — unresolved criteria + approved questions.
- `POST /api/interviews/:id/scorecards` — feedback becomes evidence.
- `GET /api/applications/:id/decision-readiness` — decision coverage state.
- `POST /api/applications/:id/decisions` — stores immutable evidence snapshot + human decision.
- `POST /api/applications/:id/offers` — generate offer.

## v0.7 Assessment Studio

### `POST /api/assessments`
Create a reusable job-level assessment for the authenticated hiring team.

### `POST /api/assessments/:assessmentId/questions`
Add a question with:
- optional approved `requirementId`;
- method (`MCQ`, `CODING`, `SQL`, `DEBUGGING`, `PRACTICAL`);
- difficulty;
- prompt;
- deterministic rubric.

Once an assessment has any assigned attempt, content/timing mutations are rejected to preserve comparability.

### `POST /api/assessments/:assessmentId/assign`
Assign the reusable assessment to a candidate application for the same job.

### `PUT /api/assessment-attempts/:attemptId/answers`
Autosave candidate draft answers. Ownership, started-state and submitted-state checks are mandatory.

## v0.7 Candidate interview self-scheduling

### `POST /api/interview-slots`
Publish future interviewer availability. Overlap with existing availability and scheduled interviews is rejected.

### `GET /api/applications/:applicationId/interview-slots`
Candidate-only list of open slots for an owned application.

### `POST /api/applications/:applicationId/interview-slots/book`
Atomically claim an open slot in a serializable transaction, create the interview, write stage history and send notifications.

### `DELETE /api/interview-slots/:slotId`
Delete only an unbooked same-company availability slot.

## v0.7 Admin controls

### `PATCH /api/admin/settings`
Persist audited platform settings including candidate self-scheduling toggle and policy metadata.

### `PATCH /api/admin/companies/:companyId`
Update organization metadata.

### `PATCH /api/admin/jobs/:jobId`
Update job state while retaining the requirement-approval gate before `OPEN`.

### `PATCH /api/admin/assessments/:assessmentId`
Activate/deactivate an assessment without changing historical candidate attempts.

## v0.7 assessment versioning and operations

### `POST /api/assessments/:assessmentId/clone`
Creates the next inactive version of an existing tenant assessment and copies its questions/rubrics. Historical candidate attempts remain attached to the exact earlier version they received.

### `GET /api/health`
Public no-cache liveness/readiness-style endpoint. Reports application version and database reachability without connection details.


## Decision integrity

### `GET /api/applications/:applicationId/integrity-audit`
Authorized Recruiter/Hiring Manager/Admin endpoint returning independent checks for:
- recruiter-approved criterion structure;
- duplicate criterion names and positive weights;
- evidence linkage/provenance;
- criterion-evaluation freshness relative to latest evidence;
- DecisionTrace evidence-snapshot SHA-256 integrity;
- terminal workflow consistency;
- AI/heuristic execution provenance.

The response exposes operational AI metadata/hashes, not raw resume or job text from the AI ledger.
