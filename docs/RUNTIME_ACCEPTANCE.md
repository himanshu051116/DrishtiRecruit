# DrishtiRecruit v1.3 Runtime Acceptance

This is the final acceptance sequence before deployment. It intentionally separates **source-level QA** from **dependency-backed runtime acceptance**.

## 1. Preflight

```bash
npm run runtime:preflight
```

Expected checks:

- Node.js >= 22.12
- npm available
- package dependencies installed
- `.env` present
- npm-registry DNS reachable when installation is required
- PostgreSQL reachable through `DATABASE_URL`
- Chrome/Chromium available for five-role browser QA

A missing `package-lock.json` is a reproducibility warning. Generate and commit it after the first successful `npm install`.

## 2. Install dependencies

```bash
npm install
```

v1.3 explicitly includes `dotenv` because Prisma 7 configuration imports `dotenv/config`.

## 3. Configure the local disposable acceptance database

```bash
cp .env.example .env
```

Use a local/demo PostgreSQL database. Do not point the destructive demo seed at a real hiring database.

Example:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drishtirecruit?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
TWO_FACTOR_ENCRYPTION_KEY="replace-with-another-long-random-secret"
APP_URL="http://localhost:3100"
```

## 4. Dependency-backed build gate

```bash
npm run runtime:acceptance
```

This runs:

```text
prisma generate
prisma validate
tsc --noEmit
vitest
next build
next start
GET /api/ready
GET /
```

## 5. Full disposable-database + five-role gate

Start PostgreSQL first, then run:

```bash
npm run runtime:acceptance:full
```

This additionally runs:

```text
prisma db push
npm run db:seed
Chromium Candidate QA
Chromium Recruiter QA
Chromium Hiring Manager QA
Chromium Interviewer QA
Chromium Admin QA
```

The demo seed deletes application data. Use only a disposable local/demo database.

## 6. Browser QA expectations

The browser harness signs in through the actual login endpoint and checks that each seeded role reaches its authorized workspace:

| Role | Expected workspace |
|---|---|
| Candidate | `/candidate/dashboard` |
| Recruiter | `/recruiter/dashboard` |
| Hiring Manager | `/recruiter/dashboard` |
| Interviewer | `/interviewer/interviews` |
| Admin | `/admin` |

The browser test uses Chrome DevTools Protocol directly and does not require Playwright.

## Current build-environment result

The v1.3 preflight in the current build environment reported:

```text
PASS    Node.js
PASS    npm
BLOCKED dependencies       node_modules absent
WARN    package lock       not generated yet
WARN    .env               not created in this container
BLOCKED npm registry DNS   EAI_AGAIN
BLOCKED PostgreSQL         DATABASE_URL not configured
PASS    Chromium           executable present
WARN    Docker             unavailable
```

The source release gate still passes:

```text
npm run qa:release -> PASS
237 TS/TSX files transpile-parsed -> 0 syntax diagnostics
```

Do not claim runtime acceptance until the dependency-backed sequence above passes on a networked machine.
