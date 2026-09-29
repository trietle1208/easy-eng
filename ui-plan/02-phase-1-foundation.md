# Phase 1 — Foundation (tokens, fonts, themes, base components)

Read `docs/ui-plan/00-brief.md` and the approved `docs/ui-plan/phase-0-report.md` first.

## Goal
Everything pages will be built from: tokens, fonts, theme switching and the shared base components.

## Do
1. Install the dependencies approved in Phase 0.
2. Design tokens as CSS variables in the global stylesheet, with one block for `default` and one for `[data-theme="blossom"]`. Map them into the Tailwind theme so classes like `bg-paper`, `text-ink`, `bg-primary` work.
3. Fonts via next/font/google (Be Vietnam Pro, Patrick Hand, JetBrains Mono), exposed as CSS variables and Tailwind font families.
4. next-themes provider with the two themes, no flash on load.
5. Base components (see the brief):
   - Notebook: `NotebookPage`, `GlassPanel`, `StickyNote`, `WashiTape`, `Doodle`
   - Marks: `HandCircle`, `HandUnderline`, `Highlighter`, `CorrectionMark`
   - UI: `LevelBadge`, `LevelChips`, `ProgressBar`, `Button` (primary, ink/outline, ghost), `Mascot`
   - shadcn/ui primitives you will need (dialog, popover, dropdown-menu, tabs, tooltip), restyled with the tokens
6. Mascot placeholders in `public/mascot/{frog|foal}/` extracted from the mockup HTML.
7. A dev page `/dev/components` showing every component and variant, with a theme toggle at the top.

## Do NOT
- Build any real page yet.
- Hard-code colors anywhere outside the token definitions.

## Done when
- `/dev/components` renders every component correctly in both themes.
- Vietnamese text (e.g. "Luyện đọc hằng ngày") renders correctly in all three fonts.
- Lint, type check and build pass.
- Report with screenshots of `/dev/components` in both themes. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-1-report.md`](./phase-1-report.md)
- **Showcase:** `/dev/components`
- **Screenshots:** `ui-plan/screenshots/phase-1-dev-{default,blossom}.png`
- **Next:** await review, then Phase 2
