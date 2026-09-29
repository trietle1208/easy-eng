# Phase 3e Report — Listening

**Status:** complete — awaiting review before next phase  
**Date:** 2026-09-29  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Data / media
| File | Role |
|---|---|
| `src/types/listening.ts` | Lesson, transcript sentences, dictation blanks, check result |
| `src/lib/mock/listening.ts` | 7 lesson cards; full **Checking in at the airport** content |
| `src/lib/data/listening.ts` | `getListeningLessons`, `getListeningLesson`, `checkDictation` |
| `public/audio/checking-in-at-the-airport.wav` | Silent 160s placeholder for player testing |

`/listening` redirects to `checking-in-at-the-airport`.

### UI (`src/components/listening/`)
| Component | Role |
|---|---|
| `ListeningTipBanner` | Dismissible tip |
| `ListeningSidebar` | Topic/level filters + lesson cards |
| `AudioPlayer` | Play/pause, −5s, seek bar, speed 0.75/1/1.25, keyboard-friendly controls |
| `TranscriptPanel` | Sticky “Show transcript”; active line follows playback; click seeks |
| `DictationExercise` | Blank inputs; Check → ✓ green underline / ✗ red circle + correction |
| `ListeningLessonPanel` / `ListeningView` | Notebook layout |

### Verification
- `pnpm lint`, `pnpm typecheck`, `pnpm build` — pass

---

## 2. Screenshots

| File | Notes |
|---|---|
| [`phase-3e-listening-default-1440.png`](./screenshots/phase-3e-listening-default-1440.png) | Pre-check (transcript hidden) |
| [`phase-3e-listening-blossom-1440.png`](./screenshots/phase-3e-listening-blossom-1440.png) | Blossom |
| [`phase-3e-listening-checked-1440.png`](./screenshots/phase-3e-listening-checked-1440.png) | Transcript open + mixed correct/incorrect answers |

---

## 3. Differences from mockup

1. Product name **Easy English**.
2. Audio is a silent WAV (no spoken dialogue); transcript timings still drive highlight/seek for UX testing.
3. Other lesson cards use stub transcript/dictation; airport lesson is the full exercise.
4. Catalog duration for the featured lesson is 2:40 (`160s`) matching the mockup; player uses the real file duration.

---

## 4. Decisions / notes

- Dictation compare is case-insensitive and strips light punctuation.
- After check: Try again resets; Next lesson goes to the next card in the list when available.
- Rewind is fixed −5 seconds (mockup control).

---

## 5. Next phase

Await approval, then Quiz (`ui-plan/09-phase-3f-quiz.md`).

**STOP.**
