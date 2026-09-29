# UI Implementation Brief (shared context for every phase)

Read this file fully before starting any phase. Each phase prompt only describes what is specific to that phase; everything here always applies.

## Context
- Stack: Next.js (App Router) + TypeScript. PostgreSQL will be used later, but NOT in the UI phases.
- Mockups are in `mockup/`:
  - `mockup/html/` — static HTML snapshots of each screen. Source of truth for exact values: colors, fonts, spacing, radii, shadows, SVG paths for hand-drawn marks.
  - `mockup/screenshot/` — PNG of each screen. Source of truth for how it should LOOK.
  - `mockup/PDF/` — all screens in one file, for overview.
- The HTML files are rendered snapshots: scripts were removed, so interactive states only exist as separate screens (e.g. Listening vs ListeningChecked, QuizQ1/Q2/Q3). Rebuild the behavior in React; do not paste the HTML markup 1:1.

## Scope
- UI and client-side interaction ONLY. No auth, no database, no API routes, no ORM, no seeders.
- If the repo already has backend code, database config or API routes, do not modify them.
- All data comes from typed mock data behind a data-access layer (see "Data layer").

## Tech stack
- Tailwind CSS, with all colors/radii/shadows as CSS variables (design tokens)
- next-themes for theme switching: `default` (green, frog mascot) and `blossom` (pink, foal mascot "Bông"), via `data-theme` on `<html>`
- next/font/google: Be Vietnam Pro (body), Patrick Hand (headings/handwriting), JetBrains Mono (formulas, IPA), with the `vietnamese` subset where available
- shadcn/ui (Radix) for dialog, popover, dropdown, tabs, tooltip, restyled to the notebook look
- lucide-react for icons
- Motion (framer-motion) for small animations only
- react-hook-form + zod for forms
- react-rough-notation where marks must animate; inline SVG (copied from the mockup HTML) for static hand-drawn marks
- Native `<audio>` with custom controls for Listening

## Screen map (mockup file → route)
| Mockup file | Route | Notes |
|---|---|---|
| Main, HomeMobile | `/` | HomeMobile = mobile layout of the same page |
| Grammar | `/grammar/[lessonSlug]` | `/grammar` redirects to the first lesson |
| Vocabulary | `/vocabulary` | |
| AddWord, BlossomAddWord (error state), BlossomAddWordSaved (success state) | `/vocabulary/new` | Also opens as a modal from /vocabulary (intercepting route) |
| Reading | `/reading/[slug]` | `/reading` redirects to the first passage |
| Listening, ListeningChecked | `/listening/[slug]` | Two states of one page |
| QuizStart, QuizQ1, QuizQ2, QuizQ3, QuizResults | `/quiz/[slug]` | One client flow: start → questions → results |
| Profile | `/profile` | Includes the theme switcher |
| Blossom* files | same routes | The same pages with `data-theme="blossom"`: use them to extract Blossom tokens, NOT as separate pages |
| BlossomMascot, BlossomFoalSheet | — | Reference for the Blossom palette, contrast and mascot poses |
| HomeNotebook, HomeScene | — | Alternative Home variations: ignore unless told otherwise |

## Data layer
- Types in `src/types/` (Lesson, GrammarTopic, Word, WordSet, ReadingPassage, ListeningLesson, Quiz, Question, UserProfile, Progress...), shaped so they can map to database tables later.
- Mock data in `src/lib/mock/`, using the realistic content shown in the mockups.
- Access ONLY through async functions in `src/lib/data/` (e.g. `getLesson(slug)`, `getWordSets()`, `createWord(input)`). Pages and components never import mock files directly. These functions will later be replaced by real DB queries.
- Mutations (add word, submit quiz) update in-memory state only, and return the same shape a real API would.
- Mock user: "Linh", as in the mockups.

## Component architecture
- Layout: `AppShell`, `Header`, `MainNav`, `FloatingActions`, `ThemeSwitcher`
- Notebook: `NotebookPage` (paper, ruled lines, margin line, binder rings), `GlassPanel`, `StickyNote`, `WashiTape`, `Doodle`
- Marks: `HandCircle`, `HandUnderline`, `Highlighter`, `CorrectionMark` (wrong word circled in red + green correction above + handwritten explanation with arrow)
- UI: `LevelBadge` (A1–C1), `LevelChips`, `ProgressBar` (hand-drawn), `Button` variants, `Mascot` (props `pose`, `size`; picks frog or foal by theme)
- Feature components live next to their page's route or in `src/components/<feature>/`.
- Server Components by default; `"use client"` only where there is interaction.

## Mascot assets
- Images load from `public/mascot/{frog|foal}/{pose}.webp` (poses: wave, read, listen, think, cheer, sleep, peek, face).
- Until real images exist, extract the inline SVG mascots from the mockup HTML into those paths as placeholders (SVG is fine). `Mascot` must not depend on SVG internals.

## Quality requirements
- Visual fidelity: each page matches its screenshot at 1440px (layout, colors, fonts, spacing). Minor differences are acceptable; structural ones are not.
- Responsive: 1440, 768, 390 (follow HomeMobile for mobile patterns).
- Accessibility: real `<button>`/`<a>`/`<input>`/`<label>`, aria-labels on icon-only buttons, visible focus, text contrast at least WCAG AA in both themes. Correct/incorrect never relies on color alone (keep the ✓/✗ icons).
- Vietnamese text renders correctly everywhere.
- No hard-coded colors in components: everything through tokens, so both themes work on every page.

## Verification (every phase)
- `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.
- For UI work: run the dev server, take Playwright screenshots at 1440px in both themes, and compare them side by side with `mockup/screenshot/`.

## Report format (end of every phase)
1. What was done (files created/changed)
2. Screenshots or a comparison summary
3. Differences from the mockup and why
4. Decisions I should confirm
5. Plan for the next phase

Then STOP and wait for approval. Never start the next phase on your own.
