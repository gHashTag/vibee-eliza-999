#!/bin/bash
# Скрипт запуска агентов VIBEE с автоматическим просмотром логов

echo "🚀 VIBEE Agents - Запуск и мониторинг"
echo "===================================="
echo ""

# Проверяем запущены ли уже агенты
if pgrep -f "elizaos" > /dev/null; then
    echo "⚠️  Обнаружены запущенные агенты. Перезапускаю..."
    pkill -9 -f "elizaos" 2>/dev/null
    sleep 3
fi

# Запускаем агентов в фоне
echo "🔄 Запуск агентов..."
./start-agents.sh > /dev/null 2>&1 &
START_PID=$!

echo "✅ Агенты запущены (PID: $START_PID)"
echo "⏳ Ожидание инициализации (10 секунд)..."
echo ""

sleep 10

# Проверяем есть ли multitail
if command -v multitail &> /dev/null; then
    echo "🎨 Использую красивый режим просмотра..."
    echo "⌨️  Для выхода нажмите Ctrl+C"
    echo ""
    sleep 2
    ./view-logs-beautiful.sh
else
    echo "📋 Использую стандартный режим просмотра..."
    echo "⌨️  Для выхода нажмите Ctrl+C"
    echo ""
    sleep 2
    ./view-logs.sh
fi
