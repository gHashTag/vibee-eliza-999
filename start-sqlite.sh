#!/bin/bash
# Запуск агента с SQLite для обхода PostgreSQL багов в @elizaos/server

echo "🛑 Останавливаем все процессы..."
pkill -9 -f "elizaos" 2>/dev/null
sleep 2

echo "✅ Процессы остановлены"
echo ""
echo "🔧 SQLite Configuration:"
export DATABASE_URL="sqlite:./data/dev.sqlite"
export DATABASE_ADAPTER=sqlite
unset POSTGRES_URL

echo "  DATABASE_URL=$DATABASE_URL"
echo "  DATABASE_ADAPTER=$DATABASE_ADAPTER"
echo ""

echo "🚀 Запускаем VIBEE агент с SQLite..."
cd /Users/playra/vibee-agent
PORT=3000 npx elizaos start --character /Users/playra/vibee-agent/characters/vibeeAgent.json > logs/vibee.log 2>&1 &

echo "✅ Агент запущен в фоне"
echo ""
echo "📊 Статус:"
echo "  Лог: tail -f logs/vibee.log"
echo "  URL: http://localhost:3000"
echo ""
echo "⏹️  Для остановки: pkill -f 'elizaos'"
