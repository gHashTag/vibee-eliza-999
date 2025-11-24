# 🚀 Пошаговое руководство: Настройка Sentry ↔ GitHub Integration

## ✅ Что уже готово

В репозитории уже создано:
1. ✅ **Enhanced Sentry Integration** - `instrument.js` с полным функционалом
2. ✅ **GitHub Actions Workflow** - `.github/workflows/sentry-github-sync.yml`
3. ✅ **Webhook Handler** - `scripts/sentry-webhook.js`
4. ✅ **Test Script** - `test-sentry-github-integration.js`
5. ✅ **Documentation** - все необходимые гайды

## 📋 DSN и ключи

### У нас есть:
- **SENTRY_DSN**: `https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280`
- **Infisical Setup**: для получения секретов

### Нужно получить:
1. **SENTRY_API_KEY** - для работы с Sentry API
2. **GITHUB_TOKEN** - для работы с GitHub API

## 🎯 Шаги настройки

### Шаг 1: Получить SENTRY_API_KEY

1. Перейдите на: https://sentry.io/account/settings/api/auth-tokens/
2. Создайте новый токен с правами:
   - ✅ `project:read` - чтение проектов
   - ✅ `event:read` - чтение событий
   - ✅ `issue:write` - запись issues
3. Скопируйте токен

### Шаг 2: Получить GITHUB_TOKEN

1. Перейдите на: https://github.com/settings/tokens
2. Создайте новый токен (Settings → Developer settings → Personal access tokens)
3. Выберите права:
   - ✅ `repo` (полный доступ к репозиториям)
   - ✅ `workflow` (доступ к GitHub Actions)
4. Скопируйте токен

### Шаг 3: Тестирование интеграции

```bash
# Установить токены в переменные окружения
export SENTRY_API_KEY=your_sentry_api_key_here
export GITHUB_TOKEN=your_github_token_here

# Запустить тест
node test-sentry-github-integration.js
```

### Шаг 4: Настройка GitHub Secrets

В репозитории GitHub:
1. Repository → Settings → Secrets and variables → Actions
2. Нажмите "New repository secret"
3. Добавьте:
   ```
   Name: SENTRY_API_KEY
   Secret: your_sentry_api_key_here
   ```

4. Добавьте еще:
   ```
   Name: GITHUB_TOKEN
   Secret: your_github_token_here
   ```

### Шаг 5: Активировать Workflow

1. GitHub → Actions → Sentry-GitHub Sync
2. Нажмите "Enable workflow"

### Шаг 6: Настроить Sentry Alert

1. Перейдите в Sentry Dashboard: https://sentry.io/organizations/vibee/projects/eliza/
2. Settings → Alerts → Rules
3. Create Alert Rule
4. Настройте условия:
   - Conditions: "An error is logged"
   - Environment: production
   - Level: error OR fatal
5. Добавьте действие:
   - "Create a GitHub issue"
   - Repository: vibee/vibee-eliza-999

## 🧪 Тестирование

### Метод 1: Автоматический тест

```bash
node test-sentry-github-integration.js
```

### Метод 2: Ручной тест

```bash
# Создать тестовую ошибку в Sentry
curl -X POST \
  https://sentry.io/api/0/projects/vibee/eliza/events/ \
  -H "Authorization: Bearer $SENTRY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "message": "Test error from manual test",
    "environment": "test"
  }'
```

### Метод 3: Запуск GitHub Action вручную

```bash
gh workflow run sentry-github-sync.yml
```

## 📊 Проверка результатов

### В Sentry:
1. https://sentry.io/organizations/vibee/projects/eliza/issues/
2. Должны появиться новые ошибки

### В GitHub:
1. Repository → Issues
2. Должны появиться новые issues с label "sentry"

```bash
# Посмотреть открытые issues
gh issue list --search "label:sentry state:open"

# Посмотреть последние runs
gh run list --workflow=sentry-github-sync.yml --limit 5
```

## 🎨 Кастомизация

### Изменить условия создания issues

В файле `.github/workflows/sentry-github-sync.yml`:

```yaml
# Строка ~20: Условия для создания
conditions:
  - "An error is logged"
  - "Environment: production"
  - "Level: error"  # <-- изменить на fatal/warning
```

### Изменить labels

```yaml
# В функции createIssue()
labels: ['bug', 'sentry', 'auto-created', 'your-custom-label']
```

### Изменить частоту проверки

```yaml
# Строка 8: Cron schedule
schedule:
  - cron: '0 */2 * * *'  # каждые 2 часа
```

## 🔧 Устранение неполадок

### Проблема: Workflow не запускается

```bash
# Проверить workflow permissions
# Settings → Actions → General → Workflow permissions
# Должно быть: "Read and write permissions"
```

### Проблема: API возвращает 401

```bash
# Проверить токены
curl -H "Authorization: Bearer $SENTRY_API_KEY" \
  https://sentry.io/api/0/projects/vibee/eliza/issues/

curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/user
```

### Проблема: Issue не создается

```bash
# Посмотреть логи workflow
gh run list --workflow=sentry-github-sync.yml
gh run view <run-id> --log
```

## 🎯 Как это работает

### Сценарий 1: Критическая ошибка → GitHub Issue

```
1. Пользователь сталкивается с error/fatal
2. Sentry ловит ошибку
3. Alert Rule срабатывает
4. GitHub Action автоматически запускается
5. Создается GitHub Issue
6. Добавляется комментарий
7. Отправляется Slack уведомление
```

### Сценарий 2: High-volume ошибка

```
1. Sentry детектирует 100+ occurrences
2. Cron job каждые 2 часа
3. Action сканирует errors
4. Создается приоритетный Issue
5. Добавляется label "priority-critical"
```

### Сценарий 3: Исправление

```
1. Разработчик закрывает GitHub Issue
2. Action обновляет Sentry
3. Issue в Sentry → resolved
```

## 📈 Мониторинг

### GitHub Metrics

```bash
# Количество открытых sentry issues
gh issue list --search "label:sentry state:open" --json number --jq 'length'

# Последние созданные
gh issue list --search "label:sentry created:>$(date -d '7 days ago' -I)" --json number,title

# Закрытые за неделю
gh issue list --search "label:sentry state:closed closed:>$(date -d '7 days ago' -I)" --json number,title
```

### Workflow Metrics

```bash
# Последние runs
gh run list --workflow=sentry-github-sync.yml --limit 10 --json status,conclusion,createdAt --jq '.[0:5] | .[] | "\(.status) - \(.conclusion) - \(.createdAt)"'

# Success rate
gh run list --workflow=sentry-github-sync.yml --json conclusion --jq '[.[].conclusion] | group_by(.) | map({status: .[0], count: length})'
```

## 🎁 Дополнительные возможности

### 1. Slack интеграция

```bash
# Добавить в GitHub Secrets
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Workflow автоматически отправит уведомления при ошибках
```

### 2. Discord интеграция

```bash
# Добавить в GitHub Secrets
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK

# В workflow добавить:
- name: Notify Discord
  run: |
    curl -X POST -H "Content-Type: application/json" \
      -d '{"content":"New Sentry error: ${{ steps.extract.outputs.title }}"}' \
      ${{ secrets.DISCORD_WEBHOOK }}
```

### 3. Jira интеграция

```bash
# В workflow добавить:
- name: Create Jira Ticket
  run: |
    curl -X POST \
      -H "Authorization: Bearer $JIRA_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"summary":"'${{ github.event.client_payload.title }}'"}' \
      "https://your-domain.atlassian.net/rest/api/3/issue"
```

## 📚 Файлы в проекте

```
📁 .github/workflows/
  └─ sentry-github-sync.yml     # Основной workflow (19KB)

📁 scripts/
  └─ sentry-webhook.js          # Webhook handler (9.1KB)

📁 . (root)
  ├─ test-sentry-github-integration.js    # Test suite (15KB)
  ├─ SENTRY_GITHUB_SYNC_SETUP.md          # Подробный гайд (23KB)
  ├─ SENTRY_GITHUB_SYNC_QUICKSTART.md     # Быстрый старт (9.4KB)
  ├─ GITHUB_ISSUES_SYNC_REPORT.md         # Отчет о работе
  └─ SENTRY_ENHANCED_USAGE.md             # Гайд по Sentry (11KB)
```

## ✨ Результат

После настройки у вас будет:
- ✅ **Автоматическое создание** GitHub Issues при критических ошибках
- ✅ **Синхронизация статусов** между Sentry и GitHub
- ✅ **Уведомления** в Slack/Discord
- ✅ **Периодическая проверка** high-volume ошибок
- ✅ **Полная observability** ошибок в production

**Время настройки:** 5-10 минут
**Автоматизация:** 100%

---

## 🚀 Быстрый старт

```bash
# 1. Получить токены
# 2. Установить токены
export SENTRY_API_KEY=your_key
export GITHUB_TOKEN=your_token

# 3. Протестировать
node test-sentry-github-integration.js

# 4. Добавить в GitHub Secrets
# 5. Активировать workflow
# 6. Готово! 🎉
```

---

**Готов к использованию! Просто следуйте шагам выше!** 🚀
