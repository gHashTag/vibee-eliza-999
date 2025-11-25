#!/bin/bash

# Скрипт для тестирования мониторинга групп KOLS AGENT
# Использование: ./scripts/test-monitoring.sh

echo "🧪 Запуск тестов мониторинга групп KOLS AGENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Функция для запуска тестов
run_test() {
    local test_name=$1
    echo "▶️  $test_name"
    echo ""

    case $test_name in
        "Интеграционные тесты")
            cd /Users/playra/vibee-agent/plugin-telegram-craft
            bun test src/__tests__/group-monitoring.test.ts
            ;;
        "Проверка типов")
            cd /Users/playra/vibee-agent/plugin-telegram-craft
            tsc --noEmit --skipLibCheck
            ;;
        "Rainbow Bridge сценарии")
            echo "⚠️  Требует настройки Telegram API"
            echo "   Настройте TELEGRAM_BOT_TOKEN в .env"
            echo "   Затем запустите:"
            echo "   python3 scripts/rainbow-bridge-runner.py \\"
            echo "     tests/rainbow-bridge-scenarios.json --critical-only"
            ;;
        *)
            echo "❌ Неизвестный тест"
            ;;
    esac

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Меню выбора тестов
PS3="Выберите тест (1-4): "
options=("Интеграционные тесты" "Проверка типов" "Rainbow Bridge сценарии" "Все тесты" "Выход")

while true; do
    echo ""
    echo "📋 Доступные тесты:"
    echo "   1) Интеграционные тесты (plugin-telegram-craft)"
    echo "   2) Проверка типов (TypeScript)"
    echo "   3) Rainbow Bridge сценарии (требует настройки)"
    echo "   4) Все тесты"
    echo "   5) Выход"
    echo ""

    select opt in "${options[@]}"; do
        case $REPLY in
            1)
                run_test "Интеграционные тесты"
                break
                ;;
            2)
                run_test "Проверка типов"
                break
                ;;
            3)
                run_test "Rainbow Bridge сценарии"
                break
                ;;
            4)
                run_test "Интеграционные тесты"
                run_test "Проверка типов"
                run_test "Rainbow Bridge сценарии"
                break
                ;;
            5)
                echo "👋 Выход"
                exit 0
                ;;
            *)
                echo "❌ Неверный выбор"
                ;;
        esac
    done
done
