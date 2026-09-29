# Phase 4 Report — Polish

**Status:** complete  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Responsive
- `MobileCollapsibleAside` — grammar / reading / listening sidebars collapse under `lg` (tap to expand).
- Profile already stacks stats / heatmap / settings on narrow viewports.
- Mobile bottom nav + header drawer unchanged; no intentional horizontal page scroll.

### Accessibility
- Global `:focus-visible` (already present) kept.
- `prefers-reduced-motion` disables non-essential animation/transition durations.
- Glow orbs + glass blur reduced on mobile (`--glass-blur: 12px` under 768px).
- Achievements keep text “locked” (not colour alone); heatmap cells have aria-labels + tooltips.
- Form controls in Settings use `radiogroup` / `switch` / labelled inputs.

### States
| Piece | Role |
|---|---|
| `NotebookSkeleton` | Ruled-paper loading placeholder |
| `EmptyState` | Sleeping mascot + copy (used on empty Continue) |
| `ErrorState` | Alert + retry |
| `src/app/not-found.tsx` | Soft 404 |
| `src/app/error.tsx` + `src/app/(app)/error.tsx` | Segment error boundaries |

### Performance
- Heatmap lazy-loaded via `next/dynamic` (`ssr: false`).
- Lighter backdrop blur / glow on mobile; reduced-motion skips blur on glows.
- AppShell already uses `next/image` for optional backgrounds.

### Cleanup
- Removed unused `PlaceholderPage`.
- Confirmed no `src/components` imports from `src/lib/mock/`.
- Theme preview thumbnails keep fixed mockup gradients (intentional, not runtime tokens).

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass
- Playwright: `scripts/phase-3g-4-screenshots.mjs` → `ui-plan/screenshots/phase-3g-*` + `phase-4-*`

---

## 2. Screenshots

| File | Notes |
|---|---|
| `phase-3g-profile-default-1440.png` | Profile default |
| `phase-3g-profile-blossom-1440.png` | Profile blossom |
| `phase-3g-profile-*-390.png` | Profile mobile |
| `phase-4-{route}-{theme}-{1440\|390}.png` | Full route matrix |

Compared visually with `mockup/screenshots/11-profile.png` and prior phase screenshots.

---

## 3. Remaining differences / known limitations

1. Heatmap cell pattern is deterministic, not pixel-identical to the static Profile HTML grid.
2. Edit profile remains disabled (no backend).
3. Empty/error/skeleton are available; not every list page is wired to a Suspense skeleton (mock data resolves instantly).
4. Quiz pencil SVG still uses a few local fill colours (hand-drawn asset).
5. Theme card previews hard-code default/blossom gradient swatches to match the mockup thumbnails.
6. No real push notifications — reminder switches are UI-only.
7. Playwright screenshots depend on a running server (`PORT`, default 3015).

---

## 4. Decisions to confirm

- Collapsible sidebars default **closed** on mobile so the lesson content is first.
- Theme changes in Profile Settings apply immediately via `next-themes`; Save also persists other settings in memory.

---

## 5. Data layer contract (`src/lib/data/`)

Backend phase should preserve these async signatures (mock → DB later).

### `catalog.ts`
```ts
getFirstGrammarLessonSlug(): Promise<string>
getFirstReadingSlug(): Promise<string>
getFirstListeningSlug(): Promise<string>
getSampleQuizSlug(): Promise<string>
```

### `home.ts`
```ts
getDailyGoal(): Promise<DailyGoal>
getWordOfTheDay(): Promise<WordOfTheDay>
getContinueItems(level?: CefrLevel | "all"): Promise<ContinueItem[]>
getSectionEntries(): Promise<SectionEntry[]>
getHomeCatalogStats(): Promise<HomeCatalogStats>
getGreeting(now?: Date): Promise<Greeting>
```

### `grammar.ts`
```ts
getFirstGrammarLessonSlug(): Promise<string>
getLesson(slug: string): Promise<GrammarLesson | null>
getAdjacentLessons(slug: string): Promise<AdjacentLessons>
getGrammarTree(filters?: GrammarFilters): Promise<GrammarTree>
```

### `vocabulary.ts`
```ts
getWordSets(filters?: WordSetFilters): Promise<WordSet[]>
getTopicCounts(): Promise<Record<WordSetTopic | "all", number>>
getWord(id: string): Promise<Word | null>
getWordsInSet(setId: string): Promise<Word[]>
getReviewDueCount(): Promise<number>
getReviewDue(): Promise<ReviewDue>
getSavedWordCount(): Promise<number>
getAddedToday(): Promise<Word[]>
createWord(input: NewWordInput): Promise<Word>
```

### `reading.ts`
```ts
getFirstReadingSlug(): Promise<string>
getPassages(filters?: ReadingFilters): Promise<ReadingPassageSummary[]>
getPassage(slug: string): Promise<ReadingPassage | null>
getReadingProgress(): Promise<{ done: number; total: number }>
checkReadingAnswers(slug: string, answers: Record<string, number | null>): Promise<CheckReadingAnswersResult | null>
```

### `listening.ts`
```ts
getFirstListeningSlug(): Promise<string>
getListeningLessons(filters?: ListeningFilters): Promise<ListeningLessonSummary[]>
getListeningLesson(slug: string): Promise<ListeningLesson | null>
checkDictation(slug: string, answers: Record<string, string>): Promise<CheckDictationResult | null>
```

### `quiz.ts`
```ts
getFirstQuizSlug(): Promise<string>
getQuiz(slug: string): Promise<Quiz | null>
getLastAttempt(slug: string): Promise<QuizAttempt | null>
submitQuiz(slug: string, answers: QuizAnswersMap, timeUsedSeconds: number, options?: { questionIds?: string[] }): Promise<QuizResult | null>
formatQuizDuration(seconds: number): string
formatTimer(seconds: number): string
```

### `profile.ts`
```ts
getProfile(): Promise<{ profile: UserProfile; stats: UserStats; levels: LevelProgress[]; settings: UserSettings }>
getActivity(range?: ActivityRange): Promise<ActivitySummary>
getAchievements(): Promise<{ items: Achievement[]; earnedCount: number; total: number }>
updateSettings(input: UpdateSettingsInput): Promise<UserSettings>
```

---

## 6. Next phase

UI phases complete. Awaiting approval for backend / auth / DB work (out of scope of `ui-plan/`).

**STOP.**
