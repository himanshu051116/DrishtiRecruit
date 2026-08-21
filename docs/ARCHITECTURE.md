# DrishtiRecruit architecture

## Design intent

DrishtiRecruit turns a role into approved criteria, links candidate evidence to those criteria, and keeps the final hiring decision with an authorized person. The system deliberately distinguishes an apparent fit from the evidence needed to support a decision.

## System overview

```mermaid
flowchart TB
    User[Candidate, recruiter, interviewer, manager, or admin] --> UI[Next.js interface]
    UI --> API[Route handlers]
    API --> Auth[Session and role checks]
    API --> Workflow[Hiring workflow services]
    Workflow --> DB[(PostgreSQL via Prisma)]
    Workflow --> Storage[Resume storage adapter]
    Workflow --> Optional[Optional processing and email adapters]

    subgraph Workflow[Hiring workflow services]
      Jobs[Jobs and approved criteria]
      Applications[Applications and evidence]
      Verify[Assessments and interviews]
      Decisions[Coverage, decisions, and integrity checks]
    end

    Jobs --> Applications --> Verify --> Decisions
```

## Evidence and decision flow

```mermaid
flowchart TD
    JD[Job description] --> Criteria[Role criteria draft]
    Criteria --> Approval{Recruiter approves?}
    Approval -->|No| Criteria
    Approval -->|Yes| Matrix[Criterion-by-evidence matrix]

    Resume[Resume or profile] --> Matrix
    Assessment[Assessment result] --> Matrix
    Interview[Interview scorecard] --> Matrix
    Notes[Recruiter or portfolio evidence] --> Matrix

    Matrix --> Coverage[Fit, evidence coverage, decision coverage]
    Coverage --> Gap{Must-have gap remains?}
    Gap -->|Yes| Plan[Verification plan]
    Plan --> Assessment
    Plan --> Interview
    Gap -->|No| Review[Decision review]
    Review --> Record[Human decision record and evidence snapshot]
```

Each criterion evaluation retains its evidence sources and current status. The system can recommend a consistent next step, but it does not authorize or make the hiring decision.

## Request boundary

```mermaid
sequenceDiagram
    participant R as Recruiter
    participant UI as Interface
    participant API as Route handler
    participant S as Workflow service
    participant DB as PostgreSQL

    R->>UI: Open an application
    UI->>API: Request application workspace
    API->>API: Validate session and role
    API->>S: Load scoped application data
    S->>DB: Read criteria, evidence, coverage, and history
    DB-->>S: Scoped records
    S-->>API: Decision workspace model
    API-->>UI: Render matrix and available actions
```

Route handlers enforce authentication, company scope, and role rules before invoking workflow services. Services own policy checks, transactions, coverage recalculation, and audit records. Prisma is the only application path to PostgreSQL.

## Trust boundaries

| Boundary | Control |
| --- | --- |
| Browser to route handler | HttpOnly session cookies, validation, security headers, and origin checks where applicable |
| Route handler to workflow service | Role and company scope checks; server-authoritative state transitions |
| Workflow to database | Prisma queries and transactions for conflict-sensitive operations |
| File uploads | Type/size checks, file-signature validation, private storage adapter, and duplicate detection |
| Optional provider calls | Time limit, bounded data flow, deterministic fallback, and run metadata rather than raw duplicated inputs |
| Decisions | Authorized human action, evidence snapshot, override reason where required, and audit history |

## Assessment and interview controls

```mermaid
flowchart LR
    Approved[Approved criterion] --> Plan[Verification plan]
    Plan --> Choice{Method}
    Choice --> Assessment[Versioned assessment]
    Choice --> Interview[Focused interview kit]
    Assessment --> Evidence[Verified evidence]
    Interview --> Evidence
    Evidence --> Recalculate[Recalculate criterion and decision coverage]
```

Assessment content and duration are locked after assignment to preserve comparability. Interview scorecards can evaluate only the criteria in the assigned kit. Assessment deadlines, slot booking, and terminal application transitions are checked on the server.

## Deployment topology

```mermaid
flowchart LR
    Client[Browser] --> App[Next.js application]
    App --> DB[(PostgreSQL)]
    App --> Files[Private file storage]
    App --> Email[Optional email webhook]
    App --> Provider[Optional processing provider]

    subgraph Local development
      Compose[Docker Compose] --> DB
      Compose --> App
    end
```

`docker-compose.yml` starts PostgreSQL for local development. `docker-compose.full.yml` adds schema initialization, the application container, health checks, a named resume volume, and an optional demo seed profile.

## Implementation map

| Concern | Main location |
| --- | --- |
| Screens and API handlers | `src/app/` |
| Shared interface components | `src/components/` |
| Access policy and sessions | `src/lib/auth/`, `src/services/access/` |
| Job, application, and stage workflows | `src/services/job/`, `src/services/application/` |
| Evidence, coverage, and verification | `src/services/decisionCoverage.ts`, `src/services/verification*` |
| Assessments and interviews | `src/services/assessment/`, `src/services/interview/` |
| Decision records and reporting | `src/services/decision/`, `src/services/reporting/` |
| Data model and demo data | `prisma/schema.prisma`, `prisma/seed.ts` |

## Implementation terminology

Some internal names such as the `AiRun` model and the `/recruiter/ai-transparency` route are retained for compatibility with the existing Prisma schema and route contracts. The product interface calls this area **Processing history** and **Execution history**. The internal names do not change the product boundary: they record operational metadata and never own hiring state or final decisions.
