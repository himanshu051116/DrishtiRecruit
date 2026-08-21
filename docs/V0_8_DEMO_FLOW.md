# DrishtiRecruit v0.8 — recommended 4–5 minute demo

## Goal
Do not demo DrishtiRecruit as a sequence of CRUD screens. Demonstrate one state-changing hiring story: **high apparent fit -> insufficient evidence -> targeted verification -> stronger decision coverage -> human decision**.

## 0:00–0:35 — Role criteria
1. Login as `recruiter@tracehire.local`.
2. Open the seeded Backend Engineer job.
3. Show RequirementGraph and emphasize that AI-proposed criteria are drafts until recruiter approval.
4. Point out must-have vs important vs preferred criteria.

## 0:35–1:20 — Candidate A: high fit, incomplete evidence
1. Open Priya's application.
2. Show the three separate metrics: Fit, Evidence Coverage, Decision Coverage.
3. Open the Evidence Matrix and click one evidence item to show provenance.
4. Highlight the unresolved must-have and explain: absence of evidence is **not** treated as inability.

## 1:20–2:05 — Controlled VerifyLoop
1. Show the ranked verification recommendation.
2. Approve the standardized assessment rather than allowing an AI-generated arbitrary test.
3. Switch to the Candidate account and open the assessment.
4. Mention v0.8 server-authoritative timing: answers after the deadline are not accepted even if the browser is modified.
5. Submit the seeded/correct verification answer.

## 2:05–2:35 — Visible evidence update
1. Return to Priya's recruiter application.
2. Refresh and show that the linked criterion gained assessment evidence.
3. Point out that Fit, Evidence Coverage and Decision Coverage update independently.

## 2:35–3:10 — Compare candidates
1. Open the job comparison screen.
2. Compare Priya (higher apparent fit / weaker evidence) against Arjun (slightly lower fit / stronger verified coverage).
3. State the flagship thesis: **a larger AI match score is not automatically a better-supported hiring decision**.

## 3:10–3:45 — Interview coverage
1. Show the unresolved criterion-driven interview kit or candidate self-scheduling slot.
2. Login as the assigned Interviewer and show that only assigned criteria are scored.
3. Mention that interviewers cannot access salary-bearing offer PDFs and do not receive full recruiter evidence-matrix access.
4. Submit structured evidence notes.

## 3:45–4:20 — DecisionTrace
1. Login as Hiring Manager.
2. Show final Decision Coverage and remaining warnings.
3. Record a human decision.
4. If demonstrating an override, show that a reason is mandatory when coverage is incomplete.
5. Show the immutable evidence snapshot in decision history.

## 4:20–4:45 — Analytics + architecture close
1. Open Recruiting Analytics.
2. Show the Fit/Evidence/Decision distributions and "high apparent fit, weaker evidence" review queue.
3. Briefly show `/docs`, OpenAPI/Postman and `/api/health`.

## Closing line
> DrishtiRecruit does not automate the final hiring decision. It makes the evidence behind that decision visible, detects what is still unknown, and helps the hiring team verify the right thing next.
