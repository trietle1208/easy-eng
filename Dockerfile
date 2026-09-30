# syntax=docker/dockerfile:1

# Easy English — Next.js standalone + Postgres migrator + seeder
# Build:  docker compose build web
# Run:    docker compose up
# Seed:   docker compose run --rm web seed --content

ARG NODE_VERSION=22

# ── base: Node + pnpm ──────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
WORKDIR /app

# ── deps: install production+dev deps for build ────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder: compile Next.js + bundle migrator/seeder ──────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN pnpm build
RUN pnpm exec esbuild src/db/migrate.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=scripts/migrate.cjs
RUN pnpm exec esbuild scripts/seed.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=scripts/seed.cjs \
  --external:pg-native

# ── runner: slim runtime image ─────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/storage /app/content \
  && chown nextjs:nodejs /app/storage /app/content

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.cjs ./migrate.cjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed.cjs ./seed.cjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
