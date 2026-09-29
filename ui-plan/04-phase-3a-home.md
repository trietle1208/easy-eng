# Phase 3a — Home page

Read `docs/ui-plan/00-brief.md` first. Reference: `Main`, `HomeMobile`, `BlossomHome`.

## Build
- Hero: greeting (time-based, EN + VI), headline, subtitle, "Start learning" and "Take the level test" buttons, mascot with speech bubble ("Only N words left for today's goal!").
- Today's goal card: date, streak with weekday checks, new-words and grammar progress, study timer (Study / Pomodoro toggle, play button, counting down client-side).
- Word of the day sticky note: word, IPA, part of speech, level, Vietnamese meaning, example with highlight, audio button, "Add to my words".
- Continue where you left off: 3 progress cards (grammar/vocabulary) with Resume links.
- Pick your level: level chips that filter the cards/sections (client state).
- Section entry cards: Grammar and Vocabulary with counts.

## Data
Add the types and functions needed (e.g. `getDailyGoal()`, `getWordOfTheDay()`, `getContinueItems()`), backed by mock data.

## Done when
- Matches `Main` at 1440 and `HomeMobile` at 390, and `BlossomHome` in the blossom theme.
- Timer and level filter work.
- Lint, type check and build pass. Report with side-by-side comparisons. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-3a-report.md`](./phase-3a-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-3a-*.png`
