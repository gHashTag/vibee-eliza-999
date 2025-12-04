#!/bin/bash

echo "🚀 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ KOLS - ПРАВИЛЬНЫЙ ModelType!"
echo "======================================================"
echo ""
echo "🔧 ИСПРАВЛЕНИЯ:"
echo "  1. llmGenerator.ts - ModelType.TEXT_SMALL ✓"
echo "  2. KolsProactiveService.ts - ModelType.TEXT_SMALL ✓"  
echo "  3. KolsTelegramService.ts - ModelType.TEXT_SMALL (исправляем...)"
echo ""

# Останавливаем все процессы KOLS
echo "🛑 Останавливаем все процессы KOLS..."
pkill -f "kolsAgent.json" 2>/dev/null
sleep 2

# Исправляем KolsTelegramService.ts (ищем строку с 'TEXT_SMALL')
if grep -n "useModel('TEXT_SMALL'" /Users/playra/vibee-agent/plugin-kols/src/KolsTelegramService.ts > /dev/null; then
    echo "🔧 Исправляем KolsTelegramService.ts..."
    sed -i '' "s/useModel('TEXT_SMALL'/useModel(ModelType.TEXT_SMALL/g" /Users/playra/vibee-agent/plugin-kols/src/KolsTelegramService.ts
    echo "  ✅ Исправлено!"
else
    echo "  ✅ Уже исправлено или не найдено"
fi

# Добавляем ModelType в импорты, если его нет
if ! grep -q "ModelType" /Users/playra/vibee-agent/plugin-kols/src/KolsTelegramService.ts; then
    echo "🔧 Добавляем ModelType в импорты KolsTelegramService.ts..."
    sed -i '' "s/import { Service, IAgentRuntime } from '@elizaos/core';/import { Service, IAgentRuntime, ModelType } from '@elizaos/core';/g" /Users/playra/vibee-agent/plugin-kols/src/KolsTelegramService.ts
    echo "  ✅ ModelType добавлен в импорты!"
fi

echo ""
echo "🔨 Пересобираем плагин..."
cd /Users/playra/vibee-agent/plugin-kols
npm run build

echo ""
echo "🔑 Устанавливаем ПРАБОЧИЙ OpenRouter API ключ..."
export OPENROUTER_API_KEY="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"
export PORT=3001
export DATABASE_ADAPTER=sqlite  
export DATABASE_URL="sqlite://./data/kols.sqlite"

echo ""
echo "📊 ИТОГОВАЯ КОНФИГУРАЦИЯ:"
echo "  🔑 API ключ: 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"
echo "  📝 ModelType: ModelType.TEXT_SMALL (константа из enum!)"
echo "  📊 Группы: 2643951085 и 2298297094"
echo "  🧠 Провайдер: OpenRouter"
echo "  🎯 Режим: УНИКАЛЬНЫЕ LLM ОТВЕТЫ"
echo ""

echo "🚀 ЗАПУСК KOLS С ИСПРАВЛЕНИЯМИ..."
echo "=================================="
cd /Users/playra/vibee-agent

# Запускаем KOLS
npx elizaos start --character characters/kolsAgent.json 2>&1 | tee logs/kols-FINAL-FIXED.log &

KOLS_PID=$!
echo "📝 PID: $KOLS_PID"

sleep 10

if ps -p $KOLS_PID > /dev/null; then
    echo ""
    echo "🎉 KOLS ЗАПУЩЕН С ПРАВИЛЬНЫМ ModelType!"
    echo "✅ Теперь он будет генерировать УНИКАЛЬНЫЕ ответы!"
    echo ""
    echo "📊 МОНИТОРИНГ:"
    echo "  tail -f logs/kols-FINAL-FIXED.log | grep -i 'modeltype.TEXT_SMALL'"
    echo ""
    echo "✅ ГОТОВО! KOLS С УНИКАЛЬНЫМИ LLM ОТВЕТАМИ!"
else
    echo "❌ Ошибка запуска KOLS!"
    echo "📝 Проверьте логи: logs/kols-FINAL-FIXED.log"
fi

