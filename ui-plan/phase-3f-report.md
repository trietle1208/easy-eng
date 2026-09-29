# Phase 3f Report — Quiz flow

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data
| File | Role |
|---|---|
| `src/types/quiz.ts` | `Quiz`, discriminated `Question` union, `QuizAttempt`, `QuizResult`, answers map |
| `src/lib/mock/quiz.ts` | Full **Present perfect vs. past simple** (10 Qs) + **subject + verb clauses** quiz; seed last attempt 6/10 |
| `src/lib/data/quiz.ts` | `getQuiz`, `getLastAttempt`, `submitQuiz`, timer helpers |

`/quiz` redirects to `present-perfect-vs-past-simple`. Scoring only via `submitQuiz` (optional `questionIds` for practise-mistakes runs).

### UI (`src/components/quiz/`)
| Component | Role |
|---|---|
| `QuizStart` | Title, stats, type chips, VI hints switch, mascot + last-try sticky |
| `QuizQuestions` | Quit, counter, pencil progress, timer, question dots, notebook page |
| `QuizQuestionMultipleChoice` / `FillBlank` / `CorrectSentence` | One component per type; shared `QuizQuestionProps` |
| `QuizQuestionView` | Discriminated render |
| `QuizResults` | Red-pen score + Passed stamp, stats, All/Mistakes filter, CorrectionMark review, CTAs |
| `QuizView` | Client flow start → questions → results; `sessionStorage` persistence; timer auto-submit |

### Other
- Tokens: `--sticky-pink`, `--ink-write`
- StickyNote pink color wired to token
- `SAMPLE_QUIZ_SLUG` → `present-perfect-vs-past-simple`

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3f-quiz-start-default-1440.png`](./screenshots/phase-3f-quiz-start-default-1440.png) | Start screen |
| [`phase-3f-quiz-start-blossom-1440.png`](./screenshots/phase-3f-quiz-start-blossom-1440.png) | Blossom start |
| [`phase-3f-quiz-q-default-1440.png`](./screenshots/phase-3f-quiz-q-default-1440.png) | Question phase |
| [`phase-3f-quiz-results-default-1440.png`](./screenshots/phase-3f-quiz-results-default-1440.png) | Results |
| [`phase-3f-quiz-results-blossom-1440.png`](./screenshots/phase-3f-quiz-results-blossom-1440.png) | Blossom results |

---

## 3. Differences from mockup

1. Product name **Easy English** (not EngDaily).
2. Question nav is clickable dots (mockup static); Check answer advances / Submit on last.
3. Selected option uses green soft fill + dashed pencil check (mockup), not a HandCircle.
4. Results “Next” goes to `/grammar/future-plans-going-to` (next stub after present perfect).
5. Practise mistakes re-runs only wrong question ids with a scaled timer.

---

## 4. Decisions / notes

- Session key: `easy-english:quiz:{slug}` (phase, answers, timer endsAt, result).
- Last attempt is in-memory in the data layer (seeded 6/10 for present perfect); survives within the Node process, not across deploys.
- Fill-blank compare is case-insensitive trimmed string match against `correctAnswers`.

---

## 5. Next phase

Await approval, then Profile (`ui-plan/10-phase-3g-profile.md`).

**STOP.**
