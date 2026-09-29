# Easy English

Notebook-style English learning UI (repo folder: `chill-english`).

Stack: **Next.js 15** (App Router) · React 19 · TypeScript · Tailwind v4 · **pnpm**

UI phases are complete (mock data only — no auth/DB/API yet).

## Prerequisites

- **Node.js** 20+ (22 recommended)
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** + Compose (optional — for the FE production container)

## Start locally

```bash
# 1. Install dependencies
pnpm install

# 2. Dev server (Turbopack) — http://localhost:3000
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production-like run

```bash
pnpm build
pnpm start          # http://localhost:3000
# or a custom port:
pnpm start --port 3015
```

## Docker (FE)

Production image for the Next.js frontend only (backend can be added later as extra Compose services).

**Requires:** Docker + Docker Compose.

| File | Role |
|---|---|
| `Dockerfile` | Multi-stage build (`node:22-alpine` + pnpm → Next standalone runner) |
| `docker-compose.yml` | Service `web` → image `easy-english-web:local` |
| `.dockerignore` | Keeps build context small (skips `node_modules`, mockup, docs, …) |
| `next.config.ts` | `output: "standalone"` (needed for the slim runtime image) |

```bash
# Build + run (foreground)
docker compose up --build web

# Detached
docker compose up --build -d web

# Custom host port if 3000 is already taken (e.g. by pnpm dev)
WEB_PORT=3015 docker compose up --build web

# Stop
docker compose down
```

App URL: [http://localhost:3000](http://localhost:3000) (or your `WEB_PORT`).

## Useful scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `docker compose up --build web` | Build & run FE production container |

## Main routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/grammar/[lessonSlug]` | Grammar lesson |
| `/vocabulary` | Vocabulary sets |
| `/vocabulary/new` | Add word |
| `/reading/[slug]` | Reading |
| `/listening/[slug]` | Listening |
| `/quiz/[slug]` | Quiz flow |
| `/profile` | Profile & settings |
| `/dev/components` | Component showcase |

Themes: `default` and `blossom` (toggle in the header / profile settings).

## Project layout

| Path | Role |
|---|---|
| `src/app/` | App Router pages |
| `src/components/` | UI components |
| `src/lib/data/` | Typed data accessors (mock-backed) |
| `mockup/` | HTML + screenshot mockups |
| `ui-plan/` | Phase plans and reports |
| `Dockerfile` / `docker-compose.yml` | FE production container |

## Notes

- No `.env` required for the current UI.
- Package manager is **pnpm** — prefer it over npm/yarn so the lockfile stays consistent.
- Docker currently covers **FE only**; do not commit secrets into the image (`.env*` is dockerignored).
