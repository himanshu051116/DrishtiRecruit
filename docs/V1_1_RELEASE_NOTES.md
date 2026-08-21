# DrishtiRecruit v1.1 — Evidence Audit Release

## Why this release exists
v1.1 does not change DrishtiRecruit's core thesis. It strengthens the two places where a polished hackathon demo could still break under technical review: **criterion publication integrity** and **portable evidence auditability**.

## Decision Evidence Packet
Authorized recruiter/hiring-manager/admin users can download a multi-page PDF from an application page. The packet contains:
- Fit Score, Evidence Coverage and Decision Coverage as separate metrics;
- unresolved/conflicting must-have criteria;
- latest DecisionTrace context and any recorded override reason;
- criterion-level evidence provenance and source type;
- assessment history;
- interview scorecards/evidence notes;
- workflow stage history;
- explicit reminder that missing evidence is not proof of inability and that final hiring remains human-owned.

The export intentionally does **not** collapse the hiring process into one opaque AI score.

## Atomic requirement publication
The previous UI saved criteria and published a job in separate requests. That created a failure mode where unsaved local edits could be omitted if the recruiter clicked publish immediately.

v1.1 sends the current editor state in one action and commits:
1. requirement validation;
2. sensitive-trait governance checks;
3. duplicate-name checks;
4. recruiter approval;
5. current criterion edits; and
6. job publication

inside one serializable transaction.

## Requirement-quality hardening
- AI/heuristic requirement drafts are de-duplicated by a normalized name key before persistence.
- Duplicate requirement names are rejected at publication.
- Draft weights are re-normalized after de-duplication.
- Recruiters still control final names, priorities, weights and approval.

## Release-tooling improvements
- `npm run qa:pdf` validates long-report pagination using Node 22 type stripping without external dependencies.
- `npm run qa:release` now includes PDF smoke validation.
- submission preflight validates semantic versioning rather than hardcoding v1.0.
- `docs/FINAL_DEMO_FLOW.md` is now the stable competition-demo artifact.
