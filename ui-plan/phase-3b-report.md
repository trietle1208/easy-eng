# Phase 3b Report — Grammar

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data layer
| File | Role |
|---|---|
| `src/types/grammar.ts` | `GrammarFamily`, `GrammarGroup`, `GrammarLesson`, filters, tree |
| `src/lib/mock/grammar.ts` | Tree (7 families) + featured lesson content from Grammar mockup |
| `src/lib/data/grammar.ts` | `getGrammarTree()`, `getLesson()`, `getAdjacentLessons()`, first-slug |

`/grammar` still redirects via `getFirstGrammarLessonSlug()` → `use-subject-verb-clauses`.

### UI (`src/components/grammar/`)
| Component | Role |
|---|---|
| `GrammarView` | Client filters (family / group / level) over tree |
| `GrammarTipBanner` | Dismissible tip |
| `GrammarSidebar` | Dropdowns, level chips with counts, collapsible tree, progress sticky, ↑↓ keyboard on lessons |
| `GrammarLessonPanel` | Notebook page: structure / examples / mistakes / practice + prev/next |

Route: `src/app/(app)/grammar/[lessonSlug]/page.tsx`.

### Other
- `NotebookPage` accepts `ringCount` (grammar uses 18 rings).
- First grammar slug moved off `nav.ts` into grammar mock/data.

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3b-grammar-default-1440.png`](./screenshots/phase-3b-grammar-default-1440.png) | Sidebar + notebook lesson |
| [`phase-3b-grammar-blossom-1440.png`](./screenshots/phase-3b-grammar-blossom-1440.png) | Blossom theme |

---

## 3. Differences from mockup

1. Product name **Easy English**.
2. Tree includes enough real lessons for navigation; catalog chip counts (474 / A1–C1) match mockup totals, while expandable tree is a realistic subset.
3. Non-featured lessons use stub structure/examples (enough to browse); featured lesson `use-subject-verb-clauses` matches mockup copy.
4. Mistake rows use `HandCircle` + green correction (same idea as `CorrectionMark`, layout closer to the Grammar HTML).
5. “Practice this” → `/quiz/[slug]` placeholder.

---

## 4. Decisions / notes

- Filters are client-side over the full tree payload (fine for mock size).
- Collapsed groups show lesson count chips; expanded groups list lessons with level badges.
- Keyboard: ArrowUp/Down/Home/End move focus across visible lesson links in the sidebar nav.

---

## 5. Next phase

Await approval, then Vocabulary (`ui-plan/06-phase-3c-vocabulary.md` or next numbered plan).

**STOP.**
