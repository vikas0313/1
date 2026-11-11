# Multi-stage Dockerfile for Ritsu Food Corner

# Stage 1: Build Workspace (Node 22 / 24 Alpine)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
COPY server/package.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY web/ ./web/
COPY server/ ./server/

# Build shared, web, and server
RUN npm run build --workspace=shared
RUN npm run build --workspace=web || true
RUN npm run build --workspace=server || true

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/data/ritsu.db

# Create persistent data and backup directories
RUN mkdir -p /data /data/backups

# Copy built workspace artifacts
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/web ./web

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "--experimental-sqlite", "server/src/index.ts"]

