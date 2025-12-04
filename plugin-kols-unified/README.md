# KOLS Unified Plugin

Единый переиспользуемый плагин для KOLS (Knowledge Oriented Learning System) - наставника по современной разработке и VibeCoding.

## Описание

KOLS Unified Plugin - это полнофункциональный плагин для ElizaOS, который объединяет в себе:

- **Telegram MTProto интеграция** - подключение к Telegram через MTProto API
- **Автоматические ответы** - реакция на сообщения с триггерами
- **Инициативные сообщения** - периодические сообщения с LLM генерацией
- **Мониторинг групп** - отслеживание активности в целевых группах
- **Конфигурируемость** - гибкие настройки через переменные окружения

## Архитектура

Плагин построен на архитектуре ElizaOS с использованием:

- **Services**: `KolsUnifiedService` - основной сервис, объединяющий всю логику
- **Providers**: `kolsProvider` - предоставляет контекст KOLS для LLM
- **Types**: Типизированные интерфейсы для всех компонентов
- **Utils**: `KolsLogger` - цветной логгер для отладки

## Установка

### Как npm пакет (рекомендуется)

```bash
npm install @vibee/plugin-kols-unified
# или
yarn add @vibee/plugin-kols-unified
```

### Как локальный плагин

1. Склонируйте репозиторий
2. Установите зависимости:
```bash
npm install
```
3. Скомпилируйте плагин:
```bash
npm run build
```

## Использование

### Базовое подключение

В вашем `character.ts`:

```typescript
import { kolsUnifiedPlugin } from '@vibee/plugin-kols-unified';

export const character = {
  name: 'MyAgent',
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openrouter', // требуется для LLM
    kolsUnifiedPlugin, // наш унифицированный плагин
  ],
};
```

### Конфигурация

Плагин настраивается через переменные окружения:

#### Telegram настройки

```bash
# Обязательные
TELEGRAM_API_ID=94892
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string

# Опциональные (используются значения по умолчанию)
TELEGRAM_API_ID=94892
TELEGRAM_API_HASH=cacf9ad137d228611b49b2ecc6d68d43
```

#### KOLS настройки

```bash
# Целевые группы (разделенные запятыми)
KOLS_TARGET_CHAT_IDS=-1002643951085,2298297094

# Включение/выключение функций
KOLS_AUTO_REPLY_ENABLED=true
KOLS_PROACTIVE_ENABLED=true

# Интервалы проактивности (в минутах)
KOLS_PROACTIVE_INTERVAL_MIN=60
KOLS_PROACTIVE_INTERVAL_MAX=90
```

#### LLM настройки

```bash
# Параметры генерации
KOLS_LLM_MODEL_TYPE=TEXT_SMALL
KOLS_LLM_MAX_TOKENS=300
KOLS_LLM_TEMPERATURE=0.8
```

### Настройка групп

По умолчанию плагин мониторит две группы:
- `-1002643951085` (супергруппа с префиксом -100)
- `2298297094` (обычная группа)

Изменить через `KOLS_TARGET_CHAT_IDS`:

```bash
KOLS_TARGET_CHAT_IDS=-1001234567890,-1009876543210,1234567890
```

### Настройка проактивности

Управление интервалами инициативных сообщений:

```bash
# Раз в час (60-90 минут)
KOLS_PROACTIVE_INTERVAL_MIN=60
KOLS_PROACTIVE_INTERVAL_MAX=90

# Раз в день (1440-1800 минут)
KOLS_PROACTIVE_INTERVAL_MIN=1440
KOLS_PROACTIVE_INTERVAL_MAX=1800

# Выключить проактивность
KOLS_PROACTIVE_ENABLED=false
```

## API

### KolsUnifiedService

Основной сервис плагина. Доступен через:

```typescript
const kolsService = runtime.getService('kols-unified') as KolsUnifiedService;
```

#### Методы управления

```typescript
// Включить/выключить автоответы
kolsService.setAutoReplyEnabled(true);

// Включить/выключить проактивность
kolsService.setProactiveEnabled(true);

// Добавить целевой чат
kolsService.addTargetChat('-1001234567890');

// Удалить целевой чат
kolsService.removeTargetChat('-1001234567890');

// Получить статус
const status = kolsService.getStatus();
console.log(status);
// {
//   isActive: true,
//   targetChats: 2,
//   totalMessages: 150
// }
```

### kolsProvider

Провайдер контекста для LLM. Предоставляет информацию о:
- Статусе мониторинга
- Количестве целевых чатов
- Обработанных сообщениях
- Правилах общения (запреты на эмодзи, приветствия и т.д.)

```typescript
const context = await kolsProvider.get(runtime, message);
console.log(context.text); // Контекст для LLM
console.log(context.data); // Метаданные
```

## Функциональность

### Автоматические ответы

Плагин отвечает на сообщения, содержащие триггеры:

- **Обучение**: обучи, научи, урок, курс
- **AI-агенты**: ai-агент, ai агент, агент, eliza
- **Программирование**: код, разработка, typescript, python
- **Вопросы**: расскажи, объясни, как работать, что такое
- **Инструменты**: claude code, chatgpt
- **Приветствия**: привет, здравствуй, hello

Ответы генерируются через LLM с системными промптами, которые запрещают:
- Эмодзи и смайлики
- Приветствия в начале сообщения
- Обращения по имени
- Длинные тексты (максимум 2-4 предложения)

### Инициативные сообщения

Плагин периодически отправляет инициативные сообщения:

- **Образовательные** (educational) - вопросы и факты
- **Вопросы** (question) - вовлекающие вопросы
- **Советы** (tip) - практические советы
- **Челленджи** (challenge) - вызовы и задачи
- **Мотивация** (motivation) - мотивирующие сообщения

Сообщения генерируются уникально через LLM, не повторяются.

### Мониторинг групп

Плагин фильтрует и обрабатывает сообщения только из целевых групп:

```typescript
// Проверка в handleNewMessage
const isTargetGroup = this.targetChats.has(processedMessage.chatId);
if (!isTargetGroup) {
  return; // Игнорируем нецелевые группы
}
```

## Логирование

Плагин использует цветной логгер `KolsLogger`:

```typescript
import { KolsLogger } from '@vibee/plugin-kols-unified';

// Разные уровни логирования
KolsLogger.info('ℹ️ Информация');
KolsLogger.success('✅ Успех');
KolsLogger.warning('⚠️ Предупреждение');
KolsLogger.error('❌ Ошибка');
KolsLogger.debug('🐛 Отладка');
KolsLogger.bot('🤖 Действия бота');
KolsLogger.timer('⏱️ Таймеры');
KolsLogger.activity('🎯 Активность');
KolsLogger.chat('💬 Чат операции');
```

## Типы

### KolsMessage

```typescript
interface KolsMessage {
  chatId: string;
  chatTitle: string;
  fromUserId: string;
  fromFirstName: string;
  messageText: string;
  messageId: number;
  timestamp: number;
}
```

### KolsConfig

```typescript
interface KolsConfig {
  targetChatIds: string[];
  autoReplyEnabled: boolean;
  proactiveEnabled: boolean;
  proactiveIntervalMin: number;
  proactiveIntervalMax: number;
  autoReplyTriggers: string[];
  llmModelType: string;
  llmMaxTokens: number;
  llmTemperature: number;
  systemPrompts: {
    autoReply: string;
    proactive: string[];
  };
}
```

### ProactiveMessageConfig

```typescript
interface ProactiveMessageConfig {
  type: 'educational' | 'question' | 'poll' | 'tip' | 'challenge' | 'welcome' | 'motivation';
  systemPrompt: string;
  minDelay: number;
  maxDelay: number;
}
```

## Примеры использования

### Создание кастомного персонажа с KOLS

```typescript
import { Character } from '@elizaos/core';
import { kolsUnifiedPlugin } from '@vibee/plugin-kols-unified';

export const myCharacter: Character = {
  name: 'MyKolsAgent',
  bio: 'AI-агент для обучения программированию',
  system: `Ты KOLS - наставник по современной разработке...`,
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openrouter',
    kolsUnifiedPlugin,
  ],
  settings: {
    model: 'openrouter/auto',
    voice: 'ru-RU-Neural2-B',
  },
};
```

### Динамическое управление чатами

```typescript
// В runtime
const kolsService = runtime.getService('kols-unified') as KolsUnifiedService;

// Добавить новую группу
kolsService.addTargetChat('-1001234567890');

// Убрать старую группу
kolsService.removeTargetChat('-1009876543210');

// Временно выключить проактивность
kolsService.setProactiveEnabled(false);
```

### Кастомная обработка сообщений

```typescript
import { KolsUnifiedService } from '@vibee/plugin-kols-unified';

// Получить сервис
const kolsService = runtime.getService('kols-unified') as KolsUnifiedService;

// Обработать сообщение программно
await kolsService.sendMessage(
  '-1001234567890',
  'Кастомное сообщение от KOLS'
);
```

## Разработка

### Структура проекта

```
plugin-kols-unified/
├── src/
│   ├── index.ts              # Главный файл плагина
│   ├── types/
│   │   └── index.ts          # Типы интерфейсов
│   ├── utils/
│   │   └── logger.ts         # Цветной логгер
│   ├── services/
│   │   └── KolsUnifiedService.ts  # Основной сервис
│   └── providers/
│       └── kolsProvider.ts   # Провайдер контекста
├── package.json
├── tsconfig.json
└── README.md
```

### Скрипты

```bash
# Сборка
npm run build

# Разработка с watch
npm run dev

# Проверка типов
npm run typecheck

# Очистка dist
npm run clean

# Линтинг
npm run lint

# Тесты
npm run test
```

### Переменные окружения в разработке

Создайте `.env` файл:

```bash
# Telegram
TELEGRAM_API_ID=94892
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string

# KOLS
KOLS_TARGET_CHAT_IDS=-1002643951085,2298297094
KOLS_AUTO_REPLY_ENABLED=true
KOLS_PROACTIVE_ENABLED=true
KOLS_PROACTIVE_INTERVAL_MIN=60
KOLS_PROACTIVE_INTERVAL_MAX=90

# LLM
KOLS_LLM_MODEL_TYPE=TEXT_SMALL
KOLS_LLM_MAX_TOKENS=300
KOLS_LLM_TEMPERATURE=0.8
```

## Устранение неполадок

### Проблемы с подключением к Telegram

1. Проверьте API_ID и API_HASH
2. Убедитесь, что SESSION_STRING корректен
3. Проверьте права доступа к группам

### LLM не генерирует ответы

1. Убедитесь, что установлен `@elizaos/plugin-openrouter`
2. Проверьте переменную `OPENROUTER_API_KEY`
3. Проверьте логи на ошибки API

### Сообщения не приходят в группы

1. Убедитесь, что бот добавлен в группу
2. Проверьте ID групп (с префиксом -100 для супергрупп)
3. Проверьте настройки фильтрации

### Проактивные сообщения не отправляются

1. Проверьте `KOLS_PROACTIVE_ENABLED=true`
2. Убедитесь, что `proactiveTimerId` не `null`
3. Проверьте интервалы (не слишком ли большие)

## Лицензия

MIT

## Поддержка

Для получения поддержки:
- Создайте issue в репозитории
- Напишите в Telegram: @vibee_support

## Авторы

- VIBEE Team

## Благодарности

- ElizaOS Team за отличный фреймворк
- OpenRouter за API для LLM
- Telegram за MTProto API
