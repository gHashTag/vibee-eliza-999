# 📘 Руководство по созданию новых агентов VIBEE

## 🎯 Обзор

Данное руководство содержит пошаговые инструкции по созданию новых агентов на базе успешного опыта разработки KOLS агента. Это **ПОЛНОЕ РУКОВОДСТВО** для создания Telegram-агентов с LLM интеграцией.

---

## 📋 Содержание

1. [Подготовка окружения](#подготовка-окружения)
2. [Создание персонажа](#создание-персонажа)
3. [Создание плагина](#создание-плагина)
4. [Настройка LLM интеграции](#настройка-llm-интеграции)
5. [Telegram интеграция](#telegram-интеграция)
6. [Тестирование](#тестирование)
7. [Запуск агента](#запуск-агента)
8. [Мониторинг и отладка](#мониторинг-и-отладка)
9. [Типичные проблемы и решения](#типичные-проблемы-и-решения)

---

## 🔧 Подготовка окружения

### Шаг 1: Проверка зависимостей

```bash
# Проверить Node.js версию (требуется 18+)
node --version

# Проверить Bun (основной пакетный менеджер)
bun --version

# Если Bun не установлен:
npm install -g bun
```

### Шаг 2: Настройка переменных окружения

Создать файл `.env` в корне проекта:

```bash
# 🔐 Infisical Cloud-First Configuration (ОБЯЗАТЕЛЬНО!)
INFISICAL_CLIENT_ID=<ваш-client-id>
INFISICAL_CLIENT_SECRET=<ваш-client-secret>
INFISICAL_PROJECT_ID=<ваш-project-id>
INFISICAL_ENVIRONMENT=dev

# 🧠 LLM Конфигурация (загружается из Infisical)
# OPENROUTER_API_KEY=<будет загружен из Infisical>
# ANTHROPIC_API_KEY=<опционально>

# 📱 Telegram API (загружается из Infisical)
# TELEGRAM_BOT_TOKEN=<будет загружен из Infisical>
# TELEGRAM_API_ID=<будет загружен из Infisical>
# TELEGRAM_API_HASH=<будет загружен из Infisical>
# TELEGRAM_SESSION_STRING=<будет загружен из Infisical>

# 🗄️ База данных (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_ADAPTER=postgres

# 🏷️ Версия проекта
NODE_ENV=development
PORT=3000
```

**⚠️ ВАЖНО:**
- НИКОГДА не добавляйте API ключи напрямую в `.env`
- Все ключи загружаются из Infisical Cloud
- В `.env` только Infisical credentials + минимальные настройки

### Шаг 3: Установка зависимостей

```bash
# Установить все зависимости
bun install

# Проверить что установлено
bun run --silent
```

---

## 👤 Создание персонажа

### Шаг 1: Создание файла персонажа

Создать `characters/MyAgent.json`:

```json
{
  "name": "MyAgent",
  "username": "myagent",
  "description": "Мой новый агент для работы с Telegram",
  "version": "1.0.0",
  "system": "Ты полезный ИИ-ассистент. Отвечай на русском языке.",
  "bio": [
    "Опытный ИИ-ассистент для Telegram",
    "Помогаю пользователям с вопросами",
    "Генерирую уникальные ответы через LLM"
  ],
  "style": {
    "all": [
      "Будь полезным и дружелюбным",
      "Используй четкий и понятный язык",
      "Отвечай на русском языке"
    ],
    "chat": [
      "Отвечай естественно и информативно",
      "Задавай уточняющие вопросы при необходимости"
    ]
  },
  "messageExamples": [
    [
      {
        "name": "user",
        "content": {
          "text": "Привет! Как дела?"
        }
      },
      {
        "name": "MyAgent",
        "content": {
          "text": "Привет! У меня всё отлично, спасибо! Готов помочь тебе с любыми вопросами. Как дела у тебя?"
        }
      }
    ]
  ],
  "plugins": [
    "@elizaos/plugin-bootstrap",
    "@elizaos/plugin-sql",
    "openrouter",
    "plugin-myagent"
  ],
  "settings": {
    "voice": "ru-RU-Neural2-B",
    "model": "anthropic/claude-3.5-sonnet",
    "embeddingModel": "text-embedding-3-small",
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

### Шаг 2: Импорт персонажа в код

Создать `src/characters/myagent.ts`:

```typescript
import { Character } from '@elizaos/core';

export const myAgentCharacter: Character = {
  name: 'MyAgent',
  username: 'myagent',
  description: 'Мой новый агент для работы с Telegram',
  version: '1.0.0',

  system: `Ты MyAgent - полезный ИИ-ассистент.

Основные принципы:
- Всегда старайся предоставить точную и полезную информацию
- Будь вежливым и учитывающим во всех взаимодействиях
- Признавай, когда не знаешь что-то
- Задавай уточняющие вопросы, когда запросы неясны`,

  bio: [
    'Опытный ИИ-ассистент для Telegram',
    'Помогаю пользователям с вопросами',
    'Генерирую уникальные ответы через LLM'
  ],

  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    'openrouter',
    'plugin-myagent'
  ],

  settings: {
    voice: 'ru-RU-Neural2-B',
    model: 'anthropic/claude-3.5-sonnet',
    embeddingModel: 'text-embedding-3-small',
    temperature: 0.7,
    maxTokens: 500
  },
};

export default myAgentCharacter;
```

---

## 🔌 Создание плагина

### Шаг 1: Структура плагина

Создать папку `plugin-myagent/`:

```
plugin-myagent/
├── src/
│   ├── services/
│   │   ├── MyAgentTelegramService.ts    # Основной сервис
│   │   └── MyAgentLLMService.ts         # LLM интеграция
│   ├── actions/
│   │   └── MyAgentAction.ts             # Обработчики команд
│   ├── providers/
│   │   └── MyAgentProvider.ts           # Контекстные данные
│   └── index.ts                         # Экспорт плагина
├── package.json
└── tsconfig.json
```

### Шаг 2: Основной сервис Telegram

Создать `plugin-myagent/src/services/MyAgentTelegramService.ts`:

```typescript
import { Service, IAgentRuntime } from '@elizaos/core';
import { Client } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram/client/TelegramClient';
import { NewMessage } from 'telegram/events/NewMessage';
import { NewMessageEvent } from 'telegram/events/NewMessage';

export class MyAgentTelegramService extends Service {
  static serviceType = 'myagent-telegram';

  private client: TelegramClient | null = null;
  private isInitialized: boolean = false;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🤖 [MyAgent] Инициализация MTProto...');

      const apiId = parseInt(runtime.getSetting('TELEGRAM_API_ID') || '0');
      const apiHash = runtime.getSetting('TELEGRAM_API_HASH');
      const sessionString = runtime.getSetting('TELEGRAM_SESSION_STRING');

      if (!apiId || !apiHash || !sessionString) {
        console.error('❌ [MyAgent] Отсутствуют необходимые переменные окружения');
        return;
      }

      // Настройка MTProto клиента
      this.client = new TelegramClient(
        new StringSession(sessionString),
        apiId,
        apiHash,
        {
          connectionRetries: 5,
        }
      );

      // Подключение к Telegram
      await this.client.connect();
      console.log('✅ [MyAgent] MTProto подключен!');

      // Настройка обработчика сообщений
      await this.client.addEventHandler(
        this.onNewMessage.bind(this),
        new NewMessage({})
      );

      this.isInitialized = true;
      console.log('✅ [MyAgent] Готов к работе!');

    } catch (error) {
      console.error('❌ [MyAgent] Ошибка инициализации:', error);
    }
  }

  private async onNewMessage(event: NewMessageEvent): Promise<void> {
    try {
      const message = event.message;
      const chat = await event.getChat();
      const sender = await event.getSender();

      if (!chat || !message || !message.text) {
        return;
      }

      // Фильтр целевых групп (ВАЖНО!)
      const targetGroups = ['<ID_ВАШЕЙ_ГРУППЫ>']; // Список ID целевых групп

      if (!targetGroups.includes(chat.id.toString())) {
        return; // Игнорируем нецелевые группы
      }

      // Проверка что сообщение не от бота
      if (sender && sender.id && sender.id.toString() === runtime.getSetting('TELEGRAM_BOT_USER_ID')) {
        return;
      }

      // Обработка входящего сообщения
      const messageText = message.text.trim();

      // Проверка что сообщение не команда (можно добавить обработку команд)
      if (messageText.startsWith('/')) {
        return;
      }

      console.log(`📨 [MyAgent] Получено сообщение: "${messageText}"`);

      // Генерация ответа через LLM
      const llmService = runtime.getService<MyAgentLLMService>('myagent-llm');
      if (llmService) {
        await llmService.generateAndSendReply({
          chatId: chat.id.toString(),
          chatTitle: chat.title || 'Unknown',
          fromUserId: sender?.id?.toString() || 'unknown',
          fromFirstName: sender?.firstName || 'Unknown',
          messageText: messageText,
          messageId: message.id.toString(),
        });
      }

    } catch (error) {
      console.error('❌ [MyAgent] Ошибка обработки сообщения:', error);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.client || !this.isInitialized) {
      console.error('❌ [MyAgent] Клиент не инициализирован');
      return;
    }

    try {
      await this.client.sendMessage(chatId, {
        message: text,
      });
      console.log(`✅ [MyAgent] Сообщение отправлено в ${chatId}`);
    } catch (error) {
      console.error('❌ [MyAgent] Ошибка отправки сообщения:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isInitialized = false;
      console.log('🔌 [MyAgent] MTProto отключен');
    }
  }
}
```

### Шаг 3: LLM сервис

Создать `plugin-myagent/src/services/MyAgentLLMService.ts`:

```typescript
import { Service, IAgentRuntime } from '@elizaos/core';

interface MyAgentMessage {
  chatId: string;
  chatTitle: string;
  fromUserId: string;
  fromFirstName: string;
  messageText: string;
  messageId: string;
}

export class MyAgentLLMService extends Service {
  static serviceType = 'myagent-llm';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async generateAndSendReply(message: MyAgentMessage): Promise<void> {
    try {
      console.log(`🤖 [MyAgentLLM] Генерирую ответ для ${message.fromFirstName}...`);

      // Формируем системный промпт
      const systemPrompt = `Ты MyAgent - полезный ИИ-ассистент.

Пользователь написал: "${message.messageText}"

Твоя задача: Ответить на русском языке как полезный наставник.
- Будь дружелюбным и информативным
- Используй четкий и понятный язык
- Избегай излишних приветствий
- Если вопрос неясен - задай уточняющие вопросы`;

      // Генерируем ответ через LLM
      const response = await runtime.useModel('TEXT_SMALL', {
        prompt: systemPrompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      const replyText = response?.trim();

      if (!replyText) {
        console.error('❌ [MyAgentLLM] Пустой ответ от LLM');
        return;
      }

      console.log(`✅ [MyAgentLLM] Ответ сгенерирован: "${replyText.substring(0, 50)}..."`);

      // Отправляем ответ
      const telegramService = runtime.getService<MyAgentTelegramService>('myagent-telegram');
      if (telegramService) {
        await telegramService.sendMessage(message.chatId, replyText);
      }

    } catch (error) {
      console.error('❌ [MyAgentLLM] Ошибка генерации ответа:', error);
      // НЕ отправляем fallback сообщения!
    }
  }
}
```

### Шаг 4: Экспорт плагина

Создать `plugin-myagent/src/index.ts`:

```typescript
import { Plugin } from '@elizaos/core';
import { MyAgentTelegramService } from './services/MyAgentTelegramService';
import { MyAgentLLMService } from './services/MyAgentLLMService';

export const myAgentPlugin: Plugin = {
  name: 'plugin-myagent',
  description: 'MyAgent - Telegram бот с LLM интеграцией',
  services: [
    MyAgentTelegramService,
    MyAgentLLMService,
  ],
  priority: 0,
};

export { MyAgentTelegramService } from './services/MyAgentTelegramService';
export { MyAgentLLMService } from './services/MyAgentLLMService';

export default myAgentPlugin;
```

### Шаг 5: package.json плагина

Создать `plugin-myagent/package.json`:

```json
{
  "name": "plugin-myagent",
  "version": "1.0.0",
  "description": "MyAgent - Telegram бот с LLM интеграцией",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "echo \"No tests specified\" && exit 0",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@elizaos/core": "^1.6.4",
    "telegram": "^2.26.21"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4"
  }
}
```

---

## 🧠 Настройка LLM интеграции

### Шаг 1: Выбор LLM провайдера

В VIBEE используется **OpenRouter** как основной LLM провайдер:

```bash
# В Infisical должен быть настроен:
OPENROUTER_API_KEY=sk-or-v1-<ваш-ключ>
```

### Шаг 2: Конфигурация в персонаже

В файле персонажа `characters/MyAgent.json`:

```json
{
  "settings": {
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**Доступные модели:**
- `anthropic/claude-3.5-sonnet` - для сложных задач
- `anthropic/claude-3-haiku` - быстрая и экономная
- `openai/gpt-4o-mini` - быстрые ответы
- `meta-llama/llama-3.1-8b-instruct:free` - бесплатная

### Шаг 3: Использование в сервисе

```typescript
// В MyAgentLLMService.ts
const response = await runtime.useModel('TEXT_SMALL', {
  prompt: systemPrompt,
  maxTokens: 200,
  temperature: 0.7,
});

// TEXT_SMALL - для текстовых ответов
// TEXT_LARGE - для длинных ответов
// IMAGE - для генерации изображений
```

---

## 📱 Telegram интеграция

### Шаг 1: Создание бота

1. Написать @BotFather в Telegram
2. Отправить команду `/newbot`
3. Выбрать имя и username
4. Сохранить `BOT_TOKEN`

### Шаг 2: Получение API ключей

1. Перейти на https://my.telegram.org
2. Войти под своим аккаунтом
3. Перейти в "API development tools"
4. Создать новое приложение:
   - Platform: Desktop
   - Title: MyAgent
   - Short name: myagent
5. Сохранить `API_ID` и `API_HASH`

### Шаг 3: Получение session string

```typescript
// Временный скрипт для получения session string
import { TelegramClient } from 'telegram/client/TelegramClient';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';

const session = new StringSession('');
const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => await input('Введите номер телефона:'),
  phoneCode: async () => await input('Введите код из SMS:'),
  password: async () => await input('Введите пароль:'),
});

console.log('SESSION STRING:', session.save());
```

### Шаг 4: Добавление в Infisical

Добавить в Infisical переменные:
- `TELEGRAM_BOT_TOKEN` = токен бота
- `TELEGRAM_API_ID` = ID приложения
- `TELEGRAM_API_HASH` = Hash приложения
- `TELEGRAM_SESSION_STRING` = строка сессии

### Шаг 5: Настройка фильтра групп

```typescript
// В MyAgentTelegramService.ts
const targetGroups = [
  '2643951085',      // ID первой группы
  '2298297094',      // ID второй группы
  '-1002643951085',  // ID супергруппы (с префиксом -100)
];

// Проверка:
if (!targetGroups.includes(chatId)) {
  console.log(`[SKIP] Group ${chatId} not in target list - skipping`);
  return;
}
```

**Как узнать ID группы:**
1. Добавить бота в группу
2. Написать любое сообщение
3. Открыть логи: `tail -f logs/myagent.log | grep "chat.*id"`
4. Найти строку с `chat?.id = <число>`

---

## 🧪 Тестирование

### Шаг 1: Юнит-тесты

Создать `src/__tests__/MyAgentService.test.ts`:

```typescript
import { MyAgentLLMService } from '../services/MyAgentLLMService';
import { IAgentRuntime } from '@elizaos/core';

describe('MyAgentLLMService', () => {
  let service: MyAgentLLMService;
  let runtime: IAgentRuntime;

  beforeEach(() => {
    runtime = {
      getSetting: jest.fn(),
      useModel: jest.fn().mockResolvedValue('Тестовый ответ от LLM'),
    } as any;

    service = new MyAgentLLMService(runtime);
  });

  it('должен генерировать ответ через LLM', async () => {
    const message = {
      chatId: '123456789',
      chatTitle: 'Test Group',
      fromUserId: '987654321',
      fromFirstName: 'TestUser',
      messageText: 'Привет!',
      messageId: '123',
    };

    await service.generateAndSendReply(message);

    expect(runtime.useModel).toHaveBeenCalledWith('TEXT_SMALL', {
      prompt: expect.stringContaining('Привет!'),
      maxTokens: 200,
      temperature: 0.7,
    });
  });
});
```

### Шаг 2: Интеграционные тесты

Создать `tests/integration/myagent.test.ts`:

```typescript
describe('MyAgent Integration', () => {
  it('должен отвечать на сообщения в целевой группе', async () => {
    // Тест должен проверить:
    // 1. Получение сообщения от целевой группы
    // 2. Генерацию ответа через LLM
    // 3. Отправку ответа обратно
  });
});
```

### Шаг 3: Мануальное тестирование

```bash
# 1. Запустить агента
bun run dev

# 2. Написать сообщение в целевую группу
# Ожидаемый результат: бот отвечает уникальным сообщением

# 3. Проверить логи
tail -f logs/myagent.log
```

---

## 🚀 Запуск агента

### Способ 1: Через Bun (Рекомендуется)

```bash
# Установить зависимости
bun install

# Запустить агента (ЕДИНСТВЕННАЯ КОМАНДА!)
bun dev
```

### Способ 2: Через ElizaOS

```bash
# Запустить конкретного агента
elizaos start --character characters/MyAgent.json
```

### Способ 3: Создание скрипта запуска

Создать `start-myagent.sh`:

```bash
#!/bin/bash

echo "🚀 Запуск MyAgent..."
echo "===================="

# Устанавливаем переменные окружения
export OPENROUTER_API_KEY=$(infisical secrets --key OPENROUTER_API_KEY --plain)
export TELEGRAM_BOT_TOKEN=$(infisical secrets --key TELEGRAM_BOT_TOKEN --plain)
export PORT=3000

# Очищаем логи
rm -f /Users/playra/vibee-agent/logs/myagent.log

# Запускаем агента
cd /Users/playra/vibee-agent
npx elizaos start --character characters/MyAgent.json 2>&1 | tee logs/myagent.log &

AGENT_PID=$!
echo "📝 PID: $AGENT_PID"

# Ожидание запуска
sleep 10

# Проверяем что процесс работает
if ps -p $AGENT_PID > /dev/null; then
    echo "✅ MyAgent запущен!"
    echo ""
    echo "📊 Мониторинг:"
    echo "  tail -f logs/myagent.log"
    echo ""
else
    echo "❌ Ошибка запуска MyAgent!"
    echo "📝 Проверьте логи: logs/myagent.log"
fi
```

Сделать исполняемым:
```bash
chmod +x start-myagent.sh

# Запустить
./start-myagent.sh
```

---

## 📊 Мониторинг и отладка

### Логи в реальном времени

```bash
# Все логи
tail -f logs/myagent.log

# Только ошибки
tail -f logs/myagent.log | grep -i "error\|❌"

# Только LLM генерацию
tail -f logs/myagent.log | grep -i "генерирую\|llm"

# Только целевые группы
tail -f logs/myagent.log | grep "TARGET"
```

### Отладка переменных окружения

```bash
# Проверить что переменные загружены
node -e "
require('dotenv').config();
console.log('TELEGRAM_API_ID:', process.env.TELEGRAM_API_ID ? 'SET' : 'NOT SET');
console.log('TELEGRAM_API_HASH:', process.env.TELEGRAM_API_HASH ? 'SET' : 'NOT SET');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
"
```

### Проверка подключения к базе данных

```bash
# Проверить подключение к PostgreSQL
psql $DATABASE_URL -c "SELECT version();"
```

### Мониторинг процессов

```bash
# Все процессы MyAgent
ps aux | grep "MyAgent\|myagent" | grep -v grep

# Статус конкретного PID
ps -p <PID> -o pid,ppid,cmd,etime
```

### Health check

Добавить в `MyAgentTelegramService.ts`:

```typescript
async checkHealth(): Promise<boolean> {
  const checks = {
    mtproto: !!this.client && this.isInitialized,
    database: !!this.runtime?.getSetting('DATABASE_URL'),
    llm: !!this.runtime?.getSetting('OPENROUTER_API_KEY'),
  };

  const allHealthy = Object.values(checks).every(v => v);

  console.log('🏥 [MyAgent Health]', checks);

  return allHealthy;
}
```

---

## 🐛 Типичные проблемы и решения

### ❌ Проблема: "Bot doesn't respond"

**Симптомы:**
- Процесс запущен
- MTProto подключен
- Сообщения не обрабатываются

**Решение:**
```bash
# 1. Проверить фильтр групп
grep -n "targetGroups" src/services/MyAgentTelegramService.ts

# 2. Убедиться что ID групп правильные
tail -f logs/myagent.log | grep -i "chat.*id"

# 3. Проверить что сообщение не от бота
grep -n "BOT_USER_ID" src/services/MyAgentTelegramService.ts
```

### ❌ Проблема: "Empty LLM response"

**Симптомы:**
- Сообщения обрабатываются
- LLM не генерирует ответы

**Решение:**
```bash
# 1. Проверить API ключ
echo $OPENROUTER_API_KEY | head -c 20

# 2. Проверить лимиты
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models

# 3. Проверить логи
tail -f logs/myagent.log | grep -i "llm\|error"
```

### ❌ Проблема: "Database connection failed"

**Симптомы:**
- Бот запускается
- Ошибки подключения к БД

**Решение:**
```bash
# 1. Проверить DATABASE_URL
echo $DATABASE_URL

# 2. Проверить подключение
psql $DATABASE_URL -c "SELECT 1;"

# 3. Проверить переменные в Infisical
infisical secrets --key DATABASE_URL
```

### ❌ Проблема: "Session expired"

**Симптомы:**
- MTProto подключается и сразу отключается

**Решение:**
```bash
# 1. Обновить session string
# Повторить процесс получения session string

# 2. Сохранить в Infisical
infisical secrets --key TELEGRAM_SESSION_STRING --value "<новый-session-string>"
```

### ❌ Проблема: "TypeScript errors"

**Симптомы:**
- Ошибки компиляции

**Решение:**
```bash
# 1. Проверить типы
bun run type-check

# 2. Пересобрать плагин
cd plugin-myagent
npm run build

# 3. Проверить импорты
grep -r "import.*from" src/
```

### ❌ Проблема: "Rate limit exceeded"

**Симптомы:**
- LLM не отвечает
- Ошибки в логах

**Решение:**
```bash
# 1. Увеличить delay между запросами
# Добавить в MyAgentLLMService.ts:
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 сек delay

# 2. Проверить лимиты провайдера
# OpenRouter: 100 requests/minute для бесплатного плана
```

---

## 📝 Чек-лист перед запуском

### Перед первым запуском

- [ ] Установлены все зависимости (`bun install`)
- [ ] Настроен `.env` файл с Infisical credentials
- [ ] Создан персонаж `characters/MyAgent.json`
- [ ] Создан плагин `plugin-myagent/`
- [ ] Настроены все переменные в Infisical:
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_API_ID`
  - [ ] `TELEGRAM_API_HASH`
  - [ ] `TELEGRAM_SESSION_STRING`
  - [ ] `DATABASE_URL`
- [ ] Получены ID целевых групп
- [ ] Обновлен фильтр в `MyAgentTelegramService.ts`
- [ ] Пересобран плагин (`cd plugin-myagent && npm run build`)
- [ ] Создан скрипт запуска `start-myagent.sh`
- [ ] Сделал скрипт исполняемым (`chmod +x start-myagent.sh`)

### Первый запуск

- [ ] Запущен агент (`./start-myagent.sh`)
- [ ] Проверены логи (`tail -f logs/myagent.log`)
- [ ] MTProto подключен (`✅ MTProto подключен!`)
- [ ] Отправлено тестовое сообщение в целевую группу
- [ ] Проверен ответ бота
- [ ] Убедился что ответ уникальный (не статичный)

### После успешного запуска

- [ ] Все тесты проходят (`npm test`)
- [ ] Health check проходит
- [ ] Агент стабильно работает > 1 часа
- [ ] Нет критических ошибок в логах
- [ ] Процесс не падает
- [ ] LLM генерирует уникальные ответы

---

## 🎯 Лучшие практики

### ✅ Правильно

- **Использовать только Infisical** для API ключей
- **Удалять fallback логику** - всегда LLM
- **Фильтровать целевые группы** - безопасность
- **Логировать все операции** - для отладки
- **Обрабатывать ошибки** - try/catch везде
- **Документировать код** - комментарии на русском
- **Тестировать в dev** перед продакшеном
- **Использовать TypeScript** - строгая типизация

### ❌ Неправильно

- **Добавлять API ключи в .env** - только Infisical!
- **Отправлять статические сообщения** - только LLM!
- **Игнорировать нецелевые группы** - фильтровать!
- **Ловить ошибки молча** - всегда логировать!
- **Работать без проверок** - валидировать ввод!
- **Пушить в main без тестов** - тестировать!
- **Использовать any типы** - строгая типизация!
- **Использовать var/let** - только const!

---

## 🎓 Примеры готовых агентов

### KOLS Agent

**Назначение:** Обучающий агент для VibeCoding
**Файлы:**
- `characters/kolsAgent.json` - персонаж
- `plugin-kols-userbot/` - плагин
- `start-kols-llm-working.sh` - скрипт запуска

**Особенности:**
- Proactive learning
- Knowledge base
- LLM-only responses
- Target group filtering

### VIBEE Agent

**Назначение:** Основной VIBEE агент
**Файлы:**
- `characters/vibeeAgent.json` - персонаж
- Скрипты в `scripts/`

**Особенности:**
- Multi-agent orchestration
- Telegram interface
- Plugin ecosystem

### Instagram Expert

**Назначение:** Instagram постинг
**Файлы:**
- `characters/instagramExpert.json` - персонаж
- `src/instagram-plugin/` - плагин

**Особенности:**
- Автопостинг
- Аналитика
- Медиа обработка

---

## 📚 Дополнительные ресурсы

### Документация

- **ElizaOS Docs:** https://docs.elizaos.ai/
- **VIBEE Specification:** `VIBEE_SPECIFICATION.md`
- **KOLS Guide:** `KOLS_USER_GUIDE.md`
- **Rainbow Bridge:** Система автономного тестирования

### Ключевые файлы проекта

- `CLAUDE.md` - Общие правила для агентов
- `AGENT_RULES.md` - Железные правила
- `package.json` - Зависимости и скрипты
- `.env` - Переменные окружения

### Полезные команды

```bash
# Запуск агента
bun dev

# Пересборка
bun run build

# Тестирование
npm test

# Проверка типов
npm run type-check

# Форматирование кода
npm run format

# Мониторинг логов
tail -f logs/myagent.log

# Проверка Infisical
infisical secrets --key OPENROUTER_API_KEY

# Проверка базы данных
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 📄 Журнал изменений

**v1.0.0** - Первая версия руководства
- Базовые инструкции по созданию агентов
- Примеры кода для KOLS-подобного агента
- Настройка LLM интеграции
- Telegram MTProto интеграция
- Типичные проблемы и решения

---

**🎉 Готово! Теперь вы можете создавать новых агентов как KOLS!**

**💡 Помните:**
1. **Всегда используйте LLM** - НИКАКИХ fallback сообщений!
2. **Фильтруйте группы** - безопасность превыше всего!
3. **Логируйте всё** - для легкой отладки!
4. **Тестируйте тщательно** - перед запуском в продакшен!
5. **Документируйте код** - на русском языке!

**🚀 Удачи в создании агентов!**
