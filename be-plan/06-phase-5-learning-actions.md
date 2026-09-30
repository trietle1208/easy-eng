# Phase 5 — Learning actions and progress writes

> **Status: done** (2026-09-30) — see `be-plan/phase-5-report.md`.

Read `be-plan/00-brief.md` first.

## Goal
Checking answers and finishing lessons are scored on the server and recorded as the user's progress.

## Do
1. **Server-side scoring** (Server Actions calling the data layer):
   - `checkReadingAnswers`: score from DB, store the result, mark the passage completed (or in progress).
   - `checkDictation`: normalize and compare with accepted answers from DB, store the result.
   - `submitQuiz`: score from DB (keep the existing scoring logic and the "retry mistakes only" mode via `questionIds`), save a `quiz_attempts` row, compute `deltaVsLast` from the previous full attempt, build messages with the user's real name.
2. **Lesson progress**: record grammar lesson visits/completion (define with me what "completed" means, e.g. practice quiz passed or explicit "Mark as done"), reading and listening status, last position for "Continue where you left off".
3. **Activity events**: every scored action and completion writes an `activity_events` row (type, reference, minutes, local date in the user's timezone). This is the single source for streaks, daily goals and the heatmap in Phase 7.
4. `getLastAttempt` reads from `quiz_attempts`.
5. Anonymous users: checking answers still works (no writes); the UI invites them to sign in to save progress.
6. Idempotency: double-submitting the same attempt must not create duplicates (client-generated attempt id or a short time window).

## Done when
- Completing a reading, dictation and quiz updates the sidebar completed flags, "Continue where you left off", and the last-attempt comparison.
- Tests cover scoring edge cases (empty answers, case/whitespace, alternates, partial retry) and that one user can never read or write another user's attempts.
- Lint, typecheck, build and tests pass. Report. Then STOP.
