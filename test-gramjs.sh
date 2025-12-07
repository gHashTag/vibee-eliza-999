#!/bin/bash

echo "=== GramJS API Testing Script ==="
echo ""

# Проверяем наличие telegram пакета
if [ ! -d "node_modules/telegram" ]; then
    echo "📦 Устанавливаю telegram..."
    npm install telegram
fi

# Загружаем переменные из .env если файл существует
if [ -f ".env" ]; then
    echo "📄 Загружаю переменные из .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Проверяем наличие переменных окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ] && [ -z "$TELEGRAM_SESSION_STRING" ] && [ -z "$TELEGRAM_API_ID" ]; then
    echo ""
    echo "❌ НЕ НАЙДЕНЫ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ!"
    echo ""
    echo "Нужно установить ОДИН из вариантов:"
    echo ""
    echo "1️⃣  Для бота (LIMITED -GramJS не поддерживает ботов!):"
    echo "   export TELEGRAM_BOT_TOKEN=your_bot_token"
    echo ""
    echo "2️⃣  Для пользователя (РЕКОМЕНДУЕТСЯ):"
    echo "   export TELEGRAM_API_ID=your_api_id"
    echo "   export TELEGRAM_API_HASH=your_api_hash"
    echo "   export TELEGRAM_PHONE=your_phone_number"
    echo ""
    echo "3️⃣  С существующей сессией (самое простое):"
    echo "   export TELEGRAM_API_ID=your_api_id"
    echo "   export TELEGRAM_API_HASH=your_api_hash"
    echo "   export TELEGRAM_SESSION_STRING=your_session_string"
    echo ""
    echo "Как получить API_ID и API_HASH:"
    echo "  1. Идите на https://my.telegram.org"
    echo "  2. Войдите с вашим номером телефона"
    echo "  3. Перейдите в 'API Development Tools'"
    echo "  4. Создайте приложение"
    echo ""
    exit 1
fi

echo "✅ Переменные окружения найдены"
echo ""

# Запускаем тест
echo "🚀 Запускаю GramJS API тест..."
echo ""
echo "Выходные файлы:"
echo "  📄 gramjs-test-log.txt - полный лог событий"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""
echo "================================"
echo ""

node test-gramjs-api.cjs
