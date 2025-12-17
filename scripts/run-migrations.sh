#!/bin/bash

# 🔧 Migration Runner Script
# Runs database migrations once before starting all agents
# This prevents introspection errors and migration conflicts

set -e  # Exit on error

echo "🔧 Starting database migration process..."

# 🔧 ПРИНУДИТЕЛЬНОЕ переключение на SQLite для разработки
echo "🔧 Принудительно используем SQLite для разработки"
export DATABASE_URL="sqlite:./data/dev.sqlite"
export DATABASE_ADAPTER=sqlite
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

# Отключаем миграции в @elizaos/server (они используют PostgreSQL синтаксис)


echo "✅ Database URL: $DATABASE_URL"
echo "✅ Database adapter: $DATABASE_ADAPTER"

echo "📊 Attempting ElizaOS internal migrations (if any) or auto-table creation..."
