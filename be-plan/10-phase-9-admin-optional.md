# Phase 9 — Admin content management (OPTIONAL)

**Status:** done (2026-09-30) — see `be-plan/phase-9-report.md`

Read `be-plan/00-brief.md` first. Only start this phase when I explicitly ask for it.

## Goal
Manage lessons without editing JSON files.

## Do
1. Roles: `user` and `admin` on the user record; `requireAdmin()` helper; admin routes under `/admin`, blocked for everyone else (page, actions and middleware).
2. CRUD screens for grammar lessons (structure, examples, mistakes), reading passages (paragraphs, vocab highlights, questions), listening lessons (audio upload, transcript with timings, blanks), quizzes (all three question types) and system word sets.
3. Draft / published status on content; only published content is visible to learners.
4. Import/export the same JSON format as `content/`, validated by the same Zod schemas, so the seeder and the admin stay compatible.
5. Every save revalidates the content cache tags.
6. Audit log: who changed what and when.

## Done when
An admin can create a lesson, preview it, publish it and see it in the learner UI; a normal user gets 404 on every admin route. Tests cover role checks. Report. Then STOP.
