# Phase 0 Report — Audit and plan

**Status:** complete — awaiting review before Phase 1  
**Date:** 2026-09-29  
**Sources:** `ui-plan/00-brief.md`, all files in `mockup/html/`, all PNGs in `mockup/screenshots/`

> Plan file `01-phase-0-audit.md` asked for `docs/ui-plan/phase-0-report.md`. Plans actually live under `ui-plan/`, so this report is written here. A copy path note is in §7.

---

## 1. Repo audit

### Current structure

```
chill-english/
├── mockup/
│   ├── html/                 # 30 HTML screen snapshots (source of truth for values)
│   ├── screenshots/          # PNG references (source of truth for look)
│   ├── EngDaily-mockups.pdf  # overview PDF (not in a PDF/ subfolder)
│   └── .bsk-session
├── ui-plan/                  # phase prompts 00–11
└── .vscode/tasks.json
```

**There is no application code yet.** No `package.json`, no `src/`, no Next.js config, no Tailwind, no git repository (`.git` missing).

### Versions (proposed for Phase 1 — nothing installed yet)

Aligned with the sibling project `english-flow` and the brief:

| Package | Proposed version |
|---|---|
| next | 15.5.x |
| react / react-dom | 19.1.x |
| typescript | 5.x |
| tailwindcss | 3.4.x |
| next-themes | 0.4.x |
| lucide-react | ^0.460 |
| motion (framer-motion) | ^12 or ^13 |
| react-hook-form | ^7 |
| zod | ^3 or ^4 |
| @hookform/resolvers | matching zod |
| class-variance-authority / clsx / tailwind-merge | current |
| shadcn/ui (Radix): dialog, popover, dropdown-menu, tabs, tooltip | via shadcn CLI |
| react-rough-notation | latest |
| @playwright/test | for screenshot verification |

### Do NOT touch (when they exist later)

Per brief — UI phases only. When backend lands, leave alone:

- Any `src/db/`, Drizzle/Prisma config, migrations, seeders
- Auth (better-auth / next-auth / etc.)
- `src/app/api/**` route handlers
- `.env*`, database connection strings
- PostgreSQL / Docker DB compose services

**Today:** nothing to protect except `mockup/` (read-only reference) and `ui-plan/` (planning docs).

### Path mismatches vs brief

| Brief says | Actual |
|---|---|
| `mockup/screenshot/` | `mockup/screenshots/` |
| `mockup/PDF/` | `mockup/EngDaily-mockups.pdf` (flat) |
| `docs/ui-plan/` | `ui-plan/` |

### Brand in mockups

Product name everywhere is **EngDaily** (not “Chill English”). Folder is `chill-english`.

---

## 2. Token table

Canonical CSS-variable names taken from `AddWord.html` / `BlossomAddWord.html` (the only mockups that already use a token block). Mapped to Tailwind-friendly names for Phase 1.

| Token (CSS) | Tailwind hint | Default (green / frog) | Blossom (pink / foal) | Used for |
|---|---|---|---|---|
| `--ink` | `text-ink` / `bg-ink` | `#2B2118` | `#3E2230` | Body text on paper |
| `--ink-2` | `text-ink-2` | `#1F1811` | `#33192A` | Stronger headings on paper |
| `--line` | `border-line` | `#3A2E22` | `#5A2E3E` | Sketch borders, ink buttons |
| `--muted` | `text-muted` | `#6B5A48` | `#7A5463` | Secondary text on paper |
| `--paper` | `bg-paper` | `#FBF5E6` | `#FFF5F1` | Notebook page fill |
| `--white` | `bg-surface` | `#FFFDF6` | `#FFFBFA` | Inner white / hbar track |
| `--primary` | `bg-primary` | `#B5D99A` | `#F4A7B9` | Primary buttons, active nav/chips |
| `--on-primary` | `text-on-primary` | `#1F3A14` | `#4A1D2E` | Text on primary |
| `--primary-shadow` | (shadow token) | `#6F9A55` | `#C9788F` | 4px “press” under primary btn |
| `--primary-soft` | `bg-primary-soft` | `#D3EDB8` | `#FAD3DE` | Soft fills (avatar, week done) |
| `--kick` | `text-kick` | `#4A7336` | `#A8355F` | Uppercase kicker labels |
| `--link` | `text-link` | `#3F6B2E` | `#A8355F` | Links on paper / body |
| `--glass` | `bg-glass` | `rgba(50,33,20,.6)` | `rgba(88,38,58,.7)` | Main glass panel |
| `--on-glass` | `text-on-glass` | `#FFF4E4` | `#FFF1F4` | Primary text on glass/bg |
| `--on-glass-2` | `text-on-glass-2` | `#E9D8C0` | `#FBE3EA` | Secondary text on glass |
| `--soft` | `bg-soft` | `rgba(255,240,220,.08)` | `rgba(255,225,235,.1)` | Soft cards on glass |
| `--soft-border` | `border-soft` | `rgba(255,236,210,.18–.24)` | `rgba(255,214,228,.24–.3)` | Borders on glass elements |
| `--pill` | `bg-pill` | `rgba(50,33,20,.45–.55)` | `rgba(88,38,58,.5–.6)` | Nav pills, icon buttons, fabs |
| `--danger` / `--red` | `text-danger` | `#B8372E` | `#C8102E` | Errors, today ring, wrong marks |
| `--danger-bg` | `bg-danger-soft` | `#FFF4F1` | `#FFF0F0` | Error field backgrounds |
| `--success` / `--green` | `text-success` | `#2E7D32` | `#2E7D32` | Correct marks (shared) |
| `--highlight` | highlighter | `rgba(255,222,70,.88)` | `rgba(255,140,175,.55)` | Highlighter mark |
| `--rule` | paper lines | `rgba(94,128,160,.15)` | `rgba(200,110,140,.16)` | Ruled notebook lines |
| `--margin` | margin line | `rgba(210,69,59,.32)` | `rgba(214,90,130,.35)` | Red margin rule at 62px |
| `--ring` | binder metal | `#4E4740` | `#B98497` | Binder ring stroke |
| `--hole` | binder hole | `#3A2A1C` | `#6B3A4C` | Binder hole fill |
| `--hatch-1` / `--hatch-2` | progress fill | `#7FB35E` / `#A3CF84` | `#E98AA6` / `#F6B9C9` | Striped progress bar |
| `--accent` | accents | `#7A5234` | `#9A4A6A` | Warm accent on paper |
| `--headline` | hero on glass | `#D2EDA4` | `#FFC6D5` | Large “Hi Linh” headline |
| `--focus` | focus ring | `#4A7336` | `#A8355F` | Focus outline |
| `--sticky` | sticky note | `#FFE98C` (`.y`) | `#FFD1DC` (`.pk`) | Word-of-the-day sticky |
| `--notif` | badge | `#E4574B` | `#E0445E` | Notification dot |
| `--bg-gradient` | page bg | `165deg #2A1A10 → #553520 → #8E5A2E → #C98543 → #E8AE6C` | `165deg #4A2436 → #7E3E5A → #C77D96 → #EFAFA8 → #FAD7C4` | Full-page background |
| `--glass-blur` | | `blur(22px) saturate(1.2)` | same | GlassPanel |
| `--glass-shadow` | | `0 30px 80px rgba(25,12,4,.45)` | `0 30px 80px rgba(60,20,40,.4)` | GlassPanel |
| `--paper-shadow` | | `0 16px 36px rgba(25,12,4,.35)` | `0 16px 36px rgba(60,20,40,.32)` | NotebookPage |
| `--radius-glass` | | `32px` | `32px` | Main glass container |
| `--radius-pill` | | `999px` | `999px` | Buttons, chips, nav |
| `--radius-sketch` | | `14px 24px 12px 26px / 24px 12px 22px 14px` | same shape | Hand-drawn boxes |
| `--radius-fab` | | `16px` | `16px` | Floating action buttons |
| `--line-height-rule` | | `32px` (31px gap + 1px line) | same | Paper ruled lines |
| `--margin-x` | | `62px` | `62px` | Red margin inset |

### CEFR level colors (shared across themes)

| Level | Color |
|---|---|
| A1 | `#3B7D37` |
| A2 | `#2F6BAA` |
| B1 | `#7446AE` |
| B2 | Default `#B8372E` · Blossom `#A33B28` |
| C1 | `#B25E0E` |

### Fonts

| Role | Mockup HTML (current) | Brief (target) | CSS var |
|---|---|---|---|
| Body | Nunito | **Be Vietnam Pro** (`vietnamese`) | `--font-sans` |
| Hand / headings | Mali | **Patrick Hand** | `--font-hand` |
| Mono / IPA | Space Mono | **JetBrains Mono** | `--font-mono` |

`*-lofi-fonts.png` screenshots appear to preview the brief fonts — recommend following the **brief**, not the Nunito/Mali HTML links. **Confirm in §7.**

---

## 3. Component inventory

### Layout (Phase 2 — listed for completeness)

| Component | Props (draft) | Screens |
|---|---|---|
| `AppShell` | `children` | all |
| `Header` | — | all desktop |
| `MainNav` | `active?: NavKey` | all |
| `FloatingActions` | — | Home + others |
| `ThemeSwitcher` | — | Header / Profile |

### Notebook

| Component | Props | Screens |
|---|---|---|
| `NotebookPage` | `children`, `withMargin?: boolean`, `withRings?: boolean`, `className?`, `rotate?: number` | Grammar, Reading, Listening, Quiz, AddWord, continue-cards, Today’s goal |
| `GlassPanel` | `children`, `className?` | almost all (main content frame) |
| `StickyNote` | `children`, `color?: 'yellow' \| 'pink'`, `rotate?`, `className?` | Home (word of the day) |
| `WashiTape` | `variant?: 'cream' \| 'stripe' \| 'lavender' \| 'peach'`, `className?` | paper cards with tape |
| `Doodle` | `children` or `variant` SVG doodle | decorative accents (as needed) |

### Marks

| Component | Props | Screens |
|---|---|---|
| `HandCircle` | `children`, `color?: 'ink' \| 'danger' \| 'success'` | Grammar corrections, quiz review |
| `HandUnderline` | `children`, `color?` | Grammar, reading highlights |
| `Highlighter` | `children` | Word of the day example, grammar |
| `CorrectionMark` | `wrong`, `correct`, `note?` | Grammar (circled wrong + green fix + handwritten note) |

### UI

| Component | Props | Screens |
|---|---|---|
| `LevelBadge` | `level: 'A1'\|'A2'\|'B1'\|'B2'\|'C1'` | Home, vocab, grammar, reading, listening, quiz |
| `LevelChips` | `value`, `onChange`, `options` incl. “All levels” | Home, filtered lists |
| `ProgressBar` | `value: 0–100`, `className?` | Home cards, goals, lessons |
| `Button` | `variant: 'primary' \| 'ghost' \| 'ink' \| 'outline'`, `size?`, `asChild?` | everywhere |
| `Mascot` | `pose: 'wave'\|'read'\|'listen'\|'think'\|'cheer'\|'sleep'\|'peek'\|'face'`, `size?: number \| 'sm'\|'md'\|'lg'` | Home, theme switcher, empty states; picks frog vs foal from theme |

### shadcn primitives (Phase 1)

`Dialog`, `Popover`, `DropdownMenu`, `Tabs`, `Tooltip` — restyled with tokens (notebook look: paper bg, ink border, hand headings where appropriate).

---

## 4. Route tree (`src/app/`)

```
src/app/
├── layout.tsx                 # fonts, ThemeProvider, globals
├── page.tsx                   # `/` Home
├── globals.css                # tokens + base
├── grammar/
│   ├── page.tsx               # redirect → first lesson
│   └── [lessonSlug]/page.tsx
├── vocabulary/
│   ├── page.tsx
│   ├── new/page.tsx           # `/vocabulary/new`
│   └── @modal/(.)new/page.tsx # intercepting route (Phase 3c)
├── reading/
│   ├── page.tsx               # redirect → first passage
│   └── [slug]/page.tsx
├── listening/
│   ├── page.tsx               # redirect → first lesson (optional)
│   └── [slug]/page.tsx
├── quiz/
│   └── [slug]/page.tsx       # client flow: start → Qs → results
├── profile/
│   └── page.tsx
└── dev/
    └── components/page.tsx    # Phase 1 showcase
```

Supporting folders (not routes):

```
src/
├── components/
│   ├── layout/          # AppShell, Header, MainNav, FloatingActions, ThemeSwitcher
│   ├── notebook/        # NotebookPage, GlassPanel, StickyNote, WashiTape, Doodle
│   ├── marks/           # HandCircle, HandUnderline, Highlighter, CorrectionMark
│   ├── ui/              # Button, LevelBadge, LevelChips, ProgressBar, shadcn/*
│   └── mascot/          # Mascot
├── lib/
│   ├── utils.ts         # cn()
│   ├── mock/            # typed fixtures (Phase 3+)
│   └── data/            # async accessors (Phase 3+)
├── types/               # shared domain types
└── providers/
    └── theme-provider.tsx
public/
└── mascot/
    ├── frog/{wave,read,listen,think,cheer,sleep,peek,face}.svg
    └── foal/{...}.svg
```

---

## 5. Mock data types

Shaped for later DB mapping. Access only via `src/lib/data/*`.

```ts
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase'
type ThemeId = 'default' | 'blossom'
type MascotPose = 'wave' | 'read' | 'listen' | 'think' | 'cheer' | 'sleep' | 'peek' | 'face'

interface UserProfile {
  id: string
  displayName: string        // "Linh"
  fullName: string           // "Linh Trần"
  levelLabel: string         // "Intermediate"
  cefrLevel: CefrLevel
  memberSince: string        // ISO date
  goal: string               // "IELTS 6.5"
  theme: ThemeId
  avatarInitial: string      // "L"
}

interface Progress {
  userId: string
  streakDays: number
  bestStreak: number
  wordsLearned: number
  wordsLearnedDeltaWeek: number
  grammarLessonsDone: number
  grammarLessonsTotal: number
  studyHoursTotal: number
  studyHoursWeek: number
  weekChecks: boolean[]      // 7 days
  todayWords: { current: number; goal: number }
  todayGrammar: { current: number; goal: number }
  studyTimerSeconds: number
}

interface GrammarTopic {
  id: string
  family: string             // "Tenses & time"
  slug: string
  title: string
  level: CefrLevel
  sectionIndex: number
  sectionTotal: number
  sectionLabel: string       // "Common mistakes"
  progressPercent: number
}

interface Lesson {
  id: string
  slug: string
  topicId: string
  title: string
  level: CefrLevel
  // body blocks defined in Phase 3b
}

interface Word {
  id: string
  lemma: string
  ipa?: string
  pos: PartOfSpeech
  level: CefrLevel
  glossVi: string
  exampleEn?: string
  exampleHighlight?: string  // substring to highlighter
}

interface WordSet {
  id: string
  slug: string
  title: string
  titleVi: string
  topic: string              // Travel, Food, …
  level: CefrLevel
  wordCount: number
  learnedCount: number
  progressPercent: number
}

interface ReadingPassage {
  id: string
  slug: string
  title: string
  topic: string
  level: CefrLevel
  minutes: number
  body: string               // or block array in Phase 3d
}

interface ListeningLesson {
  id: string
  slug: string
  title: string
  topic: string
  level: CefrLevel
  durationSec: number
  audioUrl: string           // mock / public asset
  transcript?: string
  // comprehension items in Phase 3e
}

interface Question {
  id: string
  type: 'multiple_choice' | 'fill_blank' | …
  promptEn: string
  promptVi?: string
  options?: string[]
  answer: string | string[]
  hint?: string
}

interface Quiz {
  id: string
  slug: string
  title: string
  breadcrumb: string[]       // Grammar › Tenses › …
  level: CefrLevel
  questionCount: number
  timeLimitSec: number
  passScore: number          // e.g. 7
  questionTypes: string[]
  questions: Question[]
}

interface QuizAttempt {
  quizId: string
  score: number
  total: number
  timeUsedSec: number
  answers: Record<string, string | null>
  passed: boolean
}
```

### Data-access functions (async; Phase 3+)

| Function | Returns |
|---|---|
| `getUserProfile()` | `UserProfile` |
| `getProgress()` | `Progress` |
| `getContinueItems()` | `(GrammarTopic \| WordSet)[]` |
| `getWordOfTheDay()` | `Word` |
| `getGrammarTopics()` / `getLesson(slug)` | topics / lesson |
| `getWordSets(filters?)` / `getWord(id)` | sets / word |
| `createWord(input)` | `Word` (in-memory) |
| `getReadingPassages()` / `getPassage(slug)` | passages |
| `getListeningLessons()` / `getListeningLesson(slug)` | lessons |
| `getQuiz(slug)` | `Quiz` |
| `submitQuiz(slug, answers)` | `QuizAttempt` |

Mock user: **Linh** / **Linh Trần**, as in mockups.

---

## 6. Dependencies to install

### App scaffold (Phase 1 first step)

```bash
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

(Run in empty-ish repo; may need to move `mockup/` / `ui-plan/` aside or pass flags that don’t wipe them — **confirm approach in §7**.)

### Runtime

| Package | Version (pin style) |
|---|---|
| `next` | `15.5.x` |
| `react` / `react-dom` | `19.1.x` |
| `next-themes` | `^0.4.6` |
| `lucide-react` | `^0.460` |
| `motion` | `^12` or `^13` |
| `react-hook-form` | `^7.87` |
| `zod` | `^3.24` or `^4` (match `@hookform/resolvers`) |
| `@hookform/resolvers` | matching |
| `class-variance-authority` | `^0.7` |
| `clsx` | `^2` |
| `tailwind-merge` | `^2` |
| `tailwindcss-animate` | `^1` |
| `react-rough-notation` | `^1.0.5` |
| Radix via shadcn | dialog, popover, dropdown-menu, tabs, tooltip, slot |

### Dev

| Package | Version |
|---|---|
| `typescript` | `^5` |
| `tailwindcss` / `postcss` / `autoprefixer` | `^3` / `^8` / `^10` |
| `eslint` + `eslint-config-next` | matching Next |
| `@playwright/test` | `^1.63` (screenshot diffs) |
| `@types/node` / `@types/react` / `@types/react-dom` | current |

**Not installing in UI phases:** drizzle, postgres, better-auth, next-intl (unless later asked).

---

## 7. Risks and open questions

### Risks

1. **Greenfield scaffold** — `create-next-app` in a non-empty directory can fail or overwrite. Need a careful init strategy.
2. **Font swap** — Mockup HTML still loads Nunito/Mali/Space Mono; brief + `*-lofi-fonts.png` use Be Vietnam Pro / Patrick Hand / JetBrains Mono. Metrics (line lengths, wrapping) will differ slightly from non-lofi PNGs.
3. **Mascot assets** — Foal SVGs in `BlossomFoalSheet.html` / `BlossomHome.html` are large inline paths; frog is simpler. Extracting 8 poses × 2 themes as static SVG placeholders is mechanical but fiddly; some poses may only exist as one variant.
4. **B2 level color** differs Default vs Blossom (`#B8372E` vs `#A33B28`) — tokenize per theme.
5. **No git** — GitNexus `analyze` and CLAUDE.md/AGENTS.md injection need a git repo. Repo is not initialized.
6. **Visual fidelity** — Mockups are fixed 1440×N absolute layouts; responsive rebuild will intentionally differ from HTML structure while matching screenshots.

### Decisions needed from you

1. **Proceed to Phase 1 after this report?** Brief says stop for approval. You also asked to implement Phase 1 in the same request — please confirm.
2. **Scaffold:** OK to `git init` + create Next.js 15 App Router app in this folder (preserving `mockup/` and `ui-plan/`)?
3. **Fonts:** Follow brief (Be Vietnam Pro / Patrick Hand / JetBrains Mono) rather than mockup HTML font links?
4. **Product name in UI:** `EngDaily` (as mockups) or something else for `chill-english`?
5. **Report path:** Keep reports in `ui-plan/` (co-located) or also mirror under `docs/ui-plan/`?
6. **Package manager:** npm (assumed) vs pnpm/yarn?
7. **Zod major:** v3 or v4?

### Proposed defaults if you say “go” without answering each

- Proceed Phase 1 immediately after your OK  
- `git init` + Next.js 15 + npm  
- Brief fonts  
- Brand string **EngDaily**  
- Reports in `ui-plan/`  
- Zod 3 (wider shadcn examples compatibility) or Zod 4 if english-flow parity preferred  

---

## Phase 0 done checklist

- [x] Repo structure read  
- [x] All `mockup/html/` files surveyed  
- [x] All `mockup/screenshots/` reviewed (incl. lofi-fonts + mobile)  
- [x] Tokens extracted (Default + Blossom)  
- [x] Component inventory  
- [x] Route tree  
- [x] Mock types + data accessors  
- [x] Dependency list  
- [x] Risks / open questions  
- [x] **No code written / no packages installed** (per Phase 0 rules)

**STOP — waiting for review before Phase 1.**
