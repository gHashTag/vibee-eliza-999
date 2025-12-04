#!/bin/bash

# Скрипт запуска KOLS агента с отдельной PostgreSQL схемой
# Решает проблему конфликта с VIBEE агентом

echo "🚀 Запуск KOLS агента с отдельной схемой БД..."

# Устанавливаем переменные для отдельной схемы KOLS
export POSTGRES_URL="$POSTGRES_URL_KOLS"
export DATABASE_URL="$DATABASE_URL_KOLS"
export DATABASE_ADAPTER="$DATABASE_ADAPTER_KOLS"
export DATABASE_SCHEMA="$DATABASE_SCHEMA_KOLS"

# Порт для KOLS (3001)
export PORT=3001

echo "✅ Переменные окружения настроены:"
echo "   - POSTGRES_URL: $POSTGRES_URL"
echo "   - DATABASE_URL: $DATABASE_URL"
echo "   - DATABASE_ADAPTER: $DATABASE_ADAPTER"
echo "   - DATABASE_SCHEMA: $DATABASE_SCHEMA"
echo "   - PORT: $PORT"

# Запускаем KOLS агента
echo "🚀 Запуск KOLS агента..."
cd /Users/playra/vibee-agent
npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json 2>&1 | tee /Users/playra/vibee-agent/logs/kols.log &

KOLS_PID=$!
echo "✅ KOLS запущен с PID: $KOLS_PID"
echo "📊 Логи: tail -f /Users/playra/vibee-agent/logs/kols.log"
echo ""
echo "🔍 Статус можно проверить:"
echo "   curl http://localhost:3001/health"
