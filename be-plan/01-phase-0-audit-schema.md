# Phase 0 — Audit and schema design (no code)

Read `be-plan/00-brief.md` first.

## Goal
A reviewed database design and a function-by-function migration plan before any code is written.

## Do
1. Read every file in `src/types/`, `src/lib/data/`, `src/lib/mock/`, `src/lib/schemas/`, and every component that calls the data layer.
2. For each function in the data contract, decide: which tables it reads/writes, whether it is public content, per-user data, or both (e.g. `getPassages` = content + the user's completed flags), and whether it becomes a Server Action.
3. Design the schema.

## Deliver (`be-plan/phase-0-report.md`)
1. **ERD** as a Mermaid diagram, plus a table list with columns, types, keys, indexes and constraints. At minimum cover:
   - Auth: users, sessions, accounts, verifications (as Better Auth requires) + app profile fields (display name, level, timezone, member since)
   - Settings: user_settings (1:1)
   - Grammar: families, groups, lessons (structure/examples/mistakes as JSONB or child tables — justify the choice)
   - Reading: passages, paragraphs/segments, vocab highlights, comprehension questions
   - Listening: lessons, transcript sentences, dictation blanks, audio file reference
   - Quiz: quizzes, questions (discriminated by type), quiz_attempts (answers JSONB)
   - Vocabulary: word_sets and words (system-owned vs user-owned via nullable `owner_id`), user_word_cards (FSRS state), review logs
   - Progress: user_lesson_progress (grammar/reading/listening, status + last position), activity_events (for streak, heatmap, daily goals, study time)
   - Achievements: achievement definitions (code or table) + user_achievements
2. **Function map**: every contract function → tables, query outline, auth requirement, Server Action yes/no.
3. **Public DTO changes**: exactly which fields are removed from client payloads (answer keys) and how the UI keeps working.
4. **Rules to confirm**: how streaks are counted, what counts toward daily goals, how study minutes are recorded (timer sessions vs. completed items), how "Continue where you left off" is chosen, how word of the day is picked, which achievements exist and their unlock rules, level progress formula.
5. **Seed plan**: how each mock file becomes JSON under `content/`, stable ids/slugs, and what a demo user contains.
6. **Dependencies** to add, with versions.
7. **Risks and open questions.**

## Do NOT
- Write code, install packages or create migrations.

## Done when
The report covers all 7 sections. Then STOP.
