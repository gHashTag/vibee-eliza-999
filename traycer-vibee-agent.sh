#!/bin/sh
# =============================================================================
# 🐝 VIBEE Agent Runner для Traycer
# =============================================================================
# Этот скрипт запускает систему агентов VIBEE из Traycer

# Доступные переменные окружения от Traycer:
#   $TRAYCER_PROMPT - Промпт для выполнения (устанавливается Traycer)
#   $TRAYCER_PROMPT_TMP_FILE - Временный файл с промптом (для больших промптов)
#   $TRAYCER_TASK_ID - ID задачи Traycer
#   $TRAYCER_PHASE_BREAKDOWN_ID - ID фазы
#   $TRAYCER_PHASE_ID - ID конкретной фазы

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐝 VIBEE Agent System (Traycer Integration)${NC}"
echo "=============================================="
echo ""

# Если есть промпт - показываем его
if [ -n "$TRAYCER_PROMPT" ]; then
    echo -e "${YELLOW}📋 Задача от Traycer:${NC}"
    echo "----------------------------------------"
    echo "$TRAYCER_PROMPT"
    echo "----------------------------------------"
    echo ""
elif [ -n "$TRAYCER_PROMPT_TMP_FILE" ] && [ -f "$TRAYCER_PROMPT_TMP_FILE" ]; then
    echo -e "${YELLOW}📋 Задача от Traycer (из файла):${NC}"
    echo "----------------------------------------"
    cat "$TRAYCER_PROMPT_TMP_FILE"
    echo "----------------------------------------"
    echo ""
fi

# Переходим в директорию проекта если нужно
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}✅ Перешли в директорию: $(pwd)${NC}"
echo ""

# Проверяем наличие необходимых файлов
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: package.json не найден!${NC}"
    echo "Убедитесь, что скрипт запускается из корня проекта VIBEE"
    exit 1
fi

# Проверяем bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Ошибка: bun не установлен!${NC}"
    echo "Установите bun: https://bun.sh"
    exit 1
fi

echo -e "${GREEN}✅ Bun установлен${NC}"

# Проверяем .env.dev
if [ ! -f ".env.dev" ]; then
    echo -e "${YELLOW}⚠️  Предупреждение: .env.dev не найден${NC}"
    echo "Создайте .env.dev с Infisical credentials"
    exit 1
fi

echo -e "${GREEN}✅ Конфигурация найдена${NC}"
echo ""

# Показываем информацию о задаче если есть
if [ -n "$TRAYCER_TASK_ID" ]; then
    echo -e "${BLUE}🔍 Task ID: $TRAYCER_TASK_ID${NC}"
fi

if [ -n "$TRAYCER_PHASE_BREAKDOWN_ID" ]; then
    echo -e "${BLUE}📊 Phase Breakdown ID: $TRAYCER_PHASE_BREAKDOWN_ID${NC}"
fi

if [ -n "$TRAYCER_PHASE_ID" ]; then
    echo -e "${BLUE}🎯 Phase ID: $TRAYCER_PHASE_ID${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Запуск VIBEE Agent System...${NC}"
echo "=================================="
echo ""

# ЗАПУСКАЕМ VIBEE!
# ЕДИНСТВЕННАЯ команда для запуска агента
exec bun dev "$@"
