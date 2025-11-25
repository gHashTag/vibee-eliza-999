#!/bin/bash

# Тест KOLS AGENT команд через API
# Используется для проверки что команды работают

echo "🧪 ТЕСТ KOLS AGENT КОМАНД"
echo "═══════════════════════════════════════════════════════"

# Проверяем что агент запущен
if ! ps aux | grep "kolsAgent.json" | grep -v grep > /dev/null; then
    echo "❌ KOLS AGENT не запущен! Запускаю..."
    cd /Users/playra/vibee-agent
    nohup npm run dev -- --character characters/kolsAgent.json > agent.log 2>&1 &
    sleep 10
fi

echo "✅ KOLS AGENT запущен"
echo ""

# Тест 1: Проверяем доступность API
echo "🔍 Тест 1: Проверка API"
echo "─────────────────────────────────────"

if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API доступен (http://localhost:3000/health)"
else
    echo "❌ API недоступен"
    exit 1
fi

echo ""

# Тест 2: Проверяем загруженные плагины
echo "🔍 Тест 2: Проверка плагинов"
echo "─────────────────────────────────────"

curl -s http://localhost:3000/api/plugins 2>/dev/null | grep -i "telegram\|craft" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ telegram-craft plugin загружен"
else
    echo "⚠️  telegram-craft plugin не найден в API"
fi

echo ""

# Тест 3: Отправляем команду /monitor start через API
echo "🔍 Тест 3: Отправка команды '/monitor start'"
echo "─────────────────────────────────────"

# Создаем тестовое сообщение
TEST_MESSAGE='{
  "content": {
    "text": "/monitor start"
  },
  "userId": "test-user",
  "roomId": "test-room"
}'

echo "📤 Отправляем запрос..."

RESPONSE=$(curl -s -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d "$TEST_MESSAGE" 2>/dev/null)

echo "📥 Ответ сервера:"
echo "$RESPONSE" | head -c 500
echo ""

echo ""

# Тест 4: Проверяем логи на обработку команды
echo "🔍 Тест 4: Проверка логов"
echo "─────────────────────────────────────"

sleep 2
if grep -i "monitor.*start\|START_GROUP_MONITORING" /Users/playra/vibee-agent/agent.log > /dev/null; then
    echo "✅ Команда /monitor start обработана!"
    echo "📝 Последние записи:"
    grep -i "monitor" /Users/playra/vibee-agent/agent.log | tail -3
else
    echo "❌ Команда /monitor start НЕ обработана"
    echo "📝 Последние 10 строк лога:"
    tail -10 /Users/playra/vibee-agent/agent.log
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ ТЕСТ ЗАВЕРШЕН"
echo "═══════════════════════════════════════════════════════"
