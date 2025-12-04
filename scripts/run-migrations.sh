#!/bin/bash

# 🔧 Migration Runner Script
# Runs database migrations once before starting all agents
# This prevents introspection errors and migration conflicts

set -e  # Exit on error

echo "🔧 Starting database migration process..."

# Load PostgreSQL configuration
export POSTGRES_URL="postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DATABASE_URL="$POSTGRES_URL"
export DATABASE_ADAPTER=postgres
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

echo "✅ PostgreSQL URL configured"
echo "📊 Running migrations with KOLS agent (proven to work)..."

# Run migrations using KOLS agent (which successfully created schema)
# Start agent in background, let it run migrations, then kill it
cd /Users/playra/vibee-agent

npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json > logs/migration.log 2>&1 &
MIGRATION_PID=$!

# Wait for migrations to complete (max 30 seconds)
for i in {1..30}; do
    if grep -q "All 1 migrations completed successfully\|No changes detected" logs/migration.log 2>/dev/null; then
        echo "✅ Migrations detected as complete"
        break
    fi
    sleep 1
done

# Kill the migration process
kill $MIGRATION_PID 2>/dev/null
sleep 2

# Check if migrations completed
if grep -q "All 1 migrations completed successfully" logs/migration.log; then
    echo "✅ Migrations completed successfully"
elif grep -q "No changes detected" logs/migration.log; then
    echo "✅ Schema already up to date"
else
    echo "❌ Migration failed - check logs/migration.log"
    tail -50 logs/migration.log
    exit 1
fi

echo "✅ Database migrations completed"
echo "🚀 Ready to start all agents"
