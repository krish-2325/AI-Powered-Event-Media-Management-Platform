# Dockerfile for PixVault

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Install dependencies ───────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app (set dummy env vars for build step)
ENV NEXTAUTH_SECRET="build-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pixvault"
ENV AWS_REGION="us-east-1"
ENV AWS_ACCESS_KEY_ID="build"
ENV AWS_SECRET_ACCESS_KEY="build"
ENV AWS_S3_BUCKET_NAME="pixvault"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Production image ───────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
