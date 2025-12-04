#!/bin/bash

echo "🚀 Запуск KOLS с LLM + SQLite (проще для разработки)..."

# Устанавливаем переменные окружения
export OPENROUTER_API_KEY="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"
export PORT=3001
export DATABASE_URL="sqlite://./data/kols.sqlite"
export DATABASE_ADAPTER=sqlite

echo "✅ OPENROUTER_API_KEY установлен"
echo "✅ PORT=3001"
echo "✅ DATABASE_ADAPTER=sqlite (SQLite - проще!)"

# Запускаем KOLS
cd /Users/playra/vibee-agent
npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-sqlite.log &
KOLS_PID=$!

echo "✅ KOLS запущен (PID: $KOLS_PID)"
echo "📝 Логи: logs/kols-sqlite.log"

# Ждем запуска
sleep 15

# Проверяем статус
if ps -p $KOLS_PID > /dev/null; then
    echo "✅ KOLS успешно запущен!"
    echo "🔗 Проверяем логи..."

    # Показываем последние 50 строк лога
    tail -50 logs/kols-sqlite.log
else
    echo "❌ KOLS не запущен. Проверяем логи на ошибки..."
    cat logs/kols-sqlite.log
fi
