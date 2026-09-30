# Backend Implementation Brief (shared context for every phase)

Read this file fully before starting any phase. Each phase file only describes what is specific to that phase; everything here always applies. Also follow the repo rules in `CLAUDE.md` and `AGENTS.md` (GitNexus impact analysis before editing, status updates after each phase).

## Context
- The UI is complete (see `ui-plan/phase-4-report.md`). It runs on typed mock data behind `src/lib/data/`.
- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind v4, pnpm, Zod 4, React Hook Form.
- Deploy target: Docker on a private server. `Dockerfile` (Next.js standalone) and `docker-compose.yml` already exist for the web app only.
- There is NO database, ORM, auth or API yet.

## Decisions (already made)
| Topic | Decision |
|---|---|
| Database | PostgreSQL 16, as a service in `docker-compose.yml` |
| ORM | Drizzle ORM + drizzle-kit, `node-postgres` driver |
| Auth | Email + password AND Google sign-in. Use **Better Auth** with its Drizzle adapter (email/password and social providers built in). Check its current docs for exact APIs. |
| Content | Loaded by an idempotent **JSON seeder**. An admin CMS is a later, optional phase. |
| Files (audio, images) | Local disk in a Docker volume, behind a storage interface so S3/R2 can be added later |
| Timezone | Default `Asia/Ho_Chi_Minh`; stored per user. Streaks and "today" are computed in the user's timezone. |
| Spaced repetition | `ts-fsrs` for vocabulary review |
| Email | A mailer interface: SMTP (nodemailer) in production, console output in development |

## The core rule: keep the UI contract
- The async function signatures in `src/lib/data/` (listed in `ui-plan/phase-4-report.md`, section 5) are the contract. Keep their names, parameters and return types. Replace only their implementation.
- Types in `src/types/` stay the shape the UI consumes. Database rows get their own types (inferred from the Drizzle schema) and are converted by mapper functions. Never leak DB rows to components.
- Allowed contract changes: (a) removing answer keys from what is sent to the browser (see Security), (b) mutations becoming Server Actions, (c) adding optional parameters. Every contract change must be listed in the phase report.
- UI changes are limited to what the backend strictly requires (auth pages, sign-out, loading/error wiring, edit profile). Reuse the existing design system and components; no new colors outside tokens.

## Known issues found in the current code (must be handled)
1. **Client components import the data layer directly**: `dictation-exercise`, `add-word-form`, `comprehension-quiz`, `vocab-popover`, `profile-settings`, `quiz-view`. Once the data layer touches the database, these calls must go through Server Actions.
2. **Pure helpers live in a data file**: `formatTimer` and `formatQuizDuration` are imported by client components from `src/lib/data/quiz.ts`. Move them to `src/lib/format.ts` so the data layer can become server-only.
3. **Answer keys reach the browser**: `Quiz` includes `correctIndex` / `correctAnswers`, `ReadingPassage.questions` includes `correctIndex`, `DictationBlank` includes `answer`. Scoring is done on the server, so public DTOs must not include answers.
4. **Mock user is hard-coded**: "Linh" appears in greetings and quiz headlines (`MOCK_USER_NAME`, `submitQuiz`).
5. **Display strings in types** (`dateLabel`, `memberSinceLabel`, `statusLabel`, `studyHoursThisWeekLabel`, `dailyGoalLabel`...): the DB stores raw values (dates, numbers); mappers build the labels.

## Target structure
```
src/
  db/
    schema/            # Drizzle tables, one file per domain (auth, content-grammar, content-reading, ...)
    index.ts           # db client (server-only)
    migrate.ts         # programmatic migrator used in Docker
  lib/
    data/              # the contract: same exports as today, now backed by the DB
    data/mappers/      # row -> UI type
    actions/           # Server Actions ("use server") called by client components
    auth/              # Better Auth config, getCurrentUser(), requireUser()
    storage/           # StorageDriver interface + local driver
    mail/              # Mailer interface + smtp/console drivers
    format.ts          # pure helpers safe for the client
  env.ts               # zod-validated environment variables
content/               # seed JSON (grammar, reading, listening, quiz, vocabulary)
scripts/seed.ts        # idempotent seeder
drizzle/               # generated migrations (committed)
```

## Security baseline (every phase)
- Every data function and action that touches user data resolves the user from the session on the server. Never trust a user id sent from the client.
- Every mutation validates input with Zod on the server (reuse schemas from `src/lib/schemas/`).
- Ownership checks on every user-owned row (words, word sets, attempts, settings).
- `import "server-only"` in `src/db`, `src/lib/data`, `src/lib/auth`, `src/lib/storage`, `src/lib/mail`.
- Secrets only from environment variables; update `.env.example`, never commit `.env`.

## Verification (every phase)
- `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- `pnpm test` passes once tests exist (Vitest for the data layer against a test database; Playwright for main flows).
- `docker compose up` still works when the phase touches Docker, env or migrations.
- The UI still looks and behaves as before (spot-check with the existing Playwright screenshot scripts).

## Report format (end of every phase)
Write `be-plan/phase-N-report.md`:
1. What was done (files created/changed, migrations added)
2. Contract changes (if any) and why
3. How to run / test what was built
4. Decisions I should confirm
5. Plan for the next phase

Update the status tables in `CLAUDE.md` and `AGENTS.md`. Then STOP and wait for approval. Never start the next phase on your own.
