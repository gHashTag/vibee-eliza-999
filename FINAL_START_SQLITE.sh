#!/bin/bash
# ФИНАЛЬНЫЙ скрипт запуска с SQLite

echo "🧹 ПОЛНАЯ ОЧИСТКА НАСТРОЕК И ПЕРЕЗАПУСК"
echo "=========================================="

# 1. Убиваем все процессы
echo ""
echo "1️⃣ Убиваем все процессы..."
pkill -9 -f elizaos 2>/dev/null
pkill -9 -f bun 2>/dev/null
sleep 3

# 2. Очищаем настройки
echo "2️⃣ Очищаем настройки..."
rm -f .env.local 2>/dev/null
mv .env.local.bak .env.local.bak 2>/dev/null  # если есть

# 3. Очищаем базу данных
echo "3️⃣ Очищаем SQLite базу..."
rm -f data/dev.sqlite
rm -f .eliza/.elizadb 2>/dev/null

# 4. Очищаем логи
echo "4️⃣ Очищаем логи..."
rm -f logs/*.log

# 5. Устанавливаем переменные окружения
echo "5️⃣ Устанавливаем переменные окружения..."
export DATABASE_URL="sqlite:./data/dev.sqlite"
export DATABASE_ADAPTER="sqlite"
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true
export NODE_ENV="development"

echo "   DATABASE_URL: $DATABASE_URL"
echo "   DATABASE_ADAPTER: $DATABASE_ADAPTER"

# 6. Запускаем агента
echo ""
echo "6️⃣ Запускаем KOLS агент с SQLite..."
env PORT=3000 DATABASE_URL="$DATABASE_URL" DATABASE_ADAPTER="$DATABASE_ADAPTER" ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json > logs/vibee.log 2>&1 &

echo "✅ Агент запущен в фоне"
echo ""
echo "📊 Статус:"
echo "   Лог: tail -f logs/vibee.log"
echo "   URL: http://localhost:3000"
echo ""
echo "⏳ Ожидаем 10 секунд и проверяем базу данных..."
sleep 10

echo ""
echo "📋 Проверяем конфигурацию БД:"
if grep -E "(postgresUrl|DATABASE.*adapter|Using.*PostgreSQL|Using.*SQLite)" logs/vibee.log | tail -5; then
    echo ""
    echo "✅ База данных настроена!"
else
    echo "⚠️  Проверяем логи вручную..."
    tail -30 logs/vibee.log | grep -E "(Database|adapter|Error|error)" | head -5
fi
