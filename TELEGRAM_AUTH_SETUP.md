# 🔐 Telegram Authentication System Setup Guide

## 📋 Обзор системы

Реализована полноценная система аутентификации через Telegram с управлением пользовательскими секретами:

### Основные компоненты:

1. **Telegram Auth Service** (`/packages/server/src/services/telegramAuthService.ts`)
   - Верификация данных через HMAC-SHA256
   - JWT токены (30 дней)
   - Управление сессиями
   - Логирование операций

2. **Infisical Service** (`/packages/server/src/services/infisicalService.ts`)
   - Пользовательские секреты в Infisical Cloud
   - Изоляция по Telegram ID
   - CRUD операции

3. **Database Schema** (`/packages/server/src/schema/userSchema.ts`)
   - `vibee_users` - пользователи
   - `vibee_user_sessions` - сессии
   - `vibee_secret_access_logs` - аудит доступа

4. **API Routes**:
   - `POST /api/auth/telegram` - аутентификация
   - `GET /api/auth/verify` - проверка токена
   - `GET /api/auth/me` - информация о пользователе
   - `POST /api/auth/logout` - выход
   - `GET /api/secrets` - список секретов
   - `GET /api/secrets/:name` - получить секрет
   - `POST /api/secrets` - создать/обновить секрет
   - `DELETE /api/secrets/:name` - удалить секрет
   - `GET /api/secrets/stats` - статистика

---

## 🚀 Быстрый запуск

### 1. Установка зависимостей

```bash
cd /Users/playra/vibee-eliza-999
bun install
```

### 2. Настройка переменных окружения

Создайте `.env` файл в корне проекта:

```bash
# PostgreSQL Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/vibee

# Telegram Bot Token (получите от @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Infisical Cloud (для секретов)
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev

# JWT Secret (генерируется автоматически если не указан)
SECRET_SALT=your_jwt_secret_here
```

### 3. Создание и запуск миграции БД

```bash
cd /Users/playra/vibee-eliza-999/packages/server
bun install

# Запустить SQL миграцию вручную
psql $POSTGRES_URL -f drizzle/migrations/20241125_create_vibee_users.sql
```

Или используйте скрипт миграции:

```bash
cd /Users/playra/vibee-eliza-999/packages/server
bun run migrate
```

### 4. Проверка системы

```bash
cd /Users/playra/vibee-eliza-999
bun run test-auth.ts
```

### 5. Запуск сервера

```bash
cd /Users/playra/vibee-eliza-999
bun dev
```

Сервер запустится на http://localhost:3000

---

## 🧪 Тестирование API

### Аутентификация через Telegram

```bash
curl -X POST http://localhost:3000/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "id": 144022504,
    "first_name": "Test",
    "username": "testuser",
    "auth_date": '$(date +%s)',
    "hash": "your_valid_hash_here"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "telegramId": 144022504,
    "username": "testuser",
    "firstName": "Test"
  },
  "session": {
    "id": 1,
    "expiresAt": "2024-12-25T12:00:00.000Z"
  }
}
```

### Получение списка секретов

```bash
curl http://localhost:3000/api/secrets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Создание секрета

```bash
curl -X POST http://localhost:3000/api/secrets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "secretName": "my_api_key",
    "secretValue": "secret_value_here",
    "environment": "dev"
  }'
```

---

## 🔑 Получение Telegram данных для аутентификации

### Способ 1: Telegram Login Widget

Добавьте на ваш сайт:

```html
<script src="https://telegram.org/js/telegram-widget.js"></script>
<script>
  Telegram.Login.auth({
    bot_id: 'YOUR_BOT_ID',
    request_access: true,
    lang: 'ru'
  }, function(user) {
    if (user) {
      // Отправляем данные на ваш API
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).then(r => r.json()).then(data => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      });
    }
  });
</script>
```

### Способ 2: Ручное тестирование

Для тестирования с ID 144022504:

```javascript
// В браузере (Console)
const testData = {
  id: 144022504,
  first_name: 'Test',
  username: 'testuser',
  auth_date: Math.floor(Date.now() / 1000),
  hash: 'test_hash_placeholder'
};

// Для получения валидного hash используйте Telegram WebApp API
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
```

---

## 🏗️ Архитектура

```
┌─────────────────────────────────────┐
│         Telegram Login Widget       │
│     (Frontend аутентификация)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         POST /api/auth/telegram      │
│   (telegramAuthService.verify)       │
└──────────────┬──────────────────────┘
               │
               ├─ JWT Token
               ├─ Создание/обновление user
               └─ Создание сессии
               │
               ▼
┌─────────────────────────────────────┐
│     Database (PostgreSQL + Drizzle) │
│  - vibee_users                      │
│  - vibee_user_sessions              │
│  - vibee_secret_access_logs         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Infisical Cloud Secrets        │
│   users/{telegramId}/{secretName}   │
└─────────────────────────────────────┘
```

---

## 🔒 Безопасность

### Реализованные меры:

1. **HMAC-SHA256 верификация** - проверка целостности данных от Telegram
2. **JWT токены** - безопасная аутентификация без состояния
3. **Rate Limiting** - защита от brute force (5 попыток/15 минут)
4. **Изоляция секретов** - каждый пользователь видит только свои секреты
5. **Аудит логи** - все операции с секретами записываются
6. **Валидация входных данных** - проверка всех параметров
7. **CORS настройки** - ограничение источников запросов

### Рекомендации:

- Используйте HTTPS в production
- Регулярно ротируйте JWT секреты
- Настройте логирование в продакшене
- Используйте secrets manager в production
- Настройте мониторинг подозрительной активности

---

## 🐛 Устранение неисправностей

### Проблема: "Database migration failed"

**Решение:**
```bash
# Проверьте подключение к PostgreSQL
psql $POSTGRES_URL -c "SELECT version();"

# Запустите миграцию вручную
psql $POSTGRES_URL -f packages/server/drizzle/migrations/20241125_create_vibee_users.sql
```

### Проблема: "Invalid hash" при аутентификации

**Решение:**
- Проверьте, что `TELEGRAM_BOT_TOKEN` правильный
- Убедитесь, что используете актуальные данные от Telegram Login Widget
- Проверьте `auth_date` (не старше 24 часов)

### Проблема: "Failed to fetch secrets"

**Решение:**
```bash
# Проверьте переменные Infisical
echo $INFISICAL_CLIENT_ID
echo $INFISICAL_CLIENT_SECRET
echo $INFISICAL_PROJECT_ID

# Проверьте подключение к Infisical
node -e "console.log('Infisical SDK version:', require('@infisical/sdk/package.json').version)"
```

---

## 📚 Дополнительная информация

### Полезные ссылки:

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Infisical Documentation](https://infisical.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [JWT.io](https://jwt.io/)

### Файлы проекта:

- `packages/server/src/services/telegramAuthService.ts` - Сервис аутентификации
- `packages/server/src/services/infisicalService.ts` - Сервис секретов
- `packages/server/src/schema/userSchema.ts` - Схема БД
- `packages/server/src/api/auth/index.ts` - API аутентификации
- `packages/server/src/api/secrets/index.ts` - API секретов
- `packages/server/drizzle/migrations/20241125_create_vibee_users.sql` - Миграция

---

## ✅ Чек-лист запуска

- [ ] Установлены зависимости (`bun install`)
- [ ] Настроен `.env` файл
- [ ] PostgreSQL запущен и доступен
- [ ] Запущена миграция БД
- [ ] Настроен Telegram Bot Token
- [ ] Настроены переменные Infisical
- [ ] Пройден тест системы (`bun run test-auth.ts`)
- [ ] Сервер запущен (`bun dev`)
- [ ] Проверены API endpoints

---

**🎉 Система готова к использованию!**

Для вопросов и поддержки создавайте issue в репозитории.
