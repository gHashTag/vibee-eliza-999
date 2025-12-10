# Build stage - using Gleam with OTP 27
FROM ghcr.io/gleam-lang/gleam:v1.13.0-erlang-alpine AS builder

# Cache bust argument must come early to invalidate subsequent layers
ARG CACHE_BUST=2025-12-10-v19-force-fresh

WORKDIR /app

# Copy all project files together to ensure fresh build
COPY gleam.toml manifest.toml ./
COPY src/ ./src/

# Clean and build fresh
RUN rm -rf build && gleam export erlang-shipment

# Runtime stage - OTP 27 to match Gleam v1.13.0-erlang-alpine
FROM erlang:27-alpine

# Cache bust for runtime stage - this RUN forces rebuild
ARG CACHE_BUST_RUNTIME=2025-12-10-v16
RUN echo "Build version: ${CACHE_BUST_RUNTIME}"

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl bash

# Copy built application from builder
COPY --from=builder /app/build/erlang-shipment /app

# Create logs directory
RUN mkdir -p /app/logs

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Non-root user
RUN adduser -D -u 1000 vibee
RUN chown -R vibee:vibee /app
USER vibee

# Environment variables
ENV PORT=8080
ENV VIBEE_BRIDGE_URL=http://localhost:8081
ENV VIBEE_LOG_LEVEL=info

EXPOSE 8080

# Run the main application - using full path for beam files
# The entrypoint.sh expects to be in /app and uses relative paths
WORKDIR /app
CMD ["./entrypoint.sh", "run"]
