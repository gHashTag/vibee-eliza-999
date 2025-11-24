---
name: vibe-monitoring
agent_id: vibe-monitoring
description: 📊 Auto-activates for monitoring, logging, debugging, health checks, and system observability
keywords:
  - monitoring
  - мониторинг
  - логи
  - logs
  - debugging
  - дебаг
  - health check
  - проверка здоровья
  - observability
  - наблюдаемость
  - метрики
  - metrics
  - alerts
  - алерты
model: sonnet
trigger_threshold: 0.7
auto_activate: true
---

# 📊 Vibe Monitoring Skill - System Observability

Этот скилл **автоматически активируется** когда упоминается мониторинг, логи, отладка или проверка системы.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `monitoring`, `мониторинг`
- `логи`, `logs`, `логирование`
- `debugging`, `дебаг`, `отладка`
- `health check`, `проверка здоровья`
- `observability`, `наблюдаемость`
- `метрики`, `metrics`
- `alerts`, `алерты`, `уведомления`
- `pm2 logs`, `docker logs`
- `tail -f`, `мониторинг логов`

### Примеры:
```
"Проверить логи приложения"
→ Авто-активируется vibe-monitoring

"Настроить health check"
→ Авто-активируется vibe-monitoring

"Мониторинг производительности"
→ Авто-активируется vibe-monitoring
```

## 🎯 Что Делает

1. **Log Management**: Просмотр и анализ логов
2. **Health Checks**: Проверка состояния системы
3. **Debugging**: Диагностика проблем
4. **Metrics**: Сбор и анализ метрик
5. **Alerts**: Настройка уведомлений
6. **Dashboard**: Визуализация состояния

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для анализа
trigger_threshold: 0.7     # Средний порог активации (70%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при работе с мониторингом
- **Координируется с**: vibe-devops, vibe-deployment, vibe-security
- **Результат**: Полная наблюдаемость системы

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-monitoring",
  description="Setup monitoring for VIBEE agent",
  prompt="Configure logs, health checks, and alerts for production"
)
```

### Автоматически:
```
"Показать логи за последние 100 строк"
→ vibe-monitoring активируется автоматически
```

## 🎨 Специализация

- ✅ **Log Aggregation**: PM2, Docker, systemd
- ✅ **Health Endpoints**: /health, /health/detailed
- ✅ **Performance Metrics**: CPU, memory, response time
- ✅ **Error Tracking**: Stack traces, error rates
- ✅ **Alert Rules**: Threshold-based notifications
- ✅ **Debug Commands**: pkill, ps aux, netstat
- ✅ **Real-time Monitoring**: tail -f, watch
- ✅ **Log Analysis**: grep, awk, jq

## 📚 Паттерны

### ElizaOS Health Check Endpoints:
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    agentId: runtime.agentId,
    character: runtime.character.name
  });
});

// Detailed health with plugins
app.get('/health/detailed', (req, res) => {
  const services = runtime.getServices();
  const plugins = runtime.getPlugins();

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: services.map(s => s.serviceType),
    plugins: plugins.map(p => p.name),
    database: {
      connected: runtime.databaseAdapter?.db ? true : false
    }
  });
});
```

### Plugin Status Monitoring:
```typescript
// Check plugin health
function getPluginStatus(runtime: IAgentRuntime) {
  const services = runtime.getServices();
  return services.map(service => ({
    name: service.serviceType,
    status: service.isInitialized ? 'healthy' : 'uninitialized',
    capabilityDescription: service.capabilityDescription
  }));
}
```

### Log Monitoring:
```bash
# PM2 logs
pm2 logs vibee-agent

# Docker logs
docker logs -f vibee-agent

# Real-time follow
tail -f /var/log/vibee/app.log

# Last 100 lines
tail -100 /var/log/vibee/app.log

# Search errors
grep -i "error" /var/log/vibee/app.log
```

### System Diagnostics:
```bash
# Process status
ps aux | grep vibee

# Memory usage
free -h

# Disk space
df -h

# Network connections
netstat -tuln

# Port usage
lsof -i :3000
```

### Alert Rules:
```yaml
# Prometheus alerting
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
```

### Dashboard Setup:
```
Grafana Dashboard:
├── System Metrics (CPU, Memory, Disk)
├── Application Metrics (Response time, Error rate)
├── Business Metrics (Operations, Users)
└── Infrastructure (Docker containers, PM2 processes)
```

## 📊 Key Metrics to Monitor

### System Level:
- **CPU Usage**: < 80%
- **Memory Usage**: < 85%
- **Disk Space**: < 90%
- **Network**: Latency, throughput

### Application Level:
- **Response Time**: < 2s
- **Error Rate**: < 1%
- **Throughput**: Requests/min
- **Uptime**: > 99.9%

### Business Level:
- **Active Users**: DAU, MAU
- **Operations**: Success/failure rate
- **Costs**: API usage, storage
- **Engagement**: Messages, commands

**Автоматически делает систему прозрачной и предсказуемой!** 📊🔍
