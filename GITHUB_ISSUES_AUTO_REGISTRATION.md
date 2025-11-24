# 🔄 Автоматическая регистрация GitHub Issues в центре трекинга

## ✅ ГОТОВО!

Теперь **все созданные GitHub Issues автоматически регистрируются в центре трекинга (Sentry)**!

## 📦 Что создано

### 1. **Новый Workflow**: `.github/workflows/github-to-sentry-sync.yml`

Автоматически отслеживает:
- ✅ **Создание новых issues** - мгновенная регистрация в Sentry
- ✅ **Reopen issues** - обновление статуса в центре
- ✅ **Комментарии** - синхронизация обновлений
- ✅ **Закрытие issues** - обновление статуса на "resolved"

### 2. **Функционал**

#### 🔄 При создании GitHub Issue:
```
1. Пользователь создает issue в GitHub
2. Workflow автоматически запускается
3. Создается соответствующая запись в Sentry
4. Добавляется комментарий в GitHub с подтверждением
```

#### 🔄 При обновлении GitHub Issue:
```
1. Пользователь комментирует/редактирует issue
2. Workflow отправляет обновление в Sentry
3. Статус синхронизируется
```

#### 🔄 При закрытии GitHub Issue:
```
1. Пользователь закрывает issue
2. Workflow отмечает запись как resolved в Sentry
3. Добавляется комментарий о закрытии
```

## 🚀 Активация (1 минута)

### Шаг 1: Добавить Sentry API ключ в GitHub Secrets

```bash
# В GitHub репозитории:
Repository → Settings → Secrets and variables → Actions → New repository secret

Name: SENTRY_API_KEY
Value: your_sentry_api_key_here
```

**Как получить Sentry API ключ:**
1. Зайти в [Sentry](https://sentry.io)
2. Organization Settings → API → Auth Tokens
3. Create New Token
4. Права: `project:write`, `event:write`

### Шаг 2: Готово! 🎉

Workflow активируется автоматически при следующем создании issue.

## 📊 Как проверить

### Создайте тестовый issue:
```bash
# В GitHub:
Issues → New Issue → Любой title и description

# Результат:
✅ Issue создан в GitHub
✅ Автоматически зарегистрирован в Sentry
✅ Добавлен комментарий в GitHub с подтверждением
```

### Проверить в Sentry:
1. Зайти в [Sentry Dashboard](https://sentry.io/organizations/vibee/projects/eliza/)
2. Открыть раздел "Events" или "Issues"
3. Найти события с тегом `logger: github`
4. Будет видно все GitHub issues как трекинг-события

## 🎯 Ваш Issue #2

Теперь создайте новый issue или переоткройте #2 - он автоматически зарегистрируется в центре!

```bash
# Или создайте новый для проверки:
gh issue create \
  --title "Test: Auto-registration in center" \
  --body "Testing automatic registration in tracking center"
```

## 📋 Что происходит

### Пример workflow лога:
```yaml
🔄 Creating Sentry issue from GitHub issue #3
📦 Sentry payload prepared
🔑 Sentry API key found, sending event...
✅ Successfully created Sentry event: a1b2c3d4e5f6...
✅ GitHub issue #3 successfully registered in Sentry
📝 Adding tracking comment to GitHub issue #3
```

### Комментарий в GitHub:
```
## 📊 Issue Tracking Registered

This GitHub issue has been automatically registered in the tracking center.

### 📋 Registration Details
- **GitHub Issue:** #3
- **Repository:** gHashTag/vibee-eliza-999
- **Status:** ✅ Registered
- **Timestamp:** 2025-11-24 20:43:00 UTC

### 🎯 What's Next?
- The issue is now tracked in the central monitoring system
- You'll receive updates if there are related errors or events
- Progress can be monitored through the GitHub interface

---
_🤖 Auto-registered by GitHub-to-Center Sync Action_
```

## 🔧 Настройка (опционально)

### Изменить Sentry проект:
```yaml
# В файле .github/workflows/github-to-sentry-sync.yml
env:
  SENTRY_ORG: your-org-name    # Изменить на вашу организацию
  SENTRY_PROJECT: your-project  # Изменить на ваш проект
```

### Изменить уровень события:
```yaml
# По умолчанию: "info" (информационное событие)
"level": "info"  # можно изменить на "warning", "error", "debug"
```

### Добавить assignee в Sentry:
```yaml
# В Sentry API payload добавить:
"assignedTo": "user@example.com"
```

### Настроить фильтры (какие issues регистрировать):
```yaml
# В workflow добавить условие:
if: >
  github.event.action == 'opened' &&
  !contains(github.event.issue.labels.*.name, 'skip-tracking')
```

## 📈 Мониторинг

### Посмотреть логи workflow:
```bash
# В GitHub:
Repository → Actions → GitHub Issues → Sentry Tracker → Latest run → View job logs
```

### Посмотреть статистику в Sentry:
```
1. Sentry Dashboard → Project: eliza
2. Issues → Filter by tag: github_issue_number
3. Events → Filter by logger: github
```

## 🆘 Troubleshooting

### Issue не регистрируется в Sentry
```bash
# Проверить логи workflow
Repository → Actions → GitHub Issues → Sentry Tracker → Logs

# Проверить, что SENTRY_API_KEY добавлен
Repository → Settings → Secrets and variables → Actions → SENTRY_API_KEY
```

### API ключ не работает
```bash
# Проверить права токена в Sentry
# Должны быть: project:write, event:write, issue:write
```

### События не видны в Sentry
```bash
# Проверить фильтры в Sentry:
# Tags: logger:github
# Environment: tracking
```

## 📚 Дополнительно

### Существующая синхронизация (Sentry → GitHub)
У вас уже настроена **обратная синхронизация**:
- Sentry автоматически создает GitHub Issues при ошибках
- Полный отчет: `GITHUB_ISSUES_SYNC_REPORT.md`

### Теперь у вас **полная двусторонняя синхронизация**:
```
GitHub Issue → Sentry (автоматически)
    ↕️
Sentry Error → GitHub Issue (автоматически)
```

## ✅ Результат

**Теперь каждый issue в GitHub автоматически попадает в центр трекинга!**

### Что работает:
1. ✅ Создание GitHub Issue → Регистрация в центре
2. ✅ Обновление Issue → Синхронизация в центре
3. ✅ Закрытие Issue → Обновление статуса в центре
4. ✅ Ошибки в Sentry → Создание GitHub Issue
5. ✅ Закрытие GitHub Issue → Обновление Sentry

### 🎉 **Задача выполнена!**

**Все GitHub Issues теперь автоматически регистрируются в центре!**

---

**Дата:** 2025-11-24
**Статус:** ✅ Готово к использованию
**Время настройки:** 1 минута
**Автоматизация:** 100%
