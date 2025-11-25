# 🐝 Универсальный шаблон создания агентов

> **🎯 Цель**: Быстрое создание агентов любого типа с использованием лучших практик VIBEE  
> **📋 Статус**: Универсальный шаблон для всех агентов  
> **🌱 Философия**: От цифрового агента к персональной личности

---

## 🏗️ ElizaOS - Фундамент проекта

> **🚨 КРИТИЧЕСКИ ВАЖНО**: ElizaOS - это ОСНОВА всего проекта!  
> **📚 Официальная документация**: [ElizaOS Documentation](https://docs.elizaos.ai/)  
> **🎯 Философия**: Все агенты создаются как ElizaOS плагины  
> **💡 Источник знаний**: `.claude/knowledge/elizaos/PLUGIN_SYSTEM.md`

### Что такое ElizaOS?

**ElizaOS** - это операционная система для AI-агентов, которая предоставляет:

- ✅ **Модульную архитектуру** - плагины для расширения функциональности
- ✅ **Единый интерфейс** - стандартизированные компоненты (Actions, Providers, Services, Evaluators)
- ✅ **Интеграцию с платформами** - Telegram, Discord, Web3 и др.
- ✅ **Автономное планирование** - агенты могут планировать действия заранее
- ✅ **Расширяемость** - легко добавлять новые функции через плагины
- ✅ **Единую систему кошельков** - управление мультицепными активами
- ✅ **Расширенное планирование поведения** - стратегические и независимые агенты

### Почему ElizaOS - фундамент?

1. **Стандартизация**: Все агенты следуют единой архитектуре
2. **Переиспользование**: Компоненты можно использовать в разных агентах
3. **Интеграция**: Легкая интеграция с различными платформами
4. **Масштабируемость**: Легко добавлять новые функции
5. **Сообщество**: Большая экосистема плагинов и примеров
6. **Проверенные паттерны**: Множество готовых решений и best practices
7. **Type Safety**: Полная типизация через TypeScript

### Архитектура ElizaOS

```
┌─────────────────────────────────────────┐
│         ElizaOS Agent Runtime           │
│  (Главный компонент - управляет всем)  │
│  - IAgentRuntime                        │
│  - Memory (сообщения)                   │
│  - State (состояние)                    │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Actions   │ │  Providers  │ │  Services   │
│  (Действия) │ │ (Контекст)  │ │ (Сервисы)   │
│             │ │             │ │             │
│ - validate  │ │ - get()     │ │ - initialize│
│ - handler   │ │ - returns   │ │ - start()   │
│ - examples  │ │   Provider  │ │ - stop()    │
│             │ │   Result    │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    Evaluators         │
        │  (Оценка ответов)     │
        │                       │
        │ - handler()           │
        │ - validate()          │
        │ - examples            │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    Routes & Events     │
        │  (HTTP & Webhooks)     │
        └───────────────────────┘
```

### Основные компоненты ElizaOS

#### 1. Plugin (Плагин) - Главный интерфейс

```typescript
import { Plugin } from '@elizaos/core'

/**
 * Базовый интерфейс ElizaOS плагина
 */
interface Plugin {
  name: string                    // Уникальное имя плагина
  description: string            // Описание плагина
  
  // Компоненты плагина (опциональные)
  actions?: Action[]              // Действия, которые может выполнять агент
  providers?: Provider[]          // Провайдеры контекста для LLM
  evaluators?: Evaluator[]        // Оценщики ответов
  services?: Service[]            // Фоновые сервисы
  
  // Инфраструктура (опциональные)
  routes?: RouteHandler[]         // HTTP маршруты
  events?: EventHandler[]         // Обработчики событий
  adapters?: DatabaseAdapter[]    // Адаптеры БД
  
  // Lifecycle
  init?: (
    config: any,
    runtime: IAgentRuntime
  ) => Promise<void>              // Инициализация плагина
}
```

**Пример создания плагина:**

```typescript
import { Plugin } from '@elizaos/core'
import { myAction } from './actions/myAction'
import { myProvider } from './providers/myProvider'
import { MyService } from './services/myService'

export const myPlugin: Plugin = {
  name: 'my-plugin',
  description: 'Описание моего плагина',
  
  // Компоненты
  actions: [myAction],
  providers: [myProvider],
  services: [new MyService()],
  
  // Инициализация
  init: async (config, runtime) => {
    console.log('My plugin initialized')
  },
}
```

#### 2. Action (Действие) - Что агент может делать

```typescript
import { Action, IAgentRuntime, Memory, State, HandlerCallback, ActionResult } from '@elizaos/core'

/**
 * Интерфейс Action
 * 
 * КРИТИЧЕСКИ ВАЖНО:
 * - options имеет тип HandlerOptions | undefined, НЕ Record<string, unknown>
 * - callback может отправлять сообщения пользователю
 * - validate выполняется ПЕРЕД handler
 * - Возвращай ActionResult для цепочки действий
 */
interface Action {
  name: string                    // Уникальный идентификатор
  similes?: string[]              // Альтернативные названия
  description: string             // Что делает действие
  
  // Валидация - должна ли выполняться эта action?
  validate: (
    runtime: IAgentRuntime,
    message: Memory
  ) => Promise<boolean>
  
  // Обработчик действия
  handler: (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options?: HandlerOptions,      // ВАЖНО: HandlerOptions | undefined
    callback?: HandlerCallback     // Для отправки сообщений пользователю
  ) => Promise<void | ActionResult>
  
  // Примеры для обучения LLM
  examples?: ActionExample[][]
}
```

**Пример Action (из реального проекта):**

```typescript
import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'

export const generateImageAction: Action = {
  name: 'GENERATE_NEUROPHOTO',
  similes: ['MAKE_IMAGE', 'CREATE_PHOTO', 'NEUROPHOTO'],
  description: 'Генерирует AI-изображения с помощью Flux/SDXL моделей',
  
  // Валидация - проверяем, нужно ли генерировать изображение
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase()
    if (!text) return false
    
    // Проверяем команды и интенты
    const commands = ['/neurophoto', 'нейрофото', 'neurophoto']
    const intents = ['нарисуй', 'создай изображение', 'generate image', 'draw']
    
    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent))
  },
  
  // Обработчик действия
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ) => {
    try {
      // Извлекаем промпт из сообщения
      const text = message.content?.text || ''
      const prompt = extractPrompt(text)
      
      if (!prompt || prompt.length < 3) {
        await callback?.({
          text: '❌ Пожалуйста, опишите какое изображение вы хотите создать.',
        })
        return {
          success: false,
          error: new Error('Промпт слишком короткий'),
        }
      }
      
      // Уведомляем пользователя о начале генерации
      await callback?.({
        text: '🎨 Генерирую изображение, это займёт 10-30 секунд...',
      })
      
      // Получаем сервис для генерации
      const service = runtime.getService<ImageService>('image-service')
      if (!service) {
        throw new Error('Image service not available')
      }
      
      // Генерируем изображение
      const result = await service.generateImage({ prompt })
      
      if (!result.success) {
        await callback?.({
          text: `❌ Не удалось сгенерировать изображение: ${result.error}`,
        })
        return {
          success: false,
          error: new Error(result.error || 'Generation failed'),
        }
      }
      
      // Отправляем результат пользователю
      await callback?.({
        text: `✨ **Изображение создано!**\n\n📝 **Промпт**: ${prompt}`,
        attachments: result.imageUrls.map(url => ({
          id: `image-${Date.now()}`,
          url,
          type: 'image',
        })),
      })
      
      return {
        success: true,
        data: {
          imageUrls: result.imageUrls,
          prompt,
        },
      }
    } catch (error) {
      await callback?.({
        text: '❌ Произошла ошибка при генерации изображения.',
      })
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  },
  
  // Примеры для обучения LLM
  examples: [
    [
      {
        name: 'user',
        content: { text: '/neurophoto красивый закат над океаном' },
      },
      {
        name: 'assistant',
        content: {
          text: '✅ Изображение готово!',
          action: 'GENERATE_NEUROPHOTO',
        },
      },
    ],
  ],
}
```

**Лучшие практики для Actions:**

1. **Всегда валидируй**: `validate` должен проверять все условия перед выполнением
2. **Используй callback**: Отправляй сообщения пользователю через `callback`
3. **Обрабатывай ошибки**: Всегда возвращай `ActionResult` с `success: false` при ошибках
4. **Добавляй примеры**: `examples` помогают LLM понять, когда использовать action
5. **Используй similes**: Альтернативные названия делают action более гибким

#### 3. Provider (Провайдер) - Контекст для LLM

```typescript
import { Provider, IAgentRuntime, Memory, State, ProviderResult } from '@elizaos/core'

/**
 * Интерфейс Provider
 * 
 * КРИТИЧЕСКИ ВАЖНО:
 * - ДОЛЖЕН возвращать ProviderResult объект, НЕ строку!
 * - Предоставляет контекстную информацию для LLM
 * - Может быть динамическим (меняется с каждым запросом)
 */
interface Provider {
  name?: string                    // Имя провайдера (опционально)
  
  // Получение данных для контекста
  get: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => Promise<ProviderResult>     // ВАЖНО: ProviderResult, НЕ string!
}

/**
 * ProviderResult - формат возвращаемых данных
 */
type ProviderResult = {
  text?: string                   // Текстовый контекст для LLM
  values?: Record<string, any>    // Структурированные данные
  data?: any                      // Любые дополнительные данные
}
```

**Пример Provider (из реального проекта):**

```typescript
import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core'

export const replicateProvider: Provider = {
  name: 'replicateProvider',
  
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => {
    const defaultModel = runtime.getSetting('DEFAULT_MODEL') || 'flux-schnell'
    
    // ВАЖНО: Возвращаем объект ProviderResult, НЕ строку!
    return {
      text: `
# 🎨 AI Image Generation Capabilities

## Available Commands
- \`/neurophoto <описание>\` - Генерация AI-изображения
- \`нарисуй <описание>\` - Альтернативная команда

## Current Configuration
- **Default Model**: ${defaultModel}
- **Generation Time**: 10-30 seconds
- **Image Format**: 1024x1024 (1:1 aspect ratio)

## Examples
✅ **Good prompts**:
- "/neurophoto beautiful sunset over the ocean"
- "нарисуй футуристический город"

❌ **Bad prompts**:
- "/neurophoto cat" (too short)
- "нарисуй" (no description)
      `.trim(),
      values: {
        defaultModel,
        supportedCommands: ['/neurophoto', 'нарисуй', 'создай изображение'],
      },
    }
  },
}
```

**Лучшие практики для Providers:**

1. **Всегда возвращай объект**: `ProviderResult`, а не строку
2. **Структурируй данные**: Используй `values` для структурированных данных
3. **Форматируй текст**: Используй Markdown для лучшей читаемости
4. **Динамический контекст**: Меняй данные в зависимости от состояния
5. **Кэширование**: Кэшируй данные, если они не меняются часто

#### 4. Service (Сервис) - Фоновые задачи

```typescript
import { Service, IAgentRuntime } from '@elizaos/core'

/**
 * Абстрактный класс Service
 * 
 * КРИТИЧЕСКИ ВАЖНО:
 * - ДОЛЖЕН расширять класс Service
 * - ДОЛЖЕН реализовать ВСЕ абстрактные методы
 * - serviceType - это статическое свойство
 * - initialize вызывается после готовности runtime
 */
abstract class Service {
  static serviceType: string      // Статическое свойство типа сервиса
  
  // Обязательные методы
  abstract initialize(
    runtime: IAgentRuntime
  ): Promise<void>
  
  abstract start(): Promise<void>
  
  abstract stop(): Promise<void>
  
  // Опциональные
  capabilityDescription?: string  // Описание возможностей сервиса
}
```

**Пример Service (из реального проекта):**

```typescript
import { Service, IAgentRuntime } from '@elizaos/core'
import Replicate from 'replicate'

export class ReplicateService extends Service {
  static serviceType = 'replicate'  // ВАЖНО: Статическое свойство
  
  private client: Replicate | null = null
  private serviceConfig: ReplicateServiceConfig | null = null
  
  capabilityDescription = 'AI image generation using Replicate API with Flux and SDXL models'
  
  // Инициализация сервиса
  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting('REPLICATE_API_KEY')
    
    if (!apiKey) {
      throw new Error('REPLICATE_API_KEY не найден в настройках')
    }
    
    this.serviceConfig = {
      apiKey,
      defaultModel: runtime.getSetting('DEFAULT_MODEL') || 'flux-schnell',
      timeout: Number(runtime.getSetting('REPLICATE_TIMEOUT')) || 300000,
      maxRetries: Number(runtime.getSetting('REPLICATE_MAX_RETRIES')) || 3,
    }
    
    this.client = new Replicate({ auth: this.serviceConfig.apiKey })
    
    console.log('✅ Replicate Service initialized')
  }
  
  // Запуск сервиса
  async start(): Promise<void> {
    // Сервис готов после инициализации
    console.log('🚀 Replicate Service started')
  }
  
  // Остановка сервиса
  async stop(): Promise<void> {
    // Очистка ресурсов
    this.client = null
    console.log('🛑 Replicate Service stopped')
  }
  
  // Кастомные методы сервиса
  async generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
    if (!this.client) {
      throw new Error('Replicate Service не инициализирован')
    }
    
    // Реализация генерации изображения
    // ...
  }
}
```

**Лучшие практики для Services:**

1. **Статический serviceType**: Всегда определяй `static serviceType`
2. **Реализуй все методы**: `initialize`, `start`, `stop` обязательны
3. **Используй runtime.getSetting()**: Для получения настроек
4. **Обрабатывай ошибки**: Проверяй наличие необходимых настроек
5. **Очищай ресурсы**: В методе `stop()` освобождай все ресурсы

#### 5. Evaluator (Оценщик) - Фильтрация ответов

```typescript
import { Evaluator, IAgentRuntime, Memory, State, EvaluatorResult } from '@elizaos/core'

/**
 * Интерфейс Evaluator
 * 
 * Используется для фильтрации и оценки ответов агента
 */
interface Evaluator {
  name: string
  description: string
  
  // Обработчик оценки
  handler: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => Promise<EvaluatorResult>
  
  // Валидация (опционально)
  validate?: (
    runtime: IAgentRuntime,
    message: Memory
  ) => Promise<boolean>
  
  // Примеры (опционально)
  examples?: EvaluatorExample[][]
}

/**
 * EvaluatorResult - результат оценки
 */
type EvaluatorResult = {
  success: boolean              // Прошла ли оценка
  score?: number                // Оценка (0-1)
  reason?: string               // Причина оценки
}
```

**Пример Evaluator:**

```typescript
import { Evaluator, IAgentRuntime, Memory, State } from '@elizaos/core'

export const qualityEvaluator: Evaluator = {
  name: 'QUALITY_CHECK',
  description: 'Проверяет качество ответа агента',
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => {
    const text = message.content?.text || ''
    
    // Проверяем качество ответа
    const quality = analyzeQuality(text) // Функция анализа качества
    
    return {
      success: quality > 0.8,  // Успех если качество > 80%
      score: quality,
      reason: quality > 0.8 
        ? 'Ответ высокого качества' 
        : 'Ответ требует улучшения',
    }
  },
}
```

### Последовательность инициализации плагина

ElizaOS инициализирует компоненты плагина в следующем порядке:

1. **Database Adapter** setup (если есть)
2. **Actions** registration
3. **Evaluators** registration
4. **Providers** registration
5. **Models** configuration
6. **Routes** setup (HTTP, если есть)
7. **Events** subscription (если есть)
8. **Services** initialization (вызывается `initialize()`)
9. **Services** start (вызывается `start()`)

**Важно**: Services инициализируются последними, после всех остальных компонентов!

### Лучшие практики ElizaOS

#### 1. Валидация

```typescript
// ✅ ХОРОШО: Всегда валидируй
validate: async (runtime, message) => {
  return message.content.text.includes('trigger') &&
         runtime.getSetting('API_KEY') !== undefined &&
         message.roomId !== undefined
}

// ❌ ПЛОХО: Нет валидации
validate: async () => true
```

#### 2. Обработка ошибок

```typescript
// ✅ ХОРОШО: Обрабатывай ошибки gracefully
handler: async (runtime, message, state, options, callback) => {
  try {
    const result = await doWork()
    await callback?.({ text: 'Success!' })
    return { success: true, data: result }
  } catch (error) {
    await callback?.({ text: 'Error occurred' })
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

// ❌ ПЛОХО: Игнорирование ошибок
handler: async () => {
  const result = await doWork() // Может упасть!
  return { success: true, data: result }
}
```

#### 3. Типобезопасность

```typescript
// ✅ ХОРОШО: Правильные типы
import { Action, IAgentRuntime, Memory, State } from '@elizaos/core'

const action: Action = {
  name: 'MY_ACTION',
  // ... правильно типизировано
}

// ❌ ПЛОХО: Использование 'any'
const action: any = {
  name: 'MY_ACTION',
  // ...
}
```

#### 4. Зависимости

```typescript
// ✅ ХОРОШО: Объявляй зависимости
export const myPlugin: Plugin = {
  name: 'my-plugin',
  dependencies: ['@elizaos/plugin-bootstrap'],
  // ...
}
```

#### 5. Provider возвращает объект

```typescript
// ✅ ХОРОШО: Возвращай ProviderResult объект
const provider: Provider = {
  get: async () => ({
    text: 'some string',
    values: { key: 'value' },
  }),
}

// ❌ ПЛОХО: Возвращай строку напрямую
const provider: Provider = {
  get: async () => 'some string', // ОШИБКА!
}
```

#### 6. Service методы обязательны

```typescript
// ✅ ХОРОШО: Все методы реализованы
class MyService extends Service {
  static serviceType = 'my-service'
  
  async initialize(runtime) {}
  async start() {}
  async stop() {}
}

// ❌ ПЛОХО: Отсутствуют методы
class MyService extends Service {
  static serviceType = 'my-service'
  // Отсутствуют initialize, start, stop!
}
```

#### 7. Action options тип

```typescript
// ✅ ХОРОШО: Пусть TypeScript выведет тип
handler: async (runtime, message, state, options) => {
  // options имеет тип HandlerOptions | undefined
}

// ❌ ПЛОХО: Неправильный тип
handler: async (runtime, message, state, options: Record<string, unknown>) => {
  // Неправильный тип!
}
```

### Типы TypeScript из ElizaOS

```typescript
// Основные типы, которые ты будешь использовать
import {
  Plugin,              // Интерфейс плагина
  Action,              // Интерфейс действия
  Provider,            // Интерфейс провайдера
  Service,             // Абстрактный класс сервиса
  Evaluator,           // Интерфейс оценщика
  IAgentRuntime,       // Runtime агента
  Memory,              // Сообщение/память
  State,               // Состояние агента
  HandlerCallback,     // Callback для отправки сообщений
  ActionResult,        // Результат действия
  ProviderResult,      // Результат провайдера
  HandlerOptions,      // Опции обработчика
} from '@elizaos/core'
```

### Пример полного плагина (из реального проекта)

```typescript
/**
 * @999-agents/plugin-neurophoto
 * ElizaOS plugin for AI image generation
 */
import { Plugin } from '@elizaos/core'
import { generateImageAction } from './actions/generateImage'
import { replicateProvider } from './providers/replicateProvider'
import { ReplicateService } from './services/replicateService'
import { FalService } from './services/falService'

export const neurophotoPlugin: Plugin = {
  name: 'neurophoto',
  description: 'AI image generation with Replicate models',
  
  // Actions - что агент может делать
  actions: [generateImageAction],
  
  // Providers - контекст для LLM
  providers: [replicateProvider],
  
  // Services - фоновые сервисы
  services: [new ReplicateService(), new FalService()],
  
  // Evaluators (нет для MVP)
  evaluators: [],
  
  // Инициализация плагина
  init: async (config, runtime) => {
    console.log('Neurophoto plugin initialized')
  },
}

export default neurophotoPlugin
```

### Интеграция ElizaOS с функциональным программированием

ElizaOS плагины можно создавать в функциональном стиле:

```typescript
import { Action, IAgentRuntime, Memory, State } from '@elizaos/core'
import { TaskEither, tryCatchAsync, right, left } from '@/core/functional/utils/result'
import { pipe, chain, map, tap } from '@/core/functional/utils/composition'

export const functionalAction: Action = {
  name: 'FUNCTIONAL_ACTION',
  description: 'Action в функциональном стиле',
  
  validate: async (runtime, message) => {
    // Функциональная валидация
    return pipe(
      () => message.content?.text,
      (text) => text?.includes('trigger') ?? false
    )()
  },
  
  handler: async (runtime, message, state, options, callback) => {
    // Функциональный обработчик с TaskEither
    const result = await pipe(
      // 1. Валидация данных
      () => validateData(message),
      chain(validated =>
        pipe(
          // 2. Выполнение действия
          () => performAction(validated),
          chain(actionResult =>
            pipe(
              // 3. Сохранение результата
              () => saveResult(actionResult),
              map(() => actionResult)
            )
          )
        )
      ),
      // 4. Уведомление пользователя (side effect через tap)
      tap(result => {
        if (result.isRight()) {
          callback?.({
            text: `✅ Успешно: ${JSON.stringify(result.value)}`,
          })
        }
      })
    )()
    
    if (result.isLeft()) {
      await callback?.({
        text: `❌ Ошибка: ${result.value.message}`,
      })
      return {
        success: false,
        error: result.value,
      }
    }
    
    return {
      success: true,
      data: result.value,
    }
  },
}
```

### Частые ошибки и как их избежать

#### Ошибка 1: Provider возвращает строку

```typescript
// ❌ НЕПРАВИЛЬНО
const provider: Provider = {
  get: async () => 'some string', // ОШИБКА!
}

// ✅ ПРАВИЛЬНО
const provider: Provider = {
  get: async () => ({
    text: 'some string',
  }),
}
```

#### Ошибка 2: Отсутствуют методы Service

```typescript
// ❌ НЕПРАВИЛЬНО
class MyService extends Service {
  static serviceType = 'my-service'
  // Отсутствуют initialize, start, stop!
}

// ✅ ПРАВИЛЬНО
class MyService extends Service {
  static serviceType = 'my-service'
  
  async initialize(runtime) {}
  async start() {}
  async stop() {}
}
```

#### Ошибка 3: Неправильный тип options в Action

```typescript
// ❌ НЕПРАВИЛЬНО
handler: async (runtime, message, state, options: Record<string, unknown>) => {
  // Неправильный тип!
}

// ✅ ПРАВИЛЬНО
handler: async (runtime, message, state, options) => {
  // TypeScript автоматически выведет HandlerOptions | undefined
}
```

### Ресурсы для изучения ElizaOS

- **Официальная документация**: https://docs.elizaos.ai/
- **Plugin Registry**: https://docs.elizaos.ai/plugin-registry/overview
- **Plugin Development Guide**: https://docs.elizaos.ai/guides/create-a-plugin
- **API Reference**: https://docs.elizaos.ai/plugins/reference
- **Примеры плагинов**: https://github.com/elizaOS/eliza/tree/main/packages/plugins
- **Knowledge Base проекта**: `.claude/knowledge/elizaos/PLUGIN_SYSTEM.md`

---

**🏗️ ElizaOS - это фундамент! Все агенты создаются как ElizaOS плагины!**

---

## 🚀 Создание плагина через генерацию

> **🚨 КРИТИЧЕСКИ ВАЖНО**: Все плагины создаются через CLI команды генерации!  
> **📋 Команда**: `elizaos plugins create <имя_плагина>`  
> **🎯 Цель**: Автоматическая генерация структуры плагина с необходимыми файлами

### Команда для создания плагина

**ОБЯЗАТЕЛЬНО использовать эту команду для создания нового плагина:**

```bash
# Основная команда создания плагина
elizaos plugins create <имя_плагина>

# Примеры:
elizaos plugins create vibe-image-generator
elizaos plugins create vibe-video-generator
elizaos plugins create vibe-payment-handler
```

### Что делает команда генерации?

Команда `elizaos plugins create` автоматически создает:

1. **Структуру директорий**:
   ```
   packages/plugin-{имя}/
   ├── src/
   │   ├── index.ts              # Главный файл плагина
   │   ├── actions/              # Действия плагина
   │   ├── providers/            # Провайдеры контекста
   │   ├── services/             # Фоновые сервисы
   │   ├── evaluators/           # Оценщики (опционально)
   │   └── types/                # TypeScript типы
   ├── package.json              # Конфигурация пакета
   ├── tsconfig.json             # TypeScript конфигурация
   ├── README.md                 # Документация
   └── .gitignore                # Git ignore
   ```

2. **Базовые файлы**:
   - `src/index.ts` - главный файл плагина с интерфейсом `Plugin`
   - `package.json` - конфигурация npm пакета
   - `tsconfig.json` - настройки TypeScript
   - `README.md` - шаблон документации

3. **Настройки**:
   - Зависимости от `@elizaos/core`
   - TypeScript конфигурация
   - ESLint настройки (если есть)

### Процесс создания плагина агентами

**ВАЖНО**: Агенты должны использовать эту команду ПЕРЕД началом разработки!

#### Шаг 1: Генерация структуры

```bash
# Агент выполняет команду генерации
elizaos plugins create vibe-my-agent

# Результат: Создана структура плагина
# packages/plugin-vibe-my-agent/
```

#### Шаг 2: Проверка созданной структуры

```bash
# Агент проверяет созданную структуру
cd packages/plugin-vibe-my-agent
ls -la

# Должны быть созданы:
# - src/index.ts
# - package.json
# - tsconfig.json
# - README.md
```

#### Шаг 3: Установка зависимостей

```bash
# Агент устанавливает зависимости
cd packages/plugin-vibe-my-agent
npm install
# или
bun install
```

#### Шаг 4: Начало разработки

После генерации структуры агент может:
- Добавлять Actions в `src/actions/`
- Добавлять Providers в `src/providers/`
- Добавлять Services в `src/services/`
- Добавлять типы в `src/types/`

### Пример полного процесса создания плагина

```bash
# 1. Генерация структуры плагина
elizaos plugins create vibe-image-generator

# 2. Переход в директорию плагина
cd packages/plugin-vibe-image-generator

# 3. Установка зависимостей
npm install

# 4. Проверка структуры
ls -la src/

# 5. Начало разработки
# - Редактирование src/index.ts
# - Создание src/actions/generateImage.ts
# - Создание src/providers/imageProvider.ts
# - Создание src/services/imageService.ts
```

### Альтернативные способы создания плагина

Если команда `elizaos plugins create` недоступна, можно использовать:

#### Вариант 1: Через npm/npx (если доступно)

```bash
# Если есть npm пакет для генерации
npx @elizaos/create-plugin vibe-my-agent

# Или
npm create @elizaos/plugin vibe-my-agent
```

#### Вариант 2: Ручное создание (НЕ РЕКОМЕНДУЕТСЯ)

Если генерация недоступна, можно создать структуру вручную, но это **НЕ РЕКОМЕНДУЕТСЯ**:

```bash
# Создание директорий
mkdir -p packages/plugin-vibe-my-agent/src/{actions,providers,services,types}

# Создание базовых файлов
touch packages/plugin-vibe-my-agent/src/index.ts
touch packages/plugin-vibe-my-agent/package.json
touch packages/plugin-vibe-my-agent/tsconfig.json
touch packages/plugin-vibe-my-agent/README.md
```

**⚠️ ВАЖНО**: Ручное создание требует знания точной структуры и может привести к ошибкам!

### Проверка после генерации

После выполнения команды генерации агент должен проверить:

1. **Структура директорий**:
   ```bash
   tree packages/plugin-{имя}/
   ```

2. **Файл package.json**:
   ```bash
   cat packages/plugin-{имя}/package.json
   # Должен содержать зависимости от @elizaos/core
   ```

3. **Главный файл плагина**:
   ```bash
   cat packages/plugin-{имя}/src/index.ts
   # Должен экспортировать объект Plugin
   ```

4. **TypeScript конфигурация**:
   ```bash
   cat packages/plugin-{имя}/tsconfig.json
   # Должна быть настроена для TypeScript
   ```

### Интеграция с проектом

После создания плагина через генерацию:

1. **Добавление в workspace** (если используется monorepo):
   ```json
   // package.json (root)
   {
     "workspaces": [
       "packages/*"
     ]
   }
   ```

2. **Импорт плагина**:
   ```typescript
   // src/character.ts или src/bot.ts
   import { myPlugin } from '@999-agents/plugin-vibe-my-agent'
   
   export const character = {
     plugins: [myPlugin],
     // ...
   }
   ```

3. **Регистрация в системе**:
   - Плагин автоматически регистрируется при импорте
   - Actions, Providers, Services автоматически подключаются

### Чек-лист создания плагина

**Агенты должны следовать этому чек-листу:**

- [ ] Выполнена команда `elizaos plugins create <имя>`
- [ ] Проверена структура директорий
- [ ] Установлены зависимости (`npm install` или `bun install`)
- [ ] Проверен файл `package.json`
- [ ] Проверен файл `src/index.ts`
- [ ] Проверена TypeScript конфигурация
- [ ] Плагин добавлен в workspace (если нужно)
- [ ] Плагин импортирован в главный файл
- [ ] Плагин зарегистрирован в системе

### Ошибки при генерации

Если команда генерации не работает:

1. **Проверить установку ElizaOS CLI**:
   ```bash
   # Проверка наличия CLI
   elizaos --version
   
   # Если не установлен:
   npm install -g @elizaos/cli
   # или
   npm install -D @elizaos/cli
   ```

2. **Проверить права доступа**:
   ```bash
   # Проверка прав на создание директорий
   ls -la packages/
   ```

3. **Проверить версию Node.js**:
   ```bash
   node --version
   # Должна быть >= 18.x
   ```

### Документация

- **Официальная документация**: https://docs.elizaos.ai/guides/create-a-plugin
- **Plugin Publishing Guide**: https://eliza.how/guides/plugin-publishing-guide
- **Примеры плагинов**: https://github.com/elizaOS/eliza/tree/main/packages/plugins

---

**🚀 ВСЕГДА используй команду генерации для создания плагинов!**

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО

### 🎯 Обязательные правила для ВСЕХ агентов

**ВСЕ АГЕНТЫ ДОЛЖНЫ БЫТЬ СОЗДАНЫ КАК ELIZAOS ПЛАГИНЫ!**

1. **ElizaOS Plugin Architecture**:
   - ✅ **ОБЯЗАТЕЛЬНО**: Использовать команду `elizaos plugins create <имя>` для генерации структуры плагина
   - ✅ Все агенты = ElizaOS плагины
   - ✅ Использовать интерфейсы `Plugin`, `Action`, `Provider`, `Service` из `@elizaos/core`
   - ✅ Следовать структуре ElizaOS плагинов
   - ✅ Использовать `IAgentRuntime` для доступа к runtime
   - ✅ Использовать `Memory` и `State` для управления состоянием
   - ✅ **НЕ создавать плагины вручную** - только через команду генерации!

2. **Функциональное программирование**:

1. **Функциональное программирование**:
   - ✅ `TaskEither<Error, Success>` для всех асинхронных операций
   - ✅ `Either<Error, Success>` для синхронных операций
   - ✅ `pipe()` для композиции функций
   - ✅ Иммутабельность (immutability)
   - ✅ Чистые функции без побочных эффектов

2. **Валидация данных**:
   - ✅ Zod для всех входных данных
   - ✅ Runtime type safety
   - ✅ Автоматическая генерация TypeScript типов

3. **База данных**:
   - ✅ Drizzle ORM для всех операций с БД
   - ✅ Единая модель `AvatarBrain`
   - ✅ Транзакции для атомарности

4. **Тестирование**:
   - ✅ TDD (Test-Driven Development)
   - ✅ 100% покрытие тестами
   - ✅ Функциональное тестирование

5. **Логирование**:
   - ✅ VIBE-SENTRY для всех действий
   - ✅ Структурированное логирование
   - ✅ Контекст для отладки

---

## 📋 Структура универсального агента

### Базовая структура файлов

```
src/agents/{agent-name}/
├── index.ts                 # Главный файл агента
├── actions/                 # Действия агента
│   ├── index.ts
│   └── {action-name}.ts
├── providers/               # Провайдеры контекста
│   ├── index.ts
│   └── {provider-name}.ts
├── services/                # Фоновые сервисы
│   ├── index.ts
│   └── {service-name}.ts
├── schemas/                 # Zod схемы
│   ├── index.ts
│   └── {schema-name}.ts
├── types/                   # TypeScript типы
│   ├── index.ts
│   └── {type-name}.ts
├── utils/                   # Утилиты
│   ├── index.ts
│   └── {util-name}.ts
└── __tests__/               # Тесты
    ├── actions.test.ts
    ├── providers.test.ts
    └── services.test.ts
```

---

## 🎯 Шаблон создания агента

### Шаг 1: Определение назначения агента

```markdown
## Агент: {AGENT-NAME}

**Назначение**: {Краткое описание что делает агент}

**Тип**: {Бизнес-агент | Инфраструктурный | Self-Development | Критический}

**Зависимости**: 
- {Зависимость 1}
- {Зависимость 2}

**Время создания**: {1-2 часа | 2-3 часа | 3-4 часа}
```

### Шаг 2: Определение интерфейса агента

```typescript
// src/agents/{agent-name}/types/index.ts
import { TaskEither } from '@/core/functional/utils/result'
import { z } from 'zod'

/**
 * Универсальный интерфейс агента
 */
export interface UniversalAgent {
  name: string
  version: string
  description: string
  
  // Действия агента (что агент может делать)
  actions: {
    [actionName: string]: (
      input: unknown
    ) => TaskEither<Error, unknown>
  }
  
  // Провайдеры контекста (данные для LLM)
  providers: {
    [providerName: string]: (
      context: unknown
    ) => TaskEither<Error, unknown>
  }
  
  // Фоновые сервисы (долгоживущие задачи)
  services: {
    [serviceName: string]: {
      initialize: () => Promise<void>
      start: () => Promise<void>
      stop: () => Promise<void>
    }
  }
  
  // Конфигурация агента
  config: {
    [key: string]: unknown
  }
  
  // Инициализация агента
  init: () => Promise<TaskEither<Error, void>>
  
  // Уничтожение агента
  destroy: () => Promise<TaskEither<Error, void>>
  
  // Регистрация в VIBE-QUEEN
  registerWithQueen: () => Promise<TaskEither<Error, void>>
}
```

### Шаг 3: Создание Zod схем

```typescript
// src/agents/{agent-name}/schemas/index.ts
import { z } from 'zod'

/**
 * Схема входных данных для действия {ActionName}
 */
export const {ActionName}InputSchema = z.object({
  // Определи поля входных данных
  field1: z.string().min(1).max(100),
  field2: z.number().int().positive(),
  field3: z.object({
    nested: z.string(),
  }).optional(),
})

export type {ActionName}Input = z.infer<typeof {ActionName}InputSchema>

/**
 * Схема выходных данных для действия {ActionName}
 */
export const {ActionName}OutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    // Определи поля выходных данных
    result: z.string(),
  }),
  timestamp: z.date(),
})

export type {ActionName}Output = z.infer<typeof {ActionName}OutputSchema>
```

### Шаг 4: Создание действия (Action)

```typescript
// src/agents/{agent-name}/actions/{action-name}.ts
import { TaskEither, tryCatchAsync, right, left } from '@/core/functional/utils/result'
import { pipe, chain, map, tap } from '@/core/functional/utils/composition'
import { validate } from '@/core/validation/validate'
import { withLogging } from '@/core/sentry/withLogging'
import { withMetrics } from '../utils/metrics'
import { withCache } from '../utils/cache'
import { checkRateLimit } from '../utils/rateLimit'
import { retryWithBackoff } from '../utils/retry'
import { withTimeout } from '../utils/timeout'
import { categorizeError } from '../utils/errorHandler'
import { {ActionName}InputSchema, {ActionName}OutputSchema } from '../schemas'
import { db } from '@/core/drizzle/client'
import { operations, assets, users, balances } from '@/core/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { AvatarBrain } from '@/core/types'
import { logger } from '@/core/logger'

/**
 * Действие: {ActionName}
 * 
 * Описание: {Что делает это действие}
 */
export const {actionName}Action = {
  name: '{action-name}',
  description: '{Описание действия}',
  
  /**
   * Валидация входных данных и контекста
   */
  validate: (
    brain: AvatarBrain,
    context: unknown
  ): TaskEither<Error, boolean> => {
    return pipe(
      // 1. Валидация входных данных через Zod
      validate({ActionName}InputSchema, context),
      chain(validatedInput => {
        // 2. Проверка баланса (если нужно)
        const cost = 10 // Стоимость операции
        const currentBalance = (brain.balance?.currencies as any)?.stars || 0
        
        if (currentBalance < cost) {
          return left(new Error(`Недостаточно баланса. Требуется: ${cost}⭐`))
        }
        
        // 3. Проверка прав доступа (если нужно)
        // if (!hasPermission(brain, 'action-name')) {
        //   return left(new Error('Нет прав доступа'))
        // }
        
        return right(true)
      })
    )
  },
  
  /**
   * Обработчик действия с полной обработкой ошибок и метриками
   */
  handler: (
    brain: AvatarBrain,
    context: unknown
  ): TaskEither<Error, {ActionName}Output> => {
    // Обертка с логированием, метриками и timeout
    return pipe(
      // 1. Проверка rate limit
      checkRateLimit({
        maxRequests: 10,
        windowMs: 60000, // 1 минута
        key: `agent:${brain.id}:{action-name}`,
      }),
      chain(() =>
        pipe(
          // 2. Валидация входных данных
          validate({ActionName}InputSchema, context),
          chain(validatedInput =>
            pipe(
              // 3. Timeout для операции (30 секунд)
              withTimeout(
                pipe(
                  // 4. Выполнение основной логики с retry
                  executeActionLogic(validatedInput, brain),
                  chain(result =>
                    pipe(
                      // 5. Сохранение результата в БД (транзакция)
                      saveResultToDB(result, brain),
                      chain(() =>
                        pipe(
                          // 6. Списание баланса атомарно (если нужно)
                          deductBalance(brain, cost),
                          map(() => ({
                            success: true,
                            data: result,
                            timestamp: new Date(),
                          }))
                        )
                      )
                    )
                  )
                ),
                30000 // 30 секунд timeout
              ),
              // 7. Обработка ошибок с категоризацией
              chain(
                (result) => right(result),
                (error) => {
                  const categorized = categorizeError(error)
                  
                  // Логируем ошибку
                  logger.error('Action handler error', {
                    agent: '{AGENT-NAME}',
                    action: '{action-name}',
                    category: categorized.category,
                    retryable: categorized.retryable,
                    error: categorized.technicalMessage,
                    userId: brain.id,
                  })
                  
                  // Возвращаем категоризированную ошибку
                  return left(categorized)
                }
              )
            )
          )
        )
      )
    )
  },
}

/**
 * Основная логика действия с retry и обработкой ошибок
 */
const executeActionLogic = (
  input: {ActionName}Input,
  brain: AvatarBrain
): TaskEither<Error, unknown> => {
  return pipe(
    // 1. Валидация входных данных
    validateInput(input),
    chain(validated =>
      pipe(
        // 2. Выполнение с retry логикой
        retryWithBackoff(
          () => performAction(validated, brain),
          {
            maxRetries: 3,
            delays: [1000, 2000, 4000], // Exponential backoff
            retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT'],
          }
        ),
        chain(result =>
          pipe(
            // 3. Валидация результата
            validateResult(result),
            map(validatedResult => ({
              ...validatedResult,
              metadata: {
                executedAt: new Date(),
                userId: brain.id,
                agent: '{AGENT-NAME}',
              },
            }))
          )
        )
      )
    )
  )
}

/**
 * Выполнение действия с обработкой ошибок
 */
const performAction = (
  input: {ActionName}Input,
  brain: AvatarBrain
): TaskEither<Error, unknown> => {
  return tryCatchAsync(
    async () => {
      // Реализуй основную логику здесь
      // Используй функциональный стиль (pipe, chain, map)
      
      // Пример вызова внешнего API:
      // const response = await callExternalAPI(input)
      // return response
      
      // Пример работы с БД:
      // const data = await db.select().from(table).where(...)
      // return data
      
      return {
        result: 'Success',
        data: input,
      }
    },
    (error) => {
      // Категоризация ошибок для правильной обработки
      if (error instanceof Error) {
        // Сетевые ошибки - можно повторить
        if (error.message.includes('timeout') || error.message.includes('network')) {
          return new Error(`NETWORK_ERROR: ${error.message}`)
        }
        
        // Ошибки валидации - не повторяем
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return new Error(`VALIDATION_ERROR: ${error.message}`)
        }
        
        // Ошибки авторизации - не повторяем
        if (error.message.includes('unauthorized') || error.message.includes('403')) {
          return new Error(`AUTH_ERROR: ${error.message}`)
        }
      }
      
      return error instanceof Error ? error : new Error(String(error))
    }
  )
}

/**
 * Валидация входных данных
 */
const validateInput = (
  input: {ActionName}Input
): TaskEither<Error, {ActionName}Input> => {
  return validate({ActionName}InputSchema, input)
}

/**
 * Валидация результата
 */
const validateResult = (
  result: unknown
): TaskEither<Error, {ActionName}Output> => {
  return validate({ActionName}OutputSchema, result)
}

/**
 * Сохранение результата в БД через Drizzle ORM с транзакцией
 */
const saveResultToDB = (
  result: unknown,
  brain: AvatarBrain
): TaskEither<Error, void> => {
  return tryCatchAsync(
    async () => {
      // Используй транзакцию Drizzle для атомарности
      await db.transaction(async (tx) => {
        // 1. Сохранение операции
        const [operation] = await tx
          .insert(operations)
          .values({
            user_id: brain.id,
            type: '{operation-type}',
            service_type: '{service-type}',
            status: 'completed',
            cost: {
              stars: cost,
            },
            result: result as any,
            metadata: {
              agent: '{AGENT-NAME}',
              action: '{action-name}',
              timestamp: new Date(),
            },
          })
          .returning()
        
        // 2. Сохранение ассета (если есть)
        if (result && typeof result === 'object' && 'asset' in result) {
          await tx.insert(assets).values({
            user_id: brain.id,
            type: '{asset-type}',
            url: (result as any).asset.url,
            metadata: {
              operation_id: operation.id,
              agent: '{AGENT-NAME}',
            },
          })
        }
        
        // 3. Обновление статистики пользователя
        await tx
          .update(users)
          .set({
            updated_at: new Date(),
          })
          .where(eq(users.id, brain.id))
      })
    },
    (error) => {
      // Логируем ошибку БД
      logger.error('Failed to save result to DB', {
        error: error instanceof Error ? error.message : String(error),
        userId: brain.id,
        agent: '{AGENT-NAME}',
      })
      return error instanceof Error ? error : new Error(String(error))
    }
  )
}

/**
 * Списание баланса атомарно с проверкой и блокировкой
 */
const deductBalance = (
  brain: AvatarBrain,
  cost: number
): TaskEither<Error, void> => {
  return tryCatchAsync(
    async () => {
      // Используй транзакцию Drizzle для атомарности
      await db.transaction(async (tx) => {
        // 1. Блокируем строку баланса для атомарности (SELECT FOR UPDATE)
        const [balance] = await tx
          .select()
          .from(balances)
          .where(eq(balances.user_id, brain.id))
          .for('update') // Блокировка строки
          .limit(1)
        
        if (!balance) {
          throw new Error('Balance not found')
        }
        
        // 2. Проверяем достаточность баланса
        const currentStars = (balance.currencies as any)?.stars || 0
        if (currentStars < cost) {
          throw new Error(`Insufficient balance. Current: ${currentStars}⭐, Required: ${cost}⭐`)
        }
        
        // 3. Атомарное списание баланса через SQL функцию
        await tx.execute(sql`
          UPDATE balances
          SET currencies = jsonb_set(
            currencies,
            '{stars}',
            ((currencies->>'stars')::int - ${cost})::text::jsonb
          ),
          updated_at = NOW()
          WHERE user_id = ${brain.id}
        `)
        
        // 4. Создаем запись об операции для аудита
        await tx.insert(operations).values({
          user_id: brain.id,
          type: 'BALANCE_DEDUCTION',
          service_type: '{service-type}',
          status: 'completed',
          cost: {
            stars: cost,
          },
          metadata: {
            agent: '{AGENT-NAME}',
            action: '{action-name}',
            previous_balance: currentStars,
            new_balance: currentStars - cost,
          },
        })
      })
    },
    (error) => {
      // Логируем ошибку списания баланса
      logger.error('Failed to deduct balance', {
        error: error instanceof Error ? error.message : String(error),
        userId: brain.id,
        cost,
        agent: '{AGENT-NAME}',
      })
      return error instanceof Error ? error : new Error(String(error))
    }
  )
}
```

### Шаг 5: Создание провайдера (Provider)

```typescript
// src/agents/{agent-name}/providers/{provider-name}.ts
import { Provider, ProviderResult, IAgentRuntime, Memory, State } from '@elizaos/core'
import { TaskEither, tryCatchAsync } from '@/core/functional/utils/result'
import { pipe, chain, map } from '@/core/functional/utils/composition'
import { db } from '@/core/drizzle/client'

/**
 * Провайдер: {ProviderName}
 * 
 * Предоставляет контекст для LLM
 */
export const {providerName}Provider: Provider = {
  name: '{PROVIDER_NAME}',
  description: '{Описание что предоставляет провайдер}',
  
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<ProviderResult> => {
    const result = await pipe(
      // 1. Получение данных
      getProviderData(message, state),
      chain(data =>
        pipe(
          // 2. Форматирование для LLM
          formatForLLM(data),
          map(formatted => ({
            content: [
              {
                type: 'text',
                text: formatted,
              },
            ],
          }))
        )
      )
    )
    
    if (result.isLeft()) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка получения данных: ${result.value.message}`,
          },
        ],
      }
    }
    
    return result.value
  },
}

/**
 * Получение данных для провайдера
 */
const getProviderData = (
  message: Memory,
  state?: State
): TaskEither<Error, unknown> => {
  return tryCatchAsync(
    async () => {
      // Получи данные из БД или другого источника
      // Используй Drizzle ORM
      return {}
    },
    (error) => error as Error
  )
}

/**
 * Форматирование данных для LLM
 */
const formatForLLM = (data: unknown): TaskEither<Error, string> => {
  return tryCatchAsync(
    async () => {
      // Форматируй данные в текст для LLM
      return JSON.stringify(data, null, 2)
    },
    (error) => error as Error
  )
}
```

### Шаг 6: Создание сервиса (Service)

```typescript
// src/agents/{agent-name}/services/{service-name}.ts
import { Service, IAgentRuntime, logger } from '@elizaos/core'
import { TaskEither, tryCatchAsync } from '@/core/functional/utils/result'

/**
 * Сервис: {ServiceName}
 * 
 * Фоновый сервис для долгоживущих задач
 */
export const {serviceName}Service: Service = {
  name: '{service-name}',
  description: '{Описание сервиса}',
  
  initialize: async (runtime: IAgentRuntime): Promise<void> => {
    logger.info('[{ServiceName}] Initializing service...')
    
    // Инициализация сервиса
    // Настройка подключений, загрузка конфигурации и т.д.
  },
  
  start: async (runtime: IAgentRuntime): Promise<void> => {
    logger.info('[{ServiceName}] Starting service...')
    
    // Запуск фоновых задач
    // setInterval, cron jobs и т.д.
    
    // Пример:
    // setInterval(async () => {
    //   await performBackgroundTask()
    // }, 60 * 1000) // Каждую минуту
  },
  
  stop: async (): Promise<void> => {
    logger.info('[{ServiceName}] Stopping service...')
    
    // Остановка фоновых задач
    // Очистка ресурсов
  },
}

/**
 * Фоновая задача
 */
const performBackgroundTask = async (): Promise<void> => {
  // Реализуй фоновую задачу здесь
}
```

### Шаг 7: Главный файл агента

```typescript
// src/agents/{agent-name}/index.ts
import { UniversalAgent } from './types'
import { {actionName}Action } from './actions'
import { {providerName}Provider } from './providers'
import { {serviceName}Service } from './services'
import { TaskEither, tryCatchAsync, right } from '@/core/functional/utils/result'
import { pipe, chain } from '@/core/functional/utils/composition'
import { VIBEQueen } from '@/agents/vibe-queen-coordinator'
import { VIBESentry } from '@/agents/vibe-sentry'

/**
 * Агент: {AGENT-NAME}
 * 
 * Описание: {Полное описание агента}
 */
export const {AgentName}Agent: UniversalAgent = {
  name: '{AGENT-NAME}',
  version: '1.0.0',
  description: '{Описание агента}',
  
  // Действия
  actions: {
    '{action-name}': {actionName}Action.handler,
  },
  
  // Провайдеры
  providers: {
    '{PROVIDER_NAME}': {providerName}Provider.get,
  },
  
  // Сервисы
  services: {
    '{service-name}': {serviceName}Service,
  },
  
  // Конфигурация
  config: {
    // Настройки агента
    enabled: true,
    timeout: 30000,
  },
  
  /**
   * Инициализация агента
   */
  init: async (): Promise<TaskEither<Error, void>> => {
    return tryCatchAsync(
      async () => {
        // 1. Инициализация логирования
        await VIBESentry.initLoggingForAgent({
          agent: '{AGENT-NAME}',
          version: '1.0.0',
        })
        
        // 2. Инициализация сервисов
        await {serviceName}Service.initialize({} as any)
        
        // 3. Регистрация в VIBE-QUEEN
        await {AgentName}Agent.registerWithQueen()
        
        return right(undefined)
      },
      (error) => error as Error
    )
  },
  
  /**
   * Уничтожение агента
   */
  destroy: async (): Promise<TaskEither<Error, void>> => {
    return tryCatchAsync(
      async () => {
        // 1. Остановка сервисов
        await {serviceName}Service.stop()
        
        // 2. Очистка ресурсов
        
        return right(undefined)
      },
      (error) => error as Error
    )
  },
  
  /**
   * Регистрация в VIBE-QUEEN
   */
  registerWithQueen: async (): Promise<TaskEither<Error, void>> => {
    return tryCatchAsync(
      async () => {
        await VIBEQueen.registerAgent({
          name: '{AGENT-NAME}',
          version: '1.0.0',
          description: '{Описание агента}',
          actions: Object.keys({AgentName}Agent.actions),
          providers: Object.keys({AgentName}Agent.providers),
          services: Object.keys({AgentName}Agent.services),
        })
        
        return right(undefined)
      },
      (error) => error as Error
    )
  },
}

export default {AgentName}Agent
```

### Шаг 8: Создание тестов

```typescript
// src/agents/{agent-name}/__tests__/actions.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runTaskEither } from '@/core/functional/utils/result'
import { {actionName}Action } from '../actions'
import { createMockBrain } from '@/core/test-utils'

describe('{AgentName} - {ActionName}', () => {
  beforeEach(() => {
    // Настройка моков перед каждым тестом
  })
  
  describe('validate', () => {
    it('should return Right(true) when input is valid', async () => {
      const brain = createMockBrain({ balance: { stars: 100 } })
      const context = { field1: 'test', field2: 10 }
      
      const result = await runTaskEither(
        {actionName}Action.validate(brain, context)
      )
      
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right).toBe(true)
      }
    })
    
    it('should return Left(Error) when balance is insufficient', async () => {
      const brain = createMockBrain({ balance: { stars: 5 } })
      const context = { field1: 'test', field2: 10 }
      
      const result = await runTaskEither(
        {actionName}Action.validate(brain, context)
      )
      
      expect(result._tag).toBe('Left')
    })
  })
  
  describe('handler', () => {
    it('should execute action successfully', async () => {
      const brain = createMockBrain({ balance: { stars: 100 } })
      const context = { field1: 'test', field2: 10 }
      
      const result = await runTaskEither(
        {actionName}Action.handler(brain, context)
      )
      
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right.success).toBe(true)
      }
    })
  })
})
```

---

## 🎭 Создание персональной личности

### От цифрового агента к персональной личности

```typescript
// src/agents/{agent-name}/personality.ts
import { Personality } from '@/core/types'

/**
 * Персональность агента
 * 
 * Определяет характер, стиль общения, предпочтения агента
 */
export const {agentName}Personality: Personality = {
  // Имя и идентификация
  name: '{Имя агента}',
  role: '{Роль агента}',
  
  // Характер
  traits: {
    // Основные черты характера (0-1)
    creativity: 0.8,
    analytical: 0.7,
    friendliness: 0.9,
    professionalism: 0.8,
    humor: 0.6,
  },
  
  // Стиль общения
  communication: {
    // Формальность (0-1, где 0 - неформальный, 1 - формальный)
    formality: 0.6,
    
    // Использование эмодзи (0-1)
    emojiUsage: 0.7,
    
    // Длина сообщений (0-1, где 0 - короткие, 1 - длинные)
    messageLength: 0.5,
    
    // Тон (friendly, professional, casual, etc.)
    tone: 'friendly',
  },
  
  // Предпочтения
  preferences: {
    // Предпочитаемые темы
    topics: ['{тема1}', '{тема2}'],
    
    // Стиль работы
    workStyle: '{стиль работы}',
    
    // Подход к решению проблем
    problemSolving: '{подход}',
  },
  
  // Контекстные ответы
  responses: {
    greeting: [
      'Привет! Я {имя}, готов помочь! 🐝',
      'Здравствуй! Чем могу помочь?',
    ],
    farewell: [
      'До встречи! Удачи! 🐝',
      'Было приятно помочь!',
    ],
    error: [
      'Упс, что-то пошло не так. Давай попробуем еще раз!',
      'Произошла ошибка, но я уже работаю над исправлением!',
    ],
  },
}

/**
 * Генерация персонального ответа
 */
export const generatePersonalizedResponse = (
  personality: Personality,
  context: {
    action: string
    user: unknown
    result: unknown
  }
): string => {
  // Используй personality для генерации персонального ответа
  // Учитывай traits, communication, preferences
  
  const { traits, communication, responses } = personality
  
  // Пример генерации ответа
  if (context.action === 'greeting') {
    return responses.greeting[
      Math.floor(Math.random() * responses.greeting.length)
    ]
  }
  
  // Генерация ответа на основе traits
  if (traits.friendliness > 0.8) {
    return `Отлично! Я рад помочь тебе! 🐝`
  }
  
  return `Готово! Результат: ${JSON.stringify(context.result)}`
}
```

---

## 📋 Детальный чек-лист создания агента

### Подготовка
- [ ] Определил назначение агента
- [ ] Определил зависимости от других агентов
- [ ] Создал структуру директорий
- [ ] Прочитал FUNCTIONALITY_DOCUMENTATION.md
- [ ] Изучил существующие агенты для паттернов
- [ ] Определил требования к производительности

### Реализация: Схемы и типы
- [ ] Создал Zod схемы для валидации входных данных
- [ ] Создал Zod схемы для валидации выходных данных
- [ ] Экспортировал TypeScript типы из схем
- [ ] Добавил валидацию вложенных объектов
- [ ] Добавил кастомные валидаторы где нужно

### Реализация: Действия (Actions)
- [ ] Реализовал validate функцию для каждого действия
- [ ] Реализовал handler функцию в функциональном стиле
- [ ] Добавил проверку баланса (если нужно)
- [ ] Добавил проверку прав доступа (если нужно)
- [ ] Добавил rate limiting
- [ ] Добавил retry логику для внешних API
- [ ] Добавил timeout для долгих операций
- [ ] Добавил кэширование (если применимо)
- [ ] Добавил категоризацию ошибок
- [ ] Добавил логирование через VIBE-SENTRY
- [ ] Добавил метрики производительности

### Реализация: Провайдеры (Providers)
- [ ] Реализовал get функцию для каждого провайдера
- [ ] Добавил кэширование данных провайдера
- [ ] Форматировал данные для LLM
- [ ] Обработал ошибки получения данных
- [ ] Добавил fallback значения

### Реализация: Сервисы (Services)
- [ ] Реализовал initialize функцию
- [ ] Реализовал start функцию с фоновыми задачами
- [ ] Реализовал stop функцию с очисткой ресурсов
- [ ] Добавил обработку ошибок в фоновых задачах
- [ ] Добавил graceful shutdown

### Реализация: База данных
- [ ] Использовал Drizzle ORM для всех операций
- [ ] Использовал транзакции для атомарности
- [ ] Добавил блокировки (SELECT FOR UPDATE) где нужно
- [ ] Оптимизировал запросы с индексами
- [ ] Добавил обработку ошибок БД

### Реализация: Интеграции
- [ ] Интегрировал с VIBE-SENTRY для логирования
- [ ] Интегрировал с VIBE-QUEEN для координации
- [ ] Интегрировал с VIBE-RAINBOW-BRIDGE для уведомлений (если нужно)
- [ ] Интегрировал с внешними API (если нужно)
- [ ] Интегрировал с Inngest для асинхронных задач (если нужно)

### Тестирование: Unit тесты
- [ ] Написал тесты для validate функции
- [ ] Написал тесты для handler функции
- [ ] Написал тесты для провайдеров
- [ ] Написал тесты для сервисов
- [ ] Написал тесты для утилит (retry, cache, rateLimit)
- [ ] Использовал функциональные моки
- [ ] Достиг 100% покрытия тестами

### Тестирование: Интеграционные тесты
- [ ] Написал интеграционные тесты с БД
- [ ] Написал интеграционные тесты с внешними API (моки)
- [ ] Написал тесты для полного пайплайна
- [ ] Протестировал обработку ошибок
- [ ] Протестировал retry логику

### Тестирование: E2E тесты
- [ ] Написал E2E тесты для основных сценариев
- [ ] Протестировал интеграцию с другими агентами
- [ ] Протестировал производительность

### Персональность
- [ ] Определил персональность агента (traits, communication, preferences)
- [ ] Создал Personality объект
- [ ] Реализовал генерацию персональных ответов
- [ ] Добавил контекстные ответы (greeting, farewell, error)
- [ ] Протестировал персональность в разных сценариях

### Оптимизация
- [ ] Оптимизировал запросы к БД
- [ ] Добавил кэширование где нужно
- [ ] Оптимизировал работу с внешними API (батчинг, pooling)
- [ ] Добавил мониторинг производительности
- [ ] Оптимизировал использование памяти

### Документация
- [ ] Написал README для агента
- [ ] Документировал все действия
- [ ] Документировал все провайдеры
- [ ] Документировал все сервисы
- [ ] Добавил примеры использования
- [ ] Добавил troubleshooting guide

### Интеграция
- [ ] Зарегистрировал агента в VIBE-QUEEN
- [ ] Обновил главную документацию
- [ ] Проверил интеграцию с другими агентами
- [ ] Протестировал в реальных условиях
- [ ] Настроил мониторинг и алерты

---

## 🎯 Примеры использования

### Пример 1: Создание простого агента

```typescript
// Создай агента для обработки текста
const textProcessorAgent: UniversalAgent = {
  name: 'TEXT-PROCESSOR',
  version: '1.0.0',
  description: 'Обрабатывает и анализирует текст',
  
  actions: {
    'process-text': async (input) => {
      // Обработка текста
      return right({ processed: true })
    },
  },
  
  // ... остальные поля
}
```

### Пример 2: Создание агента с персональностью

```typescript
// Создай агента с персональностью "Дружелюбный помощник"
const friendlyHelperPersonality: Personality = {
  name: 'Помощник',
  traits: {
    friendliness: 0.9,
    creativity: 0.7,
  },
  communication: {
    formality: 0.3,
    emojiUsage: 0.8,
    tone: 'friendly',
  },
  // ...
}
```

### Пример 3: Полный пример действия с всеми паттернами

```typescript
// src/agents/{agent-name}/actions/complete-example.ts
import { TaskEither, tryCatchAsync, right, left } from '@/core/functional/utils/result'
import { pipe, chain, map, tap } from '@/core/functional/utils/composition'
import { validate } from '@/core/validation/validate'
import { withLogging } from '@/core/sentry/withLogging'
import { withMetrics } from '../utils/metrics'
import { withCache } from '../utils/cache'
import { checkRateLimit } from '../utils/rateLimit'
import { retryWithBackoff } from '../utils/retry'
import { withTimeout } from '../utils/timeout'
import { categorizeError } from '../utils/errorHandler'
import { callExternalAPI } from '../utils/apiClient'
import { createInngestTask } from '../utils/inngest'
import { InputSchema, OutputSchema } from '../schemas'
import { db } from '@/core/drizzle/client'
import { operations, assets } from '@/core/drizzle/schema'
import { eq } from 'drizzle-orm'
import { AvatarBrain } from '@/core/types'
import { logger } from '@/core/logger'

export const completeExampleAction = {
  name: 'complete-example',
  description: 'Полный пример действия со всеми паттернами',
  
  handler: (
    brain: AvatarBrain,
    context: unknown
  ): TaskEither<Error, Output> => {
    return pipe(
      // 1. Rate limiting
      checkRateLimit({
        maxRequests: 10,
        windowMs: 60000,
        key: `agent:${brain.id}:complete-example`,
      }),
      chain(() =>
        pipe(
          // 2. Валидация
          validate(InputSchema, context),
          chain(validatedInput =>
            pipe(
              // 3. Кэширование (если результат можно кэшировать)
              withCache(
                async () => {
                  return pipe(
                    // 4. Timeout
                    withTimeout(
                      pipe(
                        // 5. Retry с экспоненциальной задержкой
                        retryWithBackoff(
                          () =>
                            pipe(
                              // 6. Вызов внешнего API
                              callExternalAPI(
                                {
                                  baseUrl: 'https://api.example.com',
                                  apiKey: process.env.API_KEY!,
                                  timeout: 30000,
                                  retries: 3,
                                },
                                '/endpoint',
                                {
                                  method: 'POST',
                                  body: JSON.stringify(validatedInput),
                                }
                              ),
                              chain(apiResult =>
                                pipe(
                                  // 7. Сохранение в БД
                                  saveToDB(apiResult, brain),
                                  map(() => apiResult)
                                )
                              )
                            ),
                          {
                            maxRetries: 3,
                            delays: [1000, 2000, 4000],
                            retryableErrors: ['NETWORK_ERROR', 'RATE_LIMIT'],
                          }
                        ),
                        // 8. Создание асинхронной задачи (если нужно)
                        chain(result =>
                          pipe(
                            createInngestTask('{agent-name}/process-result', {
                              userId: brain.id,
                              result,
                            }),
                            map(() => result)
                          )
                        )
                      ),
                      30000
                    )
                  )
                },
                () => `cache:${brain.id}:${JSON.stringify(validatedInput)}`,
                300 // TTL 5 минут
              ),
              // 9. Метрики
              tap(result => {
                if (result.isRight()) {
                  logger.info('Action completed successfully', {
                    agent: '{AGENT-NAME}',
                    action: 'complete-example',
                    userId: brain.id,
                  })
                }
              })
            )
          )
        )
      )
    )
  },
}
```

---

## 📚 Ссылки на документацию

- **Основная документация**: `FUNCTIONALITY_DOCUMENTATION.md`
- **Функциональное программирование**: Раздел "Лучшие практики функционального программирования"
- **Drizzle ORM**: Раздел "Drizzle ORM: Лучшие практики и инструменты"
- **Zod валидация**: Раздел "Валидация данных с Zod"
- **Тестирование**: Раздел "Тестирование в агентной разработке"

---

---

## 🎯 Быстрый старт: Создание агента за 5 шагов

### Шаг 1: Копируй структуру (2 минуты)

```bash
# Создай директорию агента
mkdir -p src/agents/my-new-agent/{actions,providers,services,schemas,types,utils,__tests__}

# Скопируй базовые файлы из шаблона
cp UNIVERSAL_AGENT_TEMPLATE.md src/agents/my-new-agent/README.md
```

### Шаг 2: Определи схемы (10 минут)

```typescript
// src/agents/my-new-agent/schemas/index.ts
export const MyActionInputSchema = z.object({
  // Твои поля
})

export const MyActionOutputSchema = z.object({
  // Твои поля
})
```

### Шаг 3: Реализуй действие (30 минут)

```typescript
// src/agents/my-new-agent/actions/my-action.ts
export const myAction = {
  name: 'my-action',
  validate: (brain, context) => { /* ... */ },
  handler: (brain, context) => { /* ... */ },
}
```

### Шаг 4: Напиши тесты (20 минут)

```typescript
// src/agents/my-new-agent/__tests__/actions.test.ts
describe('myAction', () => {
  it('should work', () => { /* ... */ })
})
```

### Шаг 5: Интегрируй (10 минут)

```typescript
// src/agents/my-new-agent/index.ts
export const MyNewAgent: UniversalAgent = {
  // Используй шаблон
}
```

**Итого: ~1 час для простого агента!** ⚡

---

## 📊 Сравнение: Простой vs Продвинутый агент

| Аспект | Простой агент | Продвинутый агент |
|--------|---------------|-------------------|
| **Время создания** | 1-2 часа | 3-6 часов |
| **Retry логика** | ❌ | ✅ |
| **Rate limiting** | ❌ | ✅ |
| **Кэширование** | ❌ | ✅ |
| **Метрики** | ❌ | ✅ |
| **Категоризация ошибок** | ❌ | ✅ |
| **Timeout** | ❌ | ✅ |
| **Inngest интеграция** | ❌ | ✅ |
| **Персональность** | Базовая | Полная |
| **Тесты** | Unit | Unit + Integration + E2E |

**Рекомендация**: Начинай с простого агента, добавляй продвинутые паттерны по мере необходимости!

---

## 🚨 Частые ошибки и как их избежать

### Ошибка 1: Забыл TaskEither

```typescript
// ❌ НЕПРАВИЛЬНО
const handler = async (input: string) => {
  const result = await someOperation(input)
  return result
}

// ✅ ПРАВИЛЬНО
const handler = (input: string): TaskEither<Error, Result> => {
  return tryCatchAsync(
    async () => await someOperation(input),
    (error) => error as Error
  )
}
```

### Ошибка 2: Мутация данных

```typescript
// ❌ НЕПРАВИЛЬНО
const updateData = (data: Data) => {
  data.field = 'new value' // Мутация!
  return data
}

// ✅ ПРАВИЛЬНО
const updateData = (data: Data): Data => {
  return {
    ...data,
    field: 'new value', // Новый объект
  }
}
```

### Ошибка 3: Игнорирование ошибок

```typescript
// ❌ НЕПРАВИЛЬНО
const handler = async (input: string) => {
  try {
    return await riskyOperation(input)
  } catch (error) {
    return null // Игнорируем ошибку!
  }
}

// ✅ ПРАВИЛЬНО
const handler = (input: string): TaskEither<Error, Result> => {
  return pipe(
    riskyOperation(input),
    chain(result => right(result)),
    // Ошибки обрабатываются через TaskEither
  )
}
```

### Ошибка 4: Нет валидации

```typescript
// ❌ НЕПРАВИЛЬНО
const handler = (input: unknown) => {
  return processInput(input) // Нет валидации!
}

// ✅ ПРАВИЛЬНО
const handler = (input: unknown): TaskEither<Error, Result> => {
  return pipe(
    validate(InputSchema, input), // Валидация через Zod
    chain(validated => processInput(validated))
  )
}
```

### Ошибка 5: Нет логирования

```typescript
// ❌ НЕПРАВИЛЬНО
const handler = (input: string) => {
  return processInput(input) // Нет логирования!
}

// ✅ ПРАВИЛЬНО
const handler = (input: string) => {
  return withLogging(
    (input: string) => processInput(input),
    {
      agent: '{AGENT-NAME}',
      plugin: '{agent-name}',
      action: '{action-name}',
    }
  )(input)
}
```

---

## 🎓 Обучение: От простого к сложному

### Уровень 1: Базовый агент (1-2 часа)
- ✅ Базовая структура
- ✅ Одно действие
- ✅ Простая валидация
- ✅ Базовые тесты

### Уровень 2: Средний агент (2-4 часа)
- ✅ Несколько действий
- ✅ Провайдеры и сервисы
- ✅ Retry логика
- ✅ Rate limiting
- ✅ Полное тестирование

### Уровень 3: Продвинутый агент (4-6 часов)
- ✅ Все продвинутые паттерны
- ✅ Кэширование
- ✅ Метрики
- ✅ Inngest интеграция
- ✅ Полная персональность
- ✅ E2E тесты

---

**🐝 Универсальный шаблон готов! Теперь можно быстро создавать агентов любого типа с персональными личностями!**

> **💡 СОВЕТ**: Используй этот шаблон как основу для всех новых агентов  
> **⏱️ ВРЕМЯ**: 1-3 часа для простого агента, 4-6 часов для продвинутого  
> **🎭 ПЕРСОНАЛЬНОСТЬ**: Не забывай добавлять персональность для лучшего UX!  
> **📚 ПАТТЕРНЫ**: Используй продвинутые паттерны для production-ready агентов!

