# Phase 3 Report — Authentication

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Better Auth
- [`src/lib/auth/auth.ts`](../src/lib/auth/auth.ts) — Drizzle adapter (`pg`), email+password, optional Google, `nextCookies()`, rate limits on sign-in / sign-up / password reset
- Email verification required before password sign-in; reset + verify mail via [`getMailer()`](../src/lib/mail/index.ts) (console in dev)
- Bilingual EN+VI plain templates in [`src/lib/auth/emails.ts`](../src/lib/auth/emails.ts)
- `databaseHooks.user.create.after` → [`ensureUserDefaults`](../src/lib/auth/ensure-user-defaults.ts) inserts `user_settings`
- App fields on `user`: `cefrLevel`, `timezone`, `goalText`
- API: `GET|POST /api/auth/[...all]`

### Helpers
- `getCurrentUser()` / `requireUser()` — React `cache` per request ([`session.ts`](../src/lib/auth/session.ts))
- Client: [`src/lib/auth/client.ts`](../src/lib/auth/client.ts)
- Path policy: [`src/lib/auth/paths.ts`](../src/lib/auth/paths.ts)

### Route protection
| Layer | Behaviour |
|---|---|
| Middleware | Cookie presence check → redirect to `/sign-in?callbackUrl=…` for `/profile`, `/vocabulary/**` |
| Pages | `requireUser()` on profile + vocabulary (+ add-word modal) |
| Server Actions | `requireUser()` on createWord, updateSettings, submitQuiz, checkDictation, checkReadingAnswers |

**Public (proposal applied):** `/`, grammar / reading / listening / quiz content, auth pages, `/api/health`, `/dev/**`.  
**Protected:** `/profile`, `/vocabulary/**`. Content browsing stays public so first lessons are usable without an account; personal progress mutations require sign-in.

### Auth UI (notebook style)
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`
- Reuses `NotebookPage`, `UnderlineField`, `Button`, `Mascot`, hand-drawn `AuthAlert`
- Header: **Sign in** when anonymous; user pill + menu (Profile / Sign out) when signed in

### Mock user removed from runtime
- `getGreeting` uses session first name or `"friend"`
- Quiz headlines / encouragement replace `Linh` with the session name
- Header no longer hard-codes Linh

### Tests
- [`src/lib/auth/__tests__/require-user.test.ts`](../src/lib/auth/__tests__/require-user.test.ts) — `requireUser` redirect + `createWordAction` anonymous rejection

### Migrations
None (auth tables already from Phase 2).

---

## 2. Contract changes

| Change | Why |
|---|---|
| Greeting / quiz copy use session name (or `"friend"`) | Remove hard-coded Linh |
| Protected Server Actions redirect anonymous users to sign-in | Security baseline |
| Profile + vocabulary pages require session | Phase protection policy |

UI still mock-backed for content/progress (Phases 4+).

---

## 3. How to run / test

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --demo   # Linh, email verified
pnpm dev

# Demo sign-in
# email: linh@example.com
# password: from SEED_DEMO_PASSWORD (default password123)

# New sign-up → verification link printed as [mail:console] in the terminal
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### Verification (2026-09-30)
- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — pass (17)
- `pnpm build` — pass (auth routes + middleware present)

### Google OAuth setup (for you)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Create **OAuth client ID** (Web application)  
3. **Authorized JavaScript origins:** `http://localhost:3000` (and your prod origin)  
4. **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google` (and prod equivalent)  
5. Put Client ID / Secret in `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`  
6. Restart `pnpm dev` — “Continue with Google” appears when both are non-empty  

---

## 4. Decisions I should confirm

1. **Public vs protected** — content routes public; only profile + vocabulary + mutating actions require auth. Tighten to “first lesson only” later?
2. **Email verification required** for password users — OK for private deploy, or relax in development?
3. Google left optional (hidden when env empty) — confirm before production.
4. Demo user password default `password123` — change for any shared environment?

---

## 5. Plan for the next phase

**Phase 4 — Content read from DB** (`be-plan/05-phase-4-content-read.md`):

- Replace mock reads in `src/lib/data/` with Drizzle queries + mappers
- Strip answer keys from public DTOs
- Keep mutations/progress for Phase 5+

**STOP** — await approval before Phase 4.
