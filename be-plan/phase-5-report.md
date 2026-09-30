# Phase 5 Report — Learning actions and progress writes

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Server-side scoring + progress persistence
Check/submit still score from DB answer keys. Signed-in users now also write progress:

| Action | Scoring | Writes (signed-in only) |
|---|---|---|
| `checkReadingAnswers` | unchanged | `user_lesson_progress` (reading); `activity_events.reading_done` when perfect |
| `checkDictation` | normalize + alternates | `user_lesson_progress` (listening); `activity_events.listening_done` when perfect |
| `submitQuiz` | full / retry-mistakes via `questionIds` | `quiz_attempts`; `activity_events.quiz_done`; linked grammar → completed + `grammar_done` when full run **passed** |

Shared helpers: [`src/lib/data/progress-write.ts`](../src/lib/data/progress-write.ts) (`upsertLessonProgress`, `recordActivityEvent`, local date in user TZ).

### Lesson progress
- **Grammar visit:** `recordGrammarVisit` on lesson page → `in_progress` (does not downgrade `completed`).
- **Grammar completed:** practice quiz (or `lessonHref` grammar slug) **passed** on a full run.
- **Reading / listening:** any check → at least `in_progress`; all correct → `completed`.
- **Last position:** stored as `{ score, total }` or `{ section: "visit" }` for Continue (Phase 7).

### Anonymous path
Server Actions no longer `requireUser` for check/submit. Anonymous users still get scores; `progressSaved: false` and UI shows “Sign in to save…”.

### Idempotency
- Quiz: optional `clientAttemptId` (UUID) + unique `(user_id, client_attempt_id)`; 5s window dedupe when id missing.
- Activity events: 5s window on same `user` + `kind` + `payload.ref`.

### `getLastAttempt`
Reads only from `quiz_attempts` for the session user (in-memory store removed).

### Migration
[`drizzle/0002_fluffy_karen_page.sql`](../drizzle/0002_fluffy_karen_page.sql) — `quiz_attempts.client_attempt_id` + unique with `user_id`.

### Tests
[`src/lib/data/__tests__/learning-actions.test.ts`](../src/lib/data/__tests__/learning-actions.test.ts) — scoring edge cases, anonymous no-write, persist + delta, idempotency, cross-user isolation.  
Vitest setup mocks `server-only` so data-layer tests run in Node.

### GitNexus impact (pre-edit)
| Symbol | Risk | Notes |
|---|---|---|
| `submitQuiz` / `getLastAttempt` | **HIGH** | Quiz UI processes; contract kept, persist + `progressSaved` only |
| `checkReadingAnswers` / `checkDictation` | LOW | Action + quiz components |
| `getLesson` / grammar page | LOW | Visit touch added |

### Follow-up patch (same day) — live UI + revalidation gaps
Done-when required sidebar / grammar progress to update after completing reading, dictation, or quiz. Gaps found and fixed:

| Gap | Fix |
|---|---|
| Sidebar stayed stale after check (revalidate without client refresh) | `router.refresh()` when `progressSaved` in `comprehension-quiz`, `dictation-exercise`, `quiz-view` |
| Reading/listening list cache narrow | `revalidatePath("/reading"\|"/listening", "layout")` |
| Quiz pass → grammar “done” count stale | `revalidatePath("/grammar", "layout")` in `submitQuizAction` |

**Still deferred to Phase 7:** `getContinueItems` remains mock; Phase 5 only writes `lastPosition` / `in_progress` for Continue to consume later.

GitNexus impact (patch): `submitQuizAction` / `QuizView.finish` **HIGH** (quiz flows); reading/dictation actions **LOW**. Additive refresh/revalidate only.

---

## 2. Contract changes

| Change | Why |
|---|---|
| `CheckReadingAnswersResult.progressSaved` | Tell UI whether progress was written |
| `CheckDictationResult.progressSaved` | same |
| `QuizResult.progressSaved` | same |
| `submitQuiz` options `clientAttemptId?: string` | Idempotent double-submit |
| Check/submit actions allow anonymous | Phase 5: score without forcing sign-in |
| `recordGrammarVisit(slug)` | Grammar visit → in_progress |

---

## 3. How to run / test

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content   # + --demo for sample progress

pnpm lint && pnpm typecheck && pnpm test && pnpm build

pnpm dev
# Sign in → complete reading (all correct), dictation, quiz
# Sidebar completed flags should update immediately (no full page reload)
# Pass linked practice quiz → grammar “X of Y lessons done” updates after navigation/refresh of grammar
# Sign out → check answers still works; “Sign in to save” appears
```

**Verified this session:** lint, typecheck, test (34), build — all passed (initial Phase 5). Follow-up patch: typecheck on touched UI/actions.

---

## 4. Decisions I should confirm

1. **Reading/listening “completed”** = all answers correct on check. Partial → `in_progress` only (no `*_done` event). OK?
2. **Grammar “completed”** = linked practice quiz full run **passed** (via `practiceQuizSlug` or `lessonHref`). No “Mark as done” button yet. OK?
3. **Activity on partial checks** — not written (only on completion / every quiz submit). Prefer an event on every check?
4. **Daily goal labels** on quiz results still stub `"2 / 2"` until Phase 7 aggregates `activity_events`.

---

## 5. Plan for the next phase

**Phase 6 — Vocabulary CRUD + FSRS** (`be-plan/07-phase-6-vocabulary.md`):

- Persist `createWord` / word sets / cards with `ts-fsrs`
- Ownership checks; activity `word_added` / `review_done`

**STOP** — await approval before Phase 6.
