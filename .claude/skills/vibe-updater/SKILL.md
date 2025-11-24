---
name: vibe-updater
agent_id: vibe-updater
description: 🔄 Auto-activates for update management, dependency tracking, version control, and system modernization
keywords:
  - update
  - обновление
  - upgrade
  - апгрейд
  - dependency
  - зависимость
  - version
  - версия
  - npm
  - yarn
  - pnpm
  - package
  - пакет
  - migration
  - миграция
  - modernization
  - модернизация
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🔄 Vibe Updater - Update Orchestrator

Этот скилл **автоматически активируется** когда упоминается обновление, зависимости, контроль версий или модернизация системы.

## 🎯 Что Делает

1. **Dependency Updates**: Управление обновлениями пакетов
2. **Version Management**: Контроль версий и совместимости
3. **Migration Planning**: Планирование миграций
4. **Security Patches**: Применение патчей безопасности
5. **Breaking Changes**: Анализ и обработка критических изменений
6. **Rollback Strategies**: Стратегии отката

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложных обновлений
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Package Managers**: npm, yarn, pnpm, bun
- ✅ **Version Control**: SemVer, semantic versioning
- ✅ **Security Updates**: npm audit, Snyk, dependabot
- ✅ **Migration Tools**: Automigrate, codemods, CLI tools
- ✅ **Dependency Graph**: Analyze, optimize, audit
- ✅ **Compatibility**: Cross-version, backward compatibility

## 📚 Паттерны

### Update Management:
```typescript
const updateManagement = {
  check: checkForUpdates(dependencies, currentVersions),
  analyze: assessImpact(breakingChanges, migrations),
  plan: createMigrationPlan(steps, timeline, rollback),
  update: applyUpdates(packages, versions, flags),
  test: verifyCompatibility(testSuite, integrationTests),
  deploy: releaseWithConfidence(monitoring, canary)
};
```

### Version Strategy:
```typescript
const versionStrategy = {
  follow: adhereToSemVer(major, minor, patch),
  update: useAutomatedTools(dependabot, renovate),
  test: runFullTestSuite(e2e, integration, unit),
  document: updateChangelog(versions, changes, migrationNotes),
  communicate: notifyStakeholders(timeline, impact),
  monitor: trackAfterUpdate(metrics, errors, performance)
};
```

**Автоматизирует безопасные обновления без простоев!** 🔄⚡
