# Phase 3d Report — Reading

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data
| File | Role |
|---|---|
| `src/types/reading.ts` | `ReadingPassage`, `Paragraph`, `VocabHighlight`, `ComprehensionQuestion`, check result types |
| `src/lib/mock/reading.ts` | Catalog of 7 passages; full Night Bus content + questions |
| `src/lib/data/reading.ts` | `getPassages()`, `getPassage()`, `checkReadingAnswers()`, first slug |

`/reading` redirects to `the-night-bus-to-da-lat` (active “Reading…” card in the mockup).

### UI (`src/components/reading/`)
| Component | Role |
|---|---|
| `ReadingTipBanner` | Dismissible tip |
| `ReadingSidebar` | Topic/level filters, index cards, weekly progress |
| `ReadingPassagePanel` | Notebook page, VI toggle, vocab highlights |
| `VocabPopover` | Keyboard-accessible Radix popover; **Add to my vocabulary** → `createWord()` |
| `ComprehensionQuiz` | MCQ + Check answers (✓/green underline, ✗/red circle + correct answer) |
| `ReadingView` | Layout shell for the page |

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3d-reading-default-1440.png`](./screenshots/phase-3d-reading-default-1440.png) | Sidebar + Night Bus passage |
| [`phase-3d-reading-blossom-1440.png`](./screenshots/phase-3d-reading-blossom-1440.png) | Blossom theme |
| [`phase-3d-reading-vocab-popover-1440.png`](./screenshots/phase-3d-reading-vocab-popover-1440.png) | Sticky vocab popover open |

---

## 3. Differences from mockup

1. Product name **Easy English**.
2. Full passage text + questions for **The Night Bus to Đà Lạt**; other cards use short stub bodies so the list stays browsable.
3. “Listen to this passage” is a non-functional hint on the progress card (Listening phase later).
4. New words from the popover are saved into the existing mock set `at-the-airport` via `createWord` (in-memory).

---

## 4. Decisions / notes

- Passage body uses segment tokens (`text` | `vocab`) so highlights stay stable without brittle string offsets.
- Popover closes with Esc / outside click (Radix); trigger is a real `<button>` with `aria-expanded`.
- Answer checking is client-called against `checkReadingAnswers` (same shape a future API would return).

---

## 5. Next phase

Await approval, then Listening (`ui-plan/08-phase-3e-listening.md` or next numbered plan).

**STOP.**
