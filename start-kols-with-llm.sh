#!/bin/bash

echo "🚀 Запуск KOLS с LLM поддержкой..."

# Устанавливаем переменные окружения
export OPENROUTER_API_KEY="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"
export PORT=3001
export POSTGRES_URL="${POSTGRES_URL:-postgresql://user:pass@localhost:5432/vibee}"
export DATABASE_URL="${POSTGRES_URL}"
export DATABASE_ADAPTER=postgres

echo "✅ OPENROUTER_API_KEY установлен"
echo "✅ PORT=3001"
echo "✅ DATABASE_ADAPTER=postgres"

# Запускаем KOLS
cd /Users/playra/vibee-agent
npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-llm-final.log &
KOLS_PID=$!

echo "✅ KOLS запущен (PID: $KOLS_PID)"
echo "📝 Логи: logs/kols-llm-final.log"

# Ждем запуска
sleep 10

# Проверяем статус
if ps -p $KOLS_PID > /dev/null; then
    echo "✅ KOLS успешно запущен!"
    echo "🔗 Проверяем логи..."

    # Показываем последние 50 строк лога
    tail -50 logs/kols-llm-final.log
else
    echo "❌ KOLS не запущен. Проверяем логи на ошибки..."
    cat logs/kols-llm-final.log
fi
