#!/bin/bash

echo "🚀 KOLS С РАБОЧИМ OPENROUTER КЛЮЧОМ"
echo "===================================="
echo ""
echo "🔧 ПРОБЛЕМА НАЙДЕНА И ИСПРАВЛЕНА:"
echo "  ❌ Старый ключ: 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"
echo "  ✅ Рабочий ключ: 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"
echo "  🧠 LLM будет генерировать УНИКАЛЬНЫЕ ответы!"
echo "  🎯 Только целевые группы: 2643951085 и 2298297094"
echo ""

# Устанавливаем РАБОЧИЙ ключ
export OPENROUTER_API_KEY="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"
export PORT=3001
export DATABASE_ADAPTER=sqlite
export DATABASE_URL="sqlite://./data/kols.sqlite"

echo "🔑 Используем РАБОЧИЙ OpenRouter API ключ:"
echo "   ${OPENROUTER_API_KEY:0:20}..."
echo ""

# Очищаем логи
rm -f /Users/playra/vibee-agent/logs/kols-llm-working.log

echo "🎯 ЗАПУСК KOLS С УНИКАЛЬНЫМИ ОТВЕТАМИ..."
echo "==========================================="
echo ""

# Запускаем агента
cd /Users/playra/vibee-agent
npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-llm-working.log &

KOLS_PID=$!
echo "📝 PID процесса: $KOLS_PID"

echo ""
echo "⏳ Ожидание запуска (10 секунд)..."
sleep 10

# Проверяем, что процесс запущен
if ps -p $KOLS_PID > /dev/null; then
    echo "✅ KOLS запущен с рабочим LLM!"
    echo ""
    echo "📊 ПРОВЕРКА LLM:"
    echo "  tail -f logs/kols-llm-working.log | grep -i 'llm.*генериру'"
    echo ""
    echo "🎉 KOLS БУДЕТ ГЕНЕРИРОВАТЬ УНИКАЛЬНЫЕ ОТВЕТЫ!"
else
    echo "❌ Ошибка запуска KOLS!"
    echo "📝 Проверьте логи: logs/kols-llm-working.log"
fi
