# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm
RUN addgroup --system --gid 1001 buildgroup && adduser --system --uid 1001 builduser

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=builduser:buildgroup . .

USER builduser

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env vars needed for Next.js prerendering
ARG NEXT_PUBLIC_KEYGEN_API_URL=https://api.keygen.sh/v1
ARG NEXT_PUBLIC_KEYGEN_SINGLEPLAYER=false
ENV NEXT_PUBLIC_KEYGEN_API_URL=$NEXT_PUBLIC_KEYGEN_API_URL
ENV NEXT_PUBLIC_KEYGEN_SINGLEPLAYER=$NEXT_PUBLIC_KEYGEN_SINGLEPLAYER

RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["node", "server.js"]
