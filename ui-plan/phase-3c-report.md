# Phase 3c Report — Vocabulary and Add Word

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data / schema
| File | Role |
|---|---|
| `src/types/vocabulary.ts` | `Word`, `WordSet`, `NewWordInput`, topics, POS |
| `src/lib/schemas/new-word.ts` | Shared Zod `newWordSchema` (reusable later by backend) |
| `src/lib/mock/vocabulary.ts` | In-memory sets + words + `insertMockWord` |
| `src/lib/data/vocabulary.ts` | `getWordSets`, `getWord`, `getReviewDue*`, `createWord`, … |

### UI
| Component | Role |
|---|---|
| `VocabularyView` | Search, level/topic chips, word-set grid, review sticky |
| `WordSetCard` | Title, counts, level, progress |
| `Flashcard` | Flip (click / Space), UK/US audio, Know it / Still learning |
| `AddWordForm` | RHF + Zod, underline inputs, live preview, success banner, added-today list |
| `AddWordModal` | Dialog wrapper; Esc + overlay close → `router.back()` |

### Routing
- `/vocabulary` — list
- `/vocabulary/new` — full page
- Parallel + intercepting: `(app)/@modal/(.)vocabulary/new` opens modal over vocabulary when navigating from in-app links
- `(app)/layout.tsx` renders `{children}` in `AppShell` and `{modal}` as sibling overlay

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3c-vocabulary-default-1440.png`](./screenshots/phase-3c-vocabulary-default-1440.png) | List + review flashcard |
| [`phase-3c-vocabulary-blossom-1440.png`](./screenshots/phase-3c-vocabulary-blossom-1440.png) | Blossom |
| [`phase-3c-add-word-default-1440.png`](./screenshots/phase-3c-add-word-default-1440.png) | Add word form + preview |
| [`phase-3c-add-word-blossom-1440.png`](./screenshots/phase-3c-add-word-blossom-1440.png) | Blossom form |
| [`phase-3c-add-word-errors-blossom-1440.png`](./screenshots/phase-3c-add-word-errors-blossom-1440.png) | Validation errors (handwritten) |

---

## 3. Differences from mockup

1. Product name **Easy English**.
2. Topic chip catalog counts match mockup totals (86 / …); grid shows a realistic subset of sets.
3. Optional image is a URL field (no file upload in UI phases).
4. Pronunciation UK/US uses `speechSynthesis` (no generated audio files).
5. Flashcard “Know it / Still learning” flips / acknowledges locally (no spaced-repetition backend yet).
6. Intercepting modal uses Radix Dialog; hard navigation to `/vocabulary/new` is the full page.

---

## 4. Decisions / notes

- Mutations stay in-process memory via mock module helpers (persist until server restart).
- “Add word” from the list uses client navigation so the intercepting route can show the modal.
- Zod schema lives under `src/lib/schemas/` for later API reuse.

---

## 5. Next phase

Await approval, then Reading (`ui-plan/07-…`) or the next numbered plan.

**STOP.**
