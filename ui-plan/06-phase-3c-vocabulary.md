# Phase 3c — Vocabulary and Add Word

Read `docs/ui-plan/00-brief.md` first. Reference: `Vocabulary`, `AddWord`, `BlossomAddWord` (error state), `BlossomAddWordSaved` (success state).

## Build
- `/vocabulary`: search bar, topic filters, level chips, grid of word-set cards (title, word count, level, progress), "Review due today" sticky note, "Add word" button.
- Word detail as a flashcard (word, IPA, part of speech, Vietnamese meaning, examples with highlight, audio button, "Know it" / "Still learning").
- `/vocabulary/new`: full page, and also a modal when opened from /vocabulary (intercepting + parallel routes).
- Add Word form with react-hook-form + zod: word*, IPA, part of speech, Vietnamese meaning*, English definition, multiple example sentences (add/remove), word set (select existing or create new), level chips, optional image, notes.
  - Inputs styled as handwritten underlines; errors shown as in `BlossomAddWord` (red circle + handwritten note).
  - Live preview card next to the form.
  - Buttons: Save word, Save & add another, Cancel.
  - Success state as in `BlossomAddWordSaved` (flashcard + mascot celebration).
- The zod schema lives in a shared file so the backend can reuse it later.

## Data
Types Word, WordSet, NewWordInput. Functions `getWordSets(filters)`, `getWord(id)`, `getReviewDueCount()`, `createWord(input)` (in-memory).

## Done when
- Search and filters work; the form validates, saves to in-memory data, and the new word appears in its set.
- Modal and full-page versions both work, including closing with Esc and the back button.
- Matches the screenshots in both themes.
- Lint, type check and build pass. Report. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-3c-report.md`](./phase-3c-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-3c-*.png`
