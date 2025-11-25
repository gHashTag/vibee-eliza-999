#!/bin/bash

echo "📡 KOLS AGENT - Проверка статуса"
echo "================================"
echo ""

# Проверка работы агента
if pgrep -f "elizaos dev" > /dev/null; then
    echo "✅ Агент запущен"
else
    echo "❌ Агент не запущен"
    echo "   Запустите: npm run dev"
    exit 1
fi

echo ""

# Проверка подключения к Telegram
if grep -q "Connected to Telegram" agent.log; then
    echo "✅ Подключен к Telegram"
else
    echo "⏳ Подключение к Telegram..."
fi

echo ""

# Проверка мониторинга
if grep -q "Handlers count: 1" agent.log; then
    echo "✅ Мониторинг активен"
else
    echo "⚠️ Мониторинг не активен"
fi

echo ""

# Последние сообщения
echo "📨 Последние сообщения из групп:"
tail -100 agent.log | grep "📨 \[" | tail -3 | sed 's/^/   /'

echo ""
echo "💬 Для просмотра в Telegram:"
echo "   1. Откройте @kols_agent_bot"
echo "   2. Отправьте: 'покажи сообщения'"
echo ""
echo "🌐 Веб-интерфейс: http://localhost:3002"
echo ""
echo "📊 Полный лог: tail -f agent.log"
