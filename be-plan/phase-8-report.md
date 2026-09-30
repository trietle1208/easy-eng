# Phase 8 Report — Hardening, tests and deployment

**Status:** complete  
**Date:** 2026-09-30  
**Repo:** chill-english · brand **Easy English**

---

## 1. What was done

### Security
- **Headers** in `next.config.ts`: CSP (`frame-ancestors 'none'`), `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`
- **Server Actions**: session + Zod (`parseActionInput`) + `ActionError` field/general codes; ownership already enforced in data layer (phases 5–7)
- **Rate limiting** (`src/lib/rate-limit.ts`): in-memory buckets `mutations` / `uploads` / `learning` — documented single-process limit in README
- **Files** (`/files/[...path]`): `safeResolveKey` rejects traversal; `vocabulary/{userId}/…` requires owner session; Range support for audio
- **Logs** (`src/lib/logger.ts`): structured JSON; redacts secret-like keys
- **Answer keys**: still stripped from public content DTOs (phases 4–5); covered by content-read / mapper tests

### Migration fix
- Applied `drizzle/0004_good_wolfpack.sql` (content `status`, `user.role`, `admin_audit_log`) after fixing journal `when` order and removing duplicate `learning_steps` (already in `0003`)

### Tests
| Suite | Result |
|---|---|
| Vitest (`pnpm test`) | **73** passed |
| Coverage (`pnpm test:coverage`) | Report under `coverage/` for `src/lib/**` (~50% statements; progress/fsrs/mappers high) |
| Playwright (`pnpm test:e2e`) | **4** passed — access rules + sign-up/verify + quiz→word→review→profile streak |

### Docker / deploy
- Web image: migrate on start, non-root `nextjs`, `seed` subcommand
- Volumes: Postgres, storage, backups
- `backup` Compose profile + `scripts/pg-backup.sh` (retention `BACKUP_RETENTION_DAYS`)
- `docs/deploy-proxy.md` — nginx/Caddy, HTTPS, Range/audio
- `README.md` — local setup, env, migrate/seed, Docker, backup/restore, Google OAuth, CI-like commands

### Other
- `.gitignore`: coverage, playwright-report, test-results
- ESLint ignores generated coverage/report dirs
- E2e helper aligned with `user_settings` / `user.role` schema

---

## 2. Contract changes

| Change | Why |
|---|---|
| `CurrentUser.role` (`user` \| `admin`) | Schema + session; default `user` (admin UI = Phase 9) |
| Content tables + `word_sets.status` | `draft` \| `published` (seed = published) |
| `ActionError` / rate-limit messages on actions | Consistent client-facing errors |

No intentional UI contract breaks for learner flows.

---

## 3. How to run / test

```bash
pnpm install --frozen-lockfile
cp .env.example .env   # set BETTER_AUTH_SECRET

docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content

pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm build

pnpm exec playwright install chromium
pnpm test:e2e

# Full stack
docker compose up --build -d
docker compose run --rm web seed --content
docker compose --profile backup up -d backup
```

---

## 4. Known limitations

1. **Rate limiter** is in-memory per process — fine for one container; multi-replica needs Redis/Postgres.
2. **CSP** still allows `'unsafe-inline'` scripts/styles (Next/Tailwind); nonce CSP is a later hardening step.
3. **Learner content reads** do not yet filter `status = 'published'` (all seed rows are published; draft filtering belongs with admin CMS).
4. **`admin_audit_log` / `user.role`** land in schema for Phase 9; no admin UI in this phase.
5. **Coverage** for `src/lib/` is partial (~50% statements); mail/schemas lightly covered — expand in later hardening if needed.
6. **Playwright** uses Ubuntu fallback builds on this host OS; CI should use a supported image.

---

## 5. Verification

- `pnpm lint` — pass  
- `pnpm typecheck` — pass  
- `pnpm test` — 73 passed  
- `pnpm test:coverage` — report generated  
- `pnpm build` — pass  
- `pnpm test:e2e` — 4 passed  

---

## 6. Next phase

Phase 9 (optional) — Admin CMS (`be-plan/10-phase-9-admin-optional.md`).

---

## 7. STOP

Phase 8 complete. Do not start Phase 9 without approval.
