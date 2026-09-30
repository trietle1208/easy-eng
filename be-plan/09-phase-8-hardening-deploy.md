# Phase 8 — Hardening, tests and deployment

Read `be-plan/00-brief.md` first.

## Do
1. **Security review**: every Server Action and route handler checks auth + ownership and validates input; no answer keys or other users' data in any payload; security headers (CSP, frame-ancestors, referrer policy) in `next.config.ts`; file routes reject path traversal.
2. **Rate limiting** for mutations and uploads (a Postgres-backed or in-memory limiter is fine for a single container; document the limitation).
3. **Errors and logging**: consistent error type for actions (field errors vs. general errors) shown with the existing error styles; structured server logs without personal data or secrets.
4. **Tests**:
   - Vitest: data layer and progress functions, coverage report for `src/lib/`.
   - Playwright end-to-end against a seeded database: sign up → verify → do a grammar quiz → add a word → review it → see the streak on Profile; plus signed-out access rules.
5. **Docker production**:
   - Web image runs migrations on start (`src/db/migrate.ts`), then the server; non-root user kept.
   - Volumes for Postgres data and uploads; `.env` via `env_file`.
   - A one-off seed command (`docker compose run --rm web pnpm db:seed --content`) that works in the production image.
   - Nightly `pg_dump` backup (a small cron container or a documented host cron) with retention.
   - Reverse proxy notes (nginx/Caddy, HTTPS, large file/range requests for audio).
6. **Docs**: update `README.md` (local setup, env vars, migrations, seeding, deploy, backup/restore, Google OAuth setup).

## Done when
- A fresh server can be set up from the README alone.
- All checks and tests pass in CI-like conditions (`pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`).
- Report with known limitations. Then STOP.
