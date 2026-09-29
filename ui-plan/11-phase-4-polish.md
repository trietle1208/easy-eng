# Phase 4 — Polish

**Status: done** (2026-09-29) · Report: `ui-plan/phase-4-report.md`

Read `docs/ui-plan/00-brief.md` first.

## Do
1. **Responsive pass**: every page at 1440, 768 and 390. Sidebars become drawers or stacked sections on mobile, following HomeMobile patterns. No horizontal scroll.
2. **Accessibility pass**: keyboard-only walkthrough of every page, focus states, aria-labels, heading order, form labels and error announcements, contrast check of text on glass and paper in both themes, `prefers-reduced-motion` respected.
3. **States**: loading (skeletons in notebook style), empty (sleeping mascot), and error states for every data-driven section; a `not-found` page and an `error` page in the same style.
4. **Performance**: background via next/image (AVIF/WebP), lighter backdrop blur on mobile, check that client components are only where needed, lazy-load heavy parts (audio, heatmap).
5. **Cleanup**: remove dead code and unused dependencies, make sure no component imports from `src/lib/mock/` directly, no hard-coded colors outside the tokens.
6. **Final visual check**: Playwright screenshots of every route in both themes at 1440 and 390, compared with `mockup/screenshot/`.

## Deliver
- `docs/ui-plan/phase-4-report.md` with the remaining differences from the mockups, known limitations, and a list of every function in `src/lib/data/` with its signature (this becomes the contract for the backend phase).

## Done when
Everything above passes, lint/type check/build pass. Then STOP.
