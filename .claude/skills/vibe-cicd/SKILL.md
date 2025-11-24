---
name: vibe-cicd
agent_id: vibe-cicd
description: 🔄 Auto-activates for CI/CD pipelines, GitHub Actions, deployment automation, and DevOps workflows
keywords:
  - cicd
  - ci/cd
  - pipeline
  - github actions
  - workflow
  - deploy
  - deployment
  - автодеплой
  - github
  - gitlab
  - jenkins
  - автоматизация
  - automation
  - релиз
  - release
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🔄 Vibe CI/CD - Pipeline Master

Этот скилл **автоматически активируется** когда упоминается CI/CD, пайплайны, деплой или автоматизация релизов.

## 🎯 Что Делает

1. **GitHub Actions**: Создание workflow файлов
2. **Pipeline Design**: Планирование стадий сборки
3. **Deployment Automation**: Автоматический деплой
4. **Testing Integration**: Включение тестов в пайплайн
5. **Environment Management**: Dev, Staging, Production
6. **Release Automation**: Semantic versioning, changelog

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложных пайплайнов
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **GitHub Actions**: Workflow файлы, jobs, steps
- ✅ **Docker Integration**: Build, push, deploy контейнеры
- ✅ **Testing Stages**: Unit, integration, e2e тесты
- ✅ **Security Scanning**: SAST, DAST, dependency check
- ✅ **Multi-Environment**: Dev/Staging/Prod деплой
- ✅ **Release Management**: Versioning, tags, releases

## 📚 Паттерны

### GitHub Actions Pattern:
```typescript
const cicdPipeline = {
  stages: {
    install: 'npm ci',
    test: 'npm test',
    build: 'npm run build',
    deploy: 'deploy-to-prod'
  },
  triggers: ['push', 'pull_request'],
  branches: ['main', 'develop']
};
```

### Deployment Pattern:
```typescript
const deploymentFlow = {
  build: buildApplication(),
  test: runTests(),
  scan: securityScan(),
  deploy: deployToEnvironment(env),
  verify: smokeTests()
};
```

**Автоматизирует все процессы от коммита до продакшна!** 🔄🚀
