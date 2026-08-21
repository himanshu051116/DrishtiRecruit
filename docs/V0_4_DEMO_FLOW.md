# v0.4 Flagship Demo Flow

## 1. Candidate starts with incomplete evidence

After resume analysis:

```text
Fit                high
Evidence Coverage  incomplete
Decision Coverage  not ready
Communication      MISSING
Docker             PARTIAL/WEAK
```

## 2. Controlled VerifyLoop

Recruiter plans verification and approves a standardized assessment for an unresolved technical criterion.

## 3. Candidate assessment

Candidate opens `/candidate/assessments`, starts the timed assessment, submits, and sees a score.

The result is stored as `ASSESSMENT` evidence and Decision Coverage is recalculated automatically.

## 4. Interview kit

The recruiter schedules a technical interview. The kit contains remaining unresolved requirements rather than repeating highly verified ones.

The interviewer opens `/interviewer/interviews`, records 1–5 scores and observable evidence notes.

## 5. Coverage closes

Interview evidence is stored and the recruiter Evidence Matrix updates.

## 6. Human decision

Hiring Manager/Admin sees readiness, unresolved/conflicting must-haves and coverage. They record HIRE/REJECT/HOLD.

If they make a terminal decision while coverage is incomplete, DrishtiRecruit requires an override explanation and stores it in DecisionTrace.
