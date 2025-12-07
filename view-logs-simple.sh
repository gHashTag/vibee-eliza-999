#!/bin/bash
# Простой просмотр логов VIBEE - работает в любом терминале

echo "📋 VIBEE Logs Viewer - Simple Mode"
echo "=================================="
echo ""

# Функция для показа помощи
show_help() {
    echo "🔍 Доступные команды:"
    echo "  ./view-logs-simple.sh        - Показать все логи"
    echo "  ./view-logs-simple.sh vibee  - Только VIBEE агент"
    echo "  ./view-logs-simple.sh kols   - Только KOLS агент"
    echo "  ./view-logs-simple.sh neuro  - Только NeuroPhoto агент"
    echo "  ./view-logs-simple.sh errors - Только ошибки"
    echo "  ./view-logs-simple.sh --help - Показать эту справку"
    echo ""
    echo "⌨️  Для выхода нажмите Ctrl+C"
    echo ""
}

# Проверяем аргументы
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_help
    exit 0
fi

# Создаем директорию logs если не существует
mkdir -p logs

case "$1" in
    "vibee")
        echo "🔵 VIBEE Agent - Нажмите Ctrl+C для выхода"
        echo "=========================================="
        tail -f logs/vibee.log
        ;;
    "kols")
        echo "🟡 KOLS Agent - Нажмите Ctrl+C для выхода"
        echo "=========================================="
        tail -f logs/kols.log
        ;;
    "neuro")
        echo "🟣 NeuroPhoto Agent - Нажмите Ctrl+C для выхода"
        echo "============================================="
        tail -f logs/neurophoto.log
        ;;
    "errors")
        echo "⚠️  Только ошибки из всех логов - Нажмите Ctrl+C для выхода"
        echo "==========================================================="
        tail -f logs/*.log | grep -i "error\|fail\|warn\|exception"
        ;;
    *)
        # Показываем все логи простым способом
        echo "🚀 Все агенты VIBEE"
        echo "=================="
        echo ""
        echo "📊 Размер терминала: $(tput cols)x$(tput lines)"
        echo ""

        # Проверяем доступные логи
        LOGS_COUNT=0
        [ -f logs/vibee.log ] && LOGS_COUNT=$((LOGS_COUNT + 1))
        [ -f logs/kols.log ] && LOGS_COUNT=$((LOGS_COUNT + 1))
        [ -f logs/neurophoto.log ] && LOGS_COUNT=$((LOGS_COUNT + 1))

        if [ $LOGS_COUNT -eq 0 ]; then
            echo "❌ Логи не найдены!"
            echo "💡 Запустите агентов: ./start-agents.sh"
            echo "   И подождите 10-15 секунд"
            exit 1
        fi

        echo "✅ Найдено логов: $LOGS_COUNT"
        echo ""
        echo "🔄 Запуск просмотра логов..."
        echo ""

        # Используем простой tail для каждого файла
        if [ -f logs/vibee.log ]; then
            echo "🔵 VIBEE Agent:"
            echo "==============="
            tail -50 logs/vibee.log | tail -20
            echo ""
        fi

        if [ -f logs/kols.log ]; then
            echo "🟡 KOLS Agent:"
            echo "=============="
            tail -50 logs/kols.log | tail -20
            echo ""
        fi

        if [ -f logs/neurophoto.log ]; then
            echo "🟣 NeuroPhoto Agent:"
            echo "==================="
            tail -50 logs/neurophoto.log | tail -20
            echo ""
        fi

        echo "📺 Теперь показываю live-логи (Ctrl+C для выхода)..."
        echo ""

        # Запускаем live просмотр в зависимости от размера терминала
        COLS=$(tput cols)
        LINES=$(tput lines)

        if [ $COLS -lt 100 ] || [ $LINES -lt 30 ]; then
            echo "⚠️  Терминал маленький, показываю по одному логу..."
            echo ""
            echo "🔵 VIBEE Agent (Ctrl+C для перехода к следующему)..."
            tail -f logs/vibee.log &
            TAIL_PID=$!
            sleep 5
            kill $TAIL_PID 2>/dev/null
            echo ""
            echo "🟡 KOLS Agent (Ctrl+C для перехода к следующему)..."
            tail -f logs/kols.log &
            TAIL_PID=$!
            sleep 5
            kill $TAIL_PID 2>/dev/null
            echo ""
            echo "🟣 NeuroPhoto Agent (Ctrl+C для выхода)..."
            tail -f logs/neurophoto.log
        else
            echo "✅ Терминал достаточно большой, показываю все логи одновременно..."

            # Запускаем tail для каждого файла в фоне
            (
                echo "🔵 VIBEE Agent:"
                tail -f logs/vibee.log
            ) &

            (
                sleep 1
                echo "🟡 KOLS Agent:"
                tail -f logs/kols.log
            ) &

            (
                sleep 2
                echo "🟣 NeuroPhoto Agent:"
                tail -f logs/neurophoto.log
            ) &

            # Ждем завершения
            wait
        fi
        ;;
esac
