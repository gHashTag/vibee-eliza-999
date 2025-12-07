#!/bin/bash

echo "🔬 Запуск теста GramJS"
printf '=%.0s' {1..50}
echo ""

# Попытка получить секреты из Infisical
echo "📦 Получение секретов из Infisical..."

# Пробуем разные способы получения секретов
if command -v infisical &> /dev/null; then
    echo "✅ Infisical CLI найден"

    # Пробуем получить секреты
    SECRETS_OUTPUT=$(infisical secrets --env=dev 2>&1)

    if [ $? -eq 0 ]; then
        echo "✅ Секреты получены"

        # Извлекаем нужные переменные
        TELEGRAM_API_ID=$(echo "$SECRETS_OUTPUT" | grep "TELEGRAM_API_ID" | awk '{print $2}' | head -1)
        TELEGRAM_API_HASH=$(echo "$SECRETS_OUTPUT" | grep "TELEGRAM_API_HASH" | awk '{print $2}' | head -1)
        TELEGRAM_SESSION_STRING=$(echo "$SECRETS_OUTPUT" | grep "TELEGRAM_SESSION_STRING" | awk '{print $2}' | head -1)

        if [ -n "$TELEGRAM_API_ID" ] && [ -n "$TELEGRAM_API_HASH" ]; then
            echo "✅ Переменные извлечены"

            # Экспортируем для Node.js
            export TELEGRAM_API_ID
            export TELEGRAM_API_HASH
            export TELEGRAM_SESSION_STRING

            echo "📊 Проверка переменных:"
            echo "   TELEGRAM_API_ID: ${TELEGRAM_API_ID:0:10}..."
            echo "   TELEGRAM_API_HASH: ${TELEGRAM_API_HASH:0:8}..."
            echo "   TELEGRAM_SESSION_STRING: ${TELEGRAM_SESSION_STRING:0:20}..."

            # Запускаем тест
            echo ""
            echo "🚀 Запуск теста GramJS..."
            NODE_PATH=/Users/playra/vibee-agent/plugin-telegram-craft/node_modules node /Users/playra/vibee-agent/test-gramjs-direct.cjs

        else
            echo "❌ Не удалось извлечь переменные из Infisical"
            exit 1
        fi
    else
        echo "⚠️ Ошибка получения секретов из Infisical"
        echo "Попробуйте вручную настроить Infisical или добавьте переменные в .env"
        exit 1
    fi
else
    echo "❌ Infisical CLI не найден"
    echo "Установите: npm install -g @infisical/cli"
    exit 1
fi
