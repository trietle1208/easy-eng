# Phase 1 Report — Foundation

**Status:** complete — awaiting review before Phase 2  
**Date:** 2026-09-29  
**Decisions locked by user:** brand **Easy English** · **pnpm** · fonts = brief (Be Vietnam Pro / Patrick Hand / JetBrains Mono) · Zod **4.6**

---

## 1. What was done

### Scaffold
- `git init` (branch `main`)
- Next.js **15.5.26** App Router + React **19.1** + TypeScript + **Tailwind CSS v4**
- Package manager: **pnpm** (`easy-english@0.1.0`)

### Design system
- Tokens in `src/app/globals.css`: `:root` / `[data-theme="default"]` + `[data-theme="blossom"]`, mapped into Tailwind via `@theme inline` (`bg-paper`, `text-ink`, `bg-primary`, …)
- Fonts via `next/font/google` with CSS variables `--font-be-vietnam-pro`, `--font-patrick-hand`, `--font-jetbrains-mono`
  - Be Vietnam Pro: `latin` + `vietnamese`
  - Patrick Hand / JetBrains Mono: `latin` only (no Vietnamese subset on Google Fonts)
- `ThemeProvider` (`next-themes`) with `attribute="data-theme"`, themes `default` | `blossom`, no system theme, no FOUC (`suppressHydrationWarning`)

### Components
| Area | Files |
|---|---|
| Notebook | `NotebookPage`, `GlassPanel`, `StickyNote`, `WashiTape`, `Doodle` |
| Marks | `HandCircle`, `HandUnderline`, `Highlighter`, `CorrectionMark` |
| UI | `Button` (primary/ghost/ink/outline), `LevelBadge`, `LevelChips`, `ProgressBar`, `Mascot` |
| shadcn-style | `dialog`, `popover`, `dropdown-menu`, `tabs`, `tooltip` (Radix + tokens) |

### Assets
- `public/mascot/frog/{8 poses}.svg` — frog face placeholder (same art for all poses for now)
- `public/mascot/foal/{8 poses}.svg` — Bông with embedded `<defs>` from mockup sheet (varied compositions)

### Dev showcase
- `/dev/components` — every component + theme toggle
- Home `/` — short pointer to the gallery (not a real product page yet)

### Verification
- `pnpm exec tsc --noEmit` — pass
- `pnpm lint` — pass
- `pnpm build` — pass

---

## 2. Screenshots

| Theme | File |
|---|---|
| Default | [`ui-plan/screenshots/phase-1-dev-default.png`](./screenshots/phase-1-dev-default.png) |
| Blossom | [`ui-plan/screenshots/phase-1-dev-blossom.png`](./screenshots/phase-1-dev-blossom.png) |

Both taken at **1440px** width, full page, from `http://localhost:3456/dev/components`.

---

## 3. Differences from mockup / brief

1. **Brand string** is **Easy English** (user), not EngDaily from HTML mockups.
2. **Tailwind v4** (create-next-app default) instead of v3 proposed in Phase 0 — tokens via `@theme inline` rather than `tailwind.config`.
3. **Frog poses** are identical placeholders; Foal poses vary. Real `.webp` art can replace paths later without changing `Mascot` API.
4. **Patrick Hand / JetBrains** lack Vietnamese subsets — Vietnamese in those faces falls back to Be Vietnam Pro / system where glyphs missing; body copy uses Be Vietnam Pro correctly.
5. Sticky “pink” variant still uses `--sticky` token (Blossom’s pink sticky); cream washi on default sticky matches Main, striped washi is available via `WashiTape` variants for Blossom cards later.
6. No real product pages yet (Phase 1 scope).

---

## 4. Decisions already confirmed / defaults used

| Topic | Choice |
|---|---|
| Brand | Easy English |
| Fonts | Be Vietnam Pro / Patrick Hand / JetBrains Mono |
| Package manager | pnpm |
| Zod | 4.6.x |
| Theme attribute | `data-theme` |
| Git | initialized locally (no remote / no commit unless you ask) |

No further blockers for Phase 2.

---

## 5. Plan for next phase (Phase 2 — Layout shell)

Per `ui-plan/03-phase-2-layout-shell.md`:
- `AppShell`, `Header`, `MainNav`, `FloatingActions`, `ThemeSwitcher`
- Placeholder routes for the full screen map
- Mobile header patterns from HomeMobile
- Persist theme; match screenshots at 1440 / 390

**STOP — waiting for approval before Phase 2.**
