# Phase 1 — Schema and platform changes

> Status: **done** (2026-10-02) — report `content-plan/phase-1-report.md`.

Read `content-plan/00-brief.md` and the approved `content-plan/phase-0-report.md` first. Follow the GitNexus impact-analysis rule before editing any function.

## Goal
The app can store, import and show ~3,000 words in ~18 topics without losing existing data or overwriting admin edits.

## Do
1. **Migration** (generate with drizzle-kit, review the SQL, commit): the approved columns and indexes. Backfill existing rows: `source = 'manual'`, `review_status = 'human_reviewed'`, `sort_order` from current ordering. Add an index that makes listing words of a set in order fast.
2. **Taxonomy as one source of truth**: `content/topics.json` + a Zod schema; derive `WORD_SET_TOPICS` / `WordSetTopic` from it (no more hard-coded list). The data layer and mappers read topic titles from it. Keep stored values as text.
3. **Parts of speech**: extend `PARTS_OF_SPEECH`, `newWordSchema`, the Add Word form and the flashcard display with the approved values (at least preposition, conjunction, interjection). Existing words keep working.
4. **Content schema**: update `vocabularyContentSchema` (optional `source`, `sortOrder`, `reviewStatus`; set `status`, `sortOrder`) so old files stay valid.
5. **Seeder**: batch inserts (chunks of ~500 rows), respect `status` from the JSON (default `published` for old files), add `--only-new` (insert missing rows, never update existing ones) and make plain `--content` refuse to run when `NODE_ENV=production` unless `--force` is given. Seeding the same files twice must change nothing.
6. **Admin import**: accept the new fields; show `review_status` and `source` in the word set editor; allow filtering the set list by status and by topic.
7. **UI for scale** (reuse existing components and tokens, both themes, mobile): topic filter that works with ~18 topics (scrollable chips or a "More topics" menu), set list that stays fast with ~120 sets (pagination or "load more"), and **word search**: typing a word finds the set(s) that contain it (accent-insensitive, same approach as the existing search).
8. Tests: migration backfill, unique index, seeder idempotency and `--only-new`, production guard, taxonomy validation, word search.

## Do NOT
- Add the 3,000 words yet. Do not delete or renumber the 9 existing sets / 3 words.

## Done when
- The migration applies on a copy of the current database without data loss; existing pages look and behave as before.
- Lint, typecheck, build and tests pass. Report. Then STOP.
