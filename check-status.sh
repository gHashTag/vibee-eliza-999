#!/bin/bash

# =============================================================================
# 🔍 VIBEE CHECK STATUS - Унифицированная проверка статуса
# =============================================================================
# УСТАРЕЛ - используйте новую систему:
#   ./scripts/log-viewer.sh status
#
# Этот скрипт теперь перенаправляет на унифицированный log-viewer
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_VIEWER="$SCRIPT_DIR/scripts/log-viewer.sh"

if [ -f "$LOG_VIEWER" ]; then
    # Используем новую унифицированную систему
    exec "$LOG_VIEWER" status
else
    echo "❌ [ERROR] $LOG_VIEWER не найден"
    echo ""
    echo "📋 ВРУЧНУЮ проверка статуса:"
    echo "   1. Процесс: ps aux | grep 'elizaos'"
    echo "   2. Telegram: tail -100 agent.log | grep 'Connected'"
    echo "   3. Веб-интерфейс: curl -s http://localhost:3000/health"
    echo ""
    echo "📖 Подробности в LOGS-MANAGEMENT.md"
    echo ""

    # Fallback на старую команду
    echo "🔍 ПРОВЕРКА СТАТУСА VIBEE AGENT"
    echo "═══════════════════════════════════════════════════════"

    # 1. Проверка процесса
    echo ""
    echo "📌 Процесс агента:"
    if ps aux | grep "elizaos.*dev" | grep -v grep > /dev/null 2>&1; then
        echo "   ✅ Запущен"
        ps aux | grep "elizaos.*dev" | grep -v grep | awk '{print "   PID: " $2}'
    else
        echo "   ❌ НЕ запущен"
        exit 1
    fi

    # 2. Telegram подключение
    echo ""
    echo "📌 Telegram подключение:"
    if [ -f "agent.log" ] && tail -50 agent.log | grep -q "Connected to Telegram"; then
        echo "   ✅ Подключен"
        USER_ID=$(tail -50 agent.log | grep -o "User ID:.*" | head -1)
        echo "   $USER_ID"
    else
        echo "   ❌ НЕ подключен"
    fi

    # 3. Telegram Service статус
    echo ""
    echo "📌 Telegram Service:"
    if [ -f "agent.log" ] && tail -50 agent.log | grep -q "Telegram Service started successfully"; then
        echo "   ✅ Запущен успешно"
    else
        echo "   ❌ Ошибка запуска"
    fi

    # 4. Зарегистрированные компоненты
    echo ""
    echo "📌 Плагин telegram-craft:"
    if [ -f "agent.log" ]; then
        ACTIONS=$(tail -50 agent.log | grep "Registered.*actions" | tail -1)
        PROVIDERS=$(tail -50 agent.log | grep "Registered.*providers" | tail -1)
        SERVICES=$(tail -50 agent.log | grep "Registered.*services" | tail -1)
        echo "   $ACTIONS"
        echo "   $PROVIDERS"
        echo "   $SERVICES"
    fi

    # 5. Веб-интерфейс
    echo ""
    echo "📌 Веб-интерфейс:"
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "   ✅ Доступен: http://localhost:3000"
    else
        echo "   ❌ Недоступен"
    fi

    # 6. Фильтрация групп
    echo ""
    echo "📌 Фильтрация групп:"
    if [ -f "agent.log" ]; then
        ALLOWED=$(grep "ALLOWED_GROUP_ID" agent.log | tail -1 | grep -o "[0-9]*" || echo "2298297094")
        echo "   ✅ Настроена: только группа $ALLOWED"

        IGNORED=$(grep -c "ИГНОРИРУЕМ" agent.log 2>/dev/null || echo "0")
        echo "   📊 Сообщений проигнорировано: $IGNORED"
    fi

    # 7. Статистика
    echo ""
    echo "📊 Статистика:"
    if [ -f "agent.log" ]; then
        TOTAL=$(grep -c "📨\|🔔" agent.log 2>/dev/null || echo "0")
        ERRORS=$(grep -c "❌" agent.log 2>/dev/null || echo "0")
        SUCCESS=$(grep -c "✅" agent.log 2>/dev/null || echo "0")

        echo "   📨 Сообщений: $TOTAL"
        echo "   ❌ Ошибок: $ERRORS"
        echo "   ✅ Успехов: $SUCCESS"
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "✅ ПРОВЕРКА ЗАВЕРШЕНА"
    echo ""
    echo "💡 Команды для работы:"
    echo "   • Просмотр логов:  tail -f agent.log"
    echo "   • Веб-интерфейс:   open http://localhost:3000"
    echo "   • Остановить:      pkill -f 'elizaos dev'"
    echo ""
fi
