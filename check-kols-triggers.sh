#!/bin/bash
# Запуск теста GramJS через агент

echo "🔬 Testing GramJS capabilities..."
echo "================================="

# Проверяем, запущен ли агент
if ! ps aux | grep -q "[b]un dev"; then
    echo "❌ Agent is not running. Start it first with:"
    echo "   bun dev"
    exit 1
fi

# Запускаем тест с переменными агента
cd /Users/playra/vibee-agent
NODE_PATH=/Users/playra/vibee-agent/plugin-telegram-craft/node_modules \
  node test-gramjs-simple.js

echo ""
echo "✅ Test completed"
