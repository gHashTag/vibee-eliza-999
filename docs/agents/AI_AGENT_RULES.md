# 🔐 ПРАВИЛА ЗАГРУЗКИ СЕКРЕТОВ ИЗ INFISICAL ДЛЯ AI АГЕНТОВ

## ⚠️ КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА

### 🎯 Основной принцип: Cloud-First

**ВСЕГДА загружайте секреты из Infisical Cloud!**

VIBEE использует **Infisical Cloud-First** архитектуру для управления секретами. Все API ключи, токены и конфиденциальные данные должны храниться в Infisical, а НЕ в .env файлах!

## 📋 Структура файлов секретов

### ✅ `.env.dev` - ТОЛЬКО Infisical credentials + Dev настройки

```bash
# 🔐 Infisical Cloud-First Configuration (ОБЯЗАТЕЛЬНО!)
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=<your-infisical-client-secret>
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev

# 🧪 Development Environment
NODE_ENV=development

# ⚡ Dev-only variables (для разработки, но не продакшен!)
TELEGRAM_BOT_TOKEN=8129344128:AAFUa7z8LqN9p7k6vJw3YHh2E9b0T1uI6sXeX0d5oP4rN2cF8vQ9yA3hG1jF
```

**ВАЖНО:**
- В `.env.dev` могут быть НЕКОТОРЫЕ dev-ключи для удобства разработки
- НО НЕ ВСЕ 75 переменных! (это нарушение безопасности)
- Все production ключи ТОЛЬКО в Infisical Cloud!

### ❌ `.env` - НЕ ИСПОЛЬЗУЕТСЯ

В проекте НЕТ файла `.env` (или он в .gitignore) - все секреты в Infisical!

### ✅ `.infisical.env` - ТОЛЬКО Infisical credentials

```bash
# 🔐 Infisical Cloud-First Configuration - DEVELOPMENT
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=<your-infisical-client-secret>
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev
NODE_ENV=development
```

**НЕ ДОБАВЛЯЙТЕ В `.infisical.env`:**
- ❌ TELEGRAM_BOT_TOKEN (уже в .env.dev для dev)
- ❌ OPENAI_API_KEY
- ❌ ANTHROPIC_API_KEY
- ❌ FAL_KEY
- ❌ REPLICATE_API_TOKEN
- ❌ INSTAGRAM_ACCESS_TOKEN
- ❌ DATABASE_URL
- ❌ ЛЮБЫЕ другие API ключи!

## 🔄 Как загружаются секреты

### Шаг 1: Загрузка Infisical credentials

Скрипт `scripts/dev-with-infisical.sh` загружает Infisical credentials:

```bash
#!/bin/bash
set -e

echo "🔑 Загружаем секреты из .infisical.env..."
# Загружаем Infisical client credentials
export $(grep -v '^#' .infisical.env | xargs)

echo "📦 Запускаем elizaos dev..."
elizaos dev
```

### Шаг 2: Infisical автоматически загружает все секреты

При запуске проекта Infisical автоматически загружает ВСЕ секреты из облака:

```typescript
// Infisical автоматически подгружает:
process.env.TELEGRAM_BOT_TOKEN
process.env.OPENAI_API_KEY
process.env.ANTHROPIC_API_KEY
process.env.FAL_KEY
process.env.REPLICATE_API_TOKEN
process.env.INSTAGRAM_ACCESS_TOKEN
process.env.DATABASE_URL
// ... и все остальные 50+ переменных
```

## 🚀 Правильные команды запуска

### ✅ ПРАВИЛЬНО:

```bash
# Из корня проекта
cd /Users/playra/vibee-agent

# ЕДИНСТВЕННАЯ КОМАНДА:
bun dev

# ИЛИ с загрузкой переменных:
bash scripts/dev-with-infisical.sh && bun dev
```

### ❌ НЕПРАВИЛЬНО:

```bash
# НЕПРАВИЛЬНО - плагин режим, ошибки БД
elizaos dev

# НЕПРАВИЛЬНО - не загружает переменные правильно
npm run dev:hot

# НЕПРАВИЛЬНО - не из корня проекта
cd plugin-vibe-face-avatar && elizaos dev

# НЕ добавляйте секреты в .env файлы
# НЕ храните API ключи в .env.local
# НЕ закоммитьте секреты в git!
```

## 🧪 Проверка загрузки секретов

### Команда 1: Проверить Infisical connection

```bash
infisical status
```

### Команда 2: Показать все секреты

```bash
infisical secrets list --env=dev
```

### Команда 3: Проверить критичные переменные

```bash
# Должны быть загружены из Infisical Cloud:
grep -E "(TELEGRAM_BOT_TOKEN|OPENAI_API_KEY|FAL_KEY)" <(infisical secrets list --env=dev)
```

### Команда 4: Проверить в коде

```typescript
// В любом файле TypeScript:
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Загружен' : '❌ НЕ найден');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Загружен' : '❌ НЕ найден');
console.log('FAL_KEY:', process.env.FAL_KEY ? '✅ Загружен' : '❌ НЕ найден');
```

## 📦 50+ переменных в Infisical Cloud

Все эти переменные загружаются автоматически из Infisical:

### 🔐 Базовые API ключи:
- TELEGRAM_BOT_TOKEN
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- OPENROUTER_API_KEY

### 📸 Генерация изображений:
- FAL_KEY
- REPLICATE_API_TOKEN

### 📱 Instagram:
- INSTAGRAM_ACCESS_TOKEN
- INSTAGRAM_ACCOUNT_ID
- INSTAGRAM_APP_ID
- INSTAGRAM_APP_SECRET

### 💾 База данных:
- DATABASE_URL
- NEON_CONNECTION_STRING

### 🎤 Аудио/Видео:
- ELEVENLABS_API_KEY
- CARTESIA_API_KEY
- SYNC_LABS_API_KEY

### 🌍 Другие сервисы:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MINIMAX_API_KEY
- GITHUB_TOKEN
- И многие другие...

## 🐛 Устранение проблем

### Проблема: "API key not found"

**Причина:** Секреты не загрузились из Infisical

**Решение:**
```bash
# 1. Проверьте .infisical.env содержит ТОЛЬКО Infisical credentials
cat .infisical.env | grep -v '^#'

# 2. Запустите через скрипт (НЕ напрямую!)
bash scripts/dev-with-infisical.sh

# 3. Проверьте статус Infisical
infisical status

# 4. Если ошибка - попробуйте перелогиниться
infisical login
infisical secrets pull --env=dev
```

### Проблема: "Failed to load secrets from Infisical"

**Причина:** Неправильные Infisical credentials

**Решение:**
```bash
# 1. Проверьте credentials в .infisical.env:
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=<your-infisical-client-secret>
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3

# 2. Проверьте права доступа
infisical status

# 3. Если нужно - пересоздайте токены в Infisical Dashboard
```

## 🔒 Безопасность

### ✅ ПРАВИЛЬНО:
- Секреты в Infisical Cloud
- .env файлы содержат только Infisical credentials
- .gitignore содержит .env
- Логи НЕ содержат секреты

### ❌ НЕПРАВИЛЬНО:
- Добавлять API ключи в .env файлы
- Закоммичивать .env в git
- Хранить секреты в коде
- Выводить секреты в логи

## 📝 Чек-лист для разработчиков

### Перед запуском проекта:

- [ ] Проверить `.infisical.env` содержит ТОЛЬКО 5 Infisical переменных
- [ ] Запускать через `bash scripts/dev-with-infisical.sh` (НЕ `elizaos dev`!)
- [ ] Проверить `infisical status`
- [ ] Убедиться, что все секреты загружены из облака

### При добавлении нового API:

- [ ] Добавить ключ в Infisical Cloud (НЕ в .env!)
- [ ] Обновить документацию с переменной
- [ ] Протестировать загрузку

### При коммите:

- [ ] .env файлы НЕ добавлены в git
- [ ] .infisical.env содержит только Infisical credentials
- [ ] Нет секретов в коде

## 🎯 Заключение

**Главное правило:**

> 🔐 **ВСЕГДА используйте Infisical Cloud для секретов!**
>
> 📁 **.infisical.env = ТОЛЬКО Infisical credentials (5 переменных)**
>
> ☁️ **Все остальные 50+ переменных = Infisical Cloud**
>
> 🚀 **Запуск = bash scripts/dev-with-infisical.sh**

---

**Создано для предотвращения ошибок с секретами в VIBEE проекте**

**Дата:** 2025-11-22
**Версия:** 1.0
