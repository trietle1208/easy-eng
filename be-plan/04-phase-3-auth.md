# Phase 3 — Authentication

Read `be-plan/00-brief.md` first.

## Goal
Real users with email + password and Google sign-in; the mock user disappears.

## Do
1. **Better Auth** with the Drizzle adapter (check its current docs): email + password, Google provider, sessions in the database, Next.js route handler under `src/app/api/auth/`, the Next.js cookies plugin for Server Actions.
2. **Email flows** through the mailer interface: email verification after sign-up and password reset. Console driver in development, SMTP in production. Email templates in EN + VI, plain and simple.
3. **Helpers** in `src/lib/auth/`: `getCurrentUser()` (nullable) and `requireUser()` (redirects to sign-in), both cached per request.
4. **Route protection**: middleware for a fast redirect on protected routes, and `requireUser()` inside every protected page and every Server Action (middleware alone is not enough). Decide with me in the report which pages are public (proposal: Home and the first lesson of each section are public; progress, vocabulary, quiz results and profile require sign-in).
5. **Pages** in the existing notebook style (reuse `NotebookPage`, `UnderlineField`, `Button`, `Mascot`): `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`. Validation with RHF + Zod, errors shown in the same hand-drawn style as the Add Word form.
6. **Header**: "Sign in" when signed out; user pill with a menu (Profile, Sign out) when signed in.
7. **On first sign-in**, create the user's settings and profile rows with defaults.
8. Replace every use of `MOCK_USER_NAME` and hard-coded "Linh" with the current user's display name.
9. Rate-limit sign-in, sign-up and password reset (Better Auth's built-in rate limit is fine).

## Do NOT
- Switch content or progress functions to the DB yet (next phases), except what auth needs.

## Done when
- Sign up → verify email (link printed in the dev console) → sign in → sign out works; Google sign-in works with test credentials; password reset works.
- Protected pages redirect when signed out and return to the original page after sign-in.
- Tests cover `requireUser()` and one protected Server Action rejecting anonymous calls.
- Lint, typecheck, build and tests pass. Report (include the Google OAuth setup steps for me). Then STOP.
