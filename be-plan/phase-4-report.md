# Phase 4 Report — Content read from DB

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### DB-backed content reads
Replaced mock implementations in `src/lib/data/` with Drizzle queries + existing mappers:

| Module | Functions |
|---|---|
| [`catalog.ts`](../src/lib/data/catalog.ts) | First grammar / reading / listening / quiz slugs from DB |
| [`grammar.ts`](../src/lib/data/grammar.ts) | `getLesson`, `getAdjacentLessons`, `getGrammarTree` (filters, level counts, options) |
| [`reading.ts`](../src/lib/data/reading.ts) | `getPassages`, `getPassage`, `getReadingProgress`, `checkReadingAnswers` |
| [`listening.ts`](../src/lib/data/listening.ts) | `getListeningLessons`, `getListeningLesson`, `checkDictation` |
| [`quiz.ts`](../src/lib/data/quiz.ts) | `getQuiz` (public), `getLastAttempt`, `submitQuiz` (scores from full DB payload) |

Per-user `completed` / `inProgress` / grammar tree `progress.done` come from `user_lesson_progress` when signed in; otherwise `false` / `0`.

### Caching
- [`cache-tags.ts`](../src/lib/data/cache-tags.ts) — tags `content:grammar|reading|listening|quiz`
- [`content-cache.ts`](../src/lib/data/content-cache.ts) — `unstable_cache` wrapper (bypassed under Vitest)
- Content queries only; per-user progress merged after cache
- Seeder logs that Next should be restarted (or wait ≤1h) after content seed so cache refreshes

### Answer keys stripped from browser payloads
Public DTOs omit keys; scoring still uses secure server data:

| Domain | Public | Server-only |
|---|---|---|
| Reading | `ComprehensionQuestion` (no `correctIndex`) | `ComprehensionQuestionSecure` / `mapReadingQuestionsSecure` |
| Listening | `DictationBlank` (no `answer`/`accept`) | `DictationBlankSecure` / `mapDictationBlanksSecure` |
| Quiz | `QuizPublic` / `QuestionPublic` | full `Quiz` / `Question` via internal `getQuizSecure` |

Quiz UI components updated to `QuizPublic` / `QuestionPublic`. Check/submit Server Actions still return correct answers **only after** submit.

### Audio with Range
- [`src/app/files/[...path]/route.ts`](../src/app/files/[...path]/route.ts) — serves `STORAGE_DIR` with path traversal guard, MIME types, `Accept-Ranges` + HTTP `206` for seeking
- Matches `getStorage().publicUrl()` → `/files/…`

### Cleanup
- Removed `src/lib/mock/{grammar,reading,listening,quiz}.ts`
- Kept `home` / `profile` / `vocabulary` mocks (Phases 5–7)
- `scripts/dump-content-from-mocks.ts` now exits with a pointer to `content/*.json`

### Tests
- [`src/lib/data/__tests__/content-read.test.ts`](../src/lib/data/__tests__/content-read.test.ts) — found / not found / filters + answer-key absence
- Mapper tests assert public DTOs strip keys; seed-parity updated accordingly
- Vitest: `pool: forks` + `singleFork` (worker cleanup stability)

### Migrations
None (schema already from Phase 2).

---

## 2. Contract changes

| Change | Why |
|---|---|
| `getQuiz` → `QuizPublic` (no answer keys) | Security: keys never in RSC/client payload |
| Reading / listening public types omit answer fields | Same |
| `getSampleQuizSlug` reads first quiz from DB | Catalog honesty vs hard-coded nav constant |
| Grammar `levelCounts` / tree reflect seeded DB (~30 lessons), not mock marketing totals | Catalog honesty |
| `submitQuiz` / check-* load keys from DB, not from public DTO | Scoring without leaking keys to the browser |

Home / vocabulary / profile still mock-backed (later phases). `submitQuiz` still keeps last attempt in-memory for the process; seeded DB attempts are read when signed in (persist writes → Phase 5).

---

## 3. How to run / test

```bash
# Ensure Docker Desktop / daemon exposes /var/run/docker.sock
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content   # + --demo if you want progress flags

pnpm lint && pnpm typecheck && pnpm test && pnpm build

pnpm dev
# Grammar / reading / listening / quiz pages should match prior UI
# Audio seeking: open a listening lesson and scrub the player
# RSC payload: confirm no correctIndex / correctAnswers / blank.answer
```

Spot-check: compare with existing Playwright screenshots when DB is seeded.

**Agent environment note (2026-09-30):** `/var/run/docker.sock` was missing and Google Fonts were unreachable in the agent sandbox, so full `pnpm test` (needs Postgres) and `pnpm build` (needs fonts) could not be finished here. **Lint + typecheck passed.** Please run the block above on your machine to close verification.

---

## 4. Decisions I should confirm

1. **Catalog counts** — grammar tree / level chips now show real seed counts (~30), not mockup 474. OK?
2. **Cache invalidation after seed** — currently “restart Next or wait 1h”. Prefer a small admin/`revalidateTag` API in Phase 9?
3. **`getLastAttempt`** — reads DB for signed-in users + in-memory after `submitQuiz` this process. Persist attempts in Phase 5 as planned?
4. **Anonymous progress** — always empty; demo user’s flags only after sign-in. OK?

---

## 5. Plan for the next phase

**Phase 5 — Learning actions / progress** (`be-plan/06-phase-5-learning-actions.md`):

- Persist quiz attempts, reading/listening/grammar completion
- Wire Server Actions to write `user_lesson_progress` + `activity_events`
- Drop remaining in-memory quiz attempt store

**STOP** — await approval before Phase 5.
