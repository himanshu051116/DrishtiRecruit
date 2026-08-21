# DrishtiRecruit v1.3 — Judge Guide

## 30-second product thesis
DrishtiRecruit is an Applicant Tracking System that separates **Fit**, **Evidence Coverage**, and **Decision Coverage**. It does not treat a high resume-match score as sufficient proof for a hiring decision. Instead, it shows what evidence supports each approved job criterion, identifies unresolved must-haves, recommends a controlled verification step, and preserves the final human decision in DecisionTrace.

## Fastest evaluation path
1. Sign in as `recruiter@tracehire.local` / `DrishtiRecruit123!`.
2. Open **Backend Engineer** and the candidate **Priya Sharma**.
3. Compare the three top metrics: high Fit vs materially lower Evidence/Decision Coverage.
4. Open the Evidence Matrix and inspect Docker/Communication gaps.
5. Use **Controlled VerifyLoop** to show the standardized next-verification path.
6. Open the job's **Candidate Comparison** page and compare Priya with Arjun: Arjun has slightly lower apparent Fit but much stronger verified evidence.
7. Sign in as Hiring Manager and inspect **DecisionTrace**; incomplete coverage requires an explicit override reason before a terminal hiring recommendation can proceed.
8. Show **Decision Integrity Audit** on Priya’s application and the **AI Transparency** ledger.
9. Optionally show Security (2FA/device sessions), Analytics, Assessment Studio, Interview self-scheduling, and Admin audit controls.

## What is different from a generic AI ATS?
A generic ATS often compresses candidate information into one match/rank. DrishtiRecruit preserves separate questions:
- **Fit:** how strongly does current evidence align with the role?
- **Evidence Coverage:** how much usable evidence exists?
- **Decision Coverage:** have the required criteria actually been evaluated enough to support a decision?

The flagship loop is:

```text
RequirementGraph
  -> EvidenceLedger
  -> Fit / Evidence Coverage / Decision Coverage
  -> unresolved criterion
  -> Controlled VerifyLoop
  -> assessment / interview evidence
  -> recalculation
  -> DecisionTrace
  -> human decision
```

## Production-shaped safeguards worth inspecting
- recruiter approval before AI-proposed criteria affect scoring;
- obvious sensitive-trait criteria blocked from automated-scoring approval;
- exact resume-source excerpts for AI evidence are accepted only when they actually occur in the uploaded resume;
- standardized/versioned assessments preserve candidate comparability;
- server-authoritative assessment deadlines;
- Interviewer access is assignment-scoped and salary-bearing offer data is not available to Interviewers;
- HIRE/REJECT DecisionTrace and stage transition commit atomically;
- terminal applications cannot be reopened by late analysis, assessments, or interviews;
- no autonomous final rejection/hiring decision;
- AI/heuristic runs retain provider/prompt/fallback metadata and SHA-256 input/output hashes without duplicating raw candidate/job text;
- new DecisionTrace evidence snapshots are SHA-256 hashed and verified in the evidence packet.

## Demo credentials
See `DEMO_CREDENTIALS.md` for every role. The seeded accounts and password are **demo-only local credentials** and must not be reused for a public production deployment.

## Deliberately unclaimed
DrishtiRecruit does not claim validated hiring accuracy, legal compliance, fairness certification, emotion/personality inference, facial analysis, or autonomous hiring. Remote execution of untrusted candidate code is also intentionally not run inside the application process.


## Decision evidence packet
On the recruiter application page, use **Decision evidence PDF** after the DecisionTrace step. It exports the same flagship distinction into an auditable artifact: Fit is separated from evidence sufficiency, each criterion retains provenance, and the human decision remains visible rather than being replaced by an AI verdict.


## v1.2 integrity layer
The Decision Integrity Audit intentionally avoids a single “trust score.” It reports independent checks for requirement governance, evidence linkage/provenance, calculation freshness, DecisionTrace snapshot integrity, workflow consistency and AI-run provenance.
