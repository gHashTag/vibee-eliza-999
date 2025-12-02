#!/usr/bin/env bash
set -e

echo "🔥 Запуск VIBEE с Нейрофото (TEXT_LARGE модель)..."
echo "⚙️ Используется модель: google/gemini-3-pro-exp-02-05 через OpenRouter"
echo ""

# Строим server с исправлениями
echo "📦 Сборка server..."
npx turbo run build --filter=@elizaos/server --no-cache || true

echo ""
echo "🚀 Запуск AgentServer на порту 3000..."

# Запускаем только server, пропускаем CLI проверки
cd /Users/playra/vibee-eliza-999/packages/server
node dist/index.js || bun run start
