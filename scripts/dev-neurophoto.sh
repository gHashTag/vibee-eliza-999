#!/usr/bin/env bash
set -e

echo "🚀 Запуск Нейрофото в режиме разработки..."
echo "📋 Агент: Нейрофото (NeuroPhoto)"
echo "🌐 UI: http://localhost:5173"
echo "🔌 API: http://localhost:3000"
echo ""

# Убиваем все процессы elizaos/vite/node
pkill -f "elizaos\|vite\|node.*3000\|node.*5173" 2>/dev/null || true
sleep 2

# Запускаем elizaos dev с характером Нейрофото
npx elizaos dev --character packages/vibee-agents/characters/neurophoto.character.json
