#!/bin/bash
# Загрузка секретов из Infisical и запуск VIBEE agent

set -a # Автоматически экспортировать все переменные

# Загружаем Infisical credentials
if [ -f .infisical.env ]; then
    source .infisical.env
fi

# Загружаем .env.dev для dev переменных (включая Instagram токены для тестирования)
if [ -f .env.dev ]; then
    source .env.dev
    echo "🔑 Загружено секретов из .env.dev (dev переменные)"
fi

set +a

# Устанавливаем POSTGRES_URL для Neon PostgreSQL
# ВАЖНО: SQL плагин ищет именно POSTGRES_URL, не DATABASE_URL!
export POSTGRES_URL="postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DATABASE_URL="$POSTGRES_URL"

# Разрешаем деструктивные миграции для PostgreSQL
export ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

echo "🔑 Загружено секретов из Infisical и .env.dev"
echo "🔗 PostgreSQL: Neon Database (ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech)"
echo "🚀 Запуск VIBEE агентов..."

# Если передан параметр --all или -a - запускаем всех персонажей
if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    echo "📋 Запуск ВСЕХ персонажей..."
    CHARACTERS=$(ls -1 characters/*.json 2>/dev/null)

    if [ -z "$CHARACTERS" ]; then
        echo "❌ Ошибка: Не найдено персонажей в characters/"
        exit 1
    fi

    echo "👥 Персонажи:"
    echo "$CHARACTERS"
    echo ""
    echo "⚠️  ElizaOS не поддерживает множественные персонажи."
    echo "📝 Используйте: bun dev:single characters/ИМЯ_АГЕНТА.json"
    echo "📋 Доступные агенты:"
    ls -1 characters/*.json | sed 's/.*\//  - /'
    echo ""
    exit 1
else
    # Определяем персонажа (по умолчанию VIBEE)
    CHARACTER=${1:-characters/vibeeAgent.json}
    echo "📝 Используем персонажа: $CHARACTER"

    # Проверяем существование персонажа
    if [ ! -f "$CHARACTER" ]; then
        echo "❌ Ошибка: Персонаж $CHARACTER не найден!"
        echo "📋 Доступные персонажи:"
        ls -1 characters/*.json 2>/dev/null || echo "  (нет доступных персонажей)"
        echo ""
        echo "💡 Подсказка: используй --all или -a для запуска всех персонажей"
        exit 1
    fi

    # Запускаем ElizaOS напрямую с логами в терминал
    echo "📺 Логи будут отображаться ниже..."
    echo "-----------------------------------"
    exec npx elizaos start --character "$CHARACTER"
fi
