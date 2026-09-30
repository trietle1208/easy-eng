# Phase 6 — Vocabulary CRUD and spaced repetition

> **Status: done** (2026-09-30) — see `be-plan/phase-6-report.md`.

Read `be-plan/00-brief.md` first.

## Goal
Users manage their own words and review them with FSRS.

## Do
1. **Read**: `getWordSets` (system sets + the user's own sets, with the user's `learnedCount` and `status`), `getTopicCounts`, `getWord`, `getWordsInSet`, `getSavedWordCount`, `getAddedToday` (in the user's timezone).
2. **Create**: `createWord` via a Server Action with the shared `newWordSchema`; supports creating a new personal word set from `newWordSetTitle`; prevents duplicates of the same word in the same set for the same user; also used by the Reading vocab popover and "Add to my words" on Home.
3. **Update / delete**: edit and delete for user-owned words and sets only (system content is read-only). Add the minimal UI for this using existing components (e.g. an edit/delete menu on the flashcard and set card, reusing the Add Word form in edit mode). Deleting a set asks for confirmation.
4. **Image upload** (optional field): upload through the storage interface, validate type (jpg/png/webp) and size (≤ 2 MB), store the file key, serve through the same file route as audio.
5. **Spaced repetition with ts-fsrs**:
   - A card per user per word, created when the user adds a word or starts a system set.
   - `getReviewDueCount` / `getReviewDue` return cards due now.
   - A new Server Action grades a card ("Know it" / "Still learning" mapped to FSRS ratings — confirm the mapping with me), updates the card and writes a review log + activity event.
6. Search (`query` filter) uses a case- and accent-insensitive search (e.g. `unaccent` + `ILIKE`, or a trigram index) so Vietnamese titles match without diacritics.

## Done when
- Add, edit, delete and review flows work end to end; the review due count goes down after grading.
- Tests cover ownership (cannot edit/delete another user's or system words), duplicate prevention, FSRS scheduling on grade, and upload validation.
- Lint, typecheck, build and tests pass. Report. Then STOP.
