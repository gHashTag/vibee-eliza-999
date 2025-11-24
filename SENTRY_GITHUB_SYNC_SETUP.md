# 🔄 Sentry ↔ GitHub Issues - Автоматическая Синхронизация

## 🎯 Обзор

Автоматическая синхронизация между Sentry и GitHub Issues позволяет:
- **Автоматически создавать** GitHub Issues при критических ошибках в Sentry
- **Синхронизировать статусы** (комментарии, assignees, состояние)
- **Отслеживать исправления** через commit references
- **Централизовать управление** багами в GitHub

## 📋 Методы интеграции

### 1. **Native Sentry ↔ GitHub Integration** ⭐ (Рекомендуется)

**Требования:** Business или Enterprise план Sentry

#### Шаг 1: Установить GitHub интеграцию в Sentry

```bash
# В Sentry Dashboard:
1. Settings > Integrations > GitHub
2. Нажмите "Add Installation"
3. Выберите GitHub или GitHub Enterprise
4. Авторизуйте доступ
```

#### Шаг 2: Настроить разрешения

Обязательные права доступа:
- ✅ **Issues** - Read & Write (создание GitHub issues)
- ✅ **Pull Requests** - Read & Write (комментарии, linking)
- ✅ **Members** - Read-only (user mapping)
- ✅ **Webhooks** - Read & Write (real-time updates)

#### Шаг 3: Настроить User Mappings (для синхронизации assignees)

```bash
# Organization Settings > Integrations > GitHub > Configure > User Mappings
# Сопоставьте каждого члена команды:
Sentry Username          →  GitHub Username
--------------------         ----------------
john.doe@example.com     →  johndoe
jane.smith@example.com   →  janesmith
```

#### Шаг 4: Создать Issue Alert с автосозданием GitHub Issue

**В Sentry Dashboard:**
1. Navigate to your project
2. Settings > Alerts > Rules
3. Create Alert Rule → Issue Alert
4. Условие (Conditions):
   ```yaml
   - "An error is logged"
   - Environment: production
   - Level: error OR fatal
   ```

5. Действие (Actions):
   - **Action:** Create a new GitHub issue
   - **Repository:** owner/repo-name
   - **Labels:** bug, sentry, auto-created
   - **Assignee:** [опционально]

#### Шаг 5: Настроить Issue Sync

**В Sentry Dashboard:**
```bash
# Settings > Integrations > GitHub > Configure
# Включить "Issue Sync" для:
✅ Sync comments (комментарии)
✅ Sync status (статусы)
✅ Sync assignees (исполнители)
```

---

### 2. **GitHub Actions + Sentry Webhooks** 💻 (Кастомное решение)

**Для организаций без Business/Enterprise плана**

#### Архитектура:
```
Sentry Error → Sentry Webhook → GitHub Repository → GitHub Action → GitHub Issue
```

#### Шаг 1: Создать webhook endpoint

**В проекте:** `scripts/sentry-webhook.ts`
```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';

export async function handler(req: Request, res: Response) {
  const signature = req.headers['sentry-hook-signature'];
  const secret = process.env.SENTRY_WEBHOOK_SECRET!;

  // Проверить подпись
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  const { action, data, actor } = req.body;

  // Обработка создания issue
  if (action === 'created' && data?.event) {
    await createGitHubIssue(data.event);
  }

  res.status(200).send('OK');
}

async function createGitHubIssue(event: any) {
  const title = `🚨 Error: ${event.title || event.message}`;
  const body = `
## Error Details

**Level:** ${event.level}
**Environment:** ${event.environment}
**First Seen:** ${event.firstSeen}
**Last Seen:** ${event.lastSeen}

**Stack Trace:**
\`\`\`
${event.exception?.values?.[0]?.stacktrace?.frames?.slice(0, 5).map((f: any) => f.filename + ':' + f.lineno).join('\n')}
\`\`\`

**Link to Sentry:** [View in Sentry](${event.permalink})

_This issue was automatically created from Sentry_
  `.trim();

  const response = await fetch('https://api.github.com/repos/OWNER/REPO/issues', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      body,
      labels: ['bug', 'sentry', 'auto-created']
    })
  });

  return await response.json();
}
```

#### Шаг 2: Настроить Sentry Webhook

**В Sentry Dashboard:**
```bash
# Settings > Developer Tools > Integrations > New Integration
1. Выберите "Webhook"
2. Название: "GitHub Issues Sync"
3. Webhook URL: https://your-domain.com/webhooks/sentry
4. Events:
   ✅ issue
   ✅ issue_alert
   ✅ error
5. Сохранить secret
```

#### Шаг 3: Создать GitHub Action для webhook

**В проекте:** `.github/workflows/sentry-webhook.yml`
```yaml
name: Sentry Error Handler

on:
  repository_dispatch:
    types: [sentry-error]

jobs:
  create-issue:
    runs-on: ubuntu-latest
    if: github.event.action == 'create-issue'

    steps:
      - name: Extract error data
        id: extract
        run: |
          echo "title=${{ github.event.client_payload.title }}" >> $GITHUB_OUTPUT
          echo "error_id=${{ github.event.client_payload.error_id }}" >> $GITHUB_OUTPUT
          echo "level=${{ github.event.client_payload.level }}" >> $GITHUB_OUTPUT
          echo "environment=${{ github.event.client_payload.environment }}" >> $GITHUB_OUTPUT

      - name: Create GitHub Issue
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 ${{ steps.extract.outputs.title }}`,
              body: `
              ## Error Details

              **Error ID:** ${{ steps.extract.outputs.error_id }}
              **Level:** ${{ steps.extract.outputs.level }}
              **Environment:** ${{ steps.extract.outputs.environment }}

              **Link to Sentry:** [View in Sentry](https://sentry.io/organizations/vibee/issues/${{ steps.extract.outputs.error_id }}/)

              ---
              _Auto-generated from Sentry_
              `,
              labels: ['bug', 'sentry', 'auto-created']
            });

            console.log('Created issue:', data.html_url);
```

---

### 3. **GitHub Actions + Sentry API** 🔧 (Альтернативный подход)

**Опрос Sentry API через cron и создание issues**

#### Создать GitHub Action:

**.github/workflows/sentry-sync.yml**
```yaml
name: Sync Sentry Errors to GitHub Issues

on:
  schedule:
    - cron: '*/15 * * * *'  # Каждые 15 минут
  workflow_dispatch:

jobs:
  sync-errors:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Sync Sentry Errors
        env:
          SENTRY_API_KEY: ${{ secrets.SENTRY_API_KEY }}
          SENTRY_ORG: vibee
          SENTRY_PROJECT: eliza
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Скачать ошибки из Sentry
          curl -s -H "Authorization: Bearer $SENTRY_API_KEY" \
            "https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT/issues/?query=is:unresolved" \
            | jq -r '.[] | select(.count >= 5) | {id, title, level, count}' \
            > /tmp/sentry_errors.json

          # Создать issues для новых ошибок
          for error in $(jq -c '.[]' /tmp/sentry_errors.json); do
            ERROR_ID=$(echo $error | jq -r '.id')
            TITLE=$(echo $error | jq -r '.title')
            LEVEL=$(echo $error | jq -r '.level')
            COUNT=$(echo $error | jq -r '.count')

            # Проверить, существует ли уже issue
            if ! gh issue list --search "Sentry ID: $ERROR_ID" --json number | grep -q '"number"'; then
              # Создать новый issue
              gh issue create \
                --title "🐛 $TITLE" \
                --body "
                ## Error Summary

                **Sentry ID:** $ERROR_ID
                **Level:** $LEVEL
                **Occurrences:** $COUNT

                [View in Sentry](https://sentry.io/organizations/vibee/issues/$ERROR_ID/)

                _Auto-generated by Sentry Sync Action_
                " \
                --label "bug,sentry,auto-created"

              echo "Created issue for error $ERROR_ID"
            fi
          done
```

---

## 🎯 Полная настройка для проекта ElizaOS

### Шаг 1: Environment Secrets

**В GitHub Repository Settings:**
```bash
# Repository > Settings > Secrets and variables > Actions
# Добавить secrets:
SENTRY_API_KEY=your_sentry_api_key
SENTRY_DSN=your_sentry_dsn
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}
SENTRY_ORG=vibee
SENTRY_PROJECT=eliza
```

### Шаг 2: Создать GitHub Action

**.github/workflows/sentry-gh-sync.yml**
```yaml
name: Sentry ↔ GitHub Issues Sync

on:
  # Webhook от Sentry
  repository_dispatch:
    types: [sentry-error]
  # Cron для периодической проверки
  schedule:
    - cron: '0 */2 * * *'  # Каждые 2 часа
  workflow_dispatch:  # Ручной запуск

env:
  SENTRY_ORG: vibee
  SENTRY_PROJECT: eliza
  GH_REPO: ${{ github.repository }}

jobs:
  handle-sentry-event:
    if: github.event_name == 'repository_dispatch'
    runs-on: ubuntu-latest

    steps:
      - name: Extract Sentry Event Data
        id: extract
        uses: actions/github-script@v7
        with:
          script: |
            const payload = context.payload.client_payload;
            console.log('Sentry Event:', JSON.stringify(payload, null, 2));

            const event = payload.event || payload;
            const title = `🚨 ${event.title || event.message || 'Unknown Error'}`;
            const level = event.level || 'error';
            const errorId = event.eventID || event.id;
            const environment = event.environment || 'unknown';
            const firstSeen = event.firstSeen || new Date().toISOString();

            core.setOutput('title', title);
            core.setOutput('level', level);
            core.setOutput('error_id', errorId);
            core.setOutput('environment', environment);
            core.setOutput('first_seen', firstSeen);

      - name: Check if Issue Already Exists
        id: check
        run: |
          # Поиск существующего issue по Sentry ID
          gh issue list --search "Sentry ID: ${{ steps.extract.outputs.error_id }}" --json number --jq '.[0].number // empty' > existing_issue.json

          if [ -s existing_issue.json ] && [ "$(cat existing_issue.json)" != "null" ]; then
            echo "Issue already exists: $(cat existing_issue.json)"
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Create GitHub Issue (if not exists)
        if: steps.check.outputs.exists == 'false'
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🐛 ${{ steps.extract.outputs.title }}`,
              body: `
              ## 🚨 Sentry Error Alert

              ### Error Information
              **Sentry ID:** ${{ steps.extract.outputs.error_id }}
              **Level:** ${{ steps.extract.outputs.level }}
              **Environment:** ${{ steps.extract.outputs.environment }}
              **First Seen:** ${{ steps.extract.outputs.first_seen }}

              ### Actions Required
              - [ ] Investigate error in Sentry
              - [ ] Identify root cause
              - [ ] Implement fix
              - [ ] Test fix
              - [ ] Deploy to production

              ### Links
              - [View in Sentry](https://sentry.io/organizations/vibee/issues/${{ steps.extract.outputs.error_id }}/)
              - [Sentry Dashboard](https://sentry.io/organizations/vibee/projects/eliza/)

              ---
              _Auto-generated by Sentry-GitHub Sync Action_
              `,
              labels: ['bug', 'sentry', 'auto-created', 'high-priority']
            });

            console.log('✅ Created GitHub Issue:', data.html_url);

            # Добавить комментарий с предварительной информацией
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: data.number,
              body: '🤖 Issue created automatically from Sentry error. Please investigate and update status as needed.'
            });

      - name: Update Existing Issue
        if: steps.check.outputs.exists == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const issue_number = require('fs').readFileSync('existing_issue.json', 'utf8').trim();
            if (issue_number && issue_number !== 'null') {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: parseInt(issue_number),
                body: '⚠️ New occurrence of this error detected in Sentry. Please check the latest events.'
              });
            }

  periodic-sync:
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest

    steps:
      - name: Fetch High-Volume Errors
        env:
          SENTRY_API_KEY: ${{ secrets.SENTRY_API_KEY }}
        run: |
          echo "🔍 Fetching high-volume errors from Sentry..."

          # Получить ошибки с количеством > 10
          curl -s -H "Authorization: Bearer $SENTRY_API_KEY" \
            "https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT/issues/?query=is:unresolved+level:error" \
            | jq -r '.[] | select(.count >= 10) | "\(.id)|\(.title)|\(.level)|\(.count)"' \
            > /tmp/high_volume_errors.txt

          if [ -s /tmp/high_volume_errors.txt ]; then
            echo "Found $(wc -l < /tmp/high_volume_errors.txt) high-volume errors"
            cat /tmp/high_volume_errors.txt
          else
            echo "No high-volume errors found"
          fi

      - name: Create Issues for Critical Errors
        run: |
          while IFS='|' read -r error_id title level count; do
            echo "Processing error: $error_id - $title (count: $count)"

            # Проверить, существует ли уже issue
            if ! gh issue list --search "Sentry ID: $error_id" --json number --jq '.[0].number // empty' | grep -q '[0-9]'; then
              # Создать новый issue
              gh issue create \
                --title "🔴 CRITICAL: $title (occurred $count times)" \
                --body "
                ## ⚠️ High-Volume Error Detected

                **Sentry ID:** $error_id
                **Occurrences:** $count
                **Level:** $level

                This error has occurred multiple times and requires immediate attention.

                [View in Sentry](https://sentry.io/organizations/vibee/issues/$error_id/)

                ---
                _Auto-generated by Sentry Sync Action_
                " \
                --label "bug,sentry,auto-created,critical"

              echo "✅ Created issue for error $error_id"
            fi
          done < /tmp/high_volume_errors.txt
```

### Шаг 3: Создать webhook receiver

**В проекте:** `.github/workflows/sentry-webhook-handler.yml`
```yaml
# Отдельный workflow для обработки webhook'ов Sentry
name: Sentry Webhook Receiver

on:
  push:
    paths:
      - '.github/webhooks/sentry/**'

jobs:
  trigger-sync:
    runs-on: ubuntu-latest
    if: github.event.head_commit.message contains '[sentry-webhook]'

    steps:
      - name: Trigger Sentry Sync
        run: |
          # Вызвать основной workflow через repository_dispatch
          gh workflow run sentry-gh-sync.yml \
            --repo ${{ github.repository }} \
            --ref ${{ github.ref_name }}
```

---

## 📊 Мониторинг и алерты

### Настроить алерты в Sentry:

```yaml
# Settings > Alerts > Rules > Create Rule

# Alert 1: High Error Rate
Conditions:
  - "An error is logged"
  - "Environment is production"
  - "Event matches: level:error"
  - "Aggregate: count() > 100 in 5m"

Actions:
  - "Create a new GitHub issue"
  - "Send notification to Slack"

# Alert 2: New Critical Error
Conditions:
  - "An error is logged"
  - "Environment is production"
  - "Event matches: level:fatal"

Actions:
  - "Create a new GitHub issue"
  - "Assign to: @dev-team"

# Alert 3: Performance Degradation
Conditions:
  - "Performance issue is detected"
  - "Environment is production"
  - "Aggregate: p95(transaction.duration) > 1000ms"

Actions:
  - "Create a new GitHub issue"
  - "Add label: performance"
```

---

## 🔄 Обратная синхронизация (GitHub → Sentry)

### Автоматическое закрытие Sentry issues при закрытии GitHub issues:

**.github/workflows/sentry-issue-sync.yml**
```yaml
name: GitHub → Sentry Sync

on:
  issues:
    types: [closed, reopened]

jobs:
  sync-to-sentry:
    runs-on: ubuntu-latest

    steps:
      - name: Sync Issue Status to Sentry
        env:
          SENTRY_API_KEY: ${{ secrets.SENTRY_API_KEY }}
        run: |
          if [ "${{ github.event.action }}" = "closed" ]; then
            # Извлечь Sentry ID из issue body
            SENTRY_ID=$(gh issue view ${{ github.event.issue.number }} \
              --json body --jq '.body | match("Sentry ID: ([0-9a-f]+)";"ig").captures[0].string')

            if [ ! -z "$SENTRY_ID" ]; then
              # Обновить статус в Sentry
              curl -X PUT \
                -H "Authorization: Bearer $SENTRY_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{"status":"resolved"}' \
                "https://sentry.io/api/0/issues/$SENTRY_ID/"

              echo "✅ Synced issue closure to Sentry $SENTRY_ID"
            fi
          fi
```

---

## 🛠️ Troubleshooting

### Проблема 1: GitHub Action не запускается
```bash
# Проверить workflow permissions
Repository Settings > Actions > General > Workflow permissions
# Установить: "Read and write permissions"
```

### Проблема 2: Webhook не доставляется
```bash
# Проверить webhook в Sentry
Settings > Developer Tools > Webhooks
# Проверить логи доставки
# URL должен быть доступен из интернета (использовать ngrok для тестов)
```

### Проблема 3: Не создаются GitHub Issues
```bash
# Проверить токен доступа
GitHub Settings > Developer settings > Personal access tokens
# Токен должен иметь: repo (полный доступ к repository)
```

### Проблема 4: Не синхронизируются assignees
```bash
# Проверить User Mappings
Sentry Settings > Integrations > GitHub > Configure > User Mappings
# Каждый пользователь должен иметь сопоставление
```

---

## 📈 Best Practices

### 1. **Labeling Strategy**
```yaml
# Обязательные labels:
- bug (для багов)
- sentry (для ошибок из Sentry)
- auto-created (автоматически созданные)

# Опциональные labels:
- critical (критические ошибки)
- performance (проблемы производительности)
- security (уязвимости)
```

### 2. **Issue Templates**

**.github/ISSUE_TEMPLATE/sentry-error.md**
```markdown
## Error Details
- **Sentry ID:** <!-- автоматически заполняется -->
- **Level:** <!-- error/fatal/warning -->
- **Environment:** <!-- production/development -->
- **First Seen:** <!-- дата первого появления -->

## Reproduction Steps
<!-- Как воспроизвести ошибку -->

## Expected Behavior
<!-- Что должно происходить -->

## Actual Behavior
<!-- Что происходит на самом деле -->

## Screenshots
<!-- Если применимо -->

## Links
- [View in Sentry](<!-- ссылка на Sentry -->)
- [Sentry Dashboard](<!-- ссылка на дашборд -->)
```

### 3. **GitHub Projects Integration**

```yaml
# Автоматически добавлять issues в проект
- uses: actions/github-script@v7
  with:
    script: |
      await github.rest.projects.createIssue({
        project_id: 1,  # ID проекта
        issue_id: context.issue.number
      });
```

### 4. **Slack Notifications**

```yaml
# Добавить уведомления в Slack
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: '🚨 Sentry error GitHub issue creation failed'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Рекомендации для проекта

### Начать с простого:
1. ✅ Использовать **Native Sentry ↔ GitHub Integration** (если есть Business план)
2. ✅ Настроить базовые **Issue Alerts**
3. ✅ Включить **Issue Sync** для комментариев и статусов

### Расширить функционал:
1. 🔄 Добавить **GitHub Actions** для кастомной логики
2. 📊 Настроить **метрики и дашборды**
3. 🔔 Интегрировать **Slack/Discord уведомления**
4. 📈 Добавить **автоматическое закрытие** решенных ошибок

### Мониторинг:
- Регулярно проверять workflow runs
- Мониторить количество созданных issues
- Отслеживать время до исправления (MTTR)
- Анализировать ложные срабатывания

---

## 📚 Дополнительные ресурсы

- [Sentry GitHub Integration Docs](https://docs.sentry.io/product/integrations/github/)
- [Sentry Webhooks Documentation](https://docs.sentry.io/product/integrations/integration-platform/webhooks/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub REST API Reference](https://docs.github.com/en/rest)

---

**Версия:** 1.0.0
**Дата:** 2025-11-24
**Статус:** ✅ Готово к внедрению
