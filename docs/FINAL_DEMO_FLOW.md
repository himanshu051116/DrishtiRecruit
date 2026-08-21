# DrishtiRecruit v1.3 — final 4–5 minute judge demo

## Demo objective
Show one complete hiring decision where **apparent fit, evidence coverage, and decision coverage are visibly different**. The point is not that DrishtiRecruit replaces a recruiter; it makes the evidence state of the hiring process inspectable and actionable.

## 0:00–0:35 — create / open the role
- Sign in as the seeded recruiter.
- Open **Backend Engineer**.
- Show recruiter-approved RequirementGraph: Node.js, PostgreSQL, REST API Design, Docker, Security Design, Communication, optional AWS.
- Point out that AI-generated criteria remain drafts until recruiter approval.

## 0:35–1:20 — show the flagship problem
Open Priya's application.

Expected demo shape:
- high Fit Score;
- materially lower Evidence Coverage;
- incomplete Decision Coverage;
- Docker weak/partial;
- Communication missing.

Open a criterion to show exact EvidenceLedger provenance rather than a black-box score.

## 1:20–2:05 — close one evidence gap
- Use VerifyLoop.
- Approve the standardized Docker verification.
- Switch to the candidate account and complete the seeded assessment.
- Return to the recruiter view.
- Show new ASSESSMENT evidence and the resulting coverage increase.

## 2:05–2:45 — target the interview at what remains unknown
- Show that already-verified Node.js is not repeatedly prioritized.
- Publish/select an interview slot.
- Candidate self-books.
- Open the interviewer kit and show the unresolved Communication / Security criterion.
- Submit a structured evidence note and scorecard.

## 2:45–3:25 — compare candidates
Open Candidate Comparison.

Emphasize the deliberately designed contrast:
- Priya can have stronger apparent fit but weaker verification;
- Arjun can have slightly lower fit but much stronger Evidence / Decision Coverage.

Do **not** describe this as an automatic ranking or rejection mechanism.

## 3:25–4:05 — human decision and auditability
- Open DecisionTrace.
- Show readiness, unresolved must-haves, evidence snapshot, and human ownership.
- Record a human decision.
- If demonstrating an override, show the mandatory reason field.

## 4:05–4:25 — integrity + AI transparency
- On the application page, show **Decision Integrity Audit** and its separate PASS/WARN/FAIL checks.
- Open **AI Transparency** and show provider/model/prompt version/fallback state plus hashed input/output provenance.
- Explain that the ledger does not duplicate raw resume/job text and does not control final hiring state.
- Download the Decision evidence PDF and point to the stored DecisionTrace snapshot SHA-256 + integrity check.

## 4:25–4:50 — analytics close
Open Recruiting Analytics:
- Fit distribution;
- Evidence Coverage distribution;
- Decision Coverage distribution;
- high-fit / low-evidence review queue;
- evidence gaps and evaluation redundancy.

Close with:
> DrishtiRecruit does not simply ask who appears to match. It asks what evidence supports the match, what is still unknown, and whether the hiring team has enough comparable evidence to make a human decision.

## Optional 20-second technical close
Show `/docs`, `/api/health`, `/api/ready`, Docker/CI artifacts, ER diagram, and the admin audit / retention panel.

## v1.2 close
After showing DecisionTrace, finish with the **Decision Integrity Audit**, **AI Execution Ledger**, and **Decision evidence PDF**. Together they show not only what DrishtiRecruit concluded, but whether the technical evidence path is structurally inspectable and whether the saved DecisionTrace snapshot still matches its SHA-256 hash.
