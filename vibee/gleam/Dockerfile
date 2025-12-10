# Build stage - using Gleam with OTP 27
FROM ghcr.io/gleam-lang/gleam:v1.13.0-erlang-alpine AS builder

# Use unique timestamp to bust all caching layers
ARG BUILD_TIMESTAMP="2025-12-10T15:30:00"
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

WORKDIR /app

# Copy manifest first for dependency caching
COPY gleam.toml manifest.toml ./

# Download dependencies
RUN gleam deps download

# Copy source code
COPY src/ ./src/

# Clean build and export with verification
RUN set -ex && \
    rm -rf build && \
    gleam build && \
    gleam export erlang-shipment && \
    echo "=== Verifying vibee@@main.beam ===" && \
    ls -la build/erlang-shipment/vibee/ebin/vibee@@main.beam && \
    echo "=== Checking exports ===" && \
    erl -noshell -eval "io:format(\"~p~n\", [beam_lib:chunks(\"build/erlang-shipment/vibee/ebin/vibee@@main.beam\", [exports])]), halt()."

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
