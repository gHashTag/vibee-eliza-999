#!/bin/bash
# 🚀 Полный запуск ВСЕХ компонентов VIBEE

echo "🛑 Останавливаем все предыдущие процессы..."

# Убиваем все предыдущие процессы агентов
pkill -9 -f "elizaos" 2>/dev/null
pkill -9 -f "npx elizaos" 2>/dev/null
pkill -9 -f "vibeeAgent.json" 2>/dev/null
pkill -9 -f "kolsAgent.json" 2>/dev/null
pkill -9 -f "instagramExpert.json" 2>/dev/null
pkill -9 -f "neuroPhoto.json" 2>/dev/null
pkill -9 -f "vibee-client" 2>/dev/null
sleep 3

echo "✅ Все предыдущие процессы остановлены"
echo ""
echo "🚀 Запуск всех компонентов VIBEE..."

# 🔐 Загружаем .env файл если существует
if [ -f /Users/playra/vibee-agent/.env ]; then
    echo "🔐 Загружаем переменные из .env..."
    set -a
    source /Users/playra/vibee-agent/.env
    set +a
    echo "✅ Переменные окружения загружены"
fi

# 🔧 ПРИНУДИТЕЛЬНОЕ переключение на SQLite для разработки
echo "🔧 Принудительно используем SQLite для разработки"
export DATABASE_URL="sqlite:./data/dev.sqlite"
export DATABASE_ADAPTER=sqlite
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

echo "✅ Database configured: $DATABASE_ADAPTER"
echo "   URL: $DATABASE_URL"

# 🔧 КРИТИЧЕСКИ ВАЖНО: Запускаем миграции ОДИН РАЗ перед запуском агентов
# Это предотвращает ошибки интроспекции Drizzle при параллельном старте
echo ""
echo "🔧 Запускаем миграции базы данных..."
bash /Users/playra/vibee-agent/scripts/run-migrations.sh

if [ $? -eq 0 ]; then
    echo "✅ Миграции завершены успешно"
else
    echo "❌ Ошибка миграций - проверьте logs/migration.log"
    exit 1
fi

echo ""

# 1. Проверяем и запускаем кастомный клиент
if ! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "📱 Запускаем кастомный клиент..."
    cd /Users/playra/vibee-agent/vibee-client
    npm run dev > /dev/null 2>&1 &
    CLIENT_PID=$!
    sleep 3
    echo "✅ Кастомный клиент запущен (PID: $CLIENT_PID) на http://localhost:5173"
else
    echo "✅ Кастомный клиент уже работает на http://localhost:5173"
fi

# 2. Переходим в корень проекта
cd /Users/playra/vibee-agent

echo ""
echo "📋 Запускаем агентов (каждый на своем порту):"

# 3. VIBEE Agent (порт 3000) - ПЕРВЫЙ, ждём полной инициализации
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  1. VIBEE (главный) → порт 3000"
    echo "DEBUG: Running VIBEE agent command: env PORT=3000 DATABASE_URL=\"$DATABASE_URL\" DATABASE_ADAPTER=\"$DATABASE_ADAPTER\" TELEGRAM_BOT_TOKEN=\"[REDACTED]\" OPENROUTER_API_KEY=\"[REDACTED]\" SECRET_SALT=\"[REDACTED]\" npx elizaos start --character /Users/playra/vibee-agent/characters/vibeeAgent.json"
    env PORT=3000 \
        DATABASE_URL="$DATABASE_URL" \
        DATABASE_ADAPTER="$DATABASE_ADAPTER" \
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
        OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
        SECRET_SALT="$SECRET_SALT" \
        npx elizaos start --character /Users/playra/vibee-agent/characters/vibeeAgent.json > logs/vibee.log 2>&1 &

    # Ждём пока VIBEE полностью запустится (миграции + сервисы)
    echo "     ⏳ Ожидаем запуска VIBEE (миграции БД)..."
    sleep 15

    # Проверяем что порт открылся
    for i in {1..20}; do
        if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "     ✅ VIBEE запущен на порту 3000"
            break
        fi
        sleep 2
    done
else
    echo "  1. VIBEE уже работает на порту 3000"
fi

# 4. Instagram Expert (порт 3001) - ВТОРОЙ
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  2. Instagram Expert → порт 3001"
    echo "DEBUG: Running Instagram agent command: env PORT=3001 DATABASE_URL=\"$DATABASE_URL\" DATABASE_ADAPTER=\"$DATABASE_ADAPTER\" TELEGRAM_BOT_TOKEN=\"[REDACTED]\" OPENROUTER_API_KEY=\"[REDACTED]\" SECRET_SALT=\"[REDACTED]\" npx elizaos start --character /Users/playra/vibee-agent/characters/instagramExpert.json"
    env PORT=3001 \
        DATABASE_URL="$DATABASE_URL" \
        DATABASE_ADAPTER="$DATABASE_ADAPTER" \
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
        OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
        SECRET_SALT="$SECRET_SALT" \
        npx elizaos start --character /Users/playra/vibee-agent/characters/instagramExpert.json > logs/instagram.log 2>&1 &

    echo "     ⏳ Ожидаем запуска Instagram Expert..."
    sleep 10

    for i in {1..15}; do
        if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "     ✅ Instagram Expert запущен на порту 3001"
            break
        fi
        sleep 2
    done
else
    echo "  2. Instagram Expert уже работает на порту 3001"
fi

# 5. KOLS Agent (порт 3002) - ТРЕТИЙ
if ! lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  3. KOLS Agent → порт 3002"
    echo "DEBUG: Running KOLS agent command: env PORT=3002 DATABASE_URL=\"$DATABASE_URL\" DATABASE_ADAPTER=\"$DATABASE_ADAPTER\" TELEGRAM_API_ID=\"[REDACTED]\" TELEGRAM_API_HASH=\"[REDACTED]\" TELEGRAM_SESSION_STRING=\"[REDACTED]\" TELEGRAM_BOT_TOKEN=\"[REDACTED]\" OPENROUTER_API_KEY=\"[REDACTED]\" SECRET_SALT=\"[REDACTED]\" npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json"
    env PORT=3002 \
        DATABASE_URL="$DATABASE_URL" \
        DATABASE_ADAPTER="$DATABASE_ADAPTER" \
        TELEGRAM_API_ID="$TELEGRAM_API_ID" \
        TELEGRAM_API_HASH="$TELEGRAM_API_HASH" \
        TELEGRAM_SESSION_STRING="$TELEGRAM_SESSION_STRING" \
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
        OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
        SECRET_SALT="$SECRET_SALT" \
        npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json > logs/kols.log 2>&1 &

    echo "     ⏳ Ожидаем запуска KOLS Agent..."
    sleep 10

    for i in {1..15}; do
        if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "     ✅ KOLS Agent запущен на порту 3002"
            break
        fi
        sleep 2
    done
else
    echo "  3. KOLS Agent уже работает на порту 3002"
fi

# NeuroPhoto Agent отключён - файл neuroPhoto.json не существует
# Если нужен, создайте characters/neuroPhoto.json

echo ""
echo "🎉 ВСЕ ЗАПУЩЕНО!"
echo ""
echo "📊 Статус компонентов:"
echo "  🔵 Агент VIBEE:        http://localhost:3000"
echo "  🟢 Агент Instagram:    http://localhost:3001"
echo "  🟡 Агент KOLS:         http://localhost:3002"
echo "  🎨 Кастомный клиент:   http://localhost:5173"
echo ""
echo "⏹️  Для остановки: Ctrl+C"
echo ""
echo "📺 ЛОГИ ВСЕХ АГЕНТОВ (в реальном времени):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Функция для очистки при выходе
cleanup() {
    echo ""
    echo "🛑 Останавливаем всех агентов..."
    pkill -f 'elizaos' 2>/dev/null
    pkill -f 'vite' 2>/dev/null
    exit 0
}

# Ловим Ctrl+C
trap cleanup SIGINT SIGTERM


