# Phase 3b — Grammar

Read `docs/ui-plan/00-brief.md` first. Reference: `Grammar`, `BlossomGrammar`.

## Build
- Left glass sidebar: title, family and grammar dropdown filters, level chips with counts (All, A1–C1), collapsible topic tree (family → group → lesson items with level badges), active lesson highlighted, scrollable.
- Dismissible tip banner.
- Right notebook page for the selected lesson:
  - Title + level badge
  - STRUCTURE box: formulas in mono with highlighter, italic explanations
  - EXAMPLES: sentences with hand underlines and italic explanations
  - COMMON MISTAKES: `CorrectionMark` rows (red circle on the wrong word, green correction above, handwritten explanation with arrow)
  - "Practice this" button and previous/next lesson navigation
- Mascot peeking from the page corner.

## Data
Types for GrammarFamily, GrammarTopic, Lesson (structure, examples, mistakes). Functions: `getGrammarTree(filters)`, `getLesson(slug)`, `getAdjacentLessons(slug)`. Use the lesson content from the mockup plus enough lessons for the tree to look real.

## Done when
- `/grammar` redirects to the first lesson; selecting a lesson changes the URL and content.
- Filters and level chips filter the tree; tree groups collapse/expand; keyboard navigation works.
- Matches the screenshots in both themes.
- Lint, type check and build pass. Report. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-3b-report.md`](./phase-3b-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-3b-*.png`
