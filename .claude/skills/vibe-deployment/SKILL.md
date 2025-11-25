---
name: vibe-deployment
agent_id: vibe-deployment
description: 🚀 Auto-activates for deployment, DevOps, Docker, OpenTofu, and production infrastructure
keywords:
  - deployment
  - деплой
  - devops
  - Девопс
  - docker
  - контейнер
  - opentofu
  - terraform
  - production
  - продакшен
  - pm2
  - nginx
  - сервер
  - server
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🚀 Vibe Deployment Skill - DevOps & Infrastructure

Этот скилл **автоматически активируется** когда упоминается деплой, Docker, DevOps или инфраструктура.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `deployment`, `деплой`, `deploy`
- `devops`, `Девопс`, `DevOps`
- `docker`, `контейнер`, `container`
- `opentofu`, `terraform`, `terraform`
- `production`, `продакшен`, `prod`
- `pm2`, `process manager`
- `nginx`, `reverse proxy`
- `сервер`, `server`, `инфраструктура`

### Примеры:
```
"Деплой в production среду"
→ Авто-активируется vibe-deployment

"Настроить Docker контейнер"
→ Авто-активируется vibe-deployment

"Запустить через PM2"
→ Авто-активируется vibe-deployment
```

## 🎯 Что Делает

1. **Docker Setup**: Контейнеризация приложений
2. **OpenTofu**: Infrastructure as Code
3. **PM2**: Process management
4. **Production Deploy**: Настройка продакшена
5. **Nginx**: Reverse proxy и SSL
6. **Monitoring**: Health checks и логи

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для инфраструктуры
trigger_threshold: 0.75    # Средний порог активации (75%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при работе с деплоем
- **Координируется с**: vibe-devops, vibe-monitoring, vibe-security
- **Результат**: Готовая инфраструктура + деплой

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-deployment",
  description="Deploy VIBEE to production server",
  prompt="Setup Docker, PostgreSQL, PM2, and Nginx for production"
)
```

### Автоматически:
```
"Настроить Terraform конфигурацию"
→ vibe-deployment активируется автоматически
```

## 🎨 Специализация

- ✅ **Docker**: Dockerfile, docker-compose
- ✅ **OpenTofu**: Infrastructure as Code
- ✅ **PM2**: Process management и cluster mode
- ✅ **Nginx**: SSL, reverse proxy, load balancing
- ✅ **PostgreSQL**: Database setup и backup
- ✅ **Health Checks**: /health, /health/detailed
- ✅ **CI/CD**: GitHub Actions integration
- ✅ **Monitoring**: Logs, metrics, alerts

## 📚 Паттерны

### Dockerfile Template:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 Config:
```javascript
module.exports = {
  apps: [{
    name: 'vibee-agent',
    script: 'elizaos',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### OpenTofu Structure:
```
opentofu/
├── main.tf              # Main infrastructure
├── variables.tf         # Variables
├── outputs.tf           # Outputs
├── terraform.tfvars     # Environment values
├── docker.tf            # Docker resources
└── postgres.tf          # Database
```

### ElizaOS Deployment Pattern:
```typescript
// Dockerfile for ElizaOS
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Build TypeScript
RUN bun run build

# Expose port
EXPOSE 3000

# Start ElizaOS
CMD ["elizaos", "start"]
```

### Deployment with Secrets (Infisical):
```bash
# Build with Infisical integration
docker build -t vibee/agent:latest .

# Run with environment from Infisical
docker run -p 3000:3000 \
  --env-file <(infisical secrets export --env=prod) \
  vibee/agent:latest
```

### PM2 Configuration:
```javascript
module.exports = {
  apps: [{
    name: 'vibee-agent',
    script: 'elizaos',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Load secrets from Infisical at runtime
    env_file: '.infisical.env'
  }]
};
```

### Deployment Commands:
```bash
# Build and deploy
docker build -t vibee/agent:latest .
docker run -p 3000:3000 vibee/agent:latest

# With PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# With OpenTofu
tofu init
tofu plan
tofu apply -auto-approve

# Health check
curl http://localhost:3000/health
```

**Автоматически делает деплой быстрым, надежным и масштабируемым!** 🚀☁️
