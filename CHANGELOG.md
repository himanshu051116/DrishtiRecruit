# Changelog

## v1.4.0

- Replaced the horizontal mega-navigation with a role-based sidebar, contextual top bar, breadcrumbs, active states, mobile drawer, and skip navigation.
- Added semantic UI tokens for Fit, Evidence, Decision, state colors, surfaces, dark mode, and typography.
- Redesigned the recruiter candidate page into the signature Decision Workspace with readiness first, Evidence Matrix above the fold, and a sticky Next Best Action panel.
- Rebuilt the Evidence Matrix around Resume / Assessment / Interview provenance and verified-source indicators.
- Added accessible non-drag stage controls to Kanban and removed cryptic F/E/D card labels.
- Added candidate comparison filters, sorting, finalist pinning, and difference-focused status highlighting.
- Reframed recruiter dashboard around actionable work queues rather than generic KPIs.
- Rebuilt Requirement Editor as a compact criteria table plus focused details editor.
- Reworked Assessment Studio so recruiters choose correct answers and expected concepts without editing implementation-level rubric fields.
- Reframed candidate-facing scores as role alignment / evaluation evidence / hiring-process state.
- Removed hackathon/demo/local-development placeholder copy from product-facing pages.
- Added no-flash theme initialization, design-token dark mode, responsive shell behavior, and accessibility improvements.

## v1.3.0
- Added runtime acceptance/preflight automation and five-role Chromium CDP QA harness.
- Added explicit `dotenv` dependency required by `prisma.config.ts`.
- Added Prisma 7 seed configuration in `prisma.config.ts`.
- Added runtime acceptance documentation and blocker reporting.

## v1.2.0

- Added a privacy-preserving AI Execution Ledger: provider, model, purpose, prompt version, duration, fallback state and SHA-256 input/output hashes are recorded without copying candidate/job text into the ledger.
- Added recruiter/admin AI Transparency UI for inspecting recent requirement-extraction, resume-evidence and interview-question runs.
- Added Decision Integrity Audit with explicit PASS/WARN/FAIL checks for criterion governance, evidence linkage/provenance, calculation freshness, DecisionTrace snapshot integrity and terminal workflow consistency.
- Added SHA-256 hashing to new DecisionTrace evidence snapshots and surfaced integrity status in the Decision Evidence Packet.
- Added protected JSON integrity-audit API and application-level audit panel.
- Added canonical JSON hashing regression tests and updated OpenAPI/Postman/ER/submission documentation.

## v1.1.0

- Added multi-page Decision Evidence Packet PDF export with criterion-level provenance, assessment/interview history, workflow history, and latest DecisionTrace context.
- Replaced the two-step requirement approve/publish flow with one atomic recruiter action that persists current edits, validates governance, blocks duplicates, and publishes the job in a serializable transaction.
- Added server-side duplicate requirement protection at publication and de-duplication/weight re-normalization for extracted requirement drafts.
- Replaced version-hardcoded submission preflight checks with semantic-version validation and a stable `FINAL_DEMO_FLOW.md` artifact.
- Upgraded the dependency-free PDF helper to paginate long exports instead of overflowing one page.
- Clarified admin retention language as an operational-retention window rather than a generic legal policy placeholder.

## v1.0.0
- Added public deadline-aware job discovery and server-side application deadline enforcement.
- Added Candidate Privacy Center with own-data export and auditable deletion requests.
- Added conservative admin retention preview/cleanup for expired operational records while preserving hiring evidence and audit history.
- Added `/api/ready` deployment-readiness checks for database, writable resume storage, and required production configuration.
- Switched full-stack Docker healthcheck to readiness.
- Centralized release metadata and refreshed final judge/submission documentation.

## v0.9.0
- Added active-device session management with per-device revocation and logout-all support.
- Added production email-verification delivery/resend flow and single-active-token behavior.
- Added candidate resume version history with archive/reactivate controls while preserving historical application links.
- Added AI/system interview-question drafts with explicit recruiter approval before questions can enter interview kits.
- Added deterministic requirement-governance guard that blocks obvious sensitive-trait criteria from automated scoring approval. This is a product safeguard, not a legal-compliance claim.
- Hardened forced application transitions: internal workflow jumps are forward-only, cannot reopen terminal states, and late recalculation no longer moves candidates backwards.
- Made DecisionTrace creation and HIRE/REJECT workflow transition atomic in a serializable database transaction.
- Protected destructive demo seeding from accidental production execution.
- Added TOTP authenticator-app two-factor authentication with AES-GCM encrypted secrets, one-time recovery codes and a short-lived login challenge.
- Password accounts require current-password verification before starting 2FA enrollment; Google OAuth users with DrishtiRecruit 2FA enabled must still complete the second factor.
- Added Security UI and 2FA audit events.
- Added PWA manifest/icons/service worker and a privacy-conscious offline shell that does not cache API or personalized hiring data.
- Added final submission preflight automation plus v0.9 judge demo/readiness documentation.
- Expanded OpenAPI route inventory for the 2FA API surface.

## v0.8.0
- Added adversarial security/workflow QA fixes: least-privilege offer/calendar access, server-authoritative assessment deadlines, race-safe stages/offers, immutable kit-scoped interview feedback, HTTP(S)-only external URLs, CSV injection protection, and atomic single-use auth tokens.
- Added hardened proxy-aware rate limiting, browser security headers, AI timeout/fallback behavior, expanded performance indexes and static QA automation.
- Added Fit/Evidence/Decision Coverage distribution analytics and high-fit/low-evidence review queue.
- Hardened full-stack Docker topology with schema bootstrap, persistent writable resume storage and app healthcheck.
- Added `docs/SECURITY_QA_REPORT.md` and `docs/V0_8_DEMO_FLOW.md`.

## v0.7.0
- added recruiter Assessment Studio for reusable MCQ, coding/pseudocode, SQL, debugging and practical assessments
- linked recruiter-authored questions to approved job requirements so completed tests update EvidenceLedger/Decision Coverage
- locked assessment content and timing after first assignment to preserve candidate comparability
- added interviewer availability publishing with overlap validation
- added candidate interview self-scheduling with serializable atomic slot claiming and conflict re-checks
- added configurable interview duration and duration-aware ICS export
- direct interview scheduling now rejects overlap and clears conflicting unbooked availability
- expanded Admin control center to manage organizations, job states, assessment activation and platform settings
- added server-side draft answer autosave so candidate work survives refresh/network interruptions before final submission
- added runtime toggle for candidate self-scheduling and stored retention-policy configuration
- expanded OpenAPI/Postman/ER/compliance/demo documentation
- added explicit assessment version lineage and one-click cloning for locked comparable tests
- added public API documentation page, downloadable OpenAPI/Postman resources and database-aware health endpoint
- added complete seeded demo credentials for every product role

## v0.6.0
- added audited admin role/account-state management and immediate session revocation for deactivated users
- added recruiter-to-candidate transactional messaging
- added standards-based ICS interview calendar export
- added assessment analytics and richer coding/SQL/debugging assessment presentation
- expanded standardized question bank
- added public company careers pages
- added tenant-scoped CSV recruiting export
- improved focus/reduced-motion accessibility behavior and assessment timer UX
- added explicit PS-2 compliance matrix and v0.6 demo flow

## v0.5.0
- recruiter Kanban pipeline and stage-event history
- candidate comparison, offer workflow, notifications, analytics, Google OAuth and OpenAPI documentation
