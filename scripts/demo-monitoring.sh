#!/bin/bash

# =============================================================================
# 🎭 VIBEE DEMO MONITORING - Унифицированная демонстрация мониторинга
# =============================================================================
# УСТАРЕЛ - используйте новую систему:
#   ./scripts/log-viewer.sh live      # Мониторинг всех логов
#   ./scripts/log-viewer.sh errors    # Только ошибки
#   ./scripts/log-viewer.sh messages  # Только сообщения
#   ./scripts/log-viewer.sh success   # Только успехи
#   ./scripts/log-viewer.sh status    # Проверка статуса
#
# Этот скрипт теперь показывает ссылки на унифицированную систему
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_VIEWER="$SCRIPT_DIR/log-viewer.sh"

echo ""
echo "🎭 VIBEE - ДЕМОНСТРАЦИЯ МОНИТОРИНГА"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📋 СОВРЕМЕННАЯ СИСТЕМА МОНИТОРИНГА (НОВИНКА!):"
echo "   Используйте единый инструмент для всех задач:"
echo ""
echo "   🔥 ОСНОВНЫЕ КОМАНДЫ:"
echo "      ./scripts/log-viewer.sh live       # Мониторинг всех логов"
echo "      ./scripts/log-viewer.sh errors     # Только ошибки"
echo "      ./scripts/log-viewer.sh messages   # Только сообщения"
echo "      ./scripts/log-viewer.sh success    # Только успехи"
echo "      ./scripts/log-viewer.sh status     # Проверка статуса"
echo ""
echo "   🔍 ПОИСК И ФИЛЬТРЫ:"
echo "      ./scripts/log-viewer.sh search 'telegram'  # Поиск по тексту"
echo "      ./scripts/log-viewer.sh last 100           # Последние 100 строк"
echo ""
echo "   📖 СПРАВКА:"
echo "      ./scripts/log-viewer.sh help"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "📚 ДОКУМЕНТАЦИЯ:"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "   📘 ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ:"
echo "      LOGS-MANAGEMENT.md - полное руководство по логированию"
echo ""
echo "   🎨 ЦВЕТОВАЯ СИСТЕМА:"
echo "      ✅ Зеленый  - Успешные операции"
echo "      ❌ Красный - Ошибки"
echo "      ⚠️  Желтый  - Предупреждения"
echo "      📨 Голубой - Сообщения"
echo "      🔷 Синий    - Системные события"
echo "      🟣 Фиолетовый - Метаданные"
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [ -f "$LOG_VIEWER" ]; then
    echo ""
    echo "💡 БЫСТРЫЙ СТАРТ:"
    echo ""
    echo "1️⃣  Проверить статус:"
    echo "    $LOG_VIEWER status"
    echo ""
    echo "2️⃣  Запустить мониторинг:"
    echo "    $LOG_VIEWER live"
    echo ""
    echo "3️⃣  Посмотреть только ошибки:"
    echo "    $LOG_VIEWER errors"
    echo ""
else
    echo ""
    echo "⚠️  $LOG_VIEWER не найден"
    echo "   Проверьте установку унифицированной системы логирования"
fi

# Проверяем, запущен ли агент
if pgrep -f "elizaos.*dev" > /dev/null 2>&1; then
    echo ""
    echo "✅ Агент запущен и готов к мониторингу!"
    echo ""
    echo "📊 Для просмотра последних сообщений:"
    echo "   tail -50 agent.log | grep '📨\|🔔'"
    echo ""
else
    echo ""
    echo "⚠️  Агент не запущен!"
    echo ""
    echo "📋 Для запуска агента:"
    echo "   npm run dev"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "✅ ДЕМОНСТРАЦИЯ СИСТЕМЫ МОНИТОРИНГА ЗАВЕРШЕНА"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "💡 Следующие шаги:"
echo "   1. Изучите LOGS-MANAGEMENT.md для подробностей"
echo "   2. Используйте ./scripts/log-viewer.sh для мониторинга"
echo "   3. Настройте фильтрацию групп в .env (ALLOWED_GROUP_ID)"
echo ""
