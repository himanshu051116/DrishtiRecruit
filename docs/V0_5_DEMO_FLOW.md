# DrishtiRecruit v0.5 Demo Flow

## 1. Recruiter comparison
Open the seeded Backend Engineer job, then choose **Compare**. The demo contains three deliberately different profiles:

- Priya: highest apparent fit, incomplete evidence and decision coverage.
- Arjun: slightly lower fit, substantially stronger evidence and decision coverage.
- Meera: several unresolved must-have criteria.

This is the key DrishtiRecruit distinction: fit is not treated as equivalent to decision readiness.

## 2. Pipeline
Open **Pipeline** and drag a card between valid stages. DrishtiRecruit records an `ApplicationStageEvent`, sends the candidate a notification, and rejects invalid terminal/skip transitions unless performed by an authorized decision flow.

## 3. Evidence loop
Open Priya. Show the weak Docker and missing Communication coverage, create/approve verification, assign the standardized assessment, then submit it as the candidate. The evidence ledger and coverage scores recalculate.

## 4. Interview
Schedule a criterion-driven interview. The kit targets unresolved criteria rather than repeating already-verified areas. Submit the scorecard as the interviewer to create interview-backed evidence.

## 5. Human decision and offer
Use the hiring-manager account to record the final human decision. If coverage is incomplete, DrishtiRecruit requires an override reason. A HIRE decision moves the application to OFFER.

Generate the offer, open the candidate portal, download the PDF, and accept it. Acceptance moves the application to HIRED and creates stage history.

## 6. Analytics
Finish on **Recruiting analytics**. Show the hiring funnel, time-to-hire (when stage history exists), offer acceptance, evidence-gap aggregation, source mix, and evaluation redundancy.
