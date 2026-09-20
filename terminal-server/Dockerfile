# ---------------------------------------------------------------------------
# Stage 1: Build & Native Compilation
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native dependencies required for node-pty compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies and compile node-pty
RUN npm ci

COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production Runtime
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install runtime shell utilities and tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001
ENV WORKSPACES_ROOT=/workspaces

# Create isolated workspaces directory and non-root devforge user
RUN groupadd -g 1001 devforge && \
    useradd -u 1001 -g devforge -m -s /bin/bash devforge && \
    mkdir -p /workspaces && \
    chown -R devforge:devforge /workspaces /app

COPY package*.json ./

# Copy built artifacts and compiled node modules from builder
COPY --from=builder --chown=devforge:devforge /app/node_modules ./node_modules
COPY --from=builder --chown=devforge:devforge /app/dist ./dist

# Switch to non-root devforge user
USER devforge

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
