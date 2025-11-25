---
name: vibe-sentry
agent_id: vibe-sentry
description: 🚨 Auto-activates for error monitoring, observability, incident tracking, and application health management
keywords:
  - sentry
  - monitoring
  - мониторинг
  - observability
  - наблюдаемость
  - error tracking
  - отслеживание ошибок
  - incident
  - инцидент
  - alert
  - алерт
  - health check
  - проверка здоровья
  - uptime
  - доступность
  - performance
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 🚨 Vibe Sentry - Observability Orchestrator

Этот скилл **автоматически активируется** когда упоминается мониторинг, наблюдаемость, отслеживание ошибок или управление инцидентами.

## 🎯 Что Делает

1. **Error Monitoring**: Автоматический сбор ошибок
2. **Performance Tracking**: Метрики производительности
3. **Incident Management**: Трекинг и управление инцидентами
4. **Alerting**: Настройка уведомлений и алертов
5. **Health Checks**: Проверка состояния системы
6. **User Impact Analysis**: Анализ влияния на пользователей

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для мониторинга
trigger_threshold: 0.8     # Высокий порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Error Tracking**: Stack traces, exceptions, breadcrumbs
- ✅ **Performance**: APM, transaction tracing, profiling
- ✅ **Release Tracking**: Deploy tracking, version comparison
- ✅ **User Context**: User ID, session tracking, impact
- ✅ **Custom Metrics**: Business KPIs, custom events
- ✅ **Alerting**: Slack, email, PagerDuty integration

## 📚 Паттерны

### Error Monitoring:
```typescript
const errorMonitoring = {
  capture: captureException(error, context),
  enrich: addMetadata(user, request, environment),
  group: deduplicateSimilar(errors, fingerprint),
  alert: notifyOnCritical(threshold, recipients),
  analyze: identifyTrends(patterns, frequency),
  resolve: trackToResolution(status, fixVersion)
};
```

### Incident Response:
```typescript
const incidentResponse = {
  detect: triggerOnError(error, severity),
  investigate: gatherContext(logs, traces, metrics),
  communicate: notifyStakeholders(status, impact),
  mitigate: applyWorkarounds(temporary, permanent),
  resolve: implementFix(solution, verification),
  postmortem: documentLessons(causes, actions)
};
```

**Отслеживает каждую ошибку и обеспечивает стабильность!** 🚨📊
