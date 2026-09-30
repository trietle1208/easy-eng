# Phase 4 — Content from the database (read-only)

Read `be-plan/00-brief.md` first.

## Goal
Grammar, Reading, Listening and Quiz content comes from PostgreSQL, and answer keys never reach the browser.

## Do
1. Re-implement the read functions in `src/lib/data/` with Drizzle queries + mappers:
   - `catalog.ts`, `grammar.ts` (`getLesson`, `getAdjacentLessons`, `getGrammarTree` incl. level counts and filter options), `reading.ts` (`getPassages`, `getPassage`), `listening.ts` (`getListeningLessons`, `getListeningLesson`), `quiz.ts` (`getQuiz`).
   - Per-user fields (`completed`, `inProgress`, grammar tree `progress`) come from progress tables when a user is signed in, and are empty/false when not.
2. **Public DTOs without answers**: the objects passed to client components no longer contain `correctIndex`, `correctAnswers`, `displayAnswer`, dictation `answer`/`accept`. Split types as needed (e.g. `QuizPublic` / `QuestionPublic`), and update the components that relied on them. Scoring happens only on the server (next phase).
3. Avoid N+1 queries: one query (or a small fixed number) per page. Add indexes if a query needs them.
4. Caching: content is rarely updated, so cache content queries (`unstable_cache` or `"use cache"` if enabled) with tags per domain; the seeder and future admin revalidate those tags. Per-user data is never cached across users.
5. Audio: serve files from the storage directory through a route handler with correct content type and HTTP range support (needed for seeking), or document an nginx alternative for production.
6. Delete the now-unused parts of `src/lib/mock/` for these domains (keep `content/` as the seed source).

## Done when
- Every content page renders the same as before from the DB (compare with the existing Playwright screenshots).
- Inspecting the page payload (RSC/HTML) shows no answer keys.
- Audio seeking works.
- Tests cover each read function (found / not found / filters).
- Lint, typecheck, build and tests pass. Report. Then STOP.
