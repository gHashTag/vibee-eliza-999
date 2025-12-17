# 🕉️ Централизованное управление сессиями юзер-ботов

## 📋 Описание

Централизованная система для управления сессиями Telegram юзер-ботов. Все сессии хранятся в одном месте, переключение между ними занимает секунды.

## 🚀 Быстрый старт

### Показать все доступные сессии

```bash
bun scripts/switch-userbot.ts list
```

### Показать текущую активную сессию

```bash
bun scripts/switch-userbot.ts current
```

### Переключить сессию

```bash
bun scripts/switch-userbot.ts production
```

После переключения **перезапусти агентов**:

```bash
bun dev
```

## 📝 Добавление новой сессии

1. Открой `config/userbot-sessions.ts`
2. Добавь новую сессию в объект `SESSIONS`:

```typescript
export const SESSIONS: Record<string, UserbotSession> = {
  // ... существующие сессии ...

  my_new_session: {
    id: "my_new_session",
    name: "Моя новая сессия",
    description: "Описание назначения",
    sessionString: "1BQANOTEuMTA4LjU2LjE3OQG7hxJ0...",
    // Опционально, если отличается от дефолтного:
    // apiId: "94892",
    // apiHash: "cacf9ad137d228611b49b2ecc6d68d43",
  },
};
```

3. Переключись на новую сессию:

```bash
bun scripts/switch-userbot.ts my_new_session
```

## 🔧 Как это работает

### Архитектура

1. **`config/userbot-sessions.ts`** - централизованный конфиг всех сессий
2. **`scripts/switch-userbot.ts`** - утилита для переключения сессий
3. **`plugin-telegram-craft/src/plugin.ts`** - автоматически использует активную сессию при инициализации
4. **`src/characters/kolsAgent.character.ts`** - может использовать централизованный конфиг (если не задан явно)

### Приоритет загрузки сессии

1. **Высший приоритет**: `character.settings.secrets.TELEGRAM_SESSION_STRING` (если задан явно)
2. **Средний приоритет**: `process.env.TELEGRAM_SESSION_STRING` (если задан в .env)
3. **Низкий приоритет**: Централизованный конфиг `config/userbot-sessions.ts` (активная сессия)

### Переменная окружения для активной сессии

Можно задать активную сессию через переменную окружения:

```bash
export ACTIVE_USERBOT_SESSION=production
bun dev
```

## 📚 Примеры использования

### Сценарий 1: Переключение между тестом и продакшном

```bash
# Переключиться на тестовую сессию
bun scripts/switch-userbot.ts test

# Перезапустить агентов
bun dev

# ... тестирование ...

# Переключиться обратно на продакшн
bun scripts/switch-userbot.ts production

# Перезапустить агентов
bun dev
```

### Сценарий 2: Добавление нового аккаунта

1. Получи `TELEGRAM_SESSION_STRING` для нового аккаунта
2. Добавь в `config/userbot-sessions.ts`:

```typescript
new_account: {
  id: "new_account",
  name: "Новый аккаунт",
  description: "Для тестирования новых фич",
  sessionString: "1BQANOTEuMTA4LjU2LjE3OQG7hxJ0...",
},
```

3. Переключись:

```bash
bun scripts/switch-userbot.ts new_account
bun dev
```

## ⚠️ Важные замечания

1. **Всегда перезапускай агентов** после переключения сессии (`bun dev`)
2. **Не коммить `TELEGRAM_SESSION_STRING`** в публичные репозитории
3. **Проверяй активную сессию** перед важными операциями: `bun scripts/switch-userbot.ts current`
4. **Одна сессия = один аккаунт** - не используй одну сессию для нескольких аккаунтов

## 🔍 Отладка

### Проверить, какая сессия используется

```bash
bun scripts/switch-userbot.ts current
```

### Посмотреть все сессии

```bash
bun scripts/switch-userbot.ts list
```

### Проверить логи при инициализации

При запуске агентов (`bun dev`) в логах должно быть:

```
[telegram-craft] ✅ Используется активная сессия из централизованного конфига
```

## 📖 API

### TypeScript API

```typescript
import {
  getActiveSession,
  setActiveSession,
  getAllSessions,
  getSession,
  addSession,
  getActiveCredentials,
} from "../config/userbot-sessions";

// Получить активную сессию
const active = getActiveSession();

// Установить активную сессию
setActiveSession("production");

// Получить все сессии
const all = getAllSessions();

// Получить конкретную сессию
const session = getSession("production");

// Добавить новую сессию
addSession({
  id: "new",
  name: "New Session",
  sessionString: "...",
});

// Получить credentials для активной сессии
const creds = getActiveCredentials();
```

## 🎯 Преимущества

✅ **Централизация** - все сессии в одном месте  
✅ **Простота** - переключение одной командой  
✅ **Безопасность** - не нужно искать сессии по разным файлам  
✅ **Прозрачность** - видно все доступные сессии  
✅ **Гибкость** - можно задать сессию явно или через конфиг

