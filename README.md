# Easy English

Notebook-style English learning app (repo folder: `chill-english`).

Stack: **Next.js 15** · React 19 · TypeScript · Tailwind v4 · **PostgreSQL 16** · Drizzle · Better Auth · **pnpm**

## Prerequisites

- Node.js 20+ (22 recommended)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@10.34.5 --activate`)
- Docker + Compose (Postgres locally, or full stack)
- Playwright browsers for e2e: `pnpm exec playwright install chromium`

## Local setup

```bash
# 1. Install
pnpm install --frozen-lockfile

# 2. Env
cp .env.example .env
# Edit BETTER_AUTH_SECRET (≥16 chars). Optional: Google OAuth + SMTP.

# 3. Database
docker compose up -d db
pnpm db:migrate
pnpm db:seed -- --content
# optional demo learner (verified):
pnpm db:seed -- --demo

# 4. Dev server → http://localhost:3000
pnpm dev
```

Demo user (after `--demo`): `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` (defaults `linh@example.com` / `password123`).

### CI-like checks

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage   # coverage report for src/lib/
pnpm build
pnpm test:e2e        # needs DB + seed; starts `pnpm dev` unless already running
```

## Environment variables

See `.env.example`. Important ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | App Postgres |
| `DATABASE_URL_TEST` | Vitest DB (`easy_english_test`) |
| `BETTER_AUTH_SECRET` | Session signing (≥16 chars) |
| `BETTER_AUTH_URL` | Public app URL (must match reverse proxy) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google sign-in |
| `SMTP_*` / `SMTP_FROM` | Production mail; empty `SMTP_HOST` → console mailer |
| `STORAGE_DIR` | Local uploads root (Docker volume in compose) |
| `APP_TIMEZONE` | Default streak / “today” zone |

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Create OAuth client (Web application)  
3. Authorized JavaScript origins: your `BETTER_AUTH_URL` (e.g. `http://localhost:3000`)  
4. Redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`  
5. Paste Client ID / Secret into `.env`

## Migrations & seeding

```bash
pnpm db:generate          # after schema edits
pnpm db:migrate           # apply drizzle/
pnpm db:seed -- --content # idempotent JSON from content/
pnpm db:seed -- --demo    # content + demo user
pnpm db:studio            # Drizzle Studio
```

## Docker (production-like)

```bash
cp .env.example .env   # set BETTER_AUTH_SECRET (required for compose)
docker compose up --build -d

# Seed content into the running stack (bundled seeder in the web image):
docker compose run --rm web seed --content
# equivalent local command: pnpm db:seed -- --content

# Optional nightly backups (profile):
docker compose --profile backup up -d backup
```

| Path | Role |
|---|---|
| `Dockerfile` | Standalone Next.js, non-root `nextjs`, migrate on start |
| `docker-compose.yml` | `db` + `web` + optional `backup` |
| `docs/deploy-proxy.md` | nginx/Caddy, HTTPS, audio Range requests |

Volumes: Postgres data, `/app/storage` uploads, backup dumps.

**Rate limiting note:** mutation/upload limits are in-memory per process (fine for a single container). Multi-replica needs Redis/Postgres.

### Backup / restore

**Compose cron container** (`backup` profile): daily `pg_dump` → gzip under `easy_english_backups`, retention `BACKUP_RETENTION_DAYS` (default 7).

**Host cron alternative:**

```bash
PGHOST=localhost PGUSER=easy PGPASSWORD=easy PGDATABASE=easy_english \
  BACKUP_DIR=./backups ./scripts/pg-backup.sh
```

**Restore:**

```bash
gunzip -c backups/easy_english_YYYYMMDDT….sql.gz \
  | docker compose exec -T db psql -U easy -d easy_english
```

## Admin CMS (Phase 9)

Admin routes live under `/admin` (layout + every Server Action call `requireAdmin()`). Signed-out users redirect to sign-in; signed-in non-admins get **404**.

**Promote an admin** (after migrate + seed content):

```bash
# Option A — env + seed flag (creates user if SEED_ADMIN_PASSWORD is set)
# In .env: SEED_ADMIN_EMAIL=you@example.com  SEED_ADMIN_PASSWORD=change-me-min-8-chars
pnpm db:seed -- --admin

# Option B — promote an existing account
pnpm db:promote-admin you@example.com
```

Then sign in and open http://localhost:3000/admin.

| Path | Purpose |
|---|---|
| `/admin` | Dashboard + recent audit |
| `/admin/grammar` … `/admin/vocabulary` | List / New / Edit / Preview |
| `/admin/{kind}/{id}/preview` | Admin-only preview (draft or published) |
| `/admin/import-export` | Import/export `content/*.json` shape |
| `/admin/export/{kind}` | Download JSON |
| `/admin/audit` | Full audit log |

Only **published** content is visible on learner routes. Drafts stay in admin until publish (cache tags revalidated on save).

## Main routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/grammar/[lessonSlug]` | Grammar |
| `/vocabulary` | Vocabulary (signed-in) |
| `/reading/[slug]` | Reading |
| `/listening/[slug]` | Listening |
| `/quiz/[slug]` | Quiz |
| `/profile` | Profile (signed-in) |
| `/admin` | Admin CMS (role=`admin` only) |
| `/sign-in`, `/sign-up`, … | Auth |

## Project layout

| Path | Role |
|---|---|
| `src/app/` | App Router |
| `src/lib/data/` | UI data contract (DB-backed) |
| `src/lib/actions/` | Server Actions |
| `src/db/` | Drizzle schema + migrate |
| `content/` | Seed JSON + audio |
| `be-plan/` | Backend phase plans/reports |
| `e2e/` | Playwright flows |

## Security (Phase 8)

- Server Actions: session ownership, Zod validation, rate limits
- Security headers (CSP, `frame-ancestors`, referrer policy) in `next.config.ts`
- `/files/…` rejects path traversal; `vocabulary/{userId}/…` requires owner session
- Structured JSON logs via `src/lib/logger.ts` (redacts secret-like keys)
