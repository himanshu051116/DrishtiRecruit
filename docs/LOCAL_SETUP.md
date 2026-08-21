# Local Setup

## 1. Configure environment

```bash
cp .env.example .env
```

Use a long random `JWT_SECRET` (at least 32 characters).

## 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

Default development URL in `.env.example`:

```text
postgresql://postgres:postgres@localhost:5432/drishtirecruit?schema=public
```

## 3. Install dependencies

```bash
npm install
```

## 4. Generate Prisma client

```bash
npm run prisma:generate
```

## 5. Create migration

```bash
npm run db:migrate -- --name init
```

## 6. Seed demo data

```bash
npm run db:seed
```

## 7. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation commands

```bash
npm run prisma:validate
npm run typecheck
npm run test:core
npm run build
```


## Final runtime acceptance

After the application works locally, run:

```bash
npm run runtime:preflight
npm run runtime:acceptance
```

For the disposable demo database plus five-role Chromium QA:

```bash
npm run runtime:acceptance:full
```

See `docs/RUNTIME_ACCEPTANCE.md` before using the destructive demo seed.
