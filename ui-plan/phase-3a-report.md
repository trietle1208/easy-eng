# Phase 3a Report — Home page

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data layer
| File | Role |
|---|---|
| `src/types/home.ts` | `DailyGoal`, `WordOfTheDay`, `ContinueItem`, `SectionEntry`, … |
| `src/lib/mock/home.ts` | Mock content from Main / HomeMobile |
| `src/lib/data/home.ts` | `getDailyGoal()`, `getWordOfTheDay()`, `getContinueItems()`, `getSectionEntries()`, `getGreeting()` |

### UI (`src/components/home/`)
| Component | Role |
|---|---|
| `HomeView` | Client: level filter + layout columns |
| `HomeHero` | Time-based greeting, CTAs, mascot + speech bubble |
| `DailyGoalCard` | Streak, weekday checks, progress bars, Study/Pomodoro timer (client countdown) |
| `WordOfTheDayCard` | Sticky note + IPA + speech synthesis audio |
| `ContinueSection` | 3 resume cards (scroll on mobile) |

Route `/` (`src/app/(app)/page.tsx`) loads data on the server and renders `HomeView`.

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3a-home-default-1440.png`](./screenshots/phase-3a-home-default-1440.png) | Main layout vs mockup Main |
| [`phase-3a-home-blossom-1440.png`](./screenshots/phase-3a-home-blossom-1440.png) | Blossom theme |
| [`phase-3a-home-default-390.png`](./screenshots/phase-3a-home-default-390.png) | Mobile stack + bottom nav |
| [`phase-3a-home-blossom-390.png`](./screenshots/phase-3a-home-blossom-390.png) | Mobile blossom |

---

## 3. Differences from mockup

1. Product name **Easy English** (not EngDaily).
2. Greeting is **time-based** (morning/afternoon/evening); mockup snapshot is fixed “Good afternoon”.
3. “Add to my words” is a no-op button (no vocabulary persistence yet).
4. Level filter updates continue cards + section subtitles client-side; section entry counts stay catalog totals unless filtered label changes.
5. Level test CTA links to `/quiz/level-test` (placeholder quiz route).

---

## 4. Decisions / notes

- Timer resets when switching Study ↔ Pomodoro; starts paused.
- Continue cards keep slight paper rotation from the mockup.
- Phase 2 shell unchanged; home content fills `GlassPanel`.

---

## 5. Next phase

**Phase 3b — Grammar** was implemented in the same pass (user requested phases 2 + 3a + 3b together). See `phase-3b-report.md`.

**STOP — waiting for approval before Phase 3c / later phases.**
