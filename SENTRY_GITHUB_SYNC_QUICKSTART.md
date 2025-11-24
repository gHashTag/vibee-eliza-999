# 🚀 Sentry ↔ GitHub Issues - Быстрая Настройка

## 🎯 Быстрый старт

Этот гайд поможет настроить автоматическую синхронизацию между Sentry и GitHub Issues за 5 минут.

## 📋 Что вы получите

- ✅ Автоматическое создание GitHub Issues при критических ошибках
- ✅ Синхронизация статусов (открыт/закрыт)
- ✅ Комментарии о новых occurrences
- ✅ Уведомления в Slack
- ✅ Периодическая проверка high-volume ошибок

## 🛠️ Настройка (5 минут)

### Шаг 1: Добавить Secrets в GitHub

**Repository → Settings → Secrets and variables → Actions**

```bash
# Обязательные secrets:
SENTRY_API_KEY=your_sentry_api_key_here
SENTRY_DSN=your_sentry_dsn_here
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}  # автоматически доступен

# Опциональные:
SLACK_WEBHOOK=your_slack_webhook_url  # для уведомлений
```

### Шаг 2: Настроить Sentry

**В Sentry Dashboard:**

1. **Создать API токен:**
   ```
   Settings → API → Auth Tokens → Create New Token
   Permissions needed:
   - project:read
   - event:read
   - issue:write
   ```

2. **Создать Issue Alert:**
   ```
   Your Project → Alerts → Rules → Create Alert Rule
   Conditions:
   - "An error is logged"
   - Environment: production
   - Level: error OR fatal

   Actions:
   - "Create a GitHub issue"
   - Repository: vibee-eliza-999
   ```

### Шаг 3: Workflow уже настроен! 🎉

Файл `.github/workflows/sentry-github-sync.yml` уже создан и готов к работе.

### Шаг 4: Активировать Webhook (опционально)

Для мгновенного создания issues:

**В Sentry:**
```
Settings → Developer Tools → Integrations → New Integration
Type: Webhook
URL: https://your-domain.com/webhook/sentry
Events: issue, issue_alert, error
```

**Запустить webhook handler:**
```bash
# Локально
node scripts/sentry-webhook.js

# Или в Docker
docker run -p 3000:3000 \
  -e SENTRY_WEBHOOK_SECRET=your_secret \
  -e GITHUB_TOKEN=your_token \
  your-image/sentry-webhook
```

## 📊 Как это работает

### Сценарий 1: Критическая ошибка
```
Пользователь сталкивается с ошибкой
    ↓
Sentry ловит ошибку
    ↓
Создается Issue Alert
    ↓
GitHub Action создает Issue #123
    ↓
Комментарий добавлен автоматически
    ↓
Slack уведомление отправлено
```

### Сценарий 2: High-volume ошибка
```
Sentry детектирует частую ошибку (100+ раз)
    ↓
Cron job срабатывает каждые 2 часа
    ↓
GitHub Action создает приоритетный Issue
    ↓
Автоматические assignees добавлены
```

### Сценарий 3: Исправление
```
Разработчик закрывает GitHub Issue
    ↓
GitHub Action обновляет Sentry статус
    ↓
Issue помечен как resolved
    ↓
Комментарий о закрытии добавлен
```

## 🎨 Кастомизация

### Изменить условия создания Issues

**.github/workflows/sentry-github-sync.yml**
```yaml
# Строка ~150: Изменить условие
conditions:
  - "An error is logged"
  - "Environment is production"
  - "Event matches: level:error"  # <-- изменить уровень
```

### Изменить частоту проверки

```yaml
# Строка 8: Cron schedule
schedule:
  - cron: '0 */2 * * *'  # каждые 2 часа
  # '0 */6 * * *' - каждые 6 часов
  # '0 0 * * *' - ежедневно в 00:00
```

### Добавить дополнительные Labels

```yaml
# В функции getLabelsForLevel()
function getLabelsForLevel(level) {
  const labels = ['bug', 'sentry', 'auto-created'];

  // Добавить свои labels
  if (level === 'fatal') {
    labels.push('urgent', 'production-down');
  }

  return labels;
}
```

### Настроить автоматических Assignees

```yaml
# В функции createGitHubIssue()
body: JSON.stringify({
  title: formattedTitle,
  body,
  labels: getLabelsForLevel(level),
  assignees: ['username1', 'username2']  // добавить
})
```

## 🧪 Тестирование

### Проверить работу вручную

```bash
# Запустить workflow вручную
gh workflow run sentry-github-sync.yml --repo owner/repo

# Посмотреть статус
gh run list --workflow=sentry-github-sync.yml
```

### Симулировать Sentry ошибку

```bash
# Отправить тестовую ошибку в Sentry
curl -X POST \
  https://sentry.io/api/0/projects/vibee/eliza/events/ \
  -H "Authorization: Bearer $SENTRY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "message": "Test error from webhook",
    "environment": "production"
  }'
```

### Проверить webhook локально

```bash
# Установить ngrok
ngrok http 3000

# Получить публичный URL
# URL: https://xyz.ngrok.io/webhook/sentry

# Обновить webhook URL в Sentry
```

## 📈 Мониторинг

### GitHub Metrics

**Посмотреть статистику:**
```bash
# Количество открытых issues
gh issue list --search "label:sentry state:open" --json number

# Последние созданные
gh issue list --search "label:sentry created:>$(date -d '7 days ago' -I)" --json number,title

# Закрытые за неделю
gh issue list --search "label:sentry state:closed closed:>$(date -d '7 days ago' -I)" --json number,title
```

### Sentry Metrics

**В Sentry Dashboard:**
- Issues → Trends
- Performance → Summary
- Releases → Health

### Workflow Metrics

**GitHub Actions:**
- Repository → Actions → Sentry-GitHub Sync
- Success/Failure rates
- Average execution time

## 🔧 Устранение неполадок

### Issue не создается

```bash
# Проверить secrets
gh secret list

# Посмотреть workflow логи
gh run list --workflow=sentry-github-sync.yml
gh run view <run-id> --log

# Проверить permissions
# Settings → Actions → General → Workflow permissions
# Должно быть: "Read and write permissions"
```

### Webhook не доставляется

```bash
# Проверить логи webhook handler
tail -f /var/log/webhook.log

# Проверить доступность
curl -X POST https://your-domain.com/health

# Проверить signature
# Sentry → Settings → Developer Tools → Webhooks
# Посмотреть логи доставки
```

### Ошибки API

```bash
# Проверить Sentry API key
curl -H "Authorization: Bearer $SENTRY_API_KEY" \
  https://sentry.io/api/0/projects/vibee/eliza/issues/

# Проверить GitHub token
gh auth status
```

## 🎁 Дополнительные возможности

### 1. Slack Integration

```yaml
# Добавить в workflow
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Sentry issue ${{ job.status }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Jira Integration

```yaml
# Создать Jira ticket вместе с GitHub issue
- name: Create Jira Ticket
  run: |
    curl -X POST \
      -H "Authorization: Bearer $JIRA_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"summary":"'${{ github.event.client_payload.title }}'"}' \
      "https://your-domain.atlassian.net/rest/api/3/issue"
```

### 3. Discord Integration

```yaml
# Отправить уведомление в Discord
- name: Notify Discord
  run: |
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{"content":"New Sentry error: '${{ steps.extract.outputs.title }}'"}' \
      ${{ secrets.DISCORD_WEBHOOK }}
```

## 📚 Полная документация

- [Подробное руководство](SENTRY_GITHUB_SYNC_SETUP.md)
- [Sentry API Docs](https://docs.sentry.io/api/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Webhook Testing](https://webhook.site/)

## ⚡ Быстрые команды

```bash
# Запустить sync вручную
gh workflow run sentry-github-sync.yml

# Посмотреть открытые issues
gh issue list --search "label:sentry state:open"

# Закрыть resolved issues
gh issue list --search "label:sentry state:open" --json number --jq '.[0:5] | .[] | "#\(.number)"' | xargs -I {} gh issue close {}

# Проверить workflow
gh run list --workflow=sentry-github-sync.yml --limit 5
```

## 🎉 Готово!

Теперь у вас есть полностью автоматизированная система синхронизации Sentry ↔ GitHub Issues!

**Следующие шаги:**
1. ✅ Протестируйте создание тестовой ошибки
2. ✅ Настройте Slack/Discord уведомления
3. ✅ Добавьте автоматических assignees
4. ✅ Создайте GitHub Projects для трекинга

---

**Версия:** 1.0.0
**Дата:** 2025-11-24
**Время настройки:** 5 минут
