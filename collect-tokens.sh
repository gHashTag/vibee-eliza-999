#!/bin/bash
# Скрипт сбора всех доступных токенов

echo "🔐 СБОР ДОСТУПНЫХ ТОКЕНОВ VIBEE"
echo "==============================="
echo ""

# Функция для проверки токена
check_token() {
    local token_name="$1"
    local env_var="$2"
    local pattern="$3"

    if [ -n "${!env_var}" ]; then
        echo "✅ $token_name - НАЙДЕН"
        echo "   Переменная: $env_var"
        echo "   Значение: ${!env_var:0:20}..."
        echo ""
        return 0
    else
        echo "❌ $token_name - НЕ НАЙДЕН"
        echo "   Ожидаемая переменная: $env_var"
        echo ""
        return 1
    fi
}

echo "📊 ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:"
echo "--------------------------------"
echo ""

check_token "OpenRouter API" "OPENROUTER_API_KEY" "sk-or-v1"
check_token "Telegram Bot Token" "TELEGRAM_BOT_TOKEN" "^[0-9]+:"
check_token "FAL API Key" "FAL_KEY" "fal_key"
check_token "Replicate API Key" "REPLICATE_API_KEY" "r8_"

echo ""
echo "📋 РЕЗУЛЬТАТ:"
echo "-------------"

# Создаем список найденных токенов
FOUND_COUNT=0
MISSING_COUNT=0

if [ -n "$OPENROUTER_API_KEY" ]; then
    FOUND_COUNT=$((FOUND_COUNT + 1))
    echo "✅ OpenRouter API: НАЙДЕН"
else
    MISSING_COUNT=$((MISSING_COUNT + 1))
    echo "❌ OpenRouter API: ОТСУТСТВУЕТ"
fi

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    FOUND_COUNT=$((FOUND_COUNT + 1))
    echo "✅ Telegram Bot Token: НАЙДЕН"
else
    MISSING_COUNT=$((MISSING_COUNT + 1))
    echo "❌ Telegram Bot Token: ОТСУТСТВУЕТ"
fi

if [ -n "$FAL_KEY" ]; then
    FOUND_COUNT=$((FOUND_COUNT + 1))
    echo "✅ FAL API Key: НАЙДЕН"
else
    MISSING_COUNT=$((MISSING_COUNT + 1))
    echo "❌ FAL API Key: ОТСУТСТВУЕТ"
fi

if [ -n "$REPLICATE_API_KEY" ]; then
    FOUND_COUNT=$((FOUND_COUNT + 1))
    echo "✅ Replicate API Key: НАЙДЕН"
else
    MISSING_COUNT=$((MISSING_COUNT + 1))
    echo "❌ Replicate API Key: ОТСУТСТВУЕТ"
fi

echo ""
echo "📊 ИТОГО:"
echo "---------"
echo "Найдено: $FOUND_COUNT / 4"
echo "Отсутствует: $MISSING_COUNT / 4"
echo ""

if [ $MISSING_COUNT -gt 0 ]; then
    echo "⚠️  НЕДОСТАЮЩИЕ ТОКЕНЫ:"
    echo "----------------------"

    if [ -z "$OPENROUTER_API_KEY" ]; then
        echo "❌ OpenRouter API Key - получить на https://openrouter.ai"
    fi

    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "❌ Telegram Bot Token - получить на https://t.me/BotFather"
    fi

    if [ -z "$FAL_KEY" ]; then
        echo "❌ FAL API Key - получить на https://fal.ai"
    fi

    if [ -z "$REPLICATE_API_KEY" ]; then
        echo "❌ Replicate API Key - получить на https://replicate.com"
    fi

    echo ""
    echo "📝 ДОБАВИТЬ В .env:"
    echo "------------------"
    echo "Откройте .env файл и раскомментируйте строки с недостающими токенами"
    echo ""
    echo "🚀 ЗАТЕМ ПЕРЕЗАПУСТИТЬ:"
    echo "----------------------"
    echo "pkill -f 'elizaos'"
    echo "./start-agents.sh"
else
    echo "🎉 ВСЕ ТОКЕНЫ НАЙДЕНЫ!"
    echo ""
    echo "Перезапустите агентов:"
    echo "pkill -f 'elizaos'"
    echo "./start-agents.sh"
fi
