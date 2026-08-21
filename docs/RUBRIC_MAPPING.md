# DrishtiRecruit v1.3 — DevFusion PS-2 Rubric Mapping

| Judging area | Weight | What to inspect in DrishtiRecruit |
|---|---:|---|
| Core Functionality | 30% | jobs, candidates, resume upload/parsing, application pipeline, assessments, interviews, notifications, offers, candidate portal, admin |
| AI Features & Innovation | 15% | suggested criteria, provenance-aware resume evidence, Decision Coverage, controlled verification planning, approved interview-question drafts, processing history |
| UI/UX Design | 15% | recruiter Evidence Matrix, comparison view, candidate portal, Assessment Studio, dark/light mode, responsive/loading/error states |
| Code Quality & Architecture | 15% | deterministic scoring boundary, AI adapters, AI Run Ledger, Decision Integrity Audit, canonical snapshot hashing, domain services, Prisma schema, transaction guards, versioned assessments, OpenAPI |
| Authentication & Security | 10% | OAuth/password auth, verified email, DB sessions/device revocation, 2FA, RBAC, tenant isolation, audit logs, upload validation, mutation origin checks |
| Database Design | 5% | normalized ATS entities plus JobRequirement, EvidenceItem, CriterionEvaluation, VerificationItem, DecisionRecord, stage-event history |
| Performance & Scalability | 5% | indexed relational model, bounded lists/search, stateless app shape, provider timeouts/fallbacks, healthcheck; distributed rate limiting remains future work |
| Deployment & Documentation | 5% | Dockerfile/Compose, CI workflow, README, OpenAPI 3.1, Postman, ER diagram, demo credentials, preflight/QA scripts |

## Highest-leverage demonstration
The fastest way to show value across multiple rubric categories is the Priya-vs-Arjun comparison:

```text
Priya:  higher apparent Fit, weaker evidence/decision coverage
Arjun:  slightly lower Fit, substantially stronger verified evidence
```

Then show how a missing criterion triggers controlled verification and how new assessment/interview evidence changes coverage without handing the final decision to AI.


## v1.2 rubric reinforcement
- **AI/innovation:** AI-assisted execution becomes auditable by purpose/provider/model/prompt version/fallback state without treating the model as the decision-maker.
- **UI/UX:** the application page now exposes a compact structural integrity audit and links directly to the AI execution ledger.
- **Architecture:** new DecisionTrace snapshots use canonical JSON SHA-256 hashing; coverage freshness and evidence linkage are independently checkable.
- **Security/governance:** the AI ledger retains hashes/metadata rather than a second copy of candidate/job text.
- **Documentation:** OpenAPI/Postman/ER/release notes explicitly document the integrity layer.
