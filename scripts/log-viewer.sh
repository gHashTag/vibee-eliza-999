#!/bin/bash

# =============================================================================
# 🎨 VIBEE LOG VIEWER - Универсальный инструмент просмотра логов
# =============================================================================
# Единый источник правды для мониторинга логов VIBEE агента
#
# Использование:
#   ./scripts/log-viewer.sh [режим]
#
# Режимы:
#   live        - Мониторинг в реальном времени с цветами (по умолчанию)
#   errors      - Показать только ошибки
#   messages    - Показать только сообщения
#   status      - Проверка статуса агента
#   search <текст> - Поиск по логам
#   last <N>    - Показать последние N строк
# =============================================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Лог-файлы
AGENT_LOG="agent.log"
TEST_LOGS=("final-test.log" "rainbow-test.log")

# Функция печати заголовка
print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} 🎨 ${GREEN}VIBEE LOG VIEWER${NC} - Мониторинг логов в реальном времени     ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Функция печати справки
print_help() {
    echo -e "${YELLOW}📋 ДОСТУПНЫЕ РЕЖИМЫ:${NC}"
    echo "  live        - Мониторинг всех логов с цветной подсветкой"
    echo "  errors      - Показать только ошибки (❌)"
    echo "  messages    - Показать только сообщения (🔔📝💬)"
    echo "  success     - Показать только успешные операции (✅)"
    echo "  status      - Проверка статуса агента"
    echo "  search TEXT - Поиск текста в логах"
    echo "  last N      - Показать последние N строк (по умолчанию 50)"
    echo ""
    echo -e "${YELLOW}🎨 ЦВЕТОВАЯ СХЕМА:${NC}"
    echo -e "  ${GREEN}✅${NC} - Успех"
    echo -e "  ${RED}❌${NC} - Ошибка"
    echo -e "  ${YELLOW}⚠️${NC} - Предупреждение"
    echo -e "  ${CYAN}🔔📝💬${NC} - Сообщения"
    echo -e "  ${BLUE}🚀🔗🔑${NC} - Системные события"
    echo ""
    echo -e "${YELLOW}💡 ПРИМЕРЫ:${NC}"
    echo "  ./scripts/log-viewer.sh                    # Мониторинг live"
    echo "  ./scripts/log-viewer.sh errors             # Только ошибки"
    echo "  ./scripts/log-viewer.sh search 'telegram'  # Поиск 'telegram'"
    echo "  ./scripts/log-viewer.sh last 100           # Последние 100 строк"
    echo ""
}

# Функция применения цветов к строке
apply_colors() {
    local line="$1"

    # Ошибки (красный)
    if [[ "$line" == *"❌"* ]] || [[ "$line" == *"ERROR"* ]] || [[ "$line" == *"Error"* ]]; then
        echo -e "${RED}$line${NC}"
    # Успех (зеленый)
    elif [[ "$line" == *"✅"* ]] || [[ "$line" == *"Connected"* ]]; then
        echo -e "${GREEN}$line${NC}"
    # Предупреждения (желтый)
    elif [[ "$line" == *"⚠️"* ]] || [[ "$line" == *"WARNING"* ]]; then
        echo -e "${YELLOW}$line${NC}"
    # Сообщения (голубой)
    elif [[ "$line" =~ (🔔|📝|💬|📨) ]]; then
        echo -e "${CYAN}$line${NC}"
    # Системные события (синий)
    elif [[ "$line" =~ (🚀|🔗|🔑|📡|🔥) ]]; then
        echo -e "${BLUE}$line${NC}"
    # Метаданные (фиолетовый)
    elif [[ "$line" =~ (мониторинг|monitoring|группа|group|фильтр) ]]; then
        echo -e "${MAGENTA}$line${NC}"
    # Обычный текст
    else
        echo "$line"
    fi
}

# Функция live-мониторинга
live_monitor() {
    print_header
    echo -e "${GREEN}📡 Мониторинг запущен...${NC}"
    echo -e "${GREEN}⏹️  Для выхода нажмите Ctrl+C${NC}"
    echo ""

    # Следим за всеми лог-файлами
    tail -n 0 -F $AGENT_LOG ${TEST_LOGS[@]} 2>/dev/null | while read line; do
        apply_colors "$line"
    done
}

# Функция показа ошибок
show_errors() {
    print_header
    echo -e "${RED}🔍 Поиск ошибок в логах...${NC}"
    echo ""

    # Показать последние ошибки
    if [ -f "$AGENT_LOG" ]; then
        grep -E "❌|Error|ERROR" $AGENT_LOG | tail -20 | while read line; do
            apply_colors "$line"
        done
    else
        echo -e "${RED}❌ Лог-файл $AGENT_LOG не найден${NC}"
    fi
}

# Функция показа сообщений
show_messages() {
    print_header
    echo -e "${CYAN}📨 Поиск сообщений в логах...${NC}"
    echo ""

    if [ -f "$AGENT_LOG" ]; then
        grep -E "🔔|📝|💬|📨" $AGENT_LOG | tail -30 | while read line; do
            apply_colors "$line"
        done
    else
        echo -e "${RED}❌ Лог-файл $AGENT_LOG не найден${NC}"
    fi
}

# Функция показа успехов
show_success() {
    print_header
    echo -e "${GREEN}✅ Поиск успешных операций...${NC}"
    echo ""

    if [ -f "$AGENT_LOG" ]; then
        grep -E "✅|Connected|successfully" $AGENT_LOG | tail -30 | while read line; do
            apply_colors "$line"
        done
    else
        echo -e "${RED}❌ Лог-файл $AGENT_LOG не найден${NC}"
    fi
}

# Функция проверки статуса
check_status() {
    print_header
    echo -e "${BLUE}🔍 ПРОВЕРКА СТАТУСА VIBEE АГЕНТА${NC}"
    echo ""

    # 1. Процесс агента
    echo -e "${YELLOW}📌 Процесс агента:${NC}"
    if pgrep -f "elizaos.*dev" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Запущен${NC}"
        ps aux | grep "elizaos.*dev" | grep -v grep | awk '{print "   PID: " $2}'
    else
        echo -e "   ${RED}❌ НЕ запущен${NC}"
    fi

    # 2. Подключение к Telegram
    echo ""
    echo -e "${YELLOW}📌 Telegram подключение:${NC}"
    if [ -f "$AGENT_LOG" ] && tail -50 $AGENT_LOG | grep -q "Connected to Telegram"; then
        echo -e "   ${GREEN}✅ Подключен${NC}"
        USER_ID=$(tail -50 $AGENT_LOG | grep -o "User ID:.*" | head -1)
        echo -e "   ${BLUE}$USER_ID${NC}"
    else
        echo -e "   ${RED}❌ НЕ подключен${NC}"
    fi

    # 3. Сервис Telegram
    echo ""
    echo -e "${YELLOW}📌 Telegram Service:${NC}"
    if [ -f "$AGENT_LOG" ] && tail -50 $AGENT_LOG | grep -q "Telegram Service started successfully"; then
        echo -e "   ${GREEN}✅ Запущен успешно${NC}"
    else
        echo -e "   ${RED}❌ Ошибка запуска${NC}"
    fi

    # 4. Плагин telegram-craft
    echo ""
    echo -e "${YELLOW}📌 Плагин telegram-craft:${NC}"
    if [ -f "$AGENT_LOG" ]; then
        ACTIONS=$(tail -50 $AGENT_LOG | grep "Registered.*actions" | tail -1)
        PROVIDERS=$(tail -50 $AGENT_LOG | grep "Registered.*providers" | tail -1)
        SERVICES=$(tail -50 $AGENT_LOG | grep "Registered.*services" | tail -1)
        echo -e "   ${BLUE}$ACTIONS${NC}"
        echo -e "   ${BLUE}$PROVIDERS${NC}"
        echo -e "   ${BLUE}$SERVICES${NC}"
    fi

    # 5. Фильтрация групп
    echo ""
    echo -e "${YELLOW}📌 Фильтрация групп:${NC}"
    if [ -f "$AGENT_LOG" ]; then
        ALLOWED=$(grep "ALLOWED_GROUP_ID" $AGENT_LOG | tail -1 | grep -o "[0-9]*" || echo "2298297094")
        echo -e "   ${GREEN}✅ Настроена: только группа $ALLOWED${NC}"

        IGNORED=$(grep -c "ИГНОРИРУЕМ" $AGENT_LOG 2>/dev/null || echo "0")
        echo -e "   ${BLUE}📊 Сообщений проигнорировано: $IGNORED${NC}"
    fi

    # 6. Веб-интерфейс
    echo ""
    echo -e "${YELLOW}📌 Веб-интерфейс:${NC}"
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Доступен: ${BLUE}http://localhost:3000${NC}"
    else
        echo -e "   ${RED}❌ Недоступен${NC}"
    fi

    # 7. Статистика
    echo ""
    echo -e "${YELLOW}📊 Статистика:${NC}"
    if [ -f "$AGENT_LOG" ]; then
        TOTAL=$(grep -c "📨\|🔔" $AGENT_LOG 2>/dev/null || echo "0")
        ERRORS=$(grep -c "❌" $AGENT_LOG 2>/dev/null || echo "0")
        SUCCESS=$(grep -c "✅" $AGENT_LOG 2>/dev/null || echo "0")

        echo -e "   📨 Сообщений: $TOTAL"
        echo -e "   ❌ Ошибок: $ERRORS"
        echo -e "   ✅ Успехов: $SUCCESS"
    fi

    echo ""
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
}

# Функция поиска
search_logs() {
    local query="$1"
    print_header
    echo -e "${MAGENTA}🔍 Поиск: '$query'${NC}"
    echo ""

    if [ -f "$AGENT_LOG" ]; then
        grep -i "$query" $AGENT_LOG | tail -30 | while read line; do
            apply_colors "$line"
        done
    else
        echo -e "${RED}❌ Лог-файл $AGENT_LOG не найден${NC}"
    fi
}

# Функция показа последних строк
show_last() {
    local count="${1:-50}"
    print_header
    echo -e "${GREEN}📜 Последние $count строк из $AGENT_LOG${NC}"
    echo ""

    if [ -f "$AGENT_LOG" ]; then
        tail -n $count $AGENT_LOG | while read line; do
            apply_colors "$line"
        done
    else
        echo -e "${RED}❌ Лог-файл $AGENT_LOG не найден${NC}"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

# Проверка аргументов
MODE="${1:-live}"

case "$MODE" in
    "help"|"-h"|"--help")
        print_help
        ;;
    "live")
        live_monitor
        ;;
    "errors")
        show_errors
        ;;
    "messages")
        show_messages
        ;;
    "success")
        show_success
        ;;
    "status")
        check_status
        ;;
    "search")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Укажите текст для поиска${NC}"
            echo "   Пример: ./scripts/log-viewer.sh search 'telegram'"
        else
            search_logs "$2"
        fi
        ;;
    "last")
        if [ -z "$2" ]; then
            show_last 50
        else
            show_last "$2"
        fi
        ;;
    *)
        echo -e "${RED}❌ Неизвестный режим: $MODE${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac
