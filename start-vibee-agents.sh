#!/bin/bash
# =============================================================================
# 🔥 СКРИПТ ЗАПУСКА СИСТЕМЫ АГЕНТОВ VIBEE
# =============================================================================
# Используется для запуска системы агентов-пчелок VIBEE через Traycer или вручную

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐝 VIBEE Agent System Starter${NC}"
echo "=================================="

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: package.json не найден! Запустите скрипт из корневой папки проекта VIBEE${NC}"
    exit 1
fi

# Проверяем bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Ошибка: bun не установлен! Установите bun: https://bun.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bun установлен${NC}"

# Проверяем .env.dev
if [ ! -f ".env.dev" ]; then
    echo -e "${YELLOW}⚠️  Предупреждение: .env.dev не найден!${NC}"
    echo "Создайте .env.dev с Infisical credentials:"
    cat << 'EOF'
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=dev
NODE_ENV=development
EOF
    exit 1
fi

echo -e "${GREEN}✅ .env.dev найден${NC}"

# Проверяем Infisical
if [ ! -f ".infisical.env" ]; then
    echo -e "${YELLOW}⚠️  Предупреждение: .infisical.env не найден!${NC}"
    echo "Загружаем секреты из Infisical..."
    infisical secrets pull --env=dev 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Не удалось загрузить секреты из Infisical${NC}"
        echo "Убедитесь, что Infisical CLI установлен и авторизован"
    }
fi

echo -e "${GREEN}✅ Секреты загружены${NC}"

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ] || [ ! -d ".bun" ]; then
    echo -e "${YELLOW}📦 Устанавливаем зависимости...${NC}"
    bun install
fi

echo ""
echo -e "${BLUE}🚀 Запуск системы агентов VIBEE...${NC}"
echo "=================================="
echo ""

# Запускаем VIBEE agent
# ЕДИНСТВЕННАЯ команда запуска: bun dev
exec bun dev "$@"
