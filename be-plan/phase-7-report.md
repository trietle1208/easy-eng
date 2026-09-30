# Phase 7 Report — Home, progress, profile and settings

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Pure progress helpers (`src/lib/progress/`)
Timezone-safe calendar helpers, streak (incl. rescue + ≥60s study sessions), daily goal builders, heatmap intensity bands, CEFR level %, achievement rule evaluation, and WOTD hash pick. Unit tests cover UTC midnight ICT boundaries, day gaps, rescue, and DST-free UTC.

### Home (`src/lib/data/home.ts`)
| Function | Behaviour |
|---|---|
| `getDailyGoal` | Today’s `word_added` / `grammar_done` vs settings; streak + 7-day checks in user TZ |
| `getContinueItems` | Up to 3 `in_progress` grammar / vocabulary_set rows by `updated_at` |
| `getWordOfTheDay` | Deterministic by date (+ preferred CEFR pool when signed in) |
| `getHomeCatalogStats` / `getSectionEntries` | Cached real content counts |
| `getGreeting` | Local hour in user TZ + session first name |

### Profile (`src/lib/data/profile.ts`)
| Function | Behaviour |
|---|---|
| `getProfile` | Real stats, level progress (equal-weight grammar/reading/listening; unlock ≥80%), settings |
| `getActivity` | Heatmap from `activity_events` minutes; intensity 0–4; longest streak label |
| `getAchievements` | Evaluate rules; persist newly earned with timestamp |
| `updateSettings` | DB-backed (theme follows user; `ThemeSync` on app layout) |
| `updateProfile` | Display name, CEFR level, timezone, goal text |
| `recordStudySession` | Study pause (≥60s) / Pomodoro complete → `study_session` event |

### UI
- Study timer: study counts up (records on pause ≥60s); Pomodoro counts down 25:00 (records on zero)
- Edit profile dialog enabled
- Quiz `dailyGoalLabel` now from real grammar goal counts

### Cleanup
- Removed `src/lib/mock/` entirely

### Product rules used (Phase 0 §1.5 defaults)
- Streak: qualifying kinds include any `quiz_done`; `study_session` ≥ 60s; rescue = one gap if today empty
- Level unlock threshold: previous band ≥ 80%
- WOTD: same day + level pool → same word
- Catalog honesty: real DB counts (not marketing 474/2140)

---

## 2. Contract changes

| Change | Why |
|---|---|
| `UpdateProfileInput` + `updateProfile` / `updateProfileAction` | Edit profile |
| `recordStudySession` / `recordStudySessionAction` | Study timer → activity |
| `getProfile` also returns `timezone`, `goalText` | Edit dialog defaults |
| Quiz `dailyGoalLabel` / `dailyGoalDetail` live | Phase 5 stub closed |
| `CONTENT_CACHE_TAGS.vocabulary` / `catalog` | Cached WOTD + home stats |

---

## 3. How to run / test

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content
# optional demo:
pnpm db:seed -- --demo

pnpm lint && pnpm typecheck && pnpm test && pnpm build

pnpm dev
# Sign in → / (streak, goals, continue, WOTD)
# Study timer pause after ≥60s → /profile heatmap + streak
# /profile → Edit profile, settings theme, achievements
```

---

## 4. GitNexus impact (pre-edit)

| Symbol | Risk | Notes |
|---|---|---|
| `getDailyGoal` | LOW | HomePage |
| `getProfile` | LOW | ProfilePage |
| `updateSettings` | LOW | ProfileSettings |
| `localDateString` | CRITICAL if behaviour changes | Relocated to `progress/dates` with identical semantics; re-exported from `progress-write` |

---

## 5. Verification

- `pnpm lint` — pass  
- `pnpm typecheck` — pass  
- `pnpm test` — 66 passed  
- `pnpm build` — pass  

---

## 6. STOP

Phase 7 complete. Do not start Phase 8 without approval.
