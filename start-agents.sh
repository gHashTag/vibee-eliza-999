#!/bin/bash
# Скрипт запуска всех агентов VIBEE с внешней PostgreSQL БД

echo "🚀 Запуск агентов VIBEE с PostgreSQL..."

# Загружаем переменные из .env файла
if [ -f ".env" ]; then
    echo "📄 Загружаю переменные из .env файла..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ Переменные загружены"
else
    echo "⚠️  Файл .env не найден!"
fi

# Остановить предыдущие процессы
pkill -9 -f "elizaos" 2>/dev/null
sleep 2

# Настройки PostgreSQL (Neon)
export POSTGRES_URL="postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DATABASE_URL="$POSTGRES_URL"
export DATABASE_ADAPTER=postgresql
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

# VIBEE Agent (порт 3000)
echo "  → Запуск VIBEE на порту 3000..."
PORT=3000 DATABASE_URL="$DATABASE_URL" DATABASE_ADAPTER="$DATABASE_ADAPTER" ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true npx elizaos start --character /Users/playra/vibee-agent/characters/vibeeAgent.json > logs/vibee.log 2>&1 &
VIBEE_PID=$!

sleep 3

# KOLS Agent (порт 3002)
echo "  → Запуск KOLS Agent на порту 3002..."
PORT=3002 DATABASE_URL="$DATABASE_URL" DATABASE_ADAPTER="$DATABASE_ADAPTER" ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json > logs/kols.log 2>&1 &
KOLS_PID=$!

sleep 3

# NeuroPhoto Agent (порт 3003)
echo "  → Запуск NeuroPhoto Agent на порту 3003..."
PORT=3003 DATABASE_URL="$DATABASE_URL" DATABASE_ADAPTER="$DATABASE_ADAPTER" ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true npx elizaos start --character /Users/playra/vibee-agent/characters/neuroPhoto.json > logs/neurophoto.log 2>&1 &
NEURO_PID=$!

sleep 12

echo ""
echo "✅ Все агенты запущены!"
echo ""
echo "📊 Статус:"
echo "  🔵 VIBEE:        http://localhost:3000 (PID: $VIBEE_PID)"
echo "  🟡 KOLS:         http://localhost:3002 (PID: $KOLS_PID)"
echo "  🟣 NeuroPhoto:   http://localhost:3003 (PID: $NEURO_PID)"
echo ""
echo "🗄️  База данных: PostgreSQL (Neon)"
echo "🛠️  Патч @elizaos/plugin-sql: (Array.isArray(idx.columns) ? idx.columns : []).map"
echo ""
echo "⏹️  Для остановки: pkill -f 'elizaos'"
