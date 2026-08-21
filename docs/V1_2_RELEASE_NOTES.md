# DrishtiRecruit v1.2 — Decision Integrity Release

## Why this release exists
DrishtiRecruit already separated Fit, Evidence Coverage and Decision Coverage. v1.2 strengthens a different question: **can a reviewer inspect how the system reached and preserved those conclusions?**

## New flagship-support capabilities
1. **AI Execution Ledger** — hashed input/output provenance plus provider, model, prompt version, purpose, duration, fallback status and error class. Raw candidate/job text is not duplicated into the ledger.
2. **Decision Integrity Audit** — explicit structural checks for criterion governance, evidence linkage/provenance, calculation freshness, historical snapshot integrity and workflow consistency.
3. **Tamper-evident DecisionTrace snapshots** — new decisions store SHA-256 of canonicalized evidence snapshot JSON.
4. **Evidence Packet integrity output** — the downloadable PDF prints the snapshot SHA-256 and verifies it at generation time.

## Judge demonstration
On a candidate application, show the Fit/Evidence/Decision Coverage values, then the Decision Integrity Audit. Run evidence analysis and open `/recruiter/ai-transparency` to show that the run is traceable without exposing raw resume text in the ledger. Finish with Decision Evidence PDF and point to the snapshot integrity check.

## Important boundary
The audit is not a fairness certification, legal-compliance certificate, or guarantee that a hiring decision is correct. It checks technical/process integrity of the DrishtiRecruit evidence path.
