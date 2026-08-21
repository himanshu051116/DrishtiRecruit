# DrishtiRecruit v1.4

DrishtiRecruit is an evidence-coverage Applicant Tracking System built for DevFusion 4.O Problem Statement 2.

Instead of reducing a candidate to one opaque score, DrishtiRecruit separates:

- **Fit Score** — how strongly current evidence aligns with recruiter-approved role criteria.
- **Evidence Coverage** — how much usable, provenance-backed evidence exists for those criteria.
- **Decision Coverage** — whether required criteria have been sufficiently evaluated for a human hiring decision.


## v1.4 seamless frontend release

v1.4 is a frontend-first release. It introduces a role-based application shell, mobile navigation, breadcrumbs, semantic design tokens, a signature Decision Workspace, a requirement-by-evidence matrix, accessible Kanban controls, focused candidate comparison, recruiter action queues, recruiter-friendly Assessment Studio controls, candidate-safe score language, dark-mode hardening, and removal of development/demo copy from judged surfaces. The backend decision model is unchanged; the interface now makes Requirement → Evidence → Gap → Verification → Human Decision the primary visual language. See `docs/V1_4_FRONTEND_RELEASE.md`.

## v1.3 runtime-acceptance release

v1.3 freezes product scope and adds the final acceptance harness: explicit Prisma 7 `dotenv` packaging, runtime preflight, dependency-backed build orchestration, readiness probing, and five-role Chromium QA. See `docs/RUNTIME_ACCEPTANCE.md`. The current build container cannot resolve the npm registry, so dependency-backed acceptance remains explicitly **blocked**, not falsely marked as passed.

## v1.2 decision-integrity release

v1.2 adds a **Decision Integrity Audit** and a privacy-preserving **AI Execution Ledger** on top of the v1.1 Decision Evidence Packet. Every AI/heuristic execution can now be inspected by purpose/provider/model/prompt version/fallback state while only SHA-256 input/output hashes are retained in the ledger—not copies of candidate or job text.

Each recruiter application page now checks requirement governance, evidence linkage/provenance, coverage freshness, DecisionTrace snapshot hashes, workflow consistency and AI-run provenance. New DecisionTrace records store a SHA-256 hash of their evidence snapshot, and the Decision Evidence Packet reports whether that snapshot still matches the stored hash.

Use **Decision evidence PDF** for the portable evidence record, **Decision integrity audit** for structural checks, and `/recruiter/ai-transparency` for the AI execution ledger.


## Flagship architecture

```text
Job description
  -> RequirementGraph
  -> recruiter approval
  -> resume evidence extraction
  -> EvidenceLedger
  -> Fit / Evidence Coverage / Decision Coverage
  -> Controlled VerifyLoop
  -> standardized/reusable assessment or structured interview
  -> new evidence
  -> coverage recalculation
  -> DecisionTrace
  -> human decision
  -> offer / candidate response
```

## v1.0 competition release


### v1.0 release hardening
- Public `/jobs` discovery page now lists only roles still accepting applications.
- Application submission and job publication enforce application deadlines server-side; an `OPEN` status can no longer bypass an expired deadline.
- Candidate Privacy Center provides a self-service JSON export and an auditable account-deletion request/cancellation workflow.
- Admin retention operations now preview and prune expired **operational** records (used/expired auth tokens, expired/revoked sessions, old delivered/failed email rows, and old read notifications) while deliberately preserving applications, EvidenceLedger, DecisionTrace, and audit history.
- `/api/ready` checks database reachability, writable resume storage, and required production configuration; the full-stack Docker healthcheck now uses readiness rather than database-only liveness.
- Version metadata is centralized at `src/lib/version.ts`.

### ATS foundation
- Email/password authentication, short-lived password reset, and optional Google OAuth.
- Email-verification token flow and signed database-backed sessions.
- Candidate, Recruiter, Hiring Manager, Interviewer and Admin RBAC.
- Company/tenant isolation, audit logs and device-session revocation foundation.
- Job CRUD, recruiter-approved criteria and candidate application workflow.
- Candidate profile editor, job filters and global recruiter search.
- Recruiter and candidate dashboard surfaces.
- Editable company profile including website, description, social links and offices.
- Drag/drop Kanban with validated stage transitions and persistent stage history.

### Resume + evidence intelligence
- PDF/DOCX upload, 10 MB limit, file-signature validation and SHA-256 duplicate detection.
- Resume text extraction and provenance-aware evidence mapping.
- RequirementGraph, EvidenceLedger and deterministic Fit/Evidence/Decision Coverage calculations.
- Missing, weak, partial, verified and conflicting criterion states.
- Optional structured AI adapter with deterministic local heuristic fallback.

### Controlled verification + Assessment Studio
- VerifyLoop prioritizes unresolved high-value criteria.
- Standardized question bank preserves comparability.
- Recruiter **Assessment Studio** creates reusable MCQ, coding/pseudocode, SQL, debugging and practical assessments.
- Questions can link directly to recruiter-approved job criteria and write evidence back into the same EvidenceLedger.
- Once an assessment is assigned to any candidate, its content and duration are locked to prevent silent test drift between candidates.
- Candidate timed assessment runner with deterministic hackathon grading and debounced server-side draft autosave.
- Assessment results become verified evidence and automatically recalculate coverage.
- Assessment analytics cover completion, score, verification method, linked criteria and tab-switch monitoring signals.
- High-overlap free-text/code responses to the same question are surfaced as a **manual similarity review signal** using normalized token shingles; the system does not automatically label plagiarism or misconduct.

### Interview scheduling + self-scheduling
- Hiring team can schedule criterion-driven interviews directly.
- Interviewers/hiring team can publish future availability windows.
- Overlapping availability and overlapping scheduled interviews are rejected.
- Candidate can self-select an open same-company interview slot from My Applications.
- Slot booking uses a serializable transaction, re-checks interviewer conflicts and atomically claims the slot.
- Directly scheduled interviews remove overlapping unbooked availability to prevent stale slots.
- Configurable interview duration and downloadable `.ics` calendar invite.
- Criterion-driven interview kit targets unresolved evidence rather than repeating already-covered topics.
- Structured interviewer scorecards become evidence and recalculate Decision Coverage.

### Decision + comparison
- Candidate comparison matrix shows Fit, Evidence Coverage and Decision Coverage side-by-side.
- Hiring Manager/Admin DecisionTrace with immutable evidence snapshot.
- Incomplete-coverage override requires a reason.
- DrishtiRecruit never auto-hires or auto-rejects.

### Offers + notifications
- Offer composer after human proceed-to-offer decision.
- Generated downloadable PDF offer.
- Candidate accept/decline flow.
- Accepted offer moves application to HIRED and records stage history.
- In-app workflow notifications and notification inbox.
- Provider-agnostic transactional email outbox; configure `EMAIL_WEBHOOK_URL` for actual delivery.

### Analytics + administration
- Hiring funnel and stage counts.
- Time-to-hire from stage-event history.
- Offer acceptance rate and candidate-source breakdown.
- DrishtiRecruit-specific evidence-gap and evaluation-redundancy analytics.
- Tenant-scoped CSV recruiting export.
- Admin control center now manages users, organization metadata, job publication state, assessment active state, platform settings, transactional email queue and audit history.
- Platform setting can enable/disable candidate self-scheduling at runtime.
- Public company careers pages.
- Dark/light theme, global toast viewport, route loading skeleton and error boundary.
- OpenAPI 3.1 document, Postman collection, Mermaid ER diagram and explicit PS-2 compliance matrix.
- Standalone Next.js Dockerfile, full Docker Compose stack and GitHub Actions validation workflow.

### v0.8 adversarial QA + deployment hardening
- Server-authoritative assessment deadlines: after time expires, only previously autosaved answers can be graded.
- Race-safe application stage changes and atomic offer acceptance prevent incompatible concurrent workflow updates.
- Offer PDFs now enforce least privilege: unrelated same-company interviewers cannot access salary-bearing documents.
- Interview calendar access is limited to the candidate, assigned interviewer, Recruiter/Hiring Manager in the owning company, or Admin.
- Evidence Matrix API no longer exposes recruiter-level candidate evidence to arbitrary same-company interviewers.
- Completed interview scorecards are immutable and may evaluate only the criteria included in that interview kit.
- External URLs are restricted to `http://` / `https://`; executable schemes such as `javascript:` and `data:` are rejected.
- CSV exports neutralize spreadsheet-formula injection from candidate/company-controlled text.
- Password reset and email-verification tokens use atomic single-use claims under concurrency.
- Auth rate limiting no longer trusts proxy headers unless `TRUST_PROXY_HEADERS=true`; stale in-memory buckets are swept and 429 responses carry `Retry-After`.
- Global security headers disable framing/object embedding and tighten browser permissions/referrer behavior.
- AI provider calls have a 30-second timeout and can fail safely to deterministic extraction for demo resilience.
- Recruiting analytics now visualize Fit vs Evidence vs Decision Coverage and surface high-fit/low-evidence verification candidates.
- Performance indexes added for resume hashes, assessments, attempts, interviews, users, decisions and audit history.
- Full-stack Docker Compose now includes a schema-init service, persistent writable resume volume, app healthcheck and optional demo seed profile.
- `npm run qa:static` audits route auth/origin heuristics, OpenAPI route coverage, direct proxy-header usage and obvious embedded secrets.

### v0.9 account security + installability
- TOTP authenticator-app two-factor authentication for every role.
- Active device-session manager with last-seen timestamps, per-device revocation and logout-all-devices.
- Local password accounts re-verify the current password before beginning 2FA enrollment.
- TOTP secrets are AES-256-GCM encrypted at rest; deployment should provide a separate `TWO_FACTOR_ENCRYPTION_KEY`.
- One-time recovery codes are displayed once and stored as bcrypt hashes.
- Password and Google OAuth logins do not create a DrishtiRecruit session until the configured second factor succeeds.
- `/security` provides enrollment/disable controls and the lifecycle is audit logged.
- Installable PWA manifest, application icons and service worker. The service worker never caches `/api/*` and does not pre-cache personalized hiring pages.
- `npm run submission:preflight` checks the final artifact inventory, OpenAPI route consistency, PWA files and key safety assertions.

## Demo and API resources

- Demo accounts: `docs/DEMO_CREDENTIALS.md`
- API documentation UI: `/docs`
- OpenAPI 3.1 file: `/openapi.yaml`
- Postman collection: `/DrishtiRecruit.postman_collection.json`
- Liveness endpoint: `/api/health`
- Readiness endpoint: `/api/ready`

## Local setup

Requirements: Node.js 22+, Docker Desktop or a local PostgreSQL server.

```bash
cp .env.example .env
# Set a >=32-character JWT_SECRET and a separate >=32-character TWO_FACTOR_ENCRYPTION_KEY.
docker compose up -d postgres
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run qa:static
npm run submission:preflight
npm run dev
```

Then open `http://localhost:3000`.

For the production-shaped Docker topology, set `JWT_SECRET` in `.env` and run:

```bash
docker compose -f docker-compose.full.yml up --build
```

To run the one-shot demo seed service as well:

```bash
docker compose -f docker-compose.full.yml --profile demo up --build
```

The full stack initializes the database schema before the app becomes healthy and persists uploaded resumes in a named volume. `prisma db push` is used only as a hackathon/bootstrap convenience; a real production release should commit migrations and use `prisma migrate deploy`.

Seed accounts all use `DrishtiRecruit123!` unless you change the seed:

- `recruiter@tracehire.local`
- `manager@tracehire.local`
- `interviewer@tracehire.local`
- `candidate@tracehire.local` (Priya — high fit, incomplete coverage)
- `arjun@tracehire.local` (Arjun — evidence-rich comparison candidate)
- `meera@tracehire.local` (Meera — multiple gaps)
- `admin@tracehire.local`

## Recommended v1.2 demo entry points

- `/recruiter/applications/<applicationId>` — evidence matrix + VerifyLoop + decision workflow.
- `/recruiter/assessments` — reusable Assessment Studio.
- `/recruiter/interviews/availability` — interviewer availability and candidate self-scheduling.
- `/candidate/applications` — application status + slot booking.
- `/candidate/assessments` — assigned assessment runner.
- `/interviewer/interviews` — criterion-driven interview kits and scorecards.
- `/admin` — users, companies, jobs, assessments and platform controls.
- `/recruiter/ai-transparency` — privacy-preserving AI/heuristic execution ledger.

See `docs/FINAL_DEMO_FLOW.md` for the recommended 4–5 minute story.

## Google OAuth

Set:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
APP_URL="http://localhost:3000"
```

The callback URL is `${APP_URL}/api/auth/google/callback`. Existing users are matched only by a Google-verified email; a new Google user is created as a Candidate.

## AI mode

Default:

```env
AI_PROVIDER="heuristic"
```

Optional structured provider mode:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="..."
OPENAI_MODEL="..."
AI_FALLBACK_TO_HEURISTIC="true"
```

Recruiter approval remains a hard boundary: model-proposed criteria do not affect scoring until explicitly approved. Provider calls time out after 30 seconds; unless `AI_FALLBACK_TO_HEURISTIC=false`, extraction falls back to the deterministic demo path instead of blocking the workflow.

## Storage note

`RESUME_STORAGE_DIR` is a local-development adapter. Replace it with private object storage before any multi-instance or production deployment.

## Deliberate limits

v1.2 does **not** claim scientifically validated hiring weights, autonomous candidate rejection, production-grade remote code sandboxing, automatic plagiarism verdicts, legal e-signature support, or production-ready fairness certification. Coding/SQL/debugging tasks are currently graded through deterministic rubrics rather than executing untrusted candidate code. A real hiring deployment would additionally need calibrated validation, bias monitoring, privacy/legal review, automated legally scoped candidate-record deletion, production observability/alerting, load testing, centralized rate limiting and secure object storage.


## Judge / submission quick links
- `docs/JUDGE_GUIDE.md` — fastest product evaluation path
- `docs/RUBRIC_MAPPING.md` — PS-2 judging-weight mapping
- `docs/FINAL_DEMO_FLOW.md` — 4–5 minute demonstration sequence
- `docs/PS2_COMPLIANCE_MATRIX.md` — requirement-by-requirement status
- `docs/VALIDATION_REPORT.md` — exactly what was and was not validated
