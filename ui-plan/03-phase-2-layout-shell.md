# Phase 2 — Layout shell

Read `docs/ui-plan/00-brief.md` first.

## Goal
The frame every page lives in, matching the header, background and container of the mockups.

## Do
1. `AppShell` in the root layout: full-screen illustrated background (placeholder gradient per theme via tokens, ready to accept an image through next/image), and the centered glass container.
2. `Header`: logo + mascot face, `MainNav` (Grammar, Vocabulary, Reading, Listening, with the active state), theme button, notifications (with dot), achievements, user pill ("Linh").
3. `ThemeSwitcher`: dropdown from the header theme button (see BlossomHome) showing both themes with mascot-face thumbnails.
4. `FloatingActions` on the right edge: search, AI assistant, feedback (buttons only; no functionality yet).
5. Placeholder pages for every route in the screen map, so navigation works end to end.
6. Mobile header/navigation following HomeMobile.

## Do NOT
- Build page content beyond placeholders.

## Done when
- Navigation works between all routes, active states are correct.
- Theme switching works from the header and persists after reload.
- Header and background match the screenshots at 1440px and HomeMobile at 390px, in both themes.
- Lint, type check and build pass. Report with screenshots. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-2-report.md`](./phase-2-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-2-*.png`
- **Next:** await review, then Phase 3a (Home)
