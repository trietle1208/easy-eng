# Phase 3e — Listening

Read `docs/ui-plan/00-brief.md` first. Reference: `Listening` (before checking), `ListeningChecked` (transcript open, answers checked), `BlossomListening`.

## Build
- Left: list of listening lessons (title, topic, level, duration, completed).
- `AudioPlayer` styled as in the mockup: play/pause, rewind 5s, seekable progress bar, current/total time, speed 0.75x / 1x / 1.25x. Keyboard accessible.
- Transcript hidden behind a "Show transcript" sticky note; when shown, the current sentence is highlighted and follows playback (sentence start/end times in the data). Clicking a sentence seeks to it.
- Dictation exercise: fill-in-the-blank with handwritten-line inputs.
- After "Check": correct answers underlined green with ✓, wrong ones circled red with ✗ and the correction above (as in `ListeningChecked`).

## Data
Types ListeningLesson, TranscriptSentence (text, start, end), DictationBlank. Functions `getListeningLessons()`, `getListeningLesson(slug)`, `checkDictation(slug, answers)`. Use a short royalty-free or silent placeholder audio file in `public/audio/` so the player can be tested.

## Done when
- Playback, speed, seeking, transcript sync and answer checking all work.
- Both states match their screenshots in both themes.
- Lint, type check and build pass. Report. Then STOP.

---

## Status

- **Done:** 2026-09-29
- **Deliverable:** [`phase-3e-report.md`](./phase-3e-report.md)
- **Screenshots:** `ui-plan/screenshots/phase-3e-*.png`
