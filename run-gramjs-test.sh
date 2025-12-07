#!/bin/bash
# Скрипт для запуска комплексного теста GramJS

echo "🔐 Preparing environment for GramJS test..."
echo "============================================"

# Устанавливаем переменные из Infisical
export $(grep -E "^(INFISICAL|TELEGRAM|NODE)" /Users/playra/vibee-agent/.env.dev | xargs)

# Если есть .infisical.json, загружаем переменные из него
if [ -f /Users/playra/vibee-agent/.infisical.json ]; then
    echo "📄 Loading secrets from .infisical.json..."
    source /Users/playra/vibee-agent/.infisical.json || true
fi

echo ""
echo "🔑 Checking credentials..."
echo "  TELEGRAM_API_ID: ${TELEGRAM_API_ID:-(not set)}"
echo "  TELEGRAM_API_HASH: ${TELEGRAM_API_HASH:-(not set)}"
echo "  TELEGRAM_SESSION_STRING: ${TELEGRAM_SESSION_STRING:0:20}...(truncated)"

# Проверяем наличие критичных переменных
if [ -z "$TELEGRAM_API_ID" ] || [ -z "$TELEGRAM_API_HASH" ]; then
    echo ""
    echo "❌ CRITICAL: TELEGRAM_API_ID and TELEGRAM_API_HASH are required"
    echo "   These should be loaded from Infisical"
    echo ""
    echo "Try running:"
    echo "  infisical secrets pull --env=dev"
    echo "  source .infisical.json"
    exit 1
fi

echo ""
echo "✅ Credentials check passed"
echo ""
echo "🚀 Starting GramJS comprehensive test..."
echo "============================================"
echo ""

# Переходим в директорию проекта и запускаем тест
cd /Users/playra/vibee-agent

# Запускаем тест через bun
cd plugin-telegram-craft
NODE_PATH=/Users/playra/vibee-agent/plugin-telegram-craft/node_modules \
  bun run ../scripts/gramjs-comprehensive-test.ts

echo ""
echo "============================================"
echo "✅ Test completed"
echo ""
echo "📊 Check results in:"
echo "   /Users/playra/vibee-agent/GRAMJS_TEST_REPORT.json"
echo "============================================"
