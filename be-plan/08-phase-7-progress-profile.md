# Phase 7 — Home, progress, profile and settings

Read `be-plan/00-brief.md` first.

## Goal
Everything personal on Home and Profile is computed from real data.

## Do
1. **Home** (`home.ts`):
   - `getDailyGoal`: today's new words and grammar progress vs. the user's settings targets, streak and the 7-day checks, all in the user's timezone.
   - `getContinueItems`: most recent in-progress items from lesson progress, filtered by level.
   - `getWordOfTheDay`: deterministic per date (same word for everyone on the same day), preferring the user's level when signed in.
   - `getHomeCatalogStats`, `getSectionEntries` from content counts (cached).
   - `getGreeting`: time of day in the user's timezone + real display name.
2. **Profile** (`profile.ts`):
   - `getProfile`: profile, stats (streak, best streak, words learned, words this week, grammar done/total, study hours), level progress (formula approved in Phase 0), settings.
   - `getActivity(range)`: heatmap days from `activity_events`, intensity buckets, month labels, longest streak.
   - `getAchievements`: evaluate rules, persist newly earned achievements with a timestamp.
   - `updateSettings`: Server Action with a Zod schema; theme is saved to the DB and applied on sign-in so it follows the user across devices (keep next-themes for instant switching).
   - **Edit profile**: enable the disabled button — display name, current level, timezone.
3. **Study timer** on Home: record completed study/Pomodoro sessions as activity events (confirm the rule from Phase 0).
4. Put streak, goal and level calculations in pure functions in `src/lib/progress/` with thorough unit tests (timezone boundaries, day gaps, streak rescue setting, DST-free zones).
5. Remove the remaining mock files; `src/lib/mock/` should be gone.

## Done when
- A new user sees an empty-but-correct Home and Profile (empty states, zero streak); the demo user sees data like the mockups.
- Actions from Phases 5–6 immediately change the streak, goals, heatmap and achievements.
- Lint, typecheck, build and tests pass. Report. Then STOP.
