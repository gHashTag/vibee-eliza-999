#!/bin/bash
# Скрипт быстрого деплоя официального ElizaOS в облако
# Использование: bash deploy-to-cloud.sh

set -e

echo "🚀 ДЕПЛОЙ ОФИЦИАЛЬНОГО ELIZAOS В ОБЛАКО"
echo "=========================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция вывода цветного текста
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка Docker
print_status "Проверка Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker не установлен! Установите Docker сначала."
    exit 1
fi
print_success "Docker найден: $(docker --version)"

# Проверка Docker Compose
print_status "Проверка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose не установлен!"
    exit 1
fi
print_success "Docker Compose найден: $(docker-compose --version)"

# Проверка наличия необходимых файлов
print_status "Проверка файлов..."
if [[ ! -f "Dockerfile.elizaos" ]]; then
    print_error "Файл Dockerfile.elizaos не найден!"
    exit 1
fi

if [[ ! -f "docker-compose.elizaos.yml" ]]; then
    print_error "Файл docker-compose.elizaos.yml не найден!"
    exit 1
fi

print_success "Все необходимые файлы найдены"

# Проверка переменных окружения
print_status "Проверка переменных окружения..."
if [[ -z "$OPENAI_API_KEY" ]] && [[ -z "$ANTHROPIC_API_KEY" ]]; then
    print_warning "API ключи не заданы. Добавьте OPENAI_API_KEY или ANTHROPIC_API_KEY в .env файл"
    print_warning "Или отредактируйте docker-compose.elizaos.yml"
fi

# Остановка старых контейнеров
print_status "Остановка старых контейнеров..."
docker-compose -f docker-compose.elizaos.yml down 2>/dev/null || true
docker stop elizaos-official 2>/dev/null || true
docker rm elizaos-official 2>/dev/null || true
print_success "Старые контейнеры остановлены"

# Сборка образа
print_status "Сборка Docker образа..."
print_warning "Это может занять несколько минут..."

if docker build -f Dockerfile.elizaos -t elizaos-official:latest .; then
    print_success "Docker образ собран успешно!"
else
    print_error "Ошибка при сборке Docker образа!"
    exit 1
fi

# Запуск контейнеров
print_status "Запуск контейнеров..."
if docker-compose -f docker-compose.elizaos.yml up -d; then
    print_success "Контейнеры запущены!"
else
    print_error "Ошибка при запуске контейнеров!"
    exit 1
fi

# Ожидание запуска
print_status "Ожидание запуска сервера..."
sleep 10

# Проверка статуса
print_status "Проверка статуса сервера..."
if docker ps | grep -q elizaos-official; then
    print_success "Контейнер elizaos-official запущен!"
else
    print_error "Контейнер не запущен! Проверьте логи:"
    docker-compose -f docker-compose.elizaos.yml logs
    exit 1
fi

# Проверка health check
print_status "Проверка health check..."
for i in {1..30}; do
    if curl -sf http://localhost:4000/api/status > /dev/null 2>&1; then
        print_success "Сервер отвечает на запросы!"
        break
    fi
    if [[ $i -eq 30 ]]; then
        print_error "Сервер не отвечает после 30 попыток"
        print_status "Логи сервера:"
        docker-compose -f docker-compose.elizaos.yml logs
        exit 1
    fi
    sleep 2
done

# Финальная информация
echo ""
echo "=========================================="
print_success "🎉 ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
echo "=========================================="
echo ""
echo "📍 URL для доступа:"
echo "   🌐 Web UI:  http://localhost:4000"
echo "   🔌 API:     http://localhost:4000/api"
echo "   💬 Agents:  http://localhost:4000/api/agents"
echo ""
echo "🔧 Команды управления:"
echo "   Просмотр логов:  docker-compose -f docker-compose.elizaos.yml logs -f"
echo "   Остановка:       docker-compose -f docker-compose.elizaos.yml down"
echo "   Перезапуск:      docker-compose -f docker-compose.elizaos.yml restart"
echo ""
echo "📊 Статус контейнеров:"
docker ps --filter "name=elizaos" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
print_success "Готово! Откройте http://localhost:4000 в браузере"
