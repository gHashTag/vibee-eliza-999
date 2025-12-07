#!/bin/bash
# Скрипт просмотра всех логов VIBEE агентов в реальном времени

echo "📋 VIBEE Agents Logs Viewer"
echo "==========================="
echo ""

# Функция для показа помощи
show_help() {
    echo "🔍 Доступные команды:"
    echo "  ./view-logs.sh          - Показать все логи (realtime)"
    echo "  ./view-logs.sh vibee    - Только VIBEE агент"
    echo "  ./view-logs.sh kols     - Только KOLS агент"
    echo "  ./view-logs.sh neuro    - Только NeuroPhoto агент"
    echo "  ./view-logs.sh errors   - Только ошибки из всех логов"
    echo "  ./view-logs.sh --help   - Показать эту справку"
    echo ""
    echo "⌨️  Горячие клавиши:"
    echo "  Ctrl+C - Выйти из просмотра"
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
        echo "🔵 Просмотр VIBEE агента (Ctrl+C для выхода)"
        echo "=========================================="
        tail -f logs/vibee.log
        ;;
    "kols")
        echo "🟡 Просмотр KOLS агента (Ctrl+C для выхода)"
        echo "=========================================="
        tail -f logs/kols.log
        ;;
    "neuro")
        echo "🟣 Просмотр NeuroPhoto агента (Ctrl+C для выхода)"
        echo "==============================================="
        tail -f logs/neurophoto.log
        ;;
    "errors")
        echo "⚠️  Только ошибки из всех логов (Ctrl+C для выхода)"
        echo "================================================="
        tail -f logs/*.log | grep -i "error\|fail\|warn\|exception"
        ;;
    *)
        # По умолчанию показываем все логи
        echo "🚀 Все агенты VIBEE (Ctrl+C для выхода)"
        echo "======================================="
        echo ""

        # Проверяем есть ли multitail
        if command -v multitail &> /dev/null; then
            echo "✅ Использую multitail для красивого отображения..."
            # Упрощенная версия без сложных параметров
            multitail -cS bash logs/vibee.log logs/kols.log logs/neurophoto.log
        else
            echo "⚠️  multitail не найден, использую стандартный tail..."
            echo ""
            echo "💡 Установка multitail: brew install multitail"
            echo ""

            # Используем простой tail для всех файлов
            echo "📺 Показываю логи всех агентов одновременно..."
            echo ""

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

            # Ждем завершения (пока пользователь не нажмет Ctrl+C)
            wait
        fi
        ;;
esac
