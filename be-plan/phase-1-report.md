# Phase 1 Report — Infrastructure and server boundary

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Boundary refactor (still mock-backed)
- Moved `formatTimer` / `formatQuizDuration` → [`src/lib/format.ts`](../src/lib/format.ts); quiz client components updated.
- Moved `Greeting` type → [`src/types/home.ts`](../src/types/home.ts) so clients never import `@/lib/data/*`.
- Added `import "server-only"` to every file under `src/lib/data/`.
- Server Actions (Zod → data layer):
  - `src/lib/actions/check-dictation.ts`
  - `src/lib/actions/check-reading-answers.ts`
  - `src/lib/actions/create-word.ts`
  - `src/lib/actions/update-settings.ts`
  - `src/lib/actions/submit-quiz.ts`
- Updated client callers: dictation-exercise, comprehension-quiz, add-word-form, vocab-popover, profile-settings, quiz-view.
- Schemas: `src/lib/schemas/learning-actions.ts`, `src/lib/schemas/update-settings.ts`.

### Environment & deps
- [`src/env.ts`](../src/env.ts) — Zod-validated env; `SKIP_ENV_VALIDATION=1` for builds.
- [`.env.example`](../.env.example) — all keys from the phase brief.
- Added: `drizzle-orm@0.45.3`, `pg@8.23.0`, `better-auth@1.7.6`, `server-only@0.0.1`, `nodemailer@10.0.12`; dev: `drizzle-kit`, `@types/pg`, `@types/nodemailer`, `vitest`, `tsx`, `esbuild`.
- Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:seed` (stub), `db:reset`, `db:bundle-migrate`, `test`.
- [`.npmrc`](../.npmrc) — hoist eslint plugins (fixes lint after pnpm layout change).

### Database & Docker
- [`docker-compose.yml`](../docker-compose.yml) — `db` (postgres:16-alpine, healthcheck, volumes) + `web` depends on healthy db; storage volume.
- [`docker-compose.override.yml`](../docker-compose.override.yml) — publishes `5432` for local tools/tests.
- [`drizzle.config.ts`](../drizzle.config.ts), empty [`src/db/schema/`](../src/db/schema/), [`src/db/index.ts`](../src/db/index.ts), [`src/db/migrate.ts`](../src/db/migrate.ts).
- Baseline migration [`drizzle/0000_baseline.sql`](../drizzle/0000_baseline.sql) (no domain tables).
- Dockerfile: build with `SKIP_ENV_VALIDATION=1`, bundle `migrate.cjs`, entrypoint migrates then starts server.
- Init script creates `easy_english_test` on first Postgres volume init.

### Storage, mail, health, tests
- `src/lib/storage/` — `StorageDriver` + local-disk driver.
- `src/lib/mail/` — console + SMTP drivers; `getMailer()` picks console when `SMTP_HOST` empty.
- `GET /api/health` → `{ ok, app, db }` via `SELECT 1`.
- Vitest smoke test + test DB helper (auto-creates test DB if missing).

### Migrations added
| File | Purpose |
|---|---|
| `drizzle/0000_baseline.sql` | No-op baseline so migrator is wired before Phase 2 tables |

---

## 2. Contract changes

| Change | Why |
|---|---|
| Mutations/checks from clients go through Server Actions | Required before `server-only` on data layer; same return shapes |
| `formatTimer` / `formatQuizDuration` leave `src/lib/data/quiz.ts` | Client-safe pure helpers |
| `Greeting` type lives in `src/types/home.ts` | Avoid client → data imports |

No UI display changes. Mocks still back all reads/writes. Answer keys still reach the browser (Phase 4–5).

---

## 3. How to run / test what was built

```bash
cp .env.example .env   # if needed
docker compose up -d db
pnpm db:migrate
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Full stack
docker compose up -d --build
curl -s http://localhost:3000/api/health
# → {"ok":true,"app":"ok","db":"up"}
```

Local app without Docker web: `pnpm dev` (needs `.env` + running Postgres).

`pnpm db:seed` exits with a Phase 2 message (intentional stub).

### Verification (2026-09-30)
- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — pass (DB smoke)
- `pnpm build` — pass
- `docker compose up` — db healthy, migrate on start, `/api/health` → db up

---

## 4. Decisions I should confirm

1. Phase 0 product rules (streaks, goals, WOTD, ownership, catalog padding) remain open — still needed before Phase 7.
2. Baseline migration is a no-op `SELECT 1` — OK to replace/extend when Phase 2 generates real DDL?
3. `better-auth` is installed but unused until Phase 3 — OK?
4. Health returns 503 when DB is down (`ok: false`) — preferred vs always 200 with `db: "down"`?

---

## 5. Plan for the next phase

**Phase 2 — Schema, migrations and seeders** (`be-plan/03-phase-2-schema-seed.md`):

- Implement Drizzle tables from Phase 0 ERD.
- Generate real migrations; expand seed JSON + `scripts/seed.ts`.
- Keep UI on mocks until Phase 4 wires reads.

**STOP** — await approval before Phase 2.
