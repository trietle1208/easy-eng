# Phase 6 Report — Vocabulary CRUD and spaced repetition

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Read (DB-backed)
Replaced mock `src/lib/data/vocabulary.ts` with PostgreSQL + mappers:

| Function | Behaviour |
|---|---|
| `getWordSets` | System sets + user's sets; `learnedCount` / `status` from `user_word_cards`; accent-insensitive `query` via `foldSearch` (NFD) |
| `getTopicCounts` | Counts of visible sets by topic |
| `getWord` / `getWordsInSet` | Ownership-aware; image via storage public URL |
| `getSavedWordCount` / `getAddedToday` | User-owned words; today in user timezone |
| `getReviewDueCount` / `getReviewDue` | Cards with `due <= now`; returns `null` when empty |

### Create / update / delete
- `createWord` — personal or system set; reuses personal set by title; creates FSRS card; `activity_events.word_added`; duplicate guard
- `updateWord` / `deleteWord` — owner only (system/other → `FORBIDDEN`)
- `updateWordSet` / `deleteWordSet` — owner only; delete confirms in UI
- Server Actions in `src/lib/actions/create-word.ts` + `src/lib/actions/vocabulary.ts`

### Image upload
- `uploadWordImage` / `uploadWordImageAction` — jpg/png/webp, ≤ 2 MB, key `vocabulary/{userId}/{id}.ext`, served by `/files/...` (MIME added)

### Spaced repetition (`ts-fsrs` 5.4.1)
- Helpers: [`src/lib/fsrs/index.ts`](../src/lib/fsrs/index.ts)
- Cards created on `createWord` and `startWordSet`
- `gradeReview` — UI grades → FSRS ratings; writes card + `review_logs` + `review_done` activity
- Column `user_word_cards.learning_steps` (ts-fsrs 5.x)

### UI (minimal)
- Flashcard: grade buttons + shortcuts, edit/delete menu for owned words
- Word set card: Start/Study, edit/delete + confirm dialog for owned sets
- Vocabulary empty due state; Add Word form edit mode + file upload
- Home “Add to my words” + reading vocab popover wired to `createWordAction`

### Migration
[`drizzle/0003_vocab_search_dup.sql`](../drizzle/0003_vocab_search_dup.sql) — `unaccent` extension, `learning_steps`, unique indexes for duplicate words (user + system).

### Tests
[`src/lib/data/__tests__/vocabulary.test.ts`](../src/lib/data/__tests__/vocabulary.test.ts) — ownership, duplicates, FSRS scheduling, due count after grade, upload validation.

### GitNexus impact (pre-edit)
| Symbol | Risk | Notes |
|---|---|---|
| `createWord` | LOW | Action + add-word / vocab-popover |
| `getReviewDue` | LOW | Vocabulary page |

---

## 2. Contract changes

| Change | Why |
|---|---|
| `ReviewDue \| null` + `cardId` | Empty due queue; grade needs card id |
| `Word.owned` / `WordSet.owned` | Edit/delete menus |
| `UpdateWordInput` / `UpdateWordSetInput` / `ReviewGrade` | New mutations |
| `startWordSet` / `gradeReview` / `uploadWordImage` | Phase 6 actions |
| `getReviewDue` may be null | No cards due |

---

## 3. How to run / test

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content

pnpm lint && pnpm typecheck && pnpm test && pnpm build

pnpm dev
# Sign in → /vocabulary → Start set → Review (Still learning / Know it)
# Add word (optional image) → edit/delete owned word/set
# Reading popover / Home word of the day → Add to my words
```

**Verified this session:** lint, typecheck, test (41), build, migrate — all passed.

---

## 4. Decisions I should confirm

1. **FSRS mapping:** Still learning → `Rating.Again` (1); Know it → `Rating.Good` (3). Prefer Hard/Easy instead?
2. **Search:** in-memory `foldSearch` on visible sets (small catalog). DB `unaccent` installed for later SQL ILIKE if needed. OK?
3. **Reading popover** still targets system set `at-the-airport`, fallback personal “From reading”. Prefer always personal set?
4. **learnedCount** = cards with `reps > 0` or `state > 0` (not New). OK?

---

## 5. Plan for the next phase

**Phase 7 — Home, progress, profile** (`be-plan/08-phase-7-progress-profile.md`):

- Real `getContinueItems` / daily goal / heatmap from `activity_events`
- Profile stats + achievements
- Remove remaining `src/lib/mock/*`

**STOP** — await approval before Phase 7.
