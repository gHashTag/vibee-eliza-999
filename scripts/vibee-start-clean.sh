#!/bin/bash

# 🐝 VIBEE CLEAN START SCRIPT
# Автоматически проверяет и исправляет все проблемы перед запуском

set -e

echo "🐝 Vibee Clean Start - проверяем систему..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода цветного текста
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Проверяем, есть ли уже запущенные dev процессы
echo "1. Проверяем запущенные процессы..."
BUN_PROCESSES=$(ps aux | grep -E "(bun dev|dev-watch\.js)" | grep -v grep | wc -l)

if [ "$BUN_PROCESSES" -gt 0 ]; then
    print_warning "Найдено $BUN_PROCESSES запущенных процессов bun/dev. Убиваем их..."

    # Находим и убиваем все процессы bun, dev-watch и node
    ps aux | grep -E "(bun dev|dev-watch\.js|vite)" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
    ps aux | grep "node.*vite" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

    # Ждем немного, чтобы процессы завершились
    sleep 2

    # Проверяем еще раз
    REMAINING=$(ps aux | grep -E "(bun dev|dev-watch\.js|vite)" | grep -v grep | wc -l)
    if [ "$REMAINING" -gt 0 ]; then
        print_warning "Некоторые процессы все еще висят. Принудительно убиваем..."
        ps aux | grep -E "(bun dev|dev-watch\.js|vite)" | grep -v grep | awk '{print $2}' | xargs -r kill -SIGKILL 2>/dev/null || true
        sleep 1
    fi

    print_status "Процессы очищены"
else
    print_status "Конфликтующих процессов не найдено"
fi

# 2. Проверяем порты
echo ""
echo "2. Проверяем занятость портов..."

# Функция для проверки порта
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Порт занят
    else
        return 1  # Порт свободен
    fi
}

# Проверяем порт 3000
if check_port 3000; then
    print_warning "Порт 3000 занят. Пытаемся освободить..."
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null || true
    sleep 1
fi

# Проверяем порт 5173
if check_port 5173; then
    print_warning "Порт 5173 занят. Пытаемся освободить..."
    lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
    sleep 1
fi

print_status "Порты 3000 и 5173 готовы к работе"

# 3. Проверяем TypeScript сборку
echo ""
echo "3. Проверяем TypeScript сборку..."
if [ ! -d "packages/core/dist" ] || [ ! -d "packages/cli/dist" ] || [ ! -d "packages/client/dist" ]; then
    print_warning "Обнаружены ненайденные dist папки. Запускаем сборку..."
    bun run build
    print_status "Сборка завершена"
else
    print_status "TypeScript сборка актуальна"
fi

# 4. Очищаем временные файлы
echo ""
echo "4. Очищаем временные файлы..."
rm -rf /tmp/bun-dev.log 2>/dev/null || true
rm -rf /tmp/bun-*.log 2>/dev/null || true
print_status "Временные файлы очищены"

# 5. Проверяем переменные окружения
echo ""
echo "5. Проверяем переменные окружения..."
if [ ! -f ".env" ]; then
    print_warning ".env файл не найден. Создаем базовый..."
    cat > .env << 'EOF'
# Vibee Environment Variables
VIBEE_SERVER_AUTH_TOKEN=
SECRET_SALT=your-secret-salt-change-this-in-production
NODE_ENV=development
EOF
    print_status "Создан базовый .env файл"
else
    print_status ".env файл найден"
fi

# 6. Проверяем логотип
echo ""
echo "6. Проверяем логотип..."
if [ ! -f "packages/client/public/vibee-logo-light.svg" ]; then
    print_warning "SVG логотип не найден. Создаем..."
    cat > packages/client/public/vibee-logo-light.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="beeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
    </linearGradient>
  </defs>
  <ellipse cx="40" cy="30" rx="28" ry="20" fill="url(#beeGradient)" stroke="#FF8C00" stroke-width="2"/>
  <ellipse cx="40" cy="30" rx="22" ry="18" fill="#000" opacity="0.15"/>
  <rect x="20" y="20" width="4" height="20" fill="#000" opacity="0.4"/>
  <rect x="30" y="18" width="4" height="24" fill="#000" opacity="0.4"/>
  <rect x="40" y="20" width="4" height="20" fill="#000" opacity="0.4"/>
  <rect x="50" y="22" width="4" height="16" fill="#000" opacity="0.4"/>
  <ellipse cx="25" cy="15" rx="18" ry="12" fill="#FFF" opacity="0.6" transform="rotate(-20 25 15)"/>
  <ellipse cx="55" cy="15" rx="18" ry="12" fill="#FFF" opacity="0.6" transform="rotate(20 55 15)"/>
  <text x="80" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFD700">Vibee</text>
  <text x="80" y="45" font-family="Arial, sans-serif" font-size="10" fill="#666">AI Agents Platform</text>
  <circle cx="72" cy="25" r="2" fill="#FFD700"/>
  <circle cx="165" cy="30" r="2" fill="#FFD700"/>
  <circle cx="72" cy="35" r="2" fill="#FFD700"/>
</svg>
EOF
    print_status "SVG логотип создан"
else
    print_status "SVG логотип найден"
fi

# 7. Запускаем чистый dev сервер
echo ""
echo "🚀 Запускаем Vibee в режиме разработки..."
echo ""
echo "📝 СПРАВКА:"
echo "   - Порт 3000: Backend API + статические файлы"
echo "   - Порт 5173: Vite HMR для быстрой перезагрузки"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запускаем dev сервер
bun run scripts/dev-watch.js
