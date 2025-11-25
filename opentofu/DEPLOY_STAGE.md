# 🚀 Деплой VIBEE Agent в Stage

## 📋 Предварительные Требования

1. **OpenTofu установлен** на сервере
2. **Docker установлен** и запущен
3. **SSH доступ** к серверу `188.137.250.63`
4. **Infisical credentials** из `.env.dev`

## 🔧 Шаг 1: Подготовка Локально

```bash
# Перейти в директорию проекта
cd /Users/playra/vibee-agent

# Создать terraform.tfvars из примера
cd opentofu
cp terraform.tfvars.example terraform.tfvars
```

## 📝 Шаг 2: Настроить terraform.tfvars

Отредактируйте `opentofu/terraform.tfvars` и заполните значения из `.env.dev`:

```hcl
# Server Configuration
server_ip = "188.137.250.63"
environment = "stage"

# Infisical Configuration (из .env.dev)
infisical_client_id = "88fcf0cd-cce9-4844-bad2-8e19b4bad3ed"
infisical_client_secret = "<your-infisical-client-secret>"
infisical_project_id = "fd763fa3-35d5-4045-93bd-1795c5f00fc3"
infisical_environment = "stage"

# PostgreSQL (опционально - если используете внешнюю БД)
# postgres_url = "postgresql://user:password@host:5432/database"
```

**⚠️ ВАЖНО**: Не коммитьте `terraform.tfvars` в git! Он уже в `.gitignore`.

## 🚢 Шаг 3: Копирование на Сервер

```bash
# Из корня проекта vibee-agent
rsync -avz --exclude 'node_modules' --exclude '.eliza' --exclude 'dist' \
  -e "ssh -i ~/.ssh/zomro-stage" \
  . aiagent@188.137.250.63:/home/aiagent/vibee-agent/
```

Или только opentofu директорию:

```bash
rsync -avz -e "ssh -i ~/.ssh/zomro-stage" \
  opentofu/ aiagent@188.137.250.63:/home/aiagent/vibee-agent/opentofu/
```

## 🔐 Шаг 4: SSH на Сервер

```bash
ssh -i ~/.ssh/zomro-stage aiagent@188.137.250.63
```

## 🏗️ Шаг 5: Инициализация OpenTofu

```bash
cd /home/aiagent/vibee-agent/opentofu

# Инициализировать OpenTofu
tofu init

# Проверить конфигурацию
tofu validate
```

## 📊 Шаг 6: Планирование Изменений

```bash
# Посмотреть, что будет изменено
tofu plan
```

Проверьте вывод:
- ✅ Создастся Docker network `vibee-network`
- ✅ Создастся PostgreSQL контейнер `vibee-postgres-stage`
- ✅ Соберется Docker образ `vibee/agent:stage-latest`
- ✅ Создастся VIBEE Agent контейнер `vibee-agent-stage`

## 🚀 Шаг 7: Деплой

```bash
# Применить конфигурацию
tofu apply -auto-approve
```

Или интерактивно:

```bash
tofu apply
# Введите 'yes' для подтверждения
```

## ✅ Шаг 8: Проверка Деплоя

```bash
# Проверить запущенные контейнеры
docker ps | grep vibee

# Должны быть видны:
# - vibee-agent-stage
# - vibee-postgres-stage

# Проверить логи VIBEE Agent
docker logs vibee-agent-stage -f

# Проверить health check
curl http://localhost:3000/health

# Проверить извне (с вашего компьютера)
curl http://188.137.250.63:3000/health
```

## 🔄 Обновление Деплоя

После изменений в коде:

```bash
# На сервере
cd /home/aiagent/vibee-agent/opentofu

# Пересобрать образ и применить изменения
tofu apply -auto-approve
```

Или вручную пересобрать образ:

```bash
cd /home/aiagent/vibee-agent
docker build -t vibee/agent:stage-latest -f Dockerfile .
docker restart vibee-agent-stage
```

## 🛑 Остановка Деплоя

```bash
cd /home/aiagent/vibee-agent/opentofu

# Остановить и удалить контейнеры (но сохранить volumes)
tofu destroy -target=docker_container.vibee_agent
tofu destroy -target=docker_container.postgres

# Или удалить все (включая volumes)
tofu destroy
```

## 🐛 Troubleshooting

### Проблема: Порт 3000 занят

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Остановить старый контейнер
docker stop vibee-agent-stage || true
docker rm vibee-agent-stage || true

# Применить снова
tofu apply -auto-approve
```

### Проблема: Ошибка сборки Docker образа

```bash
# Проверить Dockerfile
cd /home/aiagent/vibee-agent
docker build -t vibee/agent:stage-latest -f Dockerfile . --no-cache

# Проверить логи сборки
```

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker logs vibee-agent-stage

# Проверить переменные окружения
docker inspect vibee-agent-stage | grep -A 20 Env

# Проверить подключение к PostgreSQL
docker exec vibee-postgres-stage pg_isready -U postgres
```

### Проблема: Infisical не загружает секреты

```bash
# Проверить переменные Infisical в контейнере
docker exec vibee-agent-stage env | grep INFISICAL

# Проверить логи загрузки секретов
docker logs vibee-agent-stage | grep -i infisical
```

## 📊 Мониторинг

### Логи в реальном времени

```bash
# VIBEE Agent
docker logs vibee-agent-stage -f

# PostgreSQL
docker logs vibee-postgres-stage -f
```

### Статус контейнеров

```bash
docker ps -a | grep vibee
docker stats vibee-agent-stage vibee-postgres-stage
```

### Health Check

```bash
# Локально на сервере
curl http://localhost:3000/health

# Извне
curl http://188.137.250.63:3000/health
```

## 🔐 Безопасность

- ✅ `terraform.tfvars` не коммитится в git
- ✅ Все секреты загружаются из Infisical Cloud
- ✅ PostgreSQL доступен только на localhost
- ✅ VIBEE Agent доступен на порту 3000

## 📝 Следующие Шаги

После успешного деплоя:

1. ✅ Проверить работу Telegram бота
2. ✅ Проверить подключение к Infisical
3. ✅ Проверить работу с базой данных
4. ✅ Настроить мониторинг (если нужно)
5. ✅ Настроить автоматические backup PostgreSQL

---

**Готово!** VIBEE Agent должен быть доступен на http://188.137.250.63:3000 🎉

