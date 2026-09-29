# Phase 3g Report — Profile

**Status:** complete — continuing into Phase 4 per user request  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data
| File | Role |
|---|---|
| `src/types/profile.ts` | `UserProfile`, `UserStats`, `ActivityDay`, `LevelProgress`, `Achievement`, `UserSettings`, … |
| `src/lib/mock/profile.ts` | Linh Trần mock + deterministic 26-week heatmap |
| `src/lib/data/profile.ts` | `getProfile`, `getActivity`, `getAchievements`, `updateSettings` (in-memory) |

### UI (`src/components/profile/`)
| Component | Role |
|---|---|
| `ProfileHeader` | Avatar initials, mascot peek, level, member since, Edit (disabled stub) |
| `ProfileStats` | 4 sticky notes (streak / words / grammar / hours) |
| `ActivityHeatmap` | Hand-colored grid + tooltips (lazy-loaded) |
| `LevelProgressPanel` | A1–C1 hatched bars + “you are here” |
| `AchievementsShelf` | Sticker badges; locked grey + “locked” text |
| `ProfileSettings` | Goals, reminders, language, theme cards (syncs with header via `next-themes`) |
| `ProfileView` | Composes the page |

### Tokens / shared
- Sticky green/blue + heat-0…4 tokens (default + blossom)
- `StickyNote` colors: `yellow` \| `pink` \| `green` \| `blue` (defaults unchanged)

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

### GitNexus
- `ThemeSwitcher` upstream: **LOW** (Header only)
- `StickyNote` upstream: **CRITICAL** hub — change is additive color options only; default path unchanged

---

## 2. Screenshots

Taken with Phase 4 visual pass (`phase-3g-profile-*.png` / `phase-4-*`).

---

## 3. Differences from mockup

1. Product name **Easy English** (not EngDaily).
2. Edit profile is a disabled button (no backend).
3. Heatmap intensities are deterministic from date hashes (not pixel-matched to the static HTML grid).
4. Theme card previews use mascot PNG/SVG face assets instead of full inline foal SVG.

---

## 4. Decisions / notes

- Settings persist in-memory for the process; theme also writes through `next-themes` so header stays in sync immediately (even before Save).
- Save commits the full draft via `updateSettings`.

---

## 5. Next phase

Phase 4 polish (`ui-plan/11-phase-4-polish.md`) — started in the same session per approval.

**STOP was waived** — user asked for both plans together.
