# Multi-stage build: Builder stage for dependencies, Runtime stage for execution
FROM node:23.3.0-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    git \
    python3 \
    unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g bun@1.2.21

# Copy all source code
COPY package.json turbo.json bun.lock ./
COPY vibee.character.json ./
COPY packages ./packages

# Install dependencies (this creates the workspace symlinks)
RUN bun install --no-cache

# Fix esbuild binary version mismatch by removing and letting Vite redownload
RUN rm -rf packages/client/node_modules/vite/node_modules/esbuild && \
    rm -rf node_modules/vite/node_modules/esbuild

# Build all packages
RUN bun run build

# Runtime stage: Use a fresh image and copy everything from builder
FROM node:23.3.0-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    git \
    python3 \
    unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g bun@1.2.21

# Copy all files from builder stage including node_modules and packages with dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/vibee.character.json ./

# Ensure all dependencies are properly installed (fixes symlink issues with workspace packages)
RUN bun install --no-cache --frozen-lockfile

# Patch client JavaScript files for Bot ID and styling (MUST be after copy from builder)
RUN find packages/client/dist/assets -name "*.js" -type f -exec sed -i \
    -e 's/"your_bot_id_here"/"8309813696"/g' \
    -e 's/"YOUR_BOT_ID_HERE"/"8309813696"/g' \
    -e 's/bg-blue-600 hover:bg-blue-700/bg-black hover:bg-gray-900/g' \
    -e 's/text-white border border-blue-500 hover:border-blue-400/text-yellow-500 border border-yellow-500 hover:border-yellow-400/g' \
    -e 's/text-blue-400 hover:text-blue-300/text-yellow-400 hover:text-yellow-300/g' \
    {} \; || true

# Set NODE_ENV
ENV NODE_ENV=production
ENV PORT=4000
ENV SKIP_HEALTH_CHECK=true
ENV ELIZA_UI_ENABLE=true

EXPOSE 4000

# Run compiled JavaScript
CMD node packages/server/dist/entrypoint.js
