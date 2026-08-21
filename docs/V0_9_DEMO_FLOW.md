# DrishtiRecruit v0.9 — Recommended 4–5 minute judge demo

The demo should prove one idea: **a high match score is not the same thing as a well-supported hiring decision.** Do not tour every screen.

## 0:00–0:35 — Recruiter creates the role
1. Sign in as `recruiter@tracehire.local`.
2. Open a seeded Backend Engineer job or create one.
3. Show RequirementGraph and recruiter approval.
4. Point out must-have vs important vs preferred criteria.

Message to judges: AI may propose criteria, but only recruiter-approved criteria enter evaluation.

## 0:35–1:25 — Open the high-fit candidate
1. Open Priya's application.
2. Show the three separate metrics: Fit, Evidence Coverage, Decision Coverage.
3. Open the Evidence Matrix and click one requirement to show source provenance.
4. Highlight an unresolved must-have.

Message: DrishtiRecruit distinguishes **ability evidence missing** from **ability missing**.

## 1:25–2:10 — Close one evidence gap
1. Run/approve VerifyLoop for a weak technical requirement.
2. Assign the standardized verification.
3. Switch to Candidate and complete the seeded assessment.
4. Return to recruiter view and show the criterion gaining assessment-backed evidence and coverage recalculating.

Message: verification is controlled and standardized, not a different arbitrary AI test for every candidate.

## 2:10–2:45 — Compare candidates
1. Open candidate comparison.
2. Put Priya beside Arjun.
3. Show the case where one candidate has higher apparent fit while the other has stronger evidence/decision coverage.
4. Open Analytics → high-fit / weaker-evidence queue.

Message: DrishtiRecruit does not convert an opaque ranking into an automated rejection list.

## 2:45–3:30 — Target the remaining gap in interview
1. Publish/select an interview slot or show the candidate self-booking flow.
2. Open the Interviewer kit.
3. Show that already-covered criteria are not repeated while unresolved criteria are included.
4. Submit a criterion-linked evidence note and scorecard.
5. Return to Decision Coverage.

## 3:30–4:15 — Human decision + auditability
1. Open DecisionTrace as Hiring Manager.
2. Show readiness, unresolved criteria, and evidence snapshot.
3. If coverage is incomplete, demonstrate that proceeding requires an explicit override reason.
4. Record the human decision and show stage history.
5. Generate the offer only after the human proceed-to-offer decision.

Message: AI organizes evidence and identifies process gaps; the authorized human owns the final decision.

## 4:15–4:45 — Production credibility close
Show only briefly:
- `/docs` + OpenAPI/Postman resources;
- Admin audit log / security controls;
- `/security` two-factor authentication (bonus);
- installable PWA manifest/offline page (bonus; sensitive hiring data is intentionally not cached);
- Docker/CI files in the repository.

## Demo lines to avoid
Do not claim:
- scientifically validated hiring accuracy;
- bias-free hiring;
- autonomous rejection;
- lie detection;
- emotion/personality inference;
- production-safe execution of untrusted candidate code.

## Best closing sentence
> DrishtiRecruit does not just ask who appears to match. It asks whether the hiring team has enough traceable, comparable evidence to support the decision — and shows exactly what still needs verification before a human decides.
