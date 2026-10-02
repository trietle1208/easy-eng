# Phase 7 — Import, credits and rollout

Read `content-plan/00-brief.md` and the approved earlier reports first.

## Goal
The catalog is in the database, visible level by level, with credits and a way for learners to report mistakes.

## Do
1. **Build final files** (`build.ts`): write `content/vocabulary/a1.json … b2.json` plus `content/topics.json` (already there), in the content schema (sets with `status: "draft"`, words with `source` and `reviewStatus`). Validate with the Zod schema; print counts per level/topic; fail on any duplicate id or headword + pos. Keep the 9 existing sets and 3 words untouched.
2. **Import safely**:
   - take a `pg_dump` backup first and note its path in the report;
   - run the seeder with `--only-new` on a **staging copy** of the database; import time and row counts in the report;
   - repeat the import: the second run must change nothing.
3. **Check in the UI as a learner** (default and Blossom themes, desktop and mobile): topic filter, level filter, set list speed, set page with 20–30 words, flashcards, word search, review (FSRS) with a new set started. Fix issues found in this phase's scope.
4. **Credits**: `CREDITS.md` and a `/credits` page in the existing style listing every data source with the citation text required by its license (copy the CEFR-J citation from the dataset README), plus a short note that examples and Vietnamese meanings are AI-generated and reviewed. Link it from the footer or profile.
5. **Report-a-mistake**: new table `word_reports` (id, user_id, word_id, reason, comment, status open|resolved, created_at), a small "Report" action on the flashcard (signed-in users, rate limited, validated with Zod), and a list for admins to resolve reports. Reuse existing components; tests for ownership and rate limiting.
6. **Publish by level**: a script/admin action to publish all draft sets of one level at once (A1 first). Do not publish levels I have not approved. Production import steps written in `content-pipeline/README.md` (backup → `--only-new` → verify counts → publish A1 → … ).
7. Update the Phase-4-style data contract note: any change to `src/lib/data/` signatures (should be none or optional parameters only).

## Do NOT
- Run any import against production or publish anything unless I say so in this phase. Never run `--content` without `--only-new` here.

## Done when
- Staging shows ~3,000 words in ~100–150 sets, all draft; UI checks pass; credits page and report-a-mistake work.
- Lint, typecheck, build and tests pass. Report with the production runbook. Then STOP.
