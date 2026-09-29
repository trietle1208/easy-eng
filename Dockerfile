# syntax=docker/dockerfile:1

# Easy English — FE production image (Next.js standalone)
# Build:  docker compose build web
# Run:    docker compose up web

ARG NODE_VERSION=22

# ── base: Node + pnpm ──────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
WORKDIR /app

# ── deps: install production+dev deps for build ────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder: compile Next.js ───────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ── runner: slim runtime image ─────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
