# DrishtiRecruit v1.3 — Submission readiness

## v1.2 integrity evidence
- Decision Integrity Audit on every recruiter application.
- AI Transparency ledger at `/recruiter/ai-transparency`.
- SHA-256 DecisionTrace evidence snapshot integrity surfaced in the PDF evidence packet.

## Core judge path
The repository contains an end-to-end path from recruiter-approved job criteria through resume evidence, controlled verification, structured interview evidence, DecisionTrace, offer, and candidate response.

## Submission artifacts
- GitHub-ready source tree
- `.env.example`
- README / local setup
- architecture documentation
- Mermaid ER diagram
- OpenAPI 3.1 specification
- Postman collection
- Dockerfile + Docker Compose
- GitHub Actions CI
- seeded test accounts
- compliance matrix
- validation/security QA reports
- 4–5 minute demo sequence

## Final acceptance commands
Run on a networked machine before submission:

```bash
cp .env.example .env
# Replace JWT_SECRET and TWO_FACTOR_ENCRYPTION_KEY with strong random values.
docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:validate
npm run db:migrate
npm run db:seed
npm run qa:static
npm run submission:preflight
npm run typecheck
npm test
npm run build
```

Then run the complete role walkthrough in `FINAL_DEMO_FLOW.md`.

## v1.0 bonus hardening
- Requirement-governance guard prevents obvious sensitive-trait criteria from entering automated scoring approval.
- Forward-only forced-stage policy prevents late assessments/analysis from regressing or reopening terminal applications.
- DecisionTrace and terminal hiring decision transition are committed atomically.
- Resume history, active-device management, production verification-email resend, and recruiter-approved interview-question drafts are implemented.
- TOTP two-factor authentication with encrypted-at-rest secret, one-time recovery codes, login challenge and audit logging.
- Google OAuth still requires DrishtiRecruit's second factor when 2FA is enabled.
- Installable PWA manifest/service worker. The worker never caches `/api/*` and does not pre-cache personalized authenticated pages.

## Remaining intentionally unclaimed production work
DrishtiRecruit is a hackathon-grade production-shaped prototype, not a validated employment decision system. Real deployment still requires legal/privacy review, fairness validation and monitoring, committed database migration history, distributed rate limiting, secure object storage/malware scanning, observability/load testing, independent accessibility/security review, and a sandbox service if untrusted code execution is added.
