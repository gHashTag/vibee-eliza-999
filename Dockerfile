# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun@1.2.21

# Copy workspace files
COPY package.json bunfig.toml ./
COPY packages ./packages
COPY tsconfig.json ./
COPY turbo.json ./
COPY build-utils.ts ./

# Install dependencies
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Build packages - build server directly using package-specific script
RUN cd /app/packages/server && bun run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install bun, bash and git
RUN npm install -g bun@1.2.21 && apk add --no-cache bash git

# Copy built packages
COPY --from=builder /app/packages ./packages

# Copy runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built-in scripts
COPY scripts ./scripts

# Set environment
ENV NODE_ENV=production
ENV SKIP_POSTINSTALL=1

EXPOSE 3000
CMD ["bun", "packages/server/dist/entrypoint.js"]
