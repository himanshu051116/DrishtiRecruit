# Validation Report — DrishtiRecruit v1.3

## Checks performed in this build environment

v1.1 preserves the earlier adversarial hardening and adds atomic requirement publication, duplicate-criterion protection, multi-page decision evidence export, and a version-agnostic release gate.

Validated without downloading npm dependencies:

- TypeScript/TSX parser scan using the locally installed TypeScript parser: **228 files across src/tests/prisma, 0 syntax diagnostics**.
- local relative/`@/` import-resolution scan: **0 unexpected missing imports** (generated Prisma client excluded intentionally).
- API route inventory and OpenAPI route coverage via `npm run qa:static` / `node scripts/static-qa.mjs`: **68 API routes, static QA passed**.
- mutation-route same-origin heuristic scan.
- protected-route explicit auth heuristic scan.
- direct `x-forwarded-for` usage scan.
- obvious embedded live-secret heuristic scan.
- Prisma schema structural/model/index checks.
- OpenAPI/Postman JSON/YAML synchronization checks.
- Docker Compose / GitHub Actions YAML parsing.
- assessment deadline, CSV safety, stage policy, scheduling policy and access-policy smoke tests: **passed**.
- access-policy smoke tests for offer PDFs and interview calendars.
- scheduling/stage/scoring unit-test source remains included.

## v0.8 regression targets

The new tests cover:
- exact assessment deadline behavior;
- never-negative remaining time;
- candidate/recruiter/hiring-manager/admin offer access;
- explicit denial of unrelated same-company Interviewer offer access;
- assigned-vs-unassigned Interviewer calendar access;
- HTTP(S)-only external URL validation;
- spreadsheet-formula neutralization in CSV exports.

## Dependency-backed validation limitation

`npm install --ignore-scripts --no-audit --no-fund` / npm-registry reachability was retried in this environment and failed because the registry could not be resolved/reached (`EAI_AGAIN` / prior timeouts). Therefore this archive does **not** claim a successful dependency-backed run of:

```bash
npm run prisma:generate
npm run prisma:validate
npm run typecheck
npm test
npm run build
```

No partial `node_modules` directory is included in the final package.

## Required local acceptance gate

```bash
cp .env.example .env
# Set JWT_SECRET and TWO_FACTOR_ENCRYPTION_KEY to strong random values.

docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:validate
npm run db:migrate
npm run db:seed
npm run qa:static
npm run typecheck
npm test
npm run build
npm run dev
```

Then manually exercise:
1. Recruiter job + role-criteria approval.
2. Candidate application + PDF/DOCX resume upload.
3. Evidence analysis and provenance matrix.
4. Verification-plan assessment assignment.
5. Assessment autosave and normal submit.
6. Server-deadline behavior using an expired seeded/test attempt.
7. Candidate interview self-booking and conflicting-slot rejection.
8. Assigned Interviewer scorecard and unrelated-interviewer denial paths.
9. Hiring Manager DecisionTrace and incomplete-coverage override reason.
10. Offer PDF access by Candidate/Recruiter and denial for Interviewer.
11. Offer acceptance, HIRED stage history, and duplicate/concurrent response protection.
12. Recruiting analytics distributions/review queue.
13. `/api/health`, `/api/ready`, `/docs`, `/openapi.yaml`, and Postman import.
14. Application deadline rejection after expiry and public jobs hiding expired roles.
15. Candidate privacy export/deletion-request flow and Admin retention preview/cleanup.

## Production limitations still intentionally unclaimed

- remote sandbox execution of untrusted candidate code;
- plagiarism engine;
- autonomous candidate rejection;
- protected-trait inference, emotion/personality scoring, or facial analysis;
- direct Google/Microsoft calendar write;
- production object-storage/malware-scanning adapter;
- formal e-signature/legal offer workflow;
- distributed rate limiting;
- committed database migration history (full-stack demo bootstrap currently uses `prisma db push`);
- formal fairness validation, employment-law/privacy review, independent accessibility/security audit, load testing, centralized observability/alerting, and legally scoped candidate-record deletion enforcement.


## v0.9 additional regression targets
- forced-stage regression / terminal-reopen protection.
- recruiter requirement-governance guard for obvious sensitive-trait criteria.
- DecisionTrace + HIRE/REJECT atomic workflow transaction.
- TOTP generation/verification window and encrypted-secret round trip.
- one-time recovery-code handling.
- login challenge before session creation when 2FA is enabled.
- PWA service worker excludes `/api/*` and does not pre-cache the personalized root route.
- OpenAPI covers all v0.9 API route files.
- `npm run submission:preflight` validates required submission artifacts.


## v1.0 release regression targets
- public/candidate career discovery excludes roles after their application deadline;
- server rejects candidate application after the deadline even if job status remains `OPEN`;
- recruiter cannot publish an already-expired job;
- candidate privacy export is owner-scoped and does not expose other candidates;
- candidate deletion requests are audit logged and reversible before reviewed processing;
- generic retention cleanup deletes only expired operational records and explicitly reports `candidateHiringRecordsDeleted: 0`;
- `/api/ready` checks database, writable resume storage, and required production configuration;
- `npm run qa:source` checks local import resolution, `use client` directive placement, version consistency, and public OpenAPI/Postman synchronization;
- `npm run qa:release` composes static QA, source integrity, and submission preflight.
- public `/api/jobs` projection review: anonymous callers receive only OPEN/unexpired jobs, approved public requirements, and no application-count/tenant-management leakage.
- conservative same-question answer-similarity logic is treated only as a manual review signal; no automatic plagiarism/misconduct classification.


## v1.1 release regression targets
- `npm run qa:release` passes with 69 documented API routes.
- Decision PDF smoke generates a three-page PDF and preserves the last evidence line.
- Requirement publication persists the current editor state and opens the job in one serializable transaction.
- Duplicate requirement names are rejected before publication.
- Extracted requirement drafts are de-duplicated and re-normalized before persistence.
- Full dependency-backed Next/Prisma/Vitest validation remains required on a networked runner.


## v1.2 source-level validation
- `npm run qa:release`: **PASS**.
- Static API/security QA: **70 API routes**, OpenAPI inventory complete.
- Source-integrity QA: **220 TS/TSX application source files**, local import/version/public-doc synchronization checks passed.
- TypeScript transpile syntax scan across `src + tests + prisma`: **237 files, 0 syntax diagnostics** using the available global TypeScript parser.
- Canonical JSON / SHA-256 smoke: **PASS** for key-order stability and content-change sensitivity.
- PDF smoke: **PASS**, three pages.
- Submission preflight: **PASS**, 17 required artifact checks.
- Dependency-backed Prisma generation/validation, complete TypeScript typecheck, Vitest suite and Next production build remain pending because npm-registry access is unavailable in this execution environment.


## v1.3 runtime-acceptance attempt

- `npm run qa:release`: PASS.
- Source transpile parse: 237 TS/TSX files, 0 syntax diagnostics.
- `npm run runtime:preflight`: Node/npm/Chromium present.
- Dependency installation: BLOCKED because DNS lookup for `registry.npmjs.org` returns `EAI_AGAIN`.
- PostgreSQL runtime: BLOCKED because no `DATABASE_URL`/local database is configured in this container.
- Full `prisma generate -> validate -> typecheck -> vitest -> next build -> PostgreSQL -> browser` acceptance is therefore not claimed.

One packaging issue was fixed during the attempt: `prisma.config.ts` imports `dotenv/config`, so v1.3 now declares `dotenv` explicitly.
