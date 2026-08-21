# DrishtiRecruit v0.8 — adversarial security & workflow QA

This report records high-value issues found while reviewing v0.7 and the corresponding v0.8 fixes. It is a hackathon engineering review, not a claim of independent penetration testing or production certification.

## Fixed in v0.8

### 1. Interviewer access to salary-bearing offer PDFs
**Finding:** the v0.7 offer PDF route treated any same-company user as a company member, which meant an unrelated Interviewer could fetch an offer PDF containing salary data if they learned the offer ID.

**Fix:** offer-document policy now permits only the candidate owner, same-company Recruiter/Hiring Manager, or Admin. This aligns with PS-2's interviewer restriction around salary information.

### 2. Same-company interviewer could fetch unrelated interview calendars / Evidence Matrix API
**Finding:** same-company membership was broader than assignment-level interviewer access.

**Fix:** calendar access now permits only the candidate, assigned interviewer, same-company Recruiter/Hiring Manager, or Admin. Evidence Matrix API is recruiter/hiring-manager/admin only; interviewers receive their purpose-built interview kit instead.

### 3. Client timer was not an authoritative assessment deadline
**Finding:** a modified client could continue sending answers after the UI timer elapsed because the server checked only `startedAt`/`submittedAt`.

**Fix:** the server derives the deadline from `startedAt + durationMin`. Draft writes after the deadline are rejected. A late submit can finalize the attempt, but request-body changes after the deadline are ignored; only already-autosaved answers are graded.

### 4. Concurrent stage updates could record incompatible histories
**Finding:** v0.7 read the current application stage before a transaction and then wrote the new stage without an optimistic stage predicate.

**Fix:** stage mutation now uses `updateMany({ id, stage: observedStage })` inside the transaction. If another action wins the race, the loser gets HTTP 409 and does not append an incorrect stage event.

### 5. Concurrent offer responses
**Finding:** two near-simultaneous accept/reject requests could both observe `SENT` before either update completed.

**Fix:** offer response uses a serializable transaction and conditionally claims `status=SENT`. Offer acceptance and `OFFER -> HIRED` stage history are committed atomically.

### 6. Re-decision after terminal hiring state
**Finding:** forced DecisionTrace transitions could theoretically record another decision after `HIRED` or `REJECTED`.

**Fix:** terminal applications reject further hiring-decision creation.

### 7. Interview feedback scope drift
**Finding:** the interviewer service accepted any approved job requirement, not only the criteria present in the generated interview kit, and a completed scorecard could be resubmitted.

**Fix:** only kit-linked requirement IDs can be scored, and completed interview scorecards are immutable.

### 8. External URL scheme validation
**Finding:** generic URL validation can consider schemes such as `javascript:` or `data:` syntactically valid URLs.

**Fix:** user-controlled external links (company/candidate links, interview links) now accept only HTTP/HTTPS.

### 9. Spreadsheet formula injection in CSV export
**Finding:** candidate/company-controlled strings beginning with `=`, `+`, `-`, `@`, tab or carriage-return could become formulas when opened in spreadsheet software.

**Fix:** exported cells are spreadsheet-neutralized before RFC-style CSV quoting.

### 10. Password/email token reuse race
**Finding:** token read/check and token consumption were separate operations.

**Fix:** password-reset and email-verification tokens are now atomically claimed with `usedAt IS NULL AND expiresAt > now()` inside serializable transactions.

### 11. Proxy-header trust in rate limiting
**Finding:** auth endpoints used `x-forwarded-for` directly, which is spoofable when the deployment does not overwrite that header.

**Fix:** proxy headers are used only when `TRUST_PROXY_HEADERS=true`. Rate-limit buckets are periodically swept and 429 responses include `Retry-After`.

### 12. Deployment persistence/schema bootstrap
**Finding:** the Docker named volume was mounted at a path different from the app's default resume-storage path, and the full stack did not initialize a fresh database schema before starting the app.

**Fix:** runner and Compose use `/app/drishtirecruit-resumes`, the directory is writable by the non-root app user, and the full-stack topology includes a schema-init service plus app healthcheck. The current bootstrap uses `prisma db push` for hackathon convenience; production should use committed migrations.

## Browser hardening

`next.config.ts` now applies:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- strict referrer policy
- restrictive Permissions Policy
- COOP/CORP
- CSP directives for `base-uri`, `object-src`, `frame-ancestors`, and `form-action`
- disabled `X-Powered-By`

Mutation endpoints also reject `Sec-Fetch-Site: cross-site` requests and enforce configured same-origin checks when `Origin` is present.

## AI resilience / data-boundary hardening

- AI calls use a 30-second timeout.
- candidate inputs use `store: false` in the optional provider adapter.
- evidence excerpts must be traceable to actual resume text before being persisted.
- AI failure can fall back to deterministic extraction unless explicitly disabled.
- AI remains outside permissions, stage transitions, final scoring arithmetic, and human hiring decisions.

## Remaining production work

Not claimed as solved in v0.8:
- centralized/distributed rate limiting for multi-instance deployment;
- malware scanning and production private object storage;
- committed migration history and disaster recovery procedures;
- formal accessibility audit;
- load testing / observability / alerting;
- jurisdiction-specific privacy and employment-law review;
- validated fairness/bias study using representative data;
- independent security review;
- remote sandbox execution of untrusted candidate code.


## v0.9 workflow-integrity hardening
- `force` is no longer an unrestricted stage override: it permits forward-only progression (plus active-stage rejection) and never reopens terminal applications.
- Assessment assignment and interview scheduling are closed once an application reaches OFFER/HIRED/REJECTED; later evidence recalculation does not regress pipeline state.
- DecisionTrace creation and HIRE/REJECT stage movement now share a serializable transaction, preventing a durable decision record from being separated from its workflow transition.
- Requirement approval has a deterministic sensitive-trait governance guard. It is intentionally described as a product safeguard rather than statutory compliance.
- Destructive demo seeding is refused in production unless an explicit disposable-demo override is supplied.

## v1.0 release hardening

### Deadline bypass closed
A job carrying `status=OPEN` no longer implies it accepts applications forever. Candidate submission uses a server-side deadline check, public job discovery hides expired roles, and an already-expired job cannot be published as OPEN.

### Candidate privacy surface
Candidates can export only their own account/application/hiring-process data. Account deletion is recorded as an auditable request rather than immediately cascading through hiring records. The generic retention cleanup never deletes evidence records, decision traces, applications, or audit history.

### Operational retention boundaries
The Admin retention action is intentionally narrow: expired/used auth tokens, expired/revoked sessions, sufficiently old delivered/failed email outbox rows, and sufficiently old read notifications. This avoids a misleading claim that one global retention number can safely erase employment records across jurisdictions.

### Deployment readiness
`/api/health` remains a liveness-style database probe. `/api/ready` additionally verifies writable resume storage and required production configuration. The full-stack Docker healthcheck now uses readiness.

### Concurrent duplicate submission
Candidate application and registration routes translate Prisma unique-constraint races into stable 409 responses instead of leaking a generic server error.

### Public job API projection / deadline exposure
The public `GET /api/jobs` surface now returns only OPEN, unexpired roles and a deliberately limited public projection. Tenant-management fields and application counts are not exposed to anonymous callers. Approved requirements may be shown because they are part of the public job specification.

### Assessment similarity signal boundary
Long free-text/code responses to the same exact question can be compared using normalized token shingles to surface unusually high overlap. This is only a triage signal for manual review: it is not a plagiarism, cheating, or misconduct finding and does not autonomously change a hiring decision.


## v1.2 integrity hardening
- New DecisionTrace evidence snapshots are hashed with canonical JSON SHA-256 and rechecked when generating evidence packets/audits.
- AI/heuristic execution provenance stores hashes and operational metadata instead of a second raw copy of candidate/job content.
- Decision Integrity Audit detects evidence linked outside the approved role criteria, missing source excerpts, stale criterion calculations, snapshot hash mismatches and terminal workflow inconsistencies.
- Candidate privacy export includes AI execution metadata related to the candidate's own applications without exposing other applicants.
