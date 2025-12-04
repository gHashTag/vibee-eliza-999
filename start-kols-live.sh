#!/bin/bash

echo "🚀 ЗАПУСК KOLS - ЖИВОЙ АГЕНТ!"
echo "============================"

# Останавливаем старые процессы
pkill -f "kolsAgent.json" 2>/dev/null
pkill -f "elizaos" 2>/dev/null
sleep 2

# Загружаем секреты из Infisical (если доступен)
if command -v infisical &> /dev/null; then
    echo "🔐 Загружаем секреты из Infisical..."
    eval $(infisical export --env=dev --format=dotenv 2>/dev/null) || true
fi

# Устанавливаем переменные окружения
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-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}"
export PORT=3001
export DATABASE_ADAPTER=sqlite
export DATABASE_URL="sqlite://./data/kols.sqlite"

echo "✅ OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:0:20}..."
echo "✅ PORT: $PORT"
echo "✅ DATABASE: SQLite"

# Создаем директорию для логов
mkdir -p /Users/playra/vibee-agent/logs

# Запускаем KOLS
cd /Users/playra/vibee-agent
echo ""
echo "🎯 KOLS слушает группы:"
echo "   - 2643951085 (основная)"
echo "   - 2298297094 (neuro_blogger_pulse)"
echo ""
echo "📝 Логи: logs/kols-live.log"
echo "🔍 Мониторинг: tail -f logs/kols-live.log"
echo ""

npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-live.log
