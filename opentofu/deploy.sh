#!/bin/bash
# Скрипт для деплоя VIBEE Agent через OpenTofu

set -e

echo "🚀 Деплой VIBEE Agent в Stage"
echo "=============================="

# Проверка, что мы в правильной директории
if [ ! -f "main.tf" ]; then
  echo "❌ Ошибка: main.tf не найден. Запустите скрипт из директории opentofu/"
  exit 1
fi

# Проверка terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
  echo "❌ Ошибка: terraform.tfvars не найден"
  echo "Создайте его из terraform.tfvars.example и заполните значения"
  exit 1
fi

# Проверка наличия OpenTofu
if ! command -v tofu &> /dev/null; then
  echo "❌ Ошибка: OpenTofu не установлен"
  echo "Установите OpenTofu: https://opentofu.org/docs/intro/install/"
  exit 1
fi

echo ""
echo "📋 Шаг 1: Валидация конфигурации"
echo "-----------------------------------"
bash validate.sh

echo ""
echo "📋 Шаг 2: Инициализация OpenTofu"
echo "-----------------------------------"
tofu init

echo ""
echo "📋 Шаг 3: Планирование изменений"
echo "-----------------------------------"
tofu plan

echo ""
echo "📋 Шаг 4: Применение конфигурации"
echo "-----------------------------------"
read -p "Продолжить с деплоем? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Деплой отменен"
  exit 0
fi

tofu apply -auto-approve

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "📊 Проверка статуса:"
echo "-----------------------------------"
echo "Контейнеры:"
docker ps | grep vibee || echo "Контейнеры не найдены"

echo ""
echo "Логи VIBEE Agent:"
docker logs vibee-agent-stage --tail 50 2>&1 || echo "Контейнер еще не запущен"

echo ""
echo "Health check:"
curl -s http://localhost:3000/health || echo "Health endpoint недоступен"

echo ""
echo "🌐 Внешний доступ:"
echo "  Agent: http://188.137.250.63:3000"
echo "  Health: http://188.137.250.63:3000/health"

