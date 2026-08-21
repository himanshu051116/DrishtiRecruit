# Security Notes — v1.3

## Implemented controls

- bcrypt password hashing (cost 12)
- HTTP-only signed session cookie with production `secure` flag and SameSite=Lax
- database-backed session revocation and logout-all-devices
- role-based and company/tenant authorization on protected resources
- candidate ownership checks for resume/application operations
- same-origin + Fetch Metadata checks on state-changing endpoints
- Zod validation for API input
- rate-limit foundation with explicit trusted-proxy configuration
- email-verification and password-reset tokens stored as hashes and claimed atomically once
- private resume-storage adapter, file-signature validation, size limit and duplicate SHA-256 detection
- HTTP(S)-only external URL validation
- CSV spreadsheet-formula injection neutralization
- audit logs for sensitive actions
- server-authoritative assessment deadlines
- race-safe application stages and offer acceptance
- assignment-scoped Interviewer access and least-privilege offer/calendar policies
- security response headers that disable framing/object embedding and limit referrer/browser capabilities

## v0.9 two-factor authentication

DrishtiRecruit now supports TOTP authenticator-app 2FA for every account role.

- password accounts must re-enter the current password before starting enrollment;
- the TOTP secret is encrypted at rest with AES-256-GCM;
- use a separate `TWO_FACTOR_ENCRYPTION_KEY` in deployment; `JWT_SECRET` is only a fallback key source for development;
- enrollment must be confirmed with a valid six-digit TOTP before activation;
- one-time recovery codes are displayed once and stored only as bcrypt hashes;
- a used recovery code is removed transactionally;
- login does not create an authenticated application session until the second factor succeeds;
- Google OAuth users with DrishtiRecruit 2FA enabled must also complete the DrishtiRecruit second factor;
- enable/disable/login events are audit logged.

## v0.9 PWA cache posture

The service worker exists for installability and a safe offline shell only. It intentionally:

- never intercepts `/api/*` requests;
- does not pre-cache `/`, dashboards, candidate records, offers, assessments or other personalized routes;
- serves `/offline` when a navigation fails;
- caches only the offline page, manifest and application icons.

Sensitive hiring data should not be made available offline through this worker.

## Prototype controls that still require production upgrades

### Rate limiting
The current limiter is process-local memory. Replace with a centralized store such as Redis for multi-instance deployment.

### Email delivery
A transactional outbox/webhook adapter exists; a production provider, delivery signing/monitoring and bounce handling remain deployment responsibilities.

### File storage
PDF/DOCX validation and local private storage exist. Production requires private object storage, malware scanning, retention enforcement and access logging.

### Database lifecycle
Hackathon bootstrap can use `prisma db push`. Production releases should commit migrations and deploy them through a controlled migration pipeline.

### Assessment code execution
Coding/SQL/debugging items use deterministic rubric-based verification. DrishtiRecruit does not execute untrusted candidate code in the web application process. A separate sandbox service would be required.

### Hiring-model validation
Prototype scoring constants are not scientific estimates of candidate ability and must not be presented as validated accuracy. Real deployment requires calibration, bias/fairness testing, monitoring, privacy/employment-law review, and human governance.

See `SECURITY_QA_REPORT.md` for the v0.8 adversarial findings and `SUBMISSION_READINESS.md` for the final acceptance gate.
