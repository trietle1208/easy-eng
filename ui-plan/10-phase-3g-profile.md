# Phase 3g — Profile

**Status: done** (2026-09-29) · Report: `ui-plan/phase-3g-report.md`

Read `docs/ui-plan/00-brief.md` first. Reference: `Profile`, `BlossomProfile`.

## Build
- Header: avatar, name, current level, member since, "Edit profile" button.
- Stats row as sticky notes: streak, words learned, grammar lessons completed, study hours.
- Activity heatmap (hand-colored grid, last ~6 months, tooltip per day).
- Progress by level (A1–C1) as hand-drawn progress bars.
- Achievements shelf: sticker badges, locked ones greyed out with a text label (not color only).
- Settings: daily goal, notification reminders, interface language (English / Tiếng Việt), and the theme switcher with both theme previews (same state as the header switcher).

## Data
Types UserProfile, UserStats, ActivityDay, LevelProgress, Achievement, UserSettings. Functions `getProfile()`, `getActivity(range)`, `getAchievements()`, `updateSettings(input)` (in-memory).

## Done when
- Changing the theme here and in the header stays in sync; settings changes persist in memory during the session.
- Matches the screenshots in both themes.
- Lint, type check and build pass. Report. Then STOP.
