#!/bin/bash

echo "🚀 КОЛС - БЕЗ СПАМА И С LLM"
echo "=========================="
echo ""
echo "🔧 ИСПРАВЛЕНИЯ:"
echo "  ✅ ОДИН процесс (не несколько)"
echo "  ✅ Фильтр групп: ТОЛЬКО 2643951085 и 2298297094"
echo "  ✅ OpenRouter API: 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"
echo "  ✅ TEXT_SMALL модель (исправлено)"
echo "  ✅ Логирование OpenRouter ВКЛЮЧЕНО"
echo ""
echo "🛑 Останавливаем все процессы KOLS..."

# Убиваем все процессы KOLS
pkill -9 -f "kolsAgent" 2>/dev/null
pkill -9 -f "elizaos.*3001" 2>/dev/null
sleep 2

# Проверяем, что все остановлены
if ps aux | grep -E "(kolsAgent|elizaos.*3001)" | grep -v grep > /dev/null; then
    echo "⚠️ Процессы все еще работают, принудительно убиваем..."
    killall -9 node 2>/dev/null
    killall -9 bun 2>/dev/null
    sleep 3
fi

echo "✅ Все процессы остановлены"
echo ""

# Очищаем старые логи
echo "🧹 Очищаем старые логи..."
rm -f /Users/playra/vibee-agent/logs/kols*.log
echo "✅ Логи очищены"
echo ""

# Устанавливаем переменные окружения
export OPENROUTER_API_KEY="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"
export PORT=3001
export DATABASE_ADAPTER=sqlite
export DATABASE_URL="sqlite://./data/kols.sqlite"

# Дополнительные переменные для отладки
export DEBUG=kols:*
export LOG_LEVEL=debug

echo "🔑 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:"
echo "  OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:0:20}..."
echo "  PORT: $PORT"
echo "  DATABASE_ADAPTER: $DATABASE_ADAPTER"
echo ""

echo "📊 ЦЕЛЕВЫЕ ГРУППЫ:"
echo "  • 2643951085"
echo "  • 2298297094"
echo "  • СПАМ ФИЛЬТР: АКТИВЕН"
echo ""

echo "🎯 ЗАПУСК ЕДИНСТВЕННОГО KOLS АГЕНТА..."
echo "======================================="
echo ""

# Запускаем ОДИН процесс
cd /Users/playra/vibee-agent
npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-no-spam.log &

KOLS_PID=$!
echo "📝 PID процесса: $KOLS_PID"

echo ""
echo "⏳ Ожидание запуска (10 секунд)..."
sleep 10

# Проверяем, что процесс запущен
if ps -p $KOLS_PID > /dev/null; then
    echo "✅ KOLS запущен успешно!"
    echo ""
    echo "📊 МОНИТОРИНГ:"
    echo "  tail -f logs/kols-no-spam.log | grep -i openrouter"
    echo "  tail -f logs/kols-no-spam.log | grep -i llm"
    echo "  tail -f logs/kols-no-spam.log | grep -i 'текст_small'"
    echo ""
    echo "🛑 ОСТАНОВКА:"
    echo "  kill $KOLS_PID"
    echo ""
    echo "🎉 KOLS ГОТОВ К РАБОТЕ!"
else
    echo "❌ Ошибка запуска KOLS!"
    echo "📝 Проверьте логи: logs/kols-no-spam.log"
fi
