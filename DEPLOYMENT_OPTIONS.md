# 🚂 Варианты деплоя на Railway

## ✅ Готовые файлы для Railway

Созданы следующие файлы:
- ✅ `railway.json` - конфигурация Railway (Docker сборка)
- ✅ `Dockerfile` - для контейнеризации
- ✅ `.railwayignore` - исключения файлов
- ✅ `.github/workflows/railway-deploy.yml` - автодеплой через GitHub Actions
- ✅ `scripts/deploy-to-railway.sh` - автоматизированный скрипт деплоя

---

## 🎯 Способ 1: Автоматический скрипт (РЕКОМЕНДУЕТСЯ)

```bash
# Запустить скрипт
./scripts/deploy-to-railway.sh
```

Скрипт автоматически:
1. Проверит авторизацию
2. Создаст/привяжет проект
3. Запустит деплой
4. Покажет инструкции

---

## 🎯 Способ 2: Веб-интерфейс Railway

### Быстрое создание через GitHub Template:
1. Откройте: https://railway.app/new/template?template=https://github.com/gHashTag/vibee-eliza-999/tree/deploy-railway
2. Авторизуйтесь в Railway
3. Выберите репозиторий `gHashTag/vibee-eliza-999`
4. Выберите ветку `deploy-railway`
5. Нажмите "Deploy Now"

### Ручное создание:
1. Перейдите на https://railway.app
2. Нажмите "New Project" → "Empty Project"
3. Дайте имя: `vibee-eliza-999`
4. В Settings → Source → "Deploy from GitHub repo"
5. Выберите: `gHashTag/vibee-eliza-999`
6. Выберите ветку: `deploy-railway`
7. Нажмите "Deploy Now"

---

## 🎯 Способ 3: GitHub Actions (для CI/CD)

### Настройка:
1. Добавьте секрет в GitHub репозиторий:
   - Имя: `RAILWAY_TOKEN`
   - Значение: получите в Railway Dashboard → Settings → API Tokens

2. Пушьте в ветку `deploy-railway`:
   ```bash
   git add .
   git commit -m "Deploy to Railway"
   git push origin deploy-railway
   ```

3. GitHub Actions автоматически задеплоит на Railway

---

## 🎯 Способ 4: CLI команды

```bash
# 1. Авторизация
railway login

# 2. Инициализация проекта
railway init

# 3. Привязка к существующему проекту (если есть)
railway link

# 4. Деплой
railway up

# 5. Проверка статуса
railway status

# 6. Просмотр логов
railway logs
```

---

## 📋 Переменные окружения

Добавьте в Railway Dashboard → Variables:

### Обязательные:
```env
# Для ИИ (минимум один)
OPENAI_API_KEY=your_openai_key
# ИЛИ
ANTHROPIC_API_KEY=your_anthropic_key
```

### Опциональные:
```env
NODE_ENV=production

# Infisical (для управления секретами)
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev

# Для Telegram бота (если используете)
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

## 🔍 Проверка деплоя

После успешного деплоя откройте URL:
- Главная страница: `https://xxx.up.railway.app`
- API статус: `https://xxx.up.railway.app/api/status`
- API агенты: `https://xxx.up.railway.app/api/agents`

---

## 🔄 Обновление деплоя

### Через Git:
```bash
git add .
git commit -m "Update"
git push origin deploy-railway
# Railway автоматически пересоберет!
```

### Через CLI:
```bash
railway up
```

---

## 🆘 Устранение неполадок

### Build failed
```bash
railway logs --build
```

### Runtime error
```bash
railway logs --runtime
```

### Проверить переменные
```bash
railway variables
```

---

## 💰 Стоимость

- **Hobby Plan:** $0/месяц (free tier)
- **Pro Plan:** $20/месяц (production ready)

Рекомендуется: Pro Plan для продакшена.

---

## ✅ Итог

Все готово для деплоя! Выберите удобный способ:
1. 🚀 **Скрипт**: `./scripts/deploy-to-railway.sh`
2. 🌐 **Веб**: https://railway.app/new
3. 🤖 **CI/CD**: GitHub Actions
4. 💻 **CLI**: `railway up`

**Удачного деплоя! 🎉**
