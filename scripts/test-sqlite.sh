#!/bin/bash
# Скрипт для запуска тестов с SQLite вместо PostgreSQL
# Использование: ./scripts/test-sqlite.sh

echo "🧪 Запуск тестов с SQLite..."
echo ""

# Отключаем PostgreSQL и используем SQLite
export POSTGRES_URL=""
export DATABASE_URL="sqlite:./data/test.sqlite"
export DATABASE_ADAPTER="sqlite"

# Запускаем тесты
npx elizaos test "$@"

echo ""
echo "✅ Тесты завершены"
