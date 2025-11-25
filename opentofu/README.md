# OpenTofu Infrastructure for VIBEE Agent

Этот каталог содержит Infrastructure-as-Code (IaC) конфигурацию для деплоя VIBEE Agent (ElizaOS Telegram Bot) в Stage окружение с использованием OpenTofu.

## 🚀 Быстрый Старт

```bash
# 1. Настроить переменные
cp terraform.tfvars.example terraform.tfvars
# Отредактировать terraform.tfvars с вашими значениями

# 2. Инициализировать
tofu init

# 3. Планировать изменения
tofu plan

# 4. Деплоить
tofu apply -auto-approve
```

## 📋 Сервисы

| Сервис | Порт | URL | Описание |
|--------|------|-----|----------|
| **VIBEE Agent** | 3000 | http://188.137.250.63:3000 | ElizaOS Telegram Bot |
| **Health Check** | 3000 | http://188.137.250.63:3000/health | Проверка здоровья |
| **PostgreSQL** | 5432 | localhost:5432 | База данных (внутренний) |

## 🏗️ Архитектура

```
Internet
   |
   v
┌─────────────────────┐
│   Load Balancer     │
│   (Port 3000)       │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│   Docker Network    │
│   (vibee-network)   │
└──────┬──────┬───────┘
       |      |
       v      v
   ┌────┐ ┌────┐
   │VIBE│ │Post│
   │Agent│ │gres│
   └────┘ └────┘
```

## 📦 Модули

### VIBEE Agent Module

Модуль `modules/vibee-agent/` деплоит:

1. **VIBEE Agent Container**
   - ElizaOS Telegram Bot на порту 3000
   - Интеграция с Infisical для секретов
   - Health checks каждые 30 секунд
   - Автоматический рестарт

2. **PostgreSQL Container**
   - pgvector для векторных операций
   - Внутренний доступ только (localhost)
   - Автоматические health checks

3. **Vibee Network**
   - Docker сеть для межконтейнерной коммуникации
   - Subnet: 172.20.0.0/16

## ⚙️ Конфигурация

### Обязательные Переменные (в terraform.tfvars)

```hcl
# Server
server_ip = "188.137.250.63"
environment = "stage"

# Infisical (Cloud-First Secret Management)
infisical_client_id = "88fcf0cd-cce9-4844-bad2-8e19b4bad3ed"
infisical_client_secret = "..."
infisical_project_id = "fd763fa3-35d5-4045-93bd-1795c5f00fc3"
infisical_environment = "stage"
```

### Опциональные Переменные

- `postgres_url` - Если не указан, используется внутренний PostgreSQL контейнер

Все переменные имеют разумные значения по умолчанию. См. `variables.tf` для полного списка.

## 🔐 Управление Секретами

VIBEE использует **Infisical Cloud-First** подход:

- ✅ Все секреты хранятся в Infisical Cloud
- ✅ `.env.dev` содержит только Infisical credentials
- ✅ `terraform.tfvars` содержит только Infisical credentials
- ✅ Все остальные секреты (TELEGRAM_BOT_TOKEN, API keys) загружаются из Infisical

**⚠️ НИКОГДА не коммитьте `terraform.tfvars` с реальными секретами!**

## 📝 Команды

```bash
# Инициализировать
tofu init

# Планировать изменения
tofu plan

# Применить конфигурацию
tofu apply

# Разрушить инфраструктуру
tofu destroy

# Форматировать код
tofu fmt

# Валидировать
tofu validate
```

## 🚢 Деплой с Локальной Машины

```bash
# Скопировать на сервер
rsync -avz -e "ssh -i ~/.ssh/zomro-stage" opentofu/ \
  aiagent@188.137.250.63:/home/aiagent/vibee-agent/opentofu/

# SSH на сервер
ssh -i ~/.ssh/zomro-stage aiagent@188.137.250.63

# Деплой
cd /home/aiagent/vibee-agent/opentofu
tofu init
tofu plan
tofu apply -auto-approve
```

## 🔍 Мониторинг

После деплоя:

1. **Health Check**: http://188.137.250.63:3000/health
   - Проверка статуса агента

2. **Логи**:
   ```bash
   docker logs vibee-agent-stage -f
   docker logs vibee-postgres-stage -f
   ```

3. **Статус контейнеров**:
   ```bash
   docker ps | grep vibee
   ```

## 🐛 Troubleshooting

### Проверить Запущенные Контейнеры

```bash
docker ps | grep -E 'vibee-agent|vibee-postgres'
```

### Проверить Логи

```bash
docker logs vibee-agent-stage -f
docker logs vibee-postgres-stage -f
```

### Проблемы с Сетью

```bash
docker network ls
docker network inspect vibee-network
```

### Конфликты Порт

```bash
lsof -i :3000  # VIBEE Agent
lsof -i :5432  # PostgreSQL
```

### Пересобрать Образ

```bash
cd /home/aiagent/vibee-agent
docker build -t vibee/agent:stage-latest -f Dockerfile .
tofu apply -auto-approve
```

## 🔒 Безопасность

- ✅ API ключи хранятся в Infisical Cloud (не в git)
- ✅ Используйте `.gitignore` для исключения `terraform.tfvars`
- ✅ Все сервисы на внутренней Docker сети
- ✅ Внешний доступ только через настроенные порты
- ✅ PostgreSQL доступен только на localhost

## 💾 Backup

Сервисы, требующие backup:

1. **PostgreSQL**: Volume `vibee-postgres-data-stage`
   ```bash
   docker run --rm -v vibee-postgres-data-stage:/data -v $(pwd):/backup \
     alpine tar czf /backup/postgres-backup.tar.gz /data
   ```

2. **VIBEE Agent**: Stateless (код в git)

## ✅ Production Deployment Checklist

- [ ] Настроить SSL/TLS сертификаты
- [ ] Настроить правила firewall
- [ ] Настроить ротацию логов
- [ ] Настроить автоматические backup
- [ ] Настроить мониторинг и алерты
- [ ] Включить security scanning
- [ ] Документировать план disaster recovery
- [ ] Протестировать деплой в staging окружении

## 📚 Дополнительная Информация

- **Документация проекта**: См. `CLAUDE.md` и `AVATAR_FACE.md`
- **Логи**: `docker logs <container-name>`
- **Issues**: Проверьте GitHub Issues

---

**Примечание**: Это Infrastructure-as-Code. Все изменения должны проходить через OpenTofu workflow (plan → apply).

