#!/bin/bash
# Скрипт для валидации OpenTofu конфигурации

set -e

# Определяем директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 Проверка конфигурации OpenTofu для VIBEE Agent"
echo "=================================================="
echo "Рабочая директория: $(pwd)"

# Проверка наличия файлов
echo ""
echo "📁 Проверка структуры файлов:"
REQUIRED_FILES=(
  "main.tf"
  "variables.tf"
  "terraform.tfvars.example"
  "modules/vibee-agent/main.tf"
  "modules/vibee-agent/variables.tf"
  "modules/vibee-agent/outputs.tf"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - НЕ НАЙДЕН"
    exit 1
  fi
done

# Проверка путей в модуле (из корня проекта)
echo ""
echo "🔗 Проверка путей в модуле:"
if [ -f "../Dockerfile" ]; then
  echo "  ✅ Dockerfile доступен из корня проекта"
else
  echo "  ❌ Dockerfile недоступен из корня проекта"
  exit 1
fi

if [ -f "../package.json" ]; then
  echo "  ✅ package.json доступен из корня проекта"
else
  echo "  ❌ package.json недоступен из корня проекта"
  exit 1
fi

if [ -d "../src" ]; then
  echo "  ✅ src/ директория доступна из корня проекта"
else
  echo "  ❌ src/ директория недоступна из корня проекта"
  exit 1
fi

# Проверка переменных
echo ""
echo "📝 Проверка переменных:"
REQUIRED_VARS=(
  "server_ip"
  "environment"
  "infisical_client_id"
  "infisical_client_secret"
  "infisical_project_id"
  "infisical_environment"
  "postgres_url"
)

for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "variable \"$var\"" variables.tf; then
    echo "  ✅ variable $var определена"
  else
    echo "  ❌ variable $var НЕ определена"
    exit 1
  fi
done

# Проверка использования переменных в main.tf
echo ""
echo "🔍 Проверка использования переменных в main.tf:"
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "var\.$var" main.tf; then
    echo "  ✅ var.$var используется"
  else
    echo "  ⚠️  var.$var не используется (может быть опциональной)"
  fi
done

# Проверка синтаксиса (если OpenTofu установлен)
echo ""
echo "🔧 Проверка синтаксиса OpenTofu:"
if command -v tofu &> /dev/null; then
  echo "  OpenTofu найден, запускаю валидацию..."
  tofu init -backend=false
  tofu validate
  echo "  ✅ Синтаксис корректен"
else
  echo "  ⚠️  OpenTofu не установлен локально (валидация будет на сервере)"
fi

# Проверка Dockerfile
echo ""
echo "🐳 Проверка Dockerfile:"
if [ -f "../Dockerfile" ]; then
  if grep -q "EXPOSE 3000" ../Dockerfile; then
    echo "  ✅ Dockerfile экспортирует порт 3000"
  else
    echo "  ⚠️  Dockerfile не экспортирует порт 3000"
  fi
  
  if grep -q "curl" ../Dockerfile; then
    echo "  ✅ curl установлен (для health checks)"
  else
    echo "  ⚠️  curl не найден в Dockerfile (health checks могут не работать)"
  fi
  
  if grep -q "elizaos start" ../Dockerfile || grep -q "CMD" ../Dockerfile; then
    echo "  ✅ Dockerfile содержит команду запуска"
  else
    echo "  ⚠️  Dockerfile не содержит команду запуска"
  fi
else
  echo "  ❌ Dockerfile не найден"
  exit 1
fi

echo ""
echo "=================================================="
echo "✅ Все проверки пройдены!"
echo ""
echo "📋 Следующие шаги:"
echo "  1. Создайте terraform.tfvars из terraform.tfvars.example"
echo "  2. Заполните значения Infisical credentials"
echo "  3. Скопируйте на сервер: rsync -avz opentofu/ user@server:/path/"
echo "  4. На сервере: cd opentofu && tofu init && tofu plan && tofu apply"

