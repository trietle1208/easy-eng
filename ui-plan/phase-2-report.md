# Phase 2 Report — Layout shell

**Status:** complete — awaiting review before Phase 3  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Layout chrome
| Component | Role |
|---|---|
| `AppShell` | Theme gradient (+ optional `backgroundSrc` for future image), glow orbs, header, `GlassPanel` main, FABs, mobile bottom nav |
| `Header` | Logo + mascot face, `MainNav`, `ThemeSwitcher`, notifications (dot), achievements, user pill “Linh”, mobile hamburger menu |
| `MainNav` | Grammar / Vocabulary / Reading / Listening with active pill state (`aria-current`) |
| `ThemeSwitcher` | Dropdown “Theme · Giao diện” with frog/foal face thumbs; persists via `next-themes` |
| `FloatingActions` | Search, AI buddy, feedback (no-op buttons) — desktop only |
| `MobileBottomNav` | Home · Grammar · Words · Reading · Listening (HomeMobile pattern) |
| `PlaceholderPage` | Shared placeholder copy for all product routes |

### Routing (`src/app/(app)/` — AppShell; `/dev` stays outside)
| Route | Behavior |
|---|---|
| `/` | Home placeholder |
| `/grammar` | redirect → first lesson slug |
| `/grammar/[lessonSlug]` | placeholder |
| `/vocabulary`, `/vocabulary/new` | placeholders |
| `/reading` → `[slug]`, `/listening` → `[slug]` | redirect + placeholder |
| `/quiz/[slug]` | placeholder |
| `/profile` | placeholder |

Slugs via `src/lib/data/catalog.ts` (not imported from pages as mock files).

### Other
- ESLint ignores `.gitnexus/**` (generated runner)
- `pnpm lint`, `tsc --noEmit`, `pnpm build` all pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-2-home-default-1440.png`](./screenshots/phase-2-home-default-1440.png) | Header + glass + FABs |
| [`phase-2-home-blossom-1440.png`](./screenshots/phase-2-home-blossom-1440.png) | Blossom palette + foal |
| [`phase-2-home-default-390.png`](./screenshots/phase-2-home-default-390.png) | Compact header + bottom nav |
| [`phase-2-home-blossom-390.png`](./screenshots/phase-2-home-blossom-390.png) | Mobile blossom |
| [`phase-2-grammar-nav-1440.png`](./screenshots/phase-2-grammar-nav-1440.png) | Active Grammar nav after redirect |

---

## 3. Differences from mockup

1. Product name **Easy English** (not EngDaily).
2. Placeholder body instead of full Home/Grammar content (Phase 2 scope).
3. Mobile uses hamburger + bottom nav; HomeMobile mock shows “Sign In” (we keep logged-in “Linh” + Profile).
4. FABs fixed near viewport right; mock used absolute artboard coordinates (1358px).
5. Next.js dev “N” badge can overlap bottom-left on mobile screenshots — production build has no badge.

---

## 4. Decisions / notes

- Route group `(app)` wraps product pages in `AppShell`; `/dev/components` remains chrome-free for the gallery.
- Theme persistence: `next-themes` localStorage key `theme`.
- No open blockers for Phase 3a (Home content).

---

## 5. Next phase

**Phase 3a — Home** (`ui-plan/04-phase-3a-home.md`): fill `/` with goals, continue cards, word of the day, level chips — still inside this shell.

**STOP — waiting for approval before Phase 3.**
