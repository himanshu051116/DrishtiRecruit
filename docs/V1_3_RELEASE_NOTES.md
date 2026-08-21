# DrishtiRecruit v1.3 — Runtime Acceptance Harness

v1.3 is not a feature-expansion release. It prepares DrishtiRecruit for the final dependency-backed acceptance gate and fixes one concrete Prisma 7 packaging gap discovered while attempting that gate.

## What changed

- Added `dotenv` as an explicit development dependency because `prisma.config.ts` imports `dotenv/config` and Prisma 7's current setup documentation expects it to be installed directly.
- Added the Prisma seed command to `prisma.config.ts` under `migrations.seed`.
- Added `npm run runtime:preflight` to report Node/npm/dependency/DNS/PostgreSQL/Chromium/Docker readiness without requiring installed project packages.
- Added `npm run runtime:acceptance` to run Prisma generation, Prisma validation, TypeScript checking, Vitest, the production Next.js build, an application readiness probe, and a public HTTP smoke test.
- Added `npm run runtime:acceptance:full` to additionally exercise a disposable PostgreSQL schema, seed the five-role demo dataset, and execute the Chromium role QA flow.
- Added `npm run qa:browser`, a dependency-free Chrome DevTools Protocol harness covering Candidate, Recruiter, Hiring Manager, Interviewer and Admin seeded accounts.
- Added `docs/RUNTIME_ACCEPTANCE.md` with the exact acceptance sequence and blocker interpretation.

## Current execution result in the build environment

The source-level release gate passes, but dependency-backed acceptance cannot begin because this environment cannot resolve `registry.npmjs.org` (`EAI_AGAIN`). `node_modules` is therefore unavailable, and no local PostgreSQL service is configured in this container.

This is recorded as a blocked runtime gate, not as a successful build.
