# PS-2 requirement compliance matrix — DrishtiRecruit v1.3

Legend: **Implemented**, **Implemented / simplified execution**, **Deferred bonus**.

| PS-2 area | v1.2 status | DrishtiRecruit implementation |
|---|---|---|
| Job management | Implemented | create/edit/close/delete jobs, recruiter-approved RequirementGraph, public discovery, deadline-aware publication/application gate |
| Candidate management | Implemented | candidate profile, applications, resume library, search |
| PDF/DOCX resume upload | Implemented | validated private upload, duplicate hash checks, text extraction |
| AI resume parsing | Implemented | heuristic fallback + structured provider adapter |
| AI candidate/job matching | Implemented | deterministic Fit + provenance-aware evidence mapping |
| Requirement governance | Implemented safety layer | obvious sensitive-trait criteria are blocked from recruiter approval into automated scoring; recruiter-approved job-related criteria remain the only scoring inputs |
| Match %, missing skills, strengths, weaknesses, recommendations | Implemented | Evidence Matrix + criterion state + VerifyLoop |
| Application pipeline | Implemented | Kanban + validated stages + immutable stage-event history |
| Interview scheduling | Implemented | recruiter direct scheduling plus candidate self-scheduling from interviewer availability; notifications + downloadable ICS |
| Candidate schedule interviews | Implemented | atomic candidate slot booking from same-company published availability |
| Recruiter/interviewer availability | Implemented | future slots, overlap prevention, conflict re-check at booking |
| AI-generated interview questions | Implemented bonus | optional structured AI drafts per approved requirement, deterministic fallback templates, and explicit recruiter approval before use in interview kits |
| Coding assessment authoring | Implemented / simplified execution | recruiter Assessment Studio creates MCQ, coding/pseudocode, SQL, debugging and practical tasks; no remote untrusted-code sandbox |
| Standardized verification | Implemented | VerifyLoop bank plus reusable recruiter assessments |
| Assessment comparability | Implemented | once an assessment is assigned, content/timing mutation is blocked; one-click version cloning preserves historical attempts and creates an editable inactive successor |
| Timer / autosubmit | Implemented | candidate assessment timer, debounced server-side draft autosave and expiry submission |
| Tab-switch detection | Implemented | visibility-change counts; explicitly not an automatic misconduct finding |
| Test analytics | Implemented | completion, scores, methods, requirements, tab-switch monitoring |
| Interview feedback | Implemented | criterion-linked 1–5 scorecards and evidence notes |
| Offer letters | Implemented | offer data, PDF, candidate accept/reject |
| Email system | Implemented | transactional outbox/webhook adapter + direct recruiter messages |
| Notifications | Implemented | application/assessment/interview/offer/messages |
| Global search | Implemented | candidates/jobs/companies/workspace/interviews |
| Reports & analytics | Implemented | funnel, time-to-hire, source, offer, evidence gaps, redundancy, assessment analytics, CSV export |
| Decision evidence export | Implemented flagship support | multi-page PDF packet with Fit/Evidence/Decision Coverage, criterion provenance, assessments, interviews, workflow history and latest human decision context |
| Decision integrity audit | Implemented flagship support | PASS/WARN/FAIL structural checks for criterion governance, evidence provenance/linkage, evaluation freshness, DecisionTrace snapshot integrity and workflow consistency |
| AI execution transparency | Implemented governance layer | hashed input/output provenance, provider/model/prompt version, duration and fallback state without duplicating raw candidate/job text |
| Company profile | Implemented | editable profile + public careers page |
| Landing page | Implemented | hero, features, demo testimonial layout, pricing shell, FAQ, contact/footer, SEO metadata |
| UI/UX foundation | Implemented | responsive Tailwind UI, dark/light theme, loading skeleton, error boundary, toast system, keyboard focus states, reduced-motion support |
| Admin panel | Implemented | user roles/active state, companies, job publication states, assessment active state, platform settings, audit log and email outbox |
| Google OAuth | Implemented | OAuth start/callback with state protection |
| Email verification | Implemented | hashed single-use 30-minute token, transactional email outbox/webhook delivery, public confirmation page and rate-limited resend flow |
| Session / device management | Implemented | database-backed sessions, active-device list, per-device revocation, logout current session and logout all devices |
| 2FA | Implemented bonus | TOTP authenticator-app enrollment, encrypted secret storage, one-time recovery codes, login challenge, password re-verification for local enrollment and audit logging |
| Calendar integration | Implemented / simplified execution | `.ics` calendar export and internal self-scheduling; direct Google/Microsoft calendar write remains deferred |
| Plagiarism detection | Implemented / conservative review signal | same-question long-answer token-shingle similarity surfaces high-overlap pairs for human review; DrishtiRecruit does **not** label this as plagiarism or misconduct automatically |
| PWA / multilingual | PWA implemented / multilingual deferred | installable manifest, icons, service worker and safe offline shell; personalized/API hiring data is intentionally not cached |
| Docker/CI-CD | Implemented configuration | standalone Next.js Dockerfile, full Docker Compose topology and GitHub Actions validation workflow; dependency-backed build still needs to pass on a networked runner |
| API documentation | Implemented | OpenAPI file + internal API contracts + Postman collection |

## Flagship beyond baseline
DrishtiRecruit adds RequirementGraph, EvidenceLedger, Decision Coverage, controlled VerifyLoop and DecisionTrace. It also closes two practical hiring-process gaps: reusable comparable assessments and candidate slot-based interview self-scheduling. These are integrated into the same evidence and workflow architecture rather than added as disconnected demos.

## v0.8 QA hardening notes
- **Assessment timer:** server-authoritative deadline; late request payloads cannot extend candidate working time.
- **Interview privacy:** Interviewer access is assignment-scoped; salary-bearing offer PDFs remain unavailable to Interviewers.
- **Concurrency:** application stage changes and offer acceptance use guarded/serializable transactions.
- **Exports:** CSV formula injection is neutralized.
- **External links:** candidate/company/meeting URLs permit only HTTP(S).
- **Deployment:** full-stack Compose initializes schema, persists resume files at the configured path, and exposes an application healthcheck.
- **Analytics:** explicit Fit vs Evidence vs Decision Coverage distributions and high-fit/low-evidence review queue reinforce the flagship distinction.


## v0.9 final-competition additions
- TOTP 2FA is now a real bonus feature rather than a deferred claim.
- PWA installability is present, with an intentionally conservative cache policy for hiring data.
- `npm run submission:preflight` checks final submission artifacts, OpenAPI route inventory, PWA files and key safety assertions.

## v0.9 workflow integrity additions
- Internal forced transitions are forward-only and cannot reopen `HIRED`/`REJECTED` records.
- Late evidence recalculation can update coverage without regressing a candidate to an earlier pipeline stage.
- DecisionTrace + HIRE/REJECT stage change commit atomically.
- Destructive demo seed is refused in production unless explicitly enabled for a disposable database.


## v1.0 release hardening
- Public jobs/careers hide expired application deadlines and submission is rejected server-side after the deadline.
- Candidate Privacy Center supports own-data JSON export and auditable deletion requests without pretending that generic deletion is legally safe.
- Admin retention cleanup is intentionally limited to expired operational records; EvidenceLedger, DecisionTrace, applications and audit history are preserved.
- `/api/ready` adds deployment-readiness checks for database, resume storage and required production configuration.


## v1.1 integrity additions
- Requirement edits, recruiter approval and job publication now commit atomically; an unsaved local edit cannot be silently omitted during publish.
- Duplicate criterion names are blocked before publication and extracted requirement drafts are de-duplicated before persistence.
- Decision evidence packets provide a portable, auditable view of the flagship without collapsing evidence into a single score.


## v1.2 integrity additions
- New DecisionTrace evidence snapshots are SHA-256 hashed using canonical JSON and can be checked for later mismatch.
- AI-assisted/heuristic execution is traceable without storing a second copy of resume/job text in the AI ledger.
- The integrity audit deliberately reports separate checks instead of inventing another opaque composite trust score.
