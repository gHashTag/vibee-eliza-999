#!/bin/bash

# Sentry MCP Server Script
# Usage: ./sentry.sh [command]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="$SCRIPT_DIR/sentry-mcp-server.js"

case "$1" in
  test)
    echo "🧪 Testing Sentry MCP Server..."
    node "$SERVER" --test
    ;;
  errors)
    echo "🔍 Fetching latest errors..."
    node "$SERVER" --latest-errors
    ;;
  search)
    echo "🔎 Searching for: ${2:-error}"
    node "$SERVER" --search "$2"
    ;;
  *)
    echo "🔧 Sentry MCP Server"
    echo ""
    echo "Commands:"
    echo "  ./sentry.sh test       - Test connection"
    echo "  ./sentry.sh errors     - Get latest errors"
    echo "  ./sentry.sh search 401 - Search for specific errors"
    echo ""
    echo "Examples:"
    echo "  ./sentry.sh errors"
    echo "  ./sentry.sh search 401"
    echo ""
    echo "Status:"
    node "$SERVER" --test
    ;;
esac
