# Phase 3f — Quiz flow

**Status:** complete (2026-09-29) — see `ui-plan/phase-3f-report.md`

Read `docs/ui-plan/00-brief.md` first. Reference: `QuizStart`, `QuizQ1` (multiple choice), `QuizQ2` (fill in the blank), `QuizQ3` (choose the correct sentence), `QuizResults`, and their Blossom versions.

## Build
One client-side flow on `/quiz/[slug]`:
1. **Start**: title, topic, level, number of questions, time limit, mascot encouragement, "Start quiz".
2. **Questions**: counter (e.g. 4/10), pencil-line progress bar, countdown timer, one question per notebook page, three question types (multiple choice, fill in the blank, choose the correct sentence). The selected answer is circled in pencil. Next/previous navigation.
3. **Results**: red-pen score with circle and "Passed!" stamp, stats (time used, accuracy, change vs last try, daily goal), mascot cheering, review list (✓ rows underlined green; ✗ rows with `CorrectionMark` and EN/VI explanation), filter All / Mistakes, buttons "Practise my mistakes", "Try again", "Next".

## Rules
- Each question type is its own component sharing one `QuizQuestion` interface, so new types can be added later.
- Quiz state survives a page refresh (sessionStorage), and the timer auto-submits at zero.
- Scoring goes through `submitQuiz(slug, answers)` in the data layer, not inside components.

## Data
Types Quiz, Question (discriminated union by type), QuizAttempt, QuizResult. Functions `getQuiz(slug)`, `submitQuiz(slug, answers)`, `getLastAttempt(slug)`.

## Done when
- The full flow works start → questions → results → try again.
- Every state matches its screenshot in both themes.
- Lint, type check and build pass. Report. Then STOP.
