# DrishtiRecruit demo flow

## The story to tell

DrishtiRecruit is not a resume-ranking tool. It helps a hiring team see what supports a candidate's fit, what remains unknown, and what must be checked before a person makes the final decision.

Use the local seeded data and present one decision path in about five minutes.

## 0:00–0:35 — start with the role

1. Sign in as the recruiter.
2. Open **Backend Engineer**.
3. Show the approved role criteria: Node.js, PostgreSQL, REST API Design, Docker, Security Design, Communication, and optional AWS.
4. Explain that criteria are reviewed before they affect any candidate evaluation.

Suggested line:

> I start by making the role explicit, so the team agrees on what needs evidence before comparing people.

## 0:35–1:25 — show the important difference

Open **Priya Sharma**.

Point out:

- strong fit;
- lower evidence coverage;
- incomplete decision coverage;
- weak Docker evidence and missing Communication evidence.

Open a row in the evidence matrix and show the source behind the status. Emphasize that a missing source is treated as something to verify, not as proof the candidate cannot do the work.

## 1:25–2:10 — close an evidence gap consistently

1. Open the verification plan.
2. Choose the standardized Docker assessment for the open criterion.
3. Switch to the candidate account and complete the assigned assessment.
4. Return to the recruiter workspace and show the new assessment evidence in the same matrix.

Suggested line:

> The point is not to give every candidate a different test. I use a repeatable check that feeds the same decision record.

## 2:10–2:50 — target the interview

1. Show that already verified Node.js evidence is not the priority.
2. Publish or select an interview slot.
3. Book the slot as the candidate.
4. Open the interviewer kit.
5. Show the unresolved Communication or Security criterion and submit a structured scorecard.

## 2:50–3:35 — compare evidence, not just fit

Open the candidate comparison view.

- Priya can appear highly aligned but still have open evidence gaps.
- Arjun may have a lower fit measure while having stronger evidence and decision coverage.
- Meera makes the missing must-have path easy to demonstrate.

Avoid describing this as automatic ranking, rejection, or hiring.

## 3:35–4:15 — make the decision human-owned

1. Open the decision panel.
2. Show readiness, unresolved must-haves, and the evidence snapshot.
3. Record a hiring-manager decision.
4. If you demonstrate an incomplete-coverage override, show the required reason.
5. Open the Decision Integrity Audit to show separate structural checks instead of a single trust score.

## 4:15–4:45 — close with traceability

1. Open **Processing history** from the navigation.
2. Show the provider, fallback, duration, and input/output hashes without exposing candidate or role text.
3. Download the Decision evidence PDF.
4. Finish in analytics with the fit, evidence coverage, decision coverage, and evidence-gap views.

Suggested close:

> DrishtiRecruit does not just ask who looks like a match. It shows what supports the match, what still needs verification, and whether the team has enough comparable evidence for a human decision.

## Optional technical close

Show `/docs`, `/api/health`, `/api/ready`, the [architecture guide](ARCHITECTURE.md), the ER diagram, and the Docker/CI files. Keep this to 20 seconds; the product story should come first.
