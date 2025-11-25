# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
# Система мониторинга и управления Telegram-ботами

**Версия:** 1.0
**Дата:** 2025-11-24
**Язык разработки:** TypeScript
**Фреймворк:** ElizaOS Plugin

---

## 1. ОБЩЕЕ ОПИСАНИЕ ПРОЕКТА

### 1.1 Назначение системы
Система представляет собой плагин для ElizaOS, обеспечивающий:
- Мониторинг и анализ сообщений в Telegram-чатах
- Поддержку множественных протоколов подключения к Telegram
- Обработку входящих сообщений в реальном времени
- Аналитику активности пользователей и чатов

### 1.2 Целевая аудитория
- Разработчики телеграм-ботов
- Аналитические агентства
- SMM-специалисты
- Системные администраторы

---

## 2. АРХИТЕКТУРА СИСТЕМЫ

### 2.1 Основные компоненты

```
┌─────────────────────────────────────────┐
│           TELEGRAM SERVICE              │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐   │
│  │  BotAPI      │  │   MTProto    │   │
│  │  Adapter     │  │   Adapter    │   │
│  └──────────────┘  └──────────────┘   │
│         │                │             │
│  ┌──────────────┐  ┌──────────────┐   │
│  │     MCP      │  │   Memory     │   │
│  │  Adapter     │  │   Storage    │   │
│  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────┘
```

### 2.2 Ключевые модули

#### **TelegramService** (Основной сервис)
- Управление всеми адаптерами
- Координация обработки сообщений
- Управление состоянием мониторинга
- Логирование активности

#### **Адаптеры подключения:**
1. **BotAPI Adapter** - для webhook/polling режимов
2. **MTProto Adapter** - для работы через MTProto API
3. **MCP Adapter** - для интеграции с MCP (Model Context Protocol)

#### **Мониторинг:**
- Отслеживание активности в чатах
- Фильтрация сообщений по критериям
- Сбор аналитических данных

---

## 3. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 3.1 Основной функционал

#### **FR-1: Поддержка множественных протоколов**
- ✅ Реализация BotAPI адаптера
- ✅ Реализация MTProto адаптера
- ✅ Реализация MCP адаптера
- ✅ Автоматическое переключение между протоколами
- ✅ Fallback-механизмы при сбоях

#### **FR-2: Мониторинг сообщений**
- ✅ Перехват входящих сообщений из всех подключенных чатов
- ✅ Парсинг метаданных сообщения (chatId, chatTitle, sender, messageId)
- ✅ Извлечение текста сообщения для анализа
- ✅ Сохранение в память (опционально)

#### **FR-3: Обработка сообщений**
- ✅ Вызов обработчиков при получении сообщения
- ✅ Валидация входящих данных
- ✅ Маршрутизация к соответствующим адаптерам
- ✅ Асинхронная обработка без блокировок

#### **FR-4: Логирование и мониторинг**
- ✅ Детальное логирование всех операций
- ✅ Уровни логирования (DEBUG, INFO, WARN, ERROR)
- ✅ Трассировка обработки сообщений
- ✅ Мониторинг состояния адаптеров

### 3.2 Дополнительный функционал

#### **FR-5: Управление состоянием**
- ✅ Включение/выключение мониторинга
- ✅ Получение статуса активных чатов
- ✅ Кэширование метаданных чатов
- ✅ Управление подключениями

#### **FR-6: Аналитика**
- ✅ Подсчет сообщений по чатам
- ✅ Активность пользователей
- ✅ Временная аналитика
- ✅ Экспорт данных (опционально)

---

## 4. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### 4.1 Стек технологий

**Обязательные:**
- **TypeScript** - строгая типизация
- **ElizaOS Plugin Framework** - базовый фреймворк
- **Node.js** - среда выполнения (v18+)
- **Bun** - пакетный менеджер и рантайм

**Зависимости:**
- `@elizaos/core` - ядро фреймворка
- `telegraf` - для BotAPI (webhook/polling режимы)
- `telegram` (GramJS) - для MTProto (основной протокол)
- `@mtproto/core` - альтернативная MTProto библиотека
- `@tgsnake/core` - для расширенных возможностей Telegram
- `sqlite3` / `postgres` - для хранения данных
- `pino` / `winston` - для логирования

### 4.2 Архитектурные принципы

1. **Модульность** - каждый адаптер - отдельный модуль
2. **Расширяемость** - легко добавлять новые адаптеры
3. **Отказоустойчивость** - обработка ошибок на всех уровнях
4. **Производительность** - асинхронная обработка, кэширование
5. **Логирование** - подробные логи на каждом этапе

### 4.3 Требования к производительности

- **Пропускная способность:** обработка 1000+ сообщений/минуту
- **Задержка:** < 100ms на обработку сообщения
- **Доступность:** 99.9% uptime
- **Память:** контролируемое потребление, очистка кэшей

---

## 5. СТРУКТУРА ПРОЕКТА

### 5.1 Каталоги и файлы

```
src/
├── 📂 adapters/                    # Адаптеры подключения
│   ├── botapi.adapter.ts          # BotAPI адаптер
│   ├── mtproto.adapter.ts         # MTProto адаптер
│   ├── mcp.adapter.ts             # MCP адаптер
│   └── index.ts                   # Экспорт адаптеров
│
├── 📂 services/                   # Сервисы
│   ├── telegram.service.ts        # Основной Telegram сервис
│   ├── monitoring.service.ts      # Сервис мониторинга
│   ├── analytics.service.ts       # Сервис аналитики
│   └── index.ts
│
├── 📂 types/                      # TypeScript типы
│   ├── telegram.types.ts          # Типы для Telegram
│   ├── adapter.types.ts           # Типы для адаптеров
│   ├── message.types.ts           # Типы сообщений
│   └── index.ts
│
├── 📂 utils/                      # Утилиты
│   ├── logger.utils.ts            # Логгер
│   ├── parser.utils.ts            # Парсер сообщений
│   ├── validator.utils.ts         # Валидаторы
│   └── index.ts
│
├── 📄 index.ts                    # Главный экспорт плагина
└── 📄 plugin.ts                   # Конфигурация плагина
```

### 5.2 Ключевые интерфейсы

```typescript
// types/telegram.types.ts
interface TelegramMessage {
  chatId: string | number;
  chatTitle?: string;
  sender: string | number;
  messageId: number;
  text?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface TelegramChat {
  id: string | number;
  title: string;
  type: 'group' | 'supergroup' | 'channel' | 'private';
  membersCount?: number;
  isActive: boolean;
  lastMessageAt?: number;
}

interface MonitoringConfig {
  enabled: boolean;
  monitoredChats: (string | number)[];
  filters: {
    keywords?: string[];
    excludeKeywords?: string[];
    onlyFromUsers?: (string | number)[];
  };
}
```

---

## 6. РЕАЛИЗАЦИЯ АДАПТЕРОВ

### 6.1 BotAPI Adapter

**Назначение:** Работа через Telegram Bot API

**Основные методы:**
```typescript
class BotAPIAdapter {
  async initialize(config: BotAPIConfig): Promise<void>
  async startPolling(): Promise<void>
  async handleUpdate(update: TelegramUpdate): Promise<void>
  async sendMessage(chatId: string, text: string): Promise<void>
  async getChat(chatId: string): Promise<TelegramChat>
}
```

**Конфигурация:**
```typescript
interface BotAPIConfig {
  botToken: string;
  pollingTimeout?: number;
  allowedUpdates?: string[];
  webhookUrl?: string;
}
```

### 6.2 MTProto Adapter (GramJS)

**Назначение:** Работа через MTProto API с использованием GramJS

**Преимущества GramJS:**
- 🚀 **Высокая производительность** - < 250ms задержка
- 👥 **Полный userbot функционал** - как обычный пользователь
- 📡 **Прослушивание всех сообщений** - во ВСЕХ группах где аккаунт участник
- 🔧 **TypeScript native** - строгая типизация из коробки
- 📚 **Зрелая кодовая база** - fork популярной библиотеки Telethon
- 🎯 **Rich API** - доступ к всем возможностям Telegram
- ⚡ **Event-driven** - обработка событий в реальном времени

**Сравнение с альтернативами:**

| Библиотека       | Производительность | Типизация | Возможности         | Подходит для |
|------------------|--------------------|-----------|---------------------|--------------|
| **GramJS**       | ⭐⭐⭐⭐⭐ (250ms)    | ⭐⭐⭐⭐⭐  | Userbot + Admin     | Production   |
| @mtproto/core    | ⭐⭐⭐ (500ms)      | ⭐⭐⭐     | Userbot             | Dev/Testing  |
| Telegraf (Bot)   | ⭐⭐ (1000ms)       | ⭐⭐⭐     | Только Bot API      | Bots only    |

**Основные возможности:**
- Полный userbot функционал
- Прослушивание ВСЕХ сообщений во ВСЕХ группах
- Производительность < 250ms
- TypeScript native
- Зрелая кодовая база (fork Telethon)

**Основные методы:**
```typescript
class MTProtoAdapter {
  private client: TelegramClient;  // Из GramJS
  private session: StringSession;

  async connect(config: ITelegramConfig): Promise<void>
  async joinChat(chatId: string): Promise<void>
  onMessage(handler: (event: NewMessageEvent) => void): void
  offMessage(handler: (event: NewMessageEvent) => void): void
  async getChatHistory(chatId: string, limit?: number): Promise<TelegramMessage[]>
}
```

**Пример использования GramJS:**
```typescript
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";

const session = new StringSession(config.session || "");
const client = new TelegramClient(session, config.apiId, config.apiHash, {
  connectionRetries: 5,
  deviceModel: "Desktop",
  appVersion: "1.0.0",
  systemVersion: "NodeJS",
  langCode: "en",
});

// Прослушивание всех сообщений
client.addEventHandler(async (event: NewMessageEvent) => {
  const message = event.message;
  const chat = await message.getChat();
  const sender = await message.getSender();

  console.log(`💬 Chat: ${chat.title}, From: ${sender.firstName}`);
}, new NewMessage({}));
```

### 6.3 MCP Adapter

**Назначение:** Интеграция с MCP (Model Context Protocol)

**Основные методы:**
```typescript
class MCPAdapter {
  async connect(endpoint: string): Promise<void>
  async sendContext(context: TelegramMessage): Promise<void>
  async requestAnalysis(messageId: string): Promise<AnalysisResult>
}
```

---

## 7. СЕРВИС МОНИТОРИНГА

### 7.1 Основной функционал

```typescript
class MonitoringService {
  // Управление мониторингом
  startMonitoring(): void
  stopMonitoring(): void
  isMonitoringActive(): boolean

  // Добавление/удаление чатов
  addChatToMonitor(chatId: string | number): void
  removeChatFromMonitor(chatId: string | number): void
  getMonitoredChats(): TelegramChat[]

  // Обработка сообщений
  processIncomingMessage(message: TelegramMessage): Promise<void>
  shouldProcessMessage(message: TelegramMessage): boolean

  // Аналитика
  getChatStats(chatId: string): ChatStats
  getOverallStats(): OverallStats
}
```

### 7.2 Фильтрация сообщений

```typescript
interface MessageFilter {
  includeKeywords?: string[];     // Включить только с этими словами
  excludeKeywords?: string[];     // Исключить с этими словами
  onlyFromUsers?: string[];       // Только от этих пользователей
  minMessageLength?: number;      // Минимальная длина
  maxMessageLength?: number;      // Максимальная длина
}
```

---

## 8. ЛОГИРОВАНИЕ

### 8.1 Уровни логирования

- **DEBUG** - Детальная информация о работе
- **INFO** - Общая информация о событиях
- **WARN** - Предупреждения о потенциальных проблемах
- **ERROR** - Ошибки, требующие внимания

### 8.2 Формат логов

```json
{
  "timestamp": "2025-11-24T12:00:00.000Z",
  "level": "INFO",
  "service": "TelegramService",
  "adapter": "BotAPI",
  "messageId": "12345",
  "chatId": "1165767969",
  "message": "Processing incoming message",
  "metadata": {
    "chatTitle": "Биржа IT I Удаленка/Офис",
    "sender": "7043969066"
  }
}
```

---

## 9. БАЗА ДАННЫХ

### 9.1 Схема данных

**Таблица: telegram_messages**
```sql
CREATE TABLE telegram_messages (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL,
  chat_title VARCHAR(255),
  message_id BIGINT NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  text TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

**Таблица: telegram_chats**
```sql
CREATE TABLE telegram_chats (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  type VARCHAR(50),
  member_count INTEGER,
  is_monitored BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Таблица: analytics**
```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  messages_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  metadata JSONB
);
```

---

## 10. API ИНТЕРФЕЙСЫ

### 10.1 Внутренний API (для плагинов)

```typescript
// Получение сервиса
const telegramService = runtime.getService<TelegramService>('telegram');

// Методы сервиса
telegramService.sendMessage(chatId, text);
telegramService.getChatStats(chatId);
telegramService.getMonitoredChats();
telegramService.startMonitoring();
telegramService.stopMonitoring();
```

### 10.2 HTTP API (опционально)

```typescript
// Статус мониторинга
GET /api/telegram/status
Response: { "monitoring": true, "chatsCount": 5 }

// Список чатов
GET /api/telegram/chats
Response: { "chats": [...] }

// Статистика чата
GET /api/telegram/stats/:chatId
Response: { "messages": 100, "users": 10, "period": "24h" }

// Обновить мониторинг
POST /api/telegram/monitoring
Body: { "enabled": true, "chats": ["123", "456"] }
```

---

## 11. КОНФИГУРАЦИЯ

### 11.1 Переменные окружения

```bash
# ОБЯЗАТЕЛЬНЫЕ
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=your_phone_number
TELEGRAM_SESSION_STRING=your_session_string

# ОПЦИОНАЛЬНЫЕ
TELEGRAM_MONITORING_ENABLED=true
TELEGRAM_LOG_LEVEL=info
TELEGRAM_DATABASE_URL=postgresql://user:pass@localhost:5432/telegram
TELEGRAM_MAX_MESSAGES_PER_MINUTE=1000
TELEGRAM_CACHE_TTL=3600
```

### 11.2 Конфигурационный файл

```typescript
// config/telegram.config.ts
export const telegramConfig = {
  adapters: {
    botapi: {
      enabled: true,
      token: process.env.TELEGRAM_BOT_TOKEN,
      pollingTimeout: 50,
      allowedUpdates: ['message', 'edited_message']
    },
    mtproto: {
      enabled: true,
      apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
      apiHash: process.env.TELEGRAM_API_HASH,
      phoneNumber: process.env.TELEGRAM_PHONE,
      sessionString: process.env.TELEGRAM_SESSION_STRING
    }
  },
  monitoring: {
    enabled: process.env.TELEGRAM_MONITORING_ENABLED === 'true',
    monitoredChats: [], // Заполняется динамически
    filters: {
      minMessageLength: 1,
      maxMessageLength: 4096
    }
  },
  database: {
    url: process.env.TELEGRAM_DATABASE_URL,
    tablePrefix: 'telegram_'
  },
  logging: {
    level: process.env.TELEGRAM_LOG_LEVEL || 'info',
    format: 'json'
  }
};
```

---

## 12. УСТАНОВКА И ЗАПУСК

### 12.1 Зависимости

```bash
# Установка Bun (если не установлен)
curl -fsSL https://bun.sh/install | bash

# Инициализация проекта
bun init

# Установка зависимостей
bun add @elizaos/core
bun add telegraf                # BotAPI (webhook/polling)
bun add telegram                # GramJS (MTProto) - основной пакет
bun add @mtproto/core          # Альтернативная MTProto библиотека
bun add @tgsnake/core          # Расширенные возможности Telegram
bun add pg                      # PostgreSQL драйвер
bun add pino                    # Логгер

# Dev зависимости
bun add -D typescript @types/node
```

**Ключевые пакеты для Telegram:**

| Пакет            | Версия    | Назначение                              |
|-----------------|-----------|------------------------------------------|
| `telegram`      | ^2.26.22  | **GramJS** - основная MTProto библиотека |
| `telegraf`      | ^4.16.3   | BotAPI для webhook/polling               |
| `@mtproto/core` | ^6.3.0    | Альтернатива MTProto                    |
| `@tgsnake/core` | ^1.13.15  | Дополнительные возможности              |

### 12.2 Сборка

```bash
# Компиляция TypeScript
bun run build

# Запуск в dev режиме
bun run dev

# Запуск тестов
bun test
```

### 12.3 Деплой

```bash
# Сборка для production
NODE_ENV=production bun run build

# Запуск
bun start
```

---

## 13. ТЕСТИРОВАНИЕ

### 13.1 Unit тесты

```typescript
// tests/adapters/botapi.test.ts
describe('BotAPIAdapter', () => {
  it('should initialize successfully', async () => {
    const adapter = new BotAPIAdapter();
    await adapter.initialize({ botToken: 'test_token' });
    expect(adapter.isConnected()).toBe(true);
  });

  it('should handle incoming messages', async () => {
    // Тест обработки сообщений
  });
});
```

### 13.2 Integration тесты

```typescript
// tests/integration/telegram-service.test.ts
describe('TelegramService Integration', () => {
  it('should monitor chat and process messages', async () => {
    // Полный сценарий тестирования
  });
});
```

### 13.3 E2E тесты

```typescript
// tests/e2e/monitoring-flow.test.ts
describe('Monitoring Flow E2E', () => {
  it('should receive and process real messages', async () => {
    // Тестирование через реальный Telegram
  });
});
```

---

## 14. ДОКУМЕНТАЦИЯ

### 14.1 Обязательная документация

- **README.md** - краткое описание, установка, запуск
- **API.md** - подробное описание API
- **ARCHITECTURE.md** - архитектура системы
- **GUIDES.md** - руководства по использованию
- **CHANGELOG.md** - история изменений

### 14.2 JSDoc комментарии

```typescript
/**
 * Обрабатывает входящее сообщение из Telegram
 * @param message - Объект сообщения с метаданными
 * @param adapter - Адаптер, от которого получено сообщение
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * const message = {
 *   chatId: "123456",
 *   text: "Hello World",
 *   sender: "987654"
 * };
 * await telegramService.handleIncomingMessage(message, 'botapi');
 * ```
 */
async handleIncomingMessage(
  message: TelegramMessage,
  adapter: string
): Promise<void>
```

---

## 15. БЕЗОПАСНОСТЬ

### 15.1 Требования безопасности

1. **Хранение токенов:**
   - Использовать переменные окружения
   - Не хранить токены в коде
   - Использовать секрет-менеджеры (HashiCorp Vault, AWS Secrets Manager)

2. **Валидация входных данных:**
   - Всегда валидировать входящие сообщения
   - Проверять типы данных
   - Ограничивать размер сообщений

3. **Защита от атак:**
   - Rate limiting для API вызовов
   - Защита от SQL injection (использовать ORM)
   - Санитизация пользовательского ввода

4. **Шифрование:**
   - Шифровать session strings
   - Использовать HTTPS для webhook
   - Шифровать данные в БД (опционально)

### 15.2 Пример валидации

```typescript
function validateTelegramMessage(message: any): message is TelegramMessage {
  return (
    typeof message === 'object' &&
    typeof message.chatId !== 'undefined' &&
    typeof message.sender !== 'undefined' &&
    typeof message.messageId !== 'undefined' &&
    (!message.text || typeof message.text === 'string')
  );
}
```

---

## 16. ПРОИЗВОДИТЕЛЬНОСТЬ И МАСШТАБИРОВАНИЕ

### 16.1 Оптимизация

1. **Кэширование:**
   - Кэшировать метаданные чатов
   - Кэшировать результаты аналитики
   - TTL для кэшей

2. **База данных:**
   - Индексы на часто используемые поля
   - Партиционирование таблиц по дате
   - Регулярная очистка старых данных

3. **Очереди:**
   - Использовать очередь для асинхронной обработки
   - BullMQ или Redis Queue
   - Приоритетные очереди для критичных сообщений

### 16.2 Масштабирование

```typescript
// Горизонтальное масштабирование
interface LoadBalancerConfig {
  adapters: {
    botapi: BotAPIInstance[];
    mtproto: MTProtoInstance[];
  };
  healthCheckInterval: number;
  maxFailures: number;
}
```

---

## 17. МОНИТОРИНГ И АЛЕРТЫ

### 17.1 Метрики

- Количество обработанных сообщений
- Время обработки сообщения
- Количество ошибок
- Активность чатов
- Состояние адаптеров

### 17.2 Алерты

- Падение адаптера
- Превышение лимита сообщений
- Ошибки базы данных
- Задержки в обработке

---

## 18. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### 18.1 Базовое подключение

```typescript
import { TelegramService } from './services/telegram.service';

const service = new TelegramService();

// Инициализация
await service.initialize({
  botToken: 'YOUR_BOT_TOKEN',
  apiId: 123456,
  apiHash: 'your_api_hash'
});

// Запуск мониторинга
service.startMonitoring();

// Обработка событий
service.on('message', (message) => {
  console.log('Новое сообщение:', message.text);
});
```

### 18.2 Фильтрация сообщений

```typescript
const monitoringConfig: MonitoringConfig = {
  enabled: true,
  monitoredChats: ['123456789', '-987654321'],
  filters: {
    keywords: ['важно', 'urgent'],
    excludeKeywords: ['спам'],
    minMessageLength: 10
  }
};

service.configureMonitoring(monitoringConfig);
```

---

## 19. ROADMAP И РАЗВИТИЕ

### 19.1 Версия 1.0 (Текущая)
- ✅ Базовая функциональность
- ✅ BotAPI, MTProto, MCP адаптеры
- ✅ Мониторинг сообщений
- ✅ Логирование

### 19.2 Версия 1.1 (Планируемая)
- [ ] WebSocket поддержка
- [ ] Расширенная аналитика
- [ ] Экспорт данных в различные форматы
- [ ] Веб-интерфейс для управления

### 19.3 Версия 1.2 (Будущая)
- [ ] ML классификация сообщений
- [ ] Автоматические ответы
- [ ] Интеграция с внешними сервисами
- [ ] Мультиязычность

---

## 20. ЗАКЛЮЧЕНИЕ

Данное техническое задание описывает полнофункциональную систему мониторинга и управления Telegram-ботами. Система построена на модульной архитектуре, обеспечивает высокую производительность и расширяемость.

**Ключевые преимущества:**
- ✅ Поддержка множественных протоколов
- ✅ Высокая производительность
- ✅ Подробное логирование
- ✅ Масштабируемость
- ✅ Безопасность
- ✅ Простота интеграции

**Для начала работы:**
1. Создайте проект на TypeScript
2. Установите зависимости из раздела 12.1
3. Реализуйте структуру из раздела 5.1
4. Используйте примеры из разделов 7-10
5. Следуйте требованиям безопасности из раздела 15

---

**© 2025 Telegram Monitoring System**