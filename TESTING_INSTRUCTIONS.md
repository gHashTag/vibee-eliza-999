# 🧪 Инструкции по проверке GitHub-to-Sentry Sync

## ✅ Что настроено:

1. **Secrets в GitHub:**
   - `SENTRY_API_KEY` ✅
   - `SENTRY_DSN` ✅

2. **Workflow:** `.github/workflows/github-to-sentry-sync.yml`
   - Organization: `vasilev-dmitrii`
   - Project: `vibee-eliza-999-prod-2`

3. **Test Issues Created:**
   - #3, #4, #5, #6, #7, #8, #9

## 🔍 Проверка:

### Шаг 1: GitHub Actions
```bash
# Repository → Actions → GitHub Issues → Sentry Tracker
# Посмотреть последний failed run
# Expand "Track GitHub Issue in Sentry" job
# Проверить логи
```

### Шаг 2: Sentry Dashboard
```bash
# Зайти: https://vasilev-dmitrii.sentry.io/projects/vibee-eliza-999-prod-2/
# Проверить Events с тегом: logger: github
# Должны появиться события при создании issues
```

## 🚀 Тест:

### Вручную проверить API:
```bash
# Создать issue:
gh issue create --title "Test manual" --body "Manual test"

# Проверить workflow run:
gh run list --workflow=github-to-sentry-sync.yml --limit=1

# Посмотреть комментарий:
gh issue view N --json comments
```

## 📋 Настройки Sentry:

**Правильные значения:**
- Organization: `vasilev-dmitrii`
- Project: `vibee-eliza-999-prod-2`
- API Key: Должен иметь права `project:write`, `event:write`

## 🎯 Ожидаемый результат:

1. **При создании issue:**
   - Workflow запускается ✅
   - Событие отправляется в Sentry ✅
   - Комментарий добавляется ✅

2. **В Sentry Dashboard:**
   - Новые Events с `logger: github`
   - Теги: `github_issue_number`, `github_repository`

---

**Если все работает, то автоматическая регистрация GitHub Issues в центре настроена! 🎉**
