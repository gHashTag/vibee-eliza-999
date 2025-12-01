#!/usr/bin/env bash
set -e

echo "🔥 Starting VIBEE in HOT RELOAD mode..."
echo "📦 Building packages first..."
npx turbo run build --filter=!./packages/app --filter=!@elizaos/config --no-cache

echo "🚀 Starting server with hot reload..."
npx turbo run start --filter=./packages/server --no-cache
