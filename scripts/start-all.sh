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

# Экспортируем PostgreSQL конфигурацию - ВСЕГДА ИСПОЛЬЗУЕМ POSTGRESQL!
# ВАЖНО: SQL плагин ищет именно POSTGRES_URL, не DATABASE_URL!
export POSTGRES_URL="postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DATABASE_URL="$POSTGRES_URL"
export DATABASE_ADAPTER=postgres

echo "✅ PostgreSQL настроена: $POSTGRES_URL"

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

# 3. VIBEE Agent (порт 3000)
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  1. VIBEE (главный) → порт 3000"
    env PORT=3000 POSTGRES_URL="$POSTGRES_URL" DATABASE_URL="$POSTGRES_URL" DATABASE_ADAPTER=postgres npx elizaos start --character /Users/playra/vibee-agent/characters/vibeeAgent.json > logs/vibee.log 2>&1 &
    sleep 3
else
    echo "  1. VIBEE уже работает на порту 3000"
fi

# 4. Instagram Expert (порт 3001)
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  2. Instagram Expert → порт 3001"
    env PORT=3001 POSTGRES_URL="$POSTGRES_URL" DATABASE_URL="$POSTGRES_URL" DATABASE_ADAPTER=postgres AGENT_TYPE=instagram bun dev > logs/instagram.log 2>&1 &
    sleep 3
else
    echo "  2. Instagram Expert уже работает на порту 3001"
fi

# 5. KOLS Agent (порт 3002)
if ! lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  3. KOLS Agent → порт 3002"
    env PORT=3002 POSTGRES_URL="$POSTGRES_URL" DATABASE_URL="$POSTGRES_URL" DATABASE_ADAPTER=postgres npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json > logs/kols.log 2>&1 &
    sleep 3
else
    echo "  3. KOLS Agent уже работает на порту 3002"
fi

# 6. NeuroPhoto Agent (порт 3003)
if ! lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  4. NeuroPhoto Agent → порт 3003"
    env PORT=3003 POSTGRES_URL="$POSTGRES_URL" DATABASE_URL="$POSTGRES_URL" DATABASE_ADAPTER=postgres npx elizaos start --character /Users/playra/vibee-agent/characters/neuroPhoto.json > logs/neurophoto.log 2>&1 &
    sleep 3
else
    echo "  4. NeuroPhoto Agent уже работает на порту 3003"
fi

echo ""
echo "🎉 ВСЕ ЗАПУЩЕНО!"
echo ""
echo "📊 Статус компонентов:"
echo "  🔵 Агент VIBEE:        http://localhost:3000"
echo "  🟢 Агент Instagram:    http://localhost:3001"
echo "  🟡 Агент KOLS:         http://localhost:3002"
echo "  🟣 Агент NeuroPhoto:   http://localhost:3003"
echo "  🎨 Кастомный клиент:   http://localhost:5173"
echo ""
echo "📁 Логи агентов:"
echo "  tail -f logs/vibee.log"
echo "  tail -f logs/instagram.log"
echo "  tail -f logs/kols.log"
echo "  tail -f logs/neurophoto.log"
echo ""
echo "⏹️  Для остановки всех: pkill -f 'elizaos' && pkill -f 'vite'"
