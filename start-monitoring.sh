#!/bin/bash

# =============================================================================
# 🚀 VIBEE START MONITORING - Унифицированный запуск мониторинга
# =============================================================================
# УСТАРЕЛ - используйте новую систему:
#   ./scripts/log-viewer.sh live
#
# Этот скрипт теперь перенаправляет на унифицированный log-viewer
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_VIEWER="$SCRIPT_DIR/scripts/log-viewer.sh"

if [ -f "$LOG_VIEWER" ]; then
    # Используем новую унифицированную систему
    exec "$LOG_VIEWER" live
else
    echo "❌ [ERROR] $LOG_VIEWER не найден"
    echo ""
    echo "📋 ВРУЧНУЮ запуск мониторинга:"
    echo "   tail -f agent.log | grep --line-buffered '📨\|🔔\|⚠️'"
    echo ""
    echo "📖 Подробности в LOGS-MANAGEMENT.md"
    echo ""

    # Fallback на старую команду
    echo "🚀 ЗАПУСК МОНИТОРИНГА VIBEE AGENT"
    echo "═══════════════════════════════════════════════════════"

    # 1. Проверка что агент запущен
    if ! ps aux | grep "elizaos.*dev" | grep -v grep > /dev/null 2>&1; then
        echo "❌ VIBEE AGENT не запущен!"
        echo "Запустите: npm run dev"
        exit 1
    fi

    echo "✅ VIBEE AGENT запущен"
    echo ""

    # 2. Отправляем команду запуска мониторинга
    echo "📡 Отправляем команду 'запусти мониторинг групп'..."
    curl -s -X POST http://localhost:3000/api/message \
      -H "Content-Type: application/json" \
      -d '{
        "content": {"text": "запусти мониторинг групп"},
        "userId": "test-user",
        "roomId": "test-room"
      }' > /dev/null 2>&1

    sleep 3

    # 3. Проверяем в логах что мониторинг запущен
    echo "🔍 Проверяем логи..."
    if [ -f agent.log ] && tail -50 agent.log | grep "Запущен мониторинг\|onMessage.*called" > /dev/null; then
        echo "✅ Мониторинг запущен!"
    else
        echo "⚠️  Не удалось подтвердить запуск мониторинга"
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 Дальнейшие действия:"
    echo ""
    echo "1️⃣  Откройте новый терминал и запустите:"
    echo "   tail -f agent.log | grep '📨\|🔔\|⚠️'"
    echo ""
    echo "2️⃣  Отправьте сообщение в группу Telegram 2298297094"
    echo "   Например: 'Молодчик!' или 'help мне нужна помощь'"
    echo ""
    echo "3️⃣  Сообщения должны появиться в логах в реальном времени!"
    echo ""
    echo "💡 Или используйте новую систему:"
    echo "   ./scripts/log-viewer.sh live"
    echo ""
fi
