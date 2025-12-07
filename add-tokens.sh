#!/bin/bash
# Скрипт для добавления токенов VIBEE

echo "🔐 Добавление токенов VIBEE"
echo "=========================="
echo ""

# Функция для запроса токена
ask_token() {
    local token_name="$1"
    local env_var="$2"
    local description="$3"

    echo "📝 Введите $token_name"
    echo "   $description"
    read -p "   (оставьте пустым чтобы пропустить): " token_value

    if [ -n "$token_value" ]; then
        echo "export $env_var=\"$token_value\"" >> /tmp/tokens.env
        echo "   ✅ $token_name добавлен"
    else
        echo "   ⏭️  $token_name пропущен"
    fi
    echo ""
}

# Создаем временный файл для токенов
> /tmp/tokens.env

echo "🎯 Необходимо добавить следующие токены:"
echo ""

# Запрашиваем токены
ask_token "Telegram Bot Token" "TELEGRAM_BOT_TOKEN" "Токен для работы Telegram бота"
ask_token "FAL API Key" "FAL_KEY" "Ключ для обучения LoRA моделей (fal.ai)"
ask_token "Replicate API Key" "REPLICATE_API_KEY" "Ключ для генерации изображений (replicate.com)"
ask_token "OpenRouter API Key" "OPENROUTER_API_KEY" "Ключ для LLM моделей (openrouter.ai)"

echo ""
echo "🔍 Проверка файлов:"
echo "-------------------"

if [ -f ".env" ]; then
    echo "✅ Найден файл .env"
    ENV_FILE=".env"
elif [ -f ".env.dev" ]; then
    echo "✅ Найден файл .env.dev"
    ENV_FILE=".env.dev"
else
    echo "❌ Файлы .env и .env.dev не найдены!"
    exit 1
fi

echo ""
echo "📋 Содержимое /tmp/tokens.env:"
echo "------------------------------"
cat /tmp/tokens.env
echo ""

echo "❓ Добавить эти токены в $ENV_FILE?"
read -p "Введите 'yes' для подтверждения: " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "🔄 Добавление токенов в $ENV_FILE..."

    # Создаем бэкап
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✅ Создан бэкап: ${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"

    # Добавляем токены в конец файла
    echo "" >> "$ENV_FILE"
    echo "# VIBEE Tokens - добавлено автоматически" >> "$ENV_FILE"
    cat /tmp/tokens.env >> "$ENV_FILE"

    echo "✅ Токены добавлены в $ENV_FILE"
    echo ""

    # Показываем что добавили
    echo "📊 Добавленные токены:"
    grep -E "(TELEGRAM_BOT_TOKEN|FAL_KEY|REPLICATE_API_KEY|OPENROUTER_API_KEY)" "$ENV_FILE" | tail -4
else
    echo "❌ Операция отменена"
    exit 1
fi

echo ""
echo "🚀 СЛЕДУЮЩИЕ ШАГИ:"
echo "------------------"
echo "1. Перезапустите агентов:"
echo "   pkill -f 'elizaos'"
echo "   ./start-agents.sh"
echo ""
echo "2. Проверьте логи:"
echo "   ./view-logs-simple.sh"
echo ""

# Удаляем временный файл
rm /tmp/tokens.env

echo "✅ Готово!"
