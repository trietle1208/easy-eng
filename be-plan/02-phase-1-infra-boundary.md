# Phase 1 — Infrastructure and server boundary

Read `be-plan/00-brief.md` and the approved `be-plan/phase-0-report.md` first.

## Goal
Database running locally and in Docker, and the codebase split cleanly into client-safe and server-only code, while the app still runs on mock data.

## Do
1. **Boundary refactor (still mock data, no DB calls yet)**
   - Move `formatTimer` and `formatQuizDuration` to `src/lib/format.ts`; update imports.
   - Create Server Actions in `src/lib/actions/` for every mutation or check currently called from client components (`checkDictation`, `checkReadingAnswers`, `createWord`, `updateSettings`, `submitQuiz`). Actions validate input with Zod and call the data layer. Update the 6 client components to use them.
   - Add `import "server-only"` to `src/lib/data/*`. The build must prove no client component imports the data layer.
2. **Environment**: `src/env.ts` validates env vars with Zod and fails fast. Add `.env.example` (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SMTP_*, STORAGE_DIR, APP_TIMEZONE).
3. **Database**
   - `docker-compose.yml`: add `db` (postgres:16-alpine, named volume, healthcheck); `web` depends on a healthy `db`. Add a `docker-compose.override.yml` or profile for local development exposing the DB port.
   - Drizzle setup: `drizzle.config.ts`, `src/db/index.ts` (pooled client, server-only), empty schema folder.
   - `src/db/migrate.ts`: programmatic migrator (drizzle-orm migrator, no drizzle-kit at runtime) run before the server starts in the Docker image.
   - Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:seed`, `db:reset` (dev only).
4. **Storage and mail interfaces** (`src/lib/storage`, `src/lib/mail`) with local-disk and console drivers; no feature uses them yet.
5. **Testing setup**: Vitest configured with a separate test database (`DATABASE_URL_TEST`), a helper to reset it between test files. One smoke test that connects and runs a trivial query.
6. **Health check**: `GET /api/health` returns app and DB status.

## Do NOT
- Create domain tables yet (next phase).
- Change what the UI displays.

## Done when
- The app behaves exactly as before, with mutations going through Server Actions.
- `docker compose up` starts db + web, migrations run on start, `/api/health` reports the DB as up.
- Lint, typecheck, build and the smoke test pass. Report. Then STOP.
