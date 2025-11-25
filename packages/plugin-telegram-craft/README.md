# @elizaos/plugin-telegram-craft

ElizaOS плагин для интеграции с Telegram через MTProto (GramJS) с поддержкой fallback стратегий.

## 🚀 Возможности

- **Полный мониторинг групп** - отслеживание сообщений во всех группах где аккаунт участник
- **3 стратегии подключения:**
  - **MTProto** (основная) - полный userbot функционал, производительность <250ms
  - **Bot API** (fallback) - официальный бот API через Telegraf
  - **MCP Protocol** (fallback 2) - стандартизированный протокол
- **Live Feed** - трансляция сообщений в реальном времени с цветным форматированием
- **Автоматические ответы** через LLM с контекстом последних сообщений
- **Безопасность** - фильтр по группам, триггерные слова для срочных уведомлений

## 📦 Установка

```bash
npm install @elizaos/plugin-telegram-craft
# или
pnpm add @elizaos/plugin-telegram-craft
```

## ⚙️ Конфигурация

### Переменные окружения

Добавьте в ваш `.env` файл:

```bash
# Telegram настройки (из Infisical Cloud)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string

# Настройки мониторинга
TELEGRAM_STRATEGY=mtproto  # mtproto | botapi | mcp
ALLOWED_GROUP_ID=-1001234567890  # ID группы для мониторинга
TELEGRAM_MONITORING_CHANNEL_ID=-1001234567890  # Канал для уведомлений

# Дополнительные настройки (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token  # для Bot API fallback
TELEGRAM_PHONE=+1234567890  # номер телефона для авторизации
TELEGRAM_PASSWORD=your_password  # пароль (если 2FA)
```

**Важно:** Все API ключи загружаются из Infisical Cloud, НЕ из .env файла! Смотрите раздел ниже.

### Infisical Cloud

Все секреты (API ключи, токены) должны быть в Infisical Cloud. В `.env` находятся только переменные подключения к Infisical:

```bash
INFISICAL_CLIENT_ID=your_infisical_client_id
INFISICAL_CLIENT_SECRET=your_infisical_client_secret
INFISICAL_PROJECT_ID=your_infisical_project_id
INFISICAL_ENVIRONMENT=dev  # dev | prod
NODE_ENV=development
```

## 🎮 Использование

### Подключение к агенту

```typescript
import { telegramCraftPlugin } from '@elizaos/plugin-telegram-craft';
import { Character } from '@elizaos/core';

const character: Character = {
  name: 'MyAgent',
  plugins: [
    '@elizaos/plugin-sql',
    '@elizaos/plugin-bootstrap',

    // Telegram плагин
    telegramCraftPlugin,
  ],
};
```

### Команды для управления

После подключения плагина, агенту доступны команды:

#### Мониторинг групп
```
/monitor start        - Запустить мониторинг групп
/monitor add @group   - Добавить группу в мониторинг
```

#### Работа с сообщениями
```
/dialogs              - Показать список диалогов
покажи сообщения      - Live-трансляция сообщений из групп
```

#### Отправка сообщений
```typescript
// Через runtime.actions
await runtime.actionManager.execute('SEND_TELEGRAM_MESSAGE', {
  chatId: '@username',
  message: 'Привет из ElizaOS!'
});
```

## 🔧 API Reference

### Actions

#### `SEND_TELEGRAM_MESSAGE`
Отправляет сообщение в Telegram

**Параметры:**
```typescript
{
  chatId: string;        // ID чата или username (@username)
  message: string;       // Текст сообщения
  replyTo?: string;      // ID сообщения для ответа
}
```

**Пример:**
```typescript
await runtime.actionManager.execute('SEND_TELEGRAM_MESSAGE', {
  chatId: '@my_chat',
  message: 'Привет! 👋',
});
```

#### `READ_TELEGRAM_HISTORY`
Читает историю сообщений из чата

**Параметры:**
```typescript
{
  chatId: string;
  limit?: number;        // Количество сообщений (по умолчанию 10)
  offset?: number;       // Смещение
}
```

#### `GET_TELEGRAM_DIALOGS`
Получает список всех диалогов

**Возвращает:**
```typescript
{
  chats: Array<{
    id: string;
    title: string;
    type: 'user' | 'group' | 'channel';
    unreadCount?: number;
  }>;
}
```

### Providers

#### `liveMessages`
Предоставляет последние сообщения из групп

**Использование в промптах:**
```
Недавние сообщения из групп: {{liveMessages}}
```

#### `recentMessages`
Контекст для LLM с последними сообщениями

**Использование:**
```
Контекст разговора: {{recentMessages}}
```

### Services

#### `TelegramService`

Основной сервис для работы с Telegram

**Методы:**
```typescript
// Получить сервис
const telegramService = runtime.getService<TelegramService>('telegram');

// Отправить сообщение
await telegramService.sendMessage({
  chatId: '@chat',
  message: 'text'
});

// Получить диалоги
const dialogs = await telegramService.getDialogs();

// Получить последние сообщения
const messages = await telegramService.getRecentMessages(chatId, 10);
```

## 🔐 Безопасность

### Фильтр по группам
`ALLOWED_GROUP_ID` контролирует в какие группы можно писать. Сообщения из неразрешенных групп игнорируются.

### Триггерные слова
Автоматическое обнаружение и уведомление при сообщениях с ключевыми словами:
- `help`, `помощь`, `пожаловаться`, `report`, `urgent`, `срочно`

### Токены и ключи
- **НЕ ХРАНИТЕ ключи в .env файле!**
- Все ключи должны быть в Infisical Cloud
- В .env только переменные подключения к Infisical

## 🐛 Troubleshooting

### MTProto не подключается

1. Проверьте `TELEGRAM_API_ID` и `TELEGRAM_API_HASH`
2. Убедитесь что `TELEGRAM_SESSION_STRING` корректный
3. Проверьте что аккаунт участник в группе

### Бот API fallback

Если MTProto недоступен, автоматически переключается на Bot API:

```bash
# Требуется для Bot API
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Session String

Получить session string можно через @elizaos/cli:
```bash
elizaos telegram-auth --api-id YOUR_ID --api-hash YOUR_HASH
```

### Ошибки подключения

Проверьте логи:
```typescript
// Включить debug логи
LOG_LEVEL=debug bun start
```

## 📚 Примеры

### Простой мониторинг группы

```typescript
import { telegramCraftPlugin } from '@elizaos/plugin-telegram-craft';

const myAgent = {
  name: 'GroupMonitor',
  plugins: [telegramCraftPlugin],
};

// Агент будет автоматически мониторить группу из ALLOWED_GROUP_ID
```

### Автоматические ответы

```typescript
// В character файле
const responses = [
  'Помогу с вашим вопросом!',
  'Сейчас проверю информацию...',
  'Готов ответить на вопросы по разработке!',
];

// Плагин автоматически генерирует ответы через LLM
```

## 📄 Лицензия

MIT

## 🤝 Поддержка

- [GitHub Issues](https://github.com/elizaOS/eliza/issues)
- [Telegram](https://t.me/elizaos_dev)

## 🔗 Полезные ссылки

- [ElizaOS документация](https://elizaos.github.io/eliza/)
- [MTProto документация](https://core.telegram.org/mtproto)
- [GramJS](https://github.com/grammyjs/gramjs)
- [Telegraf](https://github.com/telegraf/telegraf)

---

**Автор:** elizaOS Team
**Версия:** 1.6.5-alpha.45
**Совместимость:** @elizaos/core ^1.6.0
