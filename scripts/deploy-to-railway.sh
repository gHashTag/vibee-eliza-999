#!/bin/bash
set -e

echo "🚂 Railway Deployment Script"
echo "=============================="
echo ""

# Проверить авторизацию
echo "1. Проверяю авторизацию в Railway..."
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Не авторизован в Railway!"
    echo "Выполните: railway login"
    exit 1
fi
echo "✅ Авторизован: $(railway whoami | head -1)"
echo ""

# Создать проект
echo "2. Создаю новый проект на Railway..."
read -p "Введите имя проекта (vibee-eliza-999): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-vibee-eliza-999}

# Попробовать привязать существующий проект
echo "Проверяю существующие проекты..."
EXISTING_PROJECTS=$(railway list --json 2>/dev/null | jq -r '.[] | select(.name=="'$PROJECT_NAME'") | .id' 2>/dev/null || echo "")

if [ -n "$EXISTING_PROJECTS" ]; then
    echo "Найден существующий проект. Привязываю..."
    railway link $EXISTING_PROJECTS
else
    echo "Проект не найден. Создаю новый..."
    echo ""
    echo "⚠️  ВАЖНО: Откройте в браузере:"
    echo "https://railway.app/new"
    echo ""
    echo "Затем выберите 'Empty Project' и дайте имя: $PROJECT_NAME"
    echo ""
    read -p "Нажмите Enter после создания проекта в браузере..."
fi

# Проверить статус проекта
echo ""
echo "3. Проверяю статус проекта..."
if railway status > /dev/null 2>&1; then
    echo "✅ Проект привязан!"
    railway status
else
    echo "❌ Не удалось привязать проект"
    exit 1
fi

echo ""
echo "4. Проверяю конфигурацию..."
echo "railway.json:"
cat railway.json | jq '.' 2>/dev/null || cat railway.json
echo ""

# Сборка проекта
echo "5. Собираю проект локально (опционально)..."
read -p "Собрать проект локально перед деплоем? (y/N): " BUILD_LOCAL
if [[ $BUILD_LOCAL =~ ^[Yy]$ ]]; then
    echo "Устанавливаю зависимости..."
    bun install || npm install

    echo "Собираю проект..."
    bun run build || npm run build

    echo "✅ Проект собран!"
else
    echo "⏭️  Пропускаю локальную сборку"
fi

echo ""
echo "6. Запускаю деплой..."
echo "⚠️  Railway будет собирать проект в облаке..."
echo ""

if railway up; then
    echo ""
    echo "✅ ДЕПЛОЙ УСПЕШЕН!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Откройте Railway Dashboard: https://railway.app/dashboard"
    echo "2. Перейдите в ваш проект: $PROJECT_NAME"
    echo "3. Добавьте переменные окружения в Variables"
    echo ""
    echo "📝 Пример переменных:"
    echo "NODE_ENV=production"
    echo "OPENAI_API_KEY=your_key_here"
    echo ""
    echo "🌐 После деплоя получите URL:"
    railway status | grep -o 'https://[^[:space:]]*\.up\.railway\.app' || echo "Проверьте в Dashboard"
else
    echo ""
    echo "❌ ДЕПЛОЙ НЕ УДАЛСЯ"
    echo "Проверьте логи: railway logs"
    exit 1
fi
