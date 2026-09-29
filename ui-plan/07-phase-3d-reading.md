# Phase 3d — Reading

Read `docs/ui-plan/00-brief.md` first. Reference: `Reading`, `BlossomReading`.

## Build
- Left: list of passages as index cards (title, topic, level, reading time, completed check).
- Right notebook page: title, level, word count, reading time; passage text aligned to the ruled lines.
- New-vocabulary words highlighted; clicking one opens a sticky-note popover (IPA, Vietnamese meaning, "Add to my vocabulary" using `createWord`).
- Toggle to show/hide the Vietnamese translation under each paragraph.
- Comprehension questions (multiple choice) with "Check answers": correct answers get ✓ and green underline, wrong ones get ✗ and a red circle with the correct answer.

## Data
Types ReadingPassage, Paragraph, VocabHighlight, ComprehensionQuestion. Functions `getPassages()`, `getPassage(slug)`, `checkReadingAnswers(slug, answers)`.

## Done when
- Popovers are keyboard accessible and close correctly; translation toggle and answer checking work.
- Matches the screenshots in both themes.
- Lint, type check and build pass. Report. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-3d-report.md`](./phase-3d-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-3d-*.png`
