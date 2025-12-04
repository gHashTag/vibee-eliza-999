#!/bin/bash
echo "🎯 KOLS С ИСПРАВЛЕННЫМ LLM (TEXT_SMALL)"
echo "✅ 3 файла исправлены: llmGenerator.ts, KolsProactiveService.ts, KolsTelegramService.ts"
echo "✅ Плагин пересобран"
echo "✅ Группы: 2643951085 и 2298297094"
echo ""

# Устанавливаем переменные
export OPENROUTER_API_KEY="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"
export PORT=3001
export DATABASE_ADAPTER=sqlite
export DATABASE_URL="sqlite://./data/kols.sqlite"

# Запускаем агента
npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json 2>&1 | tee /Users/playra/vibee-agent/logs/kols-LLM-FIXED-FINAL.log &
