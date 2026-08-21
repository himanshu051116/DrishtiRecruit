# Implementation Status — v1.3

## v1.2 decision-integrity additions
- Privacy-preserving AI Run Ledger for requirement extraction, resume evidence extraction and interview-question drafting.
- AI run records store provider/model/prompt version/duration/fallback state plus SHA-256 input/output hashes; raw candidate/job text is not duplicated into the ledger.
- Recruiter/Admin Processing History page with recent run provenance.
- Decision Integrity Audit checks approved criterion structure, evidence linkage/provenance, evaluation freshness, DecisionTrace snapshot hashes and terminal workflow consistency.
- New DecisionTrace records store `evidenceSnapshotSha256`; Decision Evidence Packets surface the integrity result.

## v1.1 release additions
- Multi-page Decision Evidence Packet export for recruiter/hiring-manager review.
- Atomic save + approve + publish workflow for job requirements.
- Duplicate extracted/published requirement protection and normalized relative draft weights.
- Version-agnostic submission preflight and stable `FINAL_DEMO_FLOW.md`.
- Paginated dependency-free text PDF utility for longer evidence reports.

## Implemented end-to-end
- email/password authentication, secure sessions, RBAC and email verification foundation
- optional Google OAuth login
- forgot/reset password with session revocation
- admin account activation/deactivation and role management with audit logging
- admin organization metadata, job state, assessment active-state and platform-setting controls
- company tenancy and public careers pages
- job CRUD and AI-assisted requirement drafts with recruiter approval
- candidate profiles, resume upload, PDF/DOCX text extraction and duplicate checks
- provenance-aware evidence records
- deterministic Fit, Evidence Coverage and Decision Coverage
- controlled verification planning with standardized verification
- recruiter Assessment Studio for reusable MCQ/coding/SQL/debugging/practical tests
- recruiter-created questions can link directly to approved job requirements
- assigned assessments are locked against content mutation; one-click version cloning preserves candidate comparability while enabling edits
- timer, draft-answer autosave, auto-submit, tab-switch monitoring and assessment analytics
- criterion-driven interview scheduling, downloadable ICS invites and scorecards
- interviewer availability publishing with overlap prevention
- candidate interview self-scheduling with atomic slot claiming and conflict re-checks
- configurable interview duration and calendar duration export
- human DecisionTrace with override reasons
- drag/drop application pipeline with stage history
- candidate comparison matrix
- offer generation, PDF export and candidate accept/decline
- notification inbox, recruiter-to-candidate messages and transactional email outbox/webhook delivery
- recruiting analytics, assessment analytics and CSV reporting
- candidate/recruiter dashboards, global search and company profile
- admin controls, outbox and audit log
- OpenAPI/API documentation, Postman collection, ER diagram and PS-2 compliance matrix
- Dockerized standalone deployment configuration and GitHub Actions CI workflow


## v1.0 release additions
- public `/jobs` discovery and deadline-aware careers listing;
- server-side application-deadline enforcement on application submission and job publication;
- candidate privacy export plus auditable deletion-request/cancellation workflow;
- administrator retention preview and conservative operational cleanup for expired tokens, sessions, old delivered/failed email rows and read notifications;
- readiness probe covering database, writable private resume storage and required production configuration;
- full-stack Docker healthcheck switched from liveness to readiness.

## v0.9 final-competition additions

- TOTP authenticator-app two-factor authentication with encrypted-at-rest secrets and one-time recovery codes.
- password re-verification before local-account 2FA enrollment; Google OAuth users with 2FA enabled still complete the DrishtiRecruit second factor.
- dedicated account Security page and auditable 2FA lifecycle.
- installable PWA manifest, icons, service-worker registration and safe offline shell; API and personalized hiring pages are intentionally not cached.
- submission preflight script and final judge demo/readiness documentation.
- OpenAPI inventory expanded to include the complete 2FA API surface.

## Still intentionally simplified
- direct Google/Microsoft Calendar write integration; v0.9 provides portable `.ics` invites and candidate slot booking
- production object storage/CDN
- remote sandboxed untrusted code execution; coding/SQL/debugging answers use deterministic rubric-based verification
- full plagiarism-classification engine; v1.0 only provides a conservative same-question similarity review signal
- production legal offer templates / e-signatures
- production transactional email provider; webhook adapter/outbox supplied
- candidate-record deletion is not automatic; v1.0 only performs conservative operational-record cleanup and records candidate deletion requests for reviewed handling

## Production hardening still required
Formal fairness validation, bias monitoring, legal/privacy review, calibrated thresholds, retention enforcement, accessibility testing, secure object storage, observability, load testing, centralized rate limiting and security review are required before real hiring deployment.

## Final v0.7 hardening

- Assessment version lineage + one-click cloning for locked comparable tests.
- Public `/docs`, complete 54/54 OpenAPI path inventory, downloadable Postman/OpenAPI files and `/api/health`.

## v0.8 adversarial QA / deployment hardening

Implemented in this pass:
- server-authoritative assessment deadline enforcement;
- race-safe application-stage transitions;
- atomic offer response + hire-stage commit;
- terminal-decision protection;
- least-privilege offer/calendar access;
- kit-scoped immutable interviewer feedback;
- HTTP(S)-only external links;
- CSV spreadsheet-injection mitigation;
- atomic one-time password/email tokens;
- proxy-aware rate-limit hardening + browser security headers;
- AI timeout/deterministic fallback;
- analytics distributions for Fit/Evidence/Decision Coverage;
- high-fit/low-evidence verification review queue;
- additional database indexes;
- Docker schema bootstrap, persistent writable resume storage and app healthcheck;
- static QA script and v0.8 security/demo documentation.


## v0.9 final integrity pass
- Stage-regression protection for internal forced transitions.
- Atomic DecisionTrace + HIRE/REJECT workflow transition.
- Sensitive-trait requirement governance at recruiter approval.
- Resume history, device-session controls, verification-email resend, recruiter-approved interview-question drafts.
- Production guard around destructive demo seed.
