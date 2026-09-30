# Phase 2 — Schema, migrations and seeders

Read `be-plan/00-brief.md` and `be-plan/phase-0-report.md` first.

## Goal
The full approved schema in PostgreSQL, filled with the content that is currently in the mock files.

## Do
1. Implement the Drizzle schema exactly as approved in Phase 0 (one file per domain under `src/db/schema/`), with foreign keys, indexes, unique constraints (slugs), check constraints for enums, and `created_at` / `updated_at`.
2. Generate and commit the migration(s). Review the SQL before committing.
3. **Content JSON**: convert `src/lib/mock/*` into files under `content/` (`grammar.json`, `reading.json`, `listening.json`, `quiz.json`, `vocabulary.json`), validated by Zod schemas in `content/schema.ts`. Stable slugs/ids.
4. **Seeder** `scripts/seed.ts`:
   - Validates every JSON file before writing anything; fails with a clear message pointing to the bad entry.
   - Idempotent: upsert by slug/stable id, safe to run repeatedly, inside a transaction per domain.
   - `--content` seeds only content; `--demo` also creates a demo user "Linh" (email/password from env) with settings, some progress, attempts, words and activity, so the UI looks like the mockups.
   - Copies seed audio files into the storage directory.
5. Mappers in `src/lib/data/mappers/` from rows to the existing UI types, with unit tests.

## Do NOT
- Switch the data layer to the DB yet (except where needed to test mappers).

## Done when
- `pnpm db:reset && pnpm db:seed --demo` produces a database whose content matches the mock data one-to-one (a test compares counts and a sample of records).
- Running the seeder twice changes nothing the second time.
- Lint, typecheck, build and tests pass. Report (include the ERD as built). Then STOP.
