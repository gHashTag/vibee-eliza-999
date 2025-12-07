#!/bin/bash
# Скрипт проверки и исправления токенов VIBEE

echo "🔐 VIBEE - Проверка и исправление токенов"
echo "========================================"
echo ""

# Функция проверки токена
check_token() {
    local token_name="$1"
    local env_var="$2"
    local description="$3"

    if [ -n "${!env_var}" ]; then
        echo "✅ $token_name - УСТАНОВЛЕН"
        return 0
    else
        echo "❌ $token_name - НЕ НАЙДЕН"
        echo "   Описание: $description"
        return 1
    fi
}

echo "📋 Проверка текущих токенов:"
echo "----------------------------"

# Проверяем основные токены
TELEGRAM_BOT_TOKEN_FOUND=0
FAL_KEY_FOUND=0
REPLICATE_API_KEY_FOUND=0
OPENROUTER_API_KEY_FOUND=0

check_token "Telegram Bot Token" "TELEGRAM_BOT_TOKEN" "Токен для работы Telegram бота. Получить на https://t.me/BotFather" && TELEGRAM_BOT_TOKEN_FOUND=1
echo ""
check_token "FAL API Key" "FAL_KEY" "Ключ для обучения LoRA моделей. Получить на https://fal.ai" && FAL_KEY_FOUND=1
echo ""
check_token "Replicate API Key" "REPLICATE_API_KEY" "Ключ для генерации изображений. Получить на https://replicate.com" && REPLICATE_API_KEY_FOUND=1
echo ""
check_token "OpenRouter API Key" "OPENROUTER_API_KEY" "Ключ для LLM моделей. Получить на https://openrouter.ai" && OPENROUTER_API_KEY_FOUND=1

echo ""
echo "📊 Инфо по агентам:"
echo "-------------------"

echo ""
echo "🔵 VIBEE Agent (порт 3000):"
echo "   - Требует: OPENROUTER_API_KEY"
echo "   - Статус: $([ $OPENROUTER_API_KEY_FOUND -eq 1 ] && echo "✅ Готов" || echo "❌ Нужен токен")"

echo ""
echo "🟡 KOLS Agent (порт 3002):"
echo "   - Требует: TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY"
echo "   - Статус: $([ $TELEGRAM_BOT_TOKEN_FOUND -eq 1 ] && [ $OPENROUTER_API_KEY_FOUND -eq 1 ] && echo "✅ Готов" || echo "❌ Нужны токены")"
echo "   - MTProto: ✅ Работает (использует API_ID/API_HASH)"

echo ""
echo "🟣 NeuroPhoto Agent (порт 3003):"
echo "   - Требует: FAL_KEY, REPLICATE_API_KEY, TELEGRAM_BOT_TOKEN"
echo "   - Статус: $([ $FAL_KEY_FOUND -eq 1 ] && [ $REPLICATE_API_KEY_FOUND -eq 1 ] && echo "✅ Готов" || echo "❌ Нужны токены")"

echo ""
echo "🔧 РЕШЕНИЕ:"
echo "----------"

if [ $TELEGRAM_BOT_TOKEN_FOUND -eq 0 ] || [ $FAL_KEY_FOUND -eq 0 ] || [ $REPLICATE_API_KEY_FOUND -eq 0 ] || [ $OPENROUTER_API_KEY_FOUND -eq 0 ]; then
    echo "⚠️  Обнаружены недостающие токены!"
    echo ""
    echo "📌 Варианты решения:"
    echo ""
    echo "1️⃣  ДОБАВИТЬ В .env.dev (временное решение):"
    echo "   Откройте .env.dev и добавьте:"
    echo ""
    [ $TELEGRAM_BOT_TOKEN_FOUND -eq 0 ] && echo "   TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN"
    [ $FAL_KEY_FOUND -eq 0 ] && echo "   FAL_KEY=YOUR_FAL_KEY"
    [ $REPLICATE_API_KEY_FOUND -eq 0 ] && echo "   REPLICATE_API_KEY=YOUR_REPLICATE_KEY"
    [ $OPENROUTER_API_KEY_FOUND -eq 0 ] && echo "   OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY"
    echo ""
    echo "2️⃣  НАСТРОИТЬ INFISICAL (правильное решение):"
    echo "   infisical login"
    echo "   infisical secrets set TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN"
    echo "   infisical secrets set FAL_KEY=YOUR_FAL_KEY"
    echo "   infisical secrets set REPLICATE_API_KEY=YOUR_REPLICATE_KEY"
    echo "   infisical secrets set OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY"
    echo ""
    echo "3️⃣  СОЗДАТЬ ЛОКАЛЬНЫЙ .env:"
    echo "   Создайте файл .env.local с токенами"
    echo ""
else
    echo "✅ Все токены найдены!"
fi

echo ""
echo "🚀 ПОСЛЕ ДОБАВЛЕНИЯ ТОКЕНОВ:"
echo "--------------------------"
echo "1. Перезапустите агентов:"
echo "   pkill -f 'elizaos'"
echo "   ./start-agents.sh"
echo ""
echo "2. Проверьте логи:"
echo "   ./view-logs-simple.sh"
echo ""

echo "📚 ССЫЛКИ ДЛЯ ПОЛУЧЕНИЯ ТОКЕНОВ:"
echo "--------------------------------"
echo "🔗 Telegram Bot Token: https://t.me/BotFather"
echo "🔗 FAL API Key: https://fal.ai"
echo "🔗 Replicate API Key: https://replicate.com"
echo "🔗 OpenRouter API Key: https://openrouter.ai"
echo ""

echo "💡 СОВЕТ: Все токены должны быть добавлены в Infisical Cloud"
echo "   для правильной работы всех агентов!"
