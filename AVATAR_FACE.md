/Users/playra/vibee-agent/plugin-vibe-face-avatar

# 🎨 План реализации Лицо аватара (Avatar Face) - Детальный гайд для агента

> **🎯 Цель**: Реализовать единый плагин "Лицо аватара" (обучение моделей + генерация фото)  
> **📋 Статус**: Готов к реализации  
> **⏱️ Время**: 5-6 часов  
> **🐝 Приоритет**: Высокий (первая функция для проверки пайплайна)  
> **🔗 Связь**: Digital Avatar Body (обучение) + NeuroPhoto (генерация) = один плагин

---

## 📋 Обзор модуля

**Лицо аватара (Avatar Face)** - единый модуль, состоящий из двух взаимосвязанных функций:

1. **🤖 Digital Avatar Body** - обучение персональных LoRA моделей (создание банка моделей)
2. **📸 NeuroPhoto** - генерация фото из банка обученных моделей

### 🚨 КРИТИЧЕСКИ ВАЖНО:

- ✅ **Единый плагин**: Обе функции в одном ElizaOS плагине `vibe-avatar-face`
- ✅ **Банк моделей**: Digital Avatar Body создает модели → NeuroPhoto использует их
- ✅ **ТОЛЬКО пользовательские модели**: NeuroPhoto использует **ИСКЛЮЧИТЕЛЬНО** модели, которые пользователь обучил через Digital Avatar Body
- ✅ **НЕТ общих моделей**: Никаких Flux Schnell, SDXL и других общих моделей - только персональные LoRA модели пользователя
- ✅ **Связь**: Какие LoRA модели пользователь обучил, такие и доступны в NeuroPhoto
- ✅ Требует активную подписку
- ✅ Проверка баланса через централизованную функцию `calculateServiceCost()`
- ✅ Функциональный стиль: все через `TaskEither` и `pipe`
- ✅ Централизованное ценообразование: динамическое через общие функции

---

## 🏗️ Архитектура модуля

```
┌─────────────────────────────────────────────────────────────┐
│           Лицо аватара (Avatar Face) Plugin                │
│  (vibe-avatar-face)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────┐ │
│  │  Digital Avatar Body      │───▶│  User Models Bank     │ │
│  │  (Обучение моделей)       │    │  (Таблица user_models)│ │
│  │                           │    │                      │ │
│  │  • Выбор модели обучения  │    │  • model_url         │ │
│  │  • Загрузка фото (10-50)  │    │  • trigger_word      │ │
│  │  • Обучение через Fal.ai  │    │  • status            │ │
│  │  • Сохранение в БД        │    │  • gender            │ │
│  └──────────────────────────┘    └──────────────────────┘ │
│           │                                    ▲            │
│           │                                    │            │
│           └────────────────────────────────────┘            │
│                             │                               │
│                             ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NeuroPhoto                                          │  │
│  │  (Генерация фото из банка моделей)                   │  │
│  │                                                       │  │
│  │  • Получение моделей из банка                        │  │
│  │  • Выбор модели (если несколько)                     │  │
│  │  • Генерация с trigger_word и model_url              │  │
│  │  • Сохранение результатов                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Часть 1: Digital Avatar Body (Обучение моделей)

### 🚨 КРИТИЧЕСКИ ВАЖНО:

- ✅ **ТОЛЬКО пользовательские модели**: NeuroPhoto использует **ИСКЛЮЧИТЕЛЬНО** модели, которые пользователь обучил через "🤖 Цифровое тело аватара"
- ✅ **НЕТ общих моделей**: Никаких Flux Schnell, SDXL и других общих моделей - только персональные LoRA модели пользователя
- ✅ **Связь с Digital Avatar Body**: Какие LoRA модели пользователь обучил, такие и доступны в NeuroPhoto
- ✅ Требует активную подписку
- ✅ Наличие хотя бы одной обученной модели (обязательно!)
- ✅ Проверка баланса через централизованную функцию `calculateServiceCost('neuro_photo', { num_images })`
- ✅ Использование `trigger_word` из модели пользователя (например, "NEURO_SAGE")
- ✅ Использование `model_url` из модели пользователя (URL обученной LoRA модели)
- ✅ Сохранение результатов в БД
- ✅ Отправка изображения пользователю в Telegram

### Интерфейс Digital Avatar Body (Wizard Flow):

```
Step 1: Выбор модели обучения
  └─ Inline кнопки:
     • 🎨 Portrait Trainer (550⭐, 15-30 мин, 2500 шагов)
     • ⚡ Fast Training (220⭐, 10-15 мин, 1000 шагов)

Step 2: Выбор пола аватара
  └─ Inline кнопки:
     • Мужской ♂️
     • Женский ♀️

Step 3: Ввод названия модели
  └─ Текстовое поле (минимум 2 символа, максимум 50)
     • Автоматически санитизируется для Replicate API
     • Используется как trigger_word (в верхнем регистре)

Step 4: Загрузка изображений
  └─ Загрузка фото (минимум 10, максимум 25)
     • Валидация формата (JPG, PNG, WEBP)
     • Проверка размера (максимум 10MB)
     • Команда /done для завершения

Step 5: Запуск обучения
  └─ Создание ZIP архива
     • Отправка в Fal.ai для обучения
     • Сохранение записи в БД (таблица model_trainings)
     • Статус: 'training' → 'completed' / 'failed'
     • Уведомление пользователю при завершении
```

### Интерфейс NeuroPhoto (Wizard Flow):

```
Step 1: Получение пользовательских моделей
  └─ Запрос через getActiveUserModelsByType(telegramId, 'replicate')
     • Если моделей нет → сообщение: "Используйте '🤖 Цифровое тело аватара' для создания модели"
     • Если модель одна → автоматически выбирается
     • Если моделей несколько → Inline кнопки со списком моделей пользователя

Step 2: Ввод промпта
  └─ Текстовое поле (минимум 3 символа)
     • Автоматически добавляется trigger_word из модели пользователя
     • Автоматически добавляется gender из профиля пользователя

Step 3: Генерация изображения
  └─ Используется model_url из выбранной модели пользователя
     • Через Fal.ai (если модель поддерживает LoRA)
     • Или через Replicate (если model_url указывает на Replicate)
     • Автоматически генерируется 1 изображение

Step 4: Отправка результата
  └─ Изображение + метаданные (модель, trigger_word, промпт)
```

---

## 🚀 Пошаговый план реализации

### Фаза 1: Подготовка и генерация структуры (15 минут)

#### Шаг 1.1: Генерация плагина через CLI

```bash
# ОБЯЗАТЕЛЬНО: Использовать команду генерации!
cd /Users/playra/999-multibots-telegraf
elizaos plugins create vibe-avatar-face

# Проверка созданной структуры
cd packages/plugin-vibe-avatar-face
ls -la
```

**Ожидаемый результат:**

```
packages/plugin-vibe-avatar-face/
├── src/
│   ├── index.ts
│   ├── actions/
│   ├── providers/
│   ├── services/
│   └── types/
├── package.json
├── tsconfig.json
└── README.md
```

#### Шаг 1.2: Установка зависимостей

```bash
cd packages/plugin-vibe-avatar-face
npm install

# Или если используется bun
bun install
```

**Проверка зависимостей:**

- `@elizaos/core` - должен быть в package.json
- `zod` - для валидации
- `drizzle-orm` - для работы с БД
- `@/core/functional/utils/result` - для TaskEither
- `@/core/functional/utils/composition` - для pipe

#### Шаг 1.3: Проверка структуры проекта

```bash
# Проверка что плагин создан правильно
cat src/index.ts
# Должен экспортировать объект Plugin

cat package.json
# Должен содержать зависимости от @elizaos/core
```

---

### Фаза 2: Создание типов и схем (30 минут)

#### Шаг 2.1: Создание Zod схем

**Файл**: `src/types/schemas.ts`

```typescript
import { z } from "zod";

/**
 * Схема входных данных для генерации изображения
 */
export const GenerateImageInputSchema = z.object({
  prompt: z.string().min(3, "Промпт должен быть минимум 3 символа"),
  modelId: z.string().uuid().optional(), // ID модели пользователя (если есть)
  modelUrl: z.string().url().optional(), // URL модели Replicate (если общая)
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:3"]).default("9:16"),
  numImages: z.number().int().min(1).max(4).default(1),
  negativePrompt: z.string().optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

/**
 * Схема результата генерации
 */
export const GenerateImageOutputSchema = z.object({
  success: z.boolean(),
  imageUrls: z.array(z.string().url()),
  metadata: z.object({
    prompt: z.string(),
    model: z.string(),
    generationTime: z.number(),
    loraUsed: z.boolean().optional(),
    triggerWord: z.string().optional(),
  }),
  error: z.string().optional(),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Схема контекста действия
 */
export const NeuroPhotoActionContextSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string(),
  prompt: z.string().min(3),
  modelId: z.string().uuid().optional(),
  modelUrl: z.string().url().optional(),
  userId: z.string().uuid(),
});

export type NeuroPhotoActionContext = z.infer<
  typeof NeuroPhotoActionContextSchema
>;
```

#### Шаг 2.2: Создание TypeScript типов

**Файл**: `src/types/index.ts`

```typescript
export * from "./schemas";

/**
 * Конфигурация сервиса генерации изображений
 */
export interface ImageGenerationServiceConfig {
  apiKey: string;
  defaultModel: string;
  timeout: number;
  maxRetries: number;
  provider: "replicate" | "fal";
}

/**
 * Опции генерации изображения
 */
export interface GenerateImageOptions {
  prompt: string;
  modelId?: string;
  modelUrl?: string;
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:3";
  numImages?: number;
  negativePrompt?: string;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
}

/**
 * Результат генерации изображения
 */
export interface ImageGenerationResult {
  success: boolean;
  imageUrls: string[];
  metadata: {
    prompt: string;
    model: string;
    generationTime: number;
    loraUsed?: boolean;
    triggerWord?: string;
  };
  error?: string;
}
```

---

### Фаза 3: Создание универсальной системы провайдеров (60 минут)

> **🎯 ЦЕЛЬ**: Создать расширяемую систему провайдеров, которая легко позволяет добавлять новые провайдеры и модели без изменения основного кода.

#### Шаг 3.1: Создание интерфейса провайдера изображений

**Файл**: `src/types/provider.interface.ts`

```typescript
import { TaskEither } from "@/core/functional/utils/result";
import { GenerateImageOptions, ImageGenerationResult } from "./index";

/**
 * Универсальный интерфейс для всех провайдеров генерации изображений
 */
export interface ImageGenerationProvider {
  /** Уникальное имя провайдера */
  name: string;

  /** Описание возможностей провайдера */
  description: string;

  /** Поддерживаемые модели */
  supportedModels: string[];

  /** Проверка здоровья провайдера */
  healthCheck(): TaskEither<Error, { status: "healthy" | "unhealthy" }>;

  /** Генерация изображения */
  generateImage(
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult>;

  /** Получение информации о модели */
  getModelInfo(modelId: string): TaskEither<Error, ModelInfo>;

  /** Получение списка доступных моделей */
  listModels(): TaskEither<Error, ModelInfo[]>;
}

/**
 * Информация о модели
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  pricePerImage: number;
  estimatedTime: number;
  supportedFeatures: string[];
  aspectRatios: string[];
  maxImages: number;
}
```

#### Шаг 3.2: Создание реестра провайдеров

**Файл**: `src/services/provider-registry.ts`

```typescript
import { ImageGenerationProvider } from "../types/provider.interface";
import { TaskEither, right, left } from "@/core/functional/utils/result";
import { pipe, chain } from "@/core/functional/utils/composition";

/**
 * Реестр всех провайдеров генерации изображений
 * Функциональный стиль, легко расширяемый
 */
export class ImageProviderRegistry {
  private providers = new Map<string, ImageGenerationProvider>();

  /**
   * Регистрация нового провайдера
   */
  register(provider: ImageGenerationProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`✅ Зарегистрирован провайдер: ${provider.name}`);
  }

  /**
   * Получение провайдера по имени
   */
  get(name: string): ImageGenerationProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Получение всех провайдеров
   */
  getAll(): ImageGenerationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Получение здоровых провайдеров
   */
  async getHealthyProviders(): Promise<ImageGenerationProvider[]> {
    const healthy: ImageGenerationProvider[] = [];

    for (const provider of this.providers.values()) {
      const health = await provider.healthCheck()();
      if (health.isRight() && health.value.status === "healthy") {
        healthy.push(provider);
      }
    }

    return healthy;
  }

  /**
   * Получение лучшего провайдера (по умолчанию первый здоровый)
   */
  async getBestProvider(): Promise<ImageGenerationProvider | undefined> {
    const healthy = await this.getHealthyProviders();
    return healthy[0];
  }
}

// Глобальный экземпляр реестра
export const imageProviderRegistry = new ImageProviderRegistry();
```

#### Шаг 3.3: Работа с пользовательскими моделями (НЕ конфигурация общих моделей!)

**🚨 ВАЖНО**: NeuroPhoto НЕ использует общие модели! Только пользовательские LoRA модели из таблицы `user_models`.

**Файл**: `src/types/user-model.interface.ts`

```typescript
/**
 * Пользовательская модель (обученная через Digital Avatar Body)
 * Это ЕДИНСТВЕННЫЙ тип модели для NeuroPhoto
 */
export interface UserModel {
  id: string; // UUID
  telegram_id: number;
  bot_name: string;
  model_name: string;
  model_url: string; // URL обученной LoRA модели (Replicate или Fal.ai)
  model_key?: string; // Альтернативный ключ
  trigger_word: string; // Например, "NEURO_SAGE" - добавляется в промпт
  gender?: "male" | "female" | "person"; // Из профиля пользователя

  // Обучение
  status: "training" | "completed" | "failed";
  training_steps?: number;
  training_model?: "flux-lora-portrait-trainer" | "flux-lora-fast-training";

  // Команда (общие модели)
  is_team_model?: boolean;
  team_id?: string;

  // Метаданные
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

/**
 * Получение активных моделей пользователя
 * Функциональный стиль с TaskEither
 */
export function getUserModelsTask(
  telegramId: number,
  botName: string
): TaskEither<Error, UserModel[]> {
  return tryCatchAsync(
    async () => {
      const { getActiveUserModelsByType } = await import(
        "@/core/supabase/getActiveUserModelsByType"
      );
      const models = await getActiveUserModelsByType(telegramId, "replicate");
      return models.filter(
        (m) => m.status === "completed" && m.is_active
      ) as UserModel[];
    },
    (error) => (error instanceof Error ? error : new Error(String(error)))
  );
}
```

**УДАЛЕНО**: Весь раздел с `IMAGE_MODELS` - он не нужен! NeuroPhoto работает только с пользовательскими моделями.

#### Шаг 3.4: Удаление провайдеров для общих моделей

**🚨 ВАЖНО**: Провайдеры для общих моделей (ReplicateProvider, FalProvider) НЕ нужны для NeuroPhoto!

NeuroPhoto работает напрямую с:

1. **Пользовательскими моделями** из таблицы `user_models`
2. **model_url** из модели пользователя (уже содержит URL обученной LoRA)
3. **trigger_word** из модели пользователя (добавляется в промпт)

**Вместо провайдеров используем**:

- `getActiveUserModelsByType(telegramId, 'replicate')` - получение моделей пользователя
- `generateNeuroPhotoHybrid()` или `generateNeuroPhotoDirect()` - генерация с использованием `model_url` и `trigger_word` из модели пользователя

**УДАЛЕНО**: Все разделы с общими моделями (IMAGE_MODELS, ReplicateProvider, FalProvider, provider-registry) - они не нужны для NeuroPhoto!
description: 'Fast, high-quality image generation',
provider: 'replicate',
apiModel: 'black-forest-labs/flux-schnell',
pricing: {
type: 'fixed',
baseCostUSD: 0.003, // Себестоимость в USD (будет рассчитано через usdToStars)
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
},
status: 'active',
},

flux_pro: {
id: 'flux_pro',
name: 'Flux Pro',
nameRu: 'Flux Pro',
description: 'Premium quality image generation',
provider: 'replicate',
apiModel: 'black-forest-labs/flux-pro',
pricing: {
type: 'fixed',
baseCostUSD: 0.055, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
},
status: 'active',
},

flux_ultra: {
id: 'flux_ultra',
name: 'Flux 1.1 Pro Ultra',
nameRu: 'Flux 1.1 Pro Ultra',
description: 'Ultra-realistic photorealistic images',
provider: 'replicate',
apiModel: 'black-forest-labs/flux-1.1-pro-ultra',
pricing: {
type: 'fixed',
baseCostUSD: 0.06, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
},
status: 'active',
},

sdxl: {
id: 'sdxl',
name: 'SDXL',
nameRu: 'SDXL',
description: 'Stable Diffusion XL - reliable and consistent',
provider: 'replicate',
apiModel: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
pricing: {
type: 'fixed',
baseCostUSD: 0.04, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
},
status: 'active',
},

sd3: {
id: 'sd3',
name: 'Stable Diffusion 3.5 Large Turbo',
nameRu: 'Stable Diffusion 3.5 Large Turbo',
description: 'Latest SD3.5 with turbo speed',
provider: 'replicate',
apiModel: 'stability-ai/stable-diffusion-3.5-large-turbo',
pricing: {
type: 'fixed',
baseCostUSD: 0.04, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
},
status: 'active',
},

recraft_v3: {
id: 'recraft_v3',
name: 'Recraft V3',
nameRu: 'Recraft V3',
description: 'High-quality image generation with SVG support',
provider: 'replicate',
apiModel: 'recraft-ai/recraft-v3',
pricing: {
type: 'fixed',
baseCostUSD: 0.022, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
},
status: 'active',
},

photon: {
id: 'photon',
name: 'Luma Photon',
nameRu: 'Luma Photon',
description: 'Photorealistic image generation',
provider: 'replicate',
apiModel: 'luma/photon',
pricing: {
type: 'fixed',
baseCostUSD: 0.03, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16', '4:3'],
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
},
status: 'active',
},

// ==================== FAL.AI MODELS ====================

fal_flux_lora: {
id: 'fal_flux_lora',
name: 'Fal.ai Flux LoRA',
nameRu: 'Fal.ai Flux LoRA',
description: 'Flux with LoRA support for personalized images',
provider: 'fal',
apiModel: 'fal-ai/flux-lora',
pricing: {
type: 'fixed',
baseCostUSD: 0.003, // Себестоимость в USD (аналогично Flux Schnell)
},
apiSettings: {
aspectRatios: ['9:16'], // Vertical for social media
maxImages: 4,
supportsNegativePrompt: true,
supportsSeed: true,
supportsSteps: true,
supportsGuidanceScale: true,
supportsLoRA: true, // ✅ Поддержка LoRA
},
status: 'active',
notes: 'Supports LoRA for personalized character generation',
},

// ==================== KIE.AI MODELS ====================

kie_gpt4o_image: {
id: 'kie_gpt4o_image',
name: 'GPT-4o Image',
nameRu: 'GPT-4o Image',
description: 'Accurate text rendering in images',
provider: 'kie',
apiModel: 'gpt-4o-image',
pricing: {
type: 'fixed',
baseCostUSD: 0.1, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16'],
maxImages: 1,
supportsNegativePrompt: false,
},
status: 'active',
notes: 'Best for text rendering in images',
},

kie_flux_kontext: {
id: 'kie_flux_kontext',
name: 'FLUX.1 Kontext',
nameRu: 'FLUX.1 Kontext',
description: 'Consistent character generation',
provider: 'kie',
apiModel: 'flux-1-kontext',
pricing: {
type: 'fixed',
baseCostUSD: 0.08, // Себестоимость в USD
},
apiSettings: {
aspectRatios: ['1:1', '16:9', '9:16'],
maxImages: 4,
supportsNegativePrompt: true,
},
status: 'active',
notes: 'Best for character consistency',
},
}

/\*\*

- Получение модели по ID
  \*/
  export function getImageModel(id: string): ImageModelConfig | undefined {
  return IMAGE_MODELS[id]
  }

/\*\*

- Получение всех активных моделей
  \*/
  export function getActiveImageModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter(model => model.status === 'active')
  }

/\*\*

- Получение моделей по провайдеру
  \*/
  export function getImageModelsByProvider(provider: string): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter(
  model => model.provider === provider && model.status === 'active'
  )
  }

/\*\*

- Рассчитывает стоимость генерации NeuroPhoto
- Использует централизованную функцию ценообразования
- Функциональный стиль с TaskEither
  \*/
  export function calculateNeuroPhotoCostTask(
  numImages: number = 1
  ): TaskEither<Error, number> {
  return tryCatchAsync(
  async () => {
  const { calculateServiceCost } = await import('@/price/helpers/calculateServiceCost')
  // Централизованная функция расчета стоимости
  // Логика: 4⭐ за 1 изображение, умножается на количество
  return calculateServiceCost('neuro_photo', { num_images: numImages })
  },
  (error) => error instanceof Error ? error : new Error(String(error))
  )
  }

````

#### Шаг 3.4: Создание ReplicateProvider (реализация интерфейса)

**Файл**: `src/providers/replicateProvider.ts`

```typescript
import { ImageGenerationProvider, ModelInfo } from '../types/provider.interface'
import { TaskEither, tryCatchAsync, right, left } from '@/core/functional/utils/result'
import { pipe, chain } from '@/core/functional/utils/composition'
import { GenerateImageOptions, ImageGenerationResult } from '../types'
import { getImageModelsByProvider, getImageModel } from '../config/image-models.config'
import Replicate from 'replicate'

/**
 * Replicate Provider - реализация интерфейса ImageGenerationProvider
 * Поддерживает все модели Replicate (Flux, SDXL, SD3, Recraft, Photon и др.)
 */
export class ReplicateProvider implements ImageGenerationProvider {
  name = 'replicate'
  description = 'AI image generation using Replicate API with Flux, SDXL, SD3, Recraft, Photon and other models'

  private client: Replicate | null = null
  private apiKey: string | null = null

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new Replicate({ auth: apiKey })
  }

  get supportedModels(): string[] {
    return getImageModelsByProvider('replicate').map(model => model.id)
  }

  healthCheck(): TaskEither<Error, { status: 'healthy' | 'unhealthy' }> {
    return tryCatchAsync(
      async () => {
        // Простая проверка - пытаемся получить список моделей
        if (!this.client) {
          throw new Error('Replicate client не инициализирован')
        }
        return { status: 'healthy' as const }
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult> {
    if (!this.client) {
      return left(new Error('Replicate Provider не инициализирован'))
    }

    return tryCatchAsync(
      async () => {
        const startTime = Date.now()

        // Получаем конфигурацию модели
        const modelConfig = options.modelId
          ? getImageModel(options.modelId)
          : getImageModel('flux_schnell') // По умолчанию

        if (!modelConfig) {
          throw new Error(`Модель не найдена: ${options.modelId || 'flux_schnell'}`)
        }

        const modelUrl = modelConfig.apiModel
        const numImages = Math.min(options.numImages || 1, modelConfig.apiSettings.maxImages)

        // Подготовка input для Replicate
        const input: any = {
          prompt: options.prompt,
          num_outputs: numImages,
        }

        // Добавляем параметры в зависимости от поддержки модели
        if (options.aspectRatio && modelConfig.apiSettings.aspectRatios.includes(options.aspectRatio)) {
          input.aspect_ratio = options.aspectRatio
        }

        if (options.negativePrompt && modelConfig.apiSettings.supportsNegativePrompt) {
          input.negative_prompt = options.negativePrompt
        }

        if (options.steps && modelConfig.apiSettings.supportsSteps) {
          input.num_inference_steps = options.steps
        }

        if (options.guidanceScale && modelConfig.apiSettings.supportsGuidanceScale) {
          input.guidance_scale = options.guidanceScale
        }

        if (options.seed && modelConfig.apiSettings.supportsSeed) {
          input.seed = options.seed
        }

        // Добавляем базовые параметры из конфигурации
        if (modelConfig.apiSettings.baseInput) {
          Object.assign(input, modelConfig.apiSettings.baseInput)
        }

        // Генерация через Replicate
        const output = await this.client!.run(modelUrl as any, { input })
        const generationTime = Date.now() - startTime

        // Парсинг результата
        let imageUrls: string[]
        if (Array.isArray(output)) {
          imageUrls = output.filter((url) => typeof url === 'string')
        } else if (typeof output === 'string') {
          imageUrls = [output]
        } else if (output && typeof output === 'object' && 'output' in output) {
          const outputData = (output as any).output
          imageUrls = Array.isArray(outputData) ? outputData : [outputData]
        } else {
          throw new Error('Неожиданный формат ответа от Replicate')
        }

        return {
          success: true,
          imageUrls,
          metadata: {
            prompt: options.prompt,
            model: modelUrl,
            generationTime,
          },
        } as ImageGenerationResult
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  getModelInfo(modelId: string): TaskEither<Error, ModelInfo> {
    return tryCatchAsync(
      async () => {
        const modelConfig = getImageModel(modelId)
        if (!modelConfig) {
          throw new Error(`Модель не найдена: ${modelId}`)
        }

        return {
          id: modelConfig.id,
          name: modelConfig.name,
          provider: modelConfig.provider,
          description: modelConfig.description,
          pricePerImage: modelConfig.pricing.fixedPriceStars || 0,
          estimatedTime: 10, // Примерное время генерации
          supportedFeatures: [
            ...(modelConfig.apiSettings.supportsNegativePrompt ? ['negative-prompt'] : []),
            ...(modelConfig.apiSettings.supportsSeed ? ['seed'] : []),
            ...(modelConfig.apiSettings.supportsSteps ? ['steps'] : []),
            ...(modelConfig.apiSettings.supportsGuidanceScale ? ['guidance-scale'] : []),
            ...(modelConfig.apiSettings.supportsLoRA ? ['lora'] : []),
          ],
          aspectRatios: modelConfig.apiSettings.aspectRatios,
          maxImages: modelConfig.apiSettings.maxImages,
        }
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  listModels(): TaskEither<Error, ModelInfo[]> {
    return tryCatchAsync(
      async () => {
        const models = getImageModelsByProvider('replicate')
        return Promise.all(
          models.map(model => this.getModelInfo(model.id)())
        ).then(results =>
          results
            .filter(result => result.isRight())
            .map(result => (result as any).value)
        )
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }
}
````

#### Шаг 3.5: Создание FalProvider (для LoRA и персонализации)

**Файл**: `src/providers/falProvider.ts`

```typescript
import {
  ImageGenerationProvider,
  ModelInfo,
} from "../types/provider.interface";
import {
  TaskEither,
  tryCatchAsync,
  left,
} from "@/core/functional/utils/result";
import { GenerateImageOptions, ImageGenerationResult } from "../types";
import {
  getImageModelsByProvider,
  getImageModel,
} from "../config/image-models.config";
import { fal } from "@fal-ai/client";

/**
 * Fal.ai Provider - реализация интерфейса ImageGenerationProvider
 * Поддерживает LoRA для персонализации изображений
 */
export class FalProvider implements ImageGenerationProvider {
  name = "fal";
  description =
    "AI image generation using Fal.ai API with LoRA support for personalized images";

  private apiKey: string | null = null;
  private defaultLoRA?: { path: string; scale: number; triggerWord: string };

  constructor(
    apiKey: string,
    defaultLoRA?: { path: string; scale: number; triggerWord: string }
  ) {
    this.apiKey = apiKey;
    this.defaultLoRA = defaultLoRA;

    // Настройка Fal.ai клиента
    fal.config({
      credentials: apiKey,
    });
  }

  get supportedModels(): string[] {
    return getImageModelsByProvider("fal").map((model) => model.id);
  }

  healthCheck(): TaskEither<Error, { status: "healthy" | "unhealthy" }> {
    return tryCatchAsync(
      async () => {
        if (!this.apiKey) {
          throw new Error("Fal.ai API key не установлен");
        }
        return { status: "healthy" as const };
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    );
  }

  generateImage(
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult> {
    if (!this.apiKey) {
      return left(new Error("Fal Provider не инициализирован"));
    }

    return tryCatchAsync(
      async () => {
        const startTime = Date.now();

        // Получаем конфигурацию модели
        const modelConfig = options.modelId
          ? getImageModel(options.modelId)
          : getImageModel("fal_flux_lora"); // По умолчанию

        if (!modelConfig) {
          throw new Error(
            `Модель не найдена: ${options.modelId || "fal_flux_lora"}`
          );
        }

        const modelUrl = modelConfig.apiModel;

        // Улучшаем промпт с trigger word для LoRA
        let enhancedPrompt = options.prompt;
        if (this.defaultLoRA && modelConfig.apiSettings.supportsLoRA) {
          enhancedPrompt = `${this.defaultLoRA.triggerWord} ${options.prompt}`;
        }

        // Подготовка input для Fal.ai
        const input: any = {
          prompt: enhancedPrompt,
          image_size: {
            width: 768,
            height: 1365, // 9:16 для социальных сетей
          },
          num_images: Math.min(
            options.numImages || 1,
            modelConfig.apiSettings.maxImages
          ),
        };

        // Добавляем LoRA если поддерживается
        if (modelConfig.apiSettings.supportsLoRA && this.defaultLoRA) {
          input.loras = [
            {
              path: this.defaultLoRA.path,
              scale: this.defaultLoRA.scale,
            },
          ];
        }

        // Добавляем опциональные параметры
        if (
          options.negativePrompt &&
          modelConfig.apiSettings.supportsNegativePrompt
        ) {
          input.negative_prompt = options.negativePrompt;
        }

        if (options.steps && modelConfig.apiSettings.supportsSteps) {
          input.num_inference_steps = options.steps;
        }

        if (
          options.guidanceScale &&
          modelConfig.apiSettings.supportsGuidanceScale
        ) {
          input.guidance_scale = options.guidanceScale;
        }

        if (options.seed && modelConfig.apiSettings.supportsSeed) {
          input.seed = options.seed;
        }

        // Вызов Fal.ai API
        const result = await fal.subscribe(modelUrl, {
          input,
          logs: false,
        });

        const generationTime = Date.now() - startTime;

        // Парсинг результата
        const output = result as any;
        let imageUrls: string[] = [];

        if (output.images && Array.isArray(output.images)) {
          imageUrls = output.images.map((img: any) => img.url);
        } else if (output.image_url) {
          imageUrls = [output.image_url];
        } else if (output.url) {
          imageUrls = [output.url];
        } else {
          throw new Error("Неожиданный формат ответа от Fal.ai");
        }

        return {
          success: true,
          imageUrls,
          metadata: {
            prompt: enhancedPrompt,
            model: modelUrl,
            generationTime,
            loraUsed: this.defaultLoRA?.path,
            triggerWord: this.defaultLoRA?.triggerWord,
          },
        } as ImageGenerationResult;
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    );
  }

  getModelInfo(modelId: string): TaskEither<Error, ModelInfo> {
    return tryCatchAsync(
      async () => {
        const modelConfig = getImageModel(modelId);
        if (!modelConfig) {
          throw new Error(`Модель не найдена: ${modelId}`);
        }

        return {
          id: modelConfig.id,
          name: modelConfig.name,
          provider: modelConfig.provider,
          description: modelConfig.description,
          pricePerImage: modelConfig.pricing.fixedPriceStars || 0,
          estimatedTime: 15, // Примерное время генерации с LoRA
          supportedFeatures: [
            ...(modelConfig.apiSettings.supportsNegativePrompt
              ? ["negative-prompt"]
              : []),
            ...(modelConfig.apiSettings.supportsSeed ? ["seed"] : []),
            ...(modelConfig.apiSettings.supportsSteps ? ["steps"] : []),
            ...(modelConfig.apiSettings.supportsGuidanceScale
              ? ["guidance-scale"]
              : []),
            ...(modelConfig.apiSettings.supportsLoRA ? ["lora"] : []),
          ],
          aspectRatios: modelConfig.apiSettings.aspectRatios,
          maxImages: modelConfig.apiSettings.maxImages,
        };
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    );
  }

  listModels(): TaskEither<Error, ModelInfo[]> {
    return tryCatchAsync(
      async () => {
        const models = getImageModelsByProvider("fal");
        return Promise.all(
          models.map((model) => this.getModelInfo(model.id)())
        ).then((results) =>
          results
            .filter((result) => result.isRight())
            .map((result) => (result as any).value)
        );
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    );
  }
}
```

#### Шаг 3.6: Регистрация провайдеров в реестре

**Файл**: `src/services/providers.ts`

```typescript
import { imageProviderRegistry } from "./provider-registry";
import { ReplicateProvider } from "../providers/replicateProvider";
import { FalProvider } from "../providers/falProvider";

/**
 * Инициализация и регистрация всех провайдеров
 */
export function initializeProviders(runtime: IAgentRuntime): void {
  // Регистрация Replicate Provider
  const replicateApiKey = runtime.getSetting("REPLICATE_API_KEY");
  if (replicateApiKey) {
    const replicateProvider = new ReplicateProvider(replicateApiKey);
    imageProviderRegistry.register(replicateProvider);
  }

  // Регистрация Fal.ai Provider
  const falApiKey = runtime.getSetting("FAL_KEY");
  if (falApiKey) {
    const defaultLoRA = {
      path: runtime.getSetting("FAL_DEFAULT_LORA_PATH") || "",
      scale: Number(runtime.getSetting("FAL_DEFAULT_LORA_SCALE")) || 1.0,
      triggerWord: runtime.getSetting("FAL_LORA_TRIGGER") || "NEURO_SAGE",
    };

    const falProvider = new FalProvider(falApiKey, defaultLoRA);
    imageProviderRegistry.register(falProvider);
  }

  console.log(
    `✅ Зарегистрировано провайдеров: ${imageProviderRegistry.getAll().length}`
  );
}
```

#### Шаг 3.7: Инструкция по добавлению нового провайдера

**Как добавить новый провайдер (например, Kie.ai или OpenRouter):**

1. **Добавить модель в конфигурацию** (`src/config/image-models.config.ts`):

```typescript
kie_new_model: {
  id: 'kie_new_model',
  name: 'New Kie Model',
  nameRu: 'Новая модель Kie',
  description: 'Description',
  provider: 'kie',
  apiModel: 'kie-api-model-id',
  pricing: {
    type: 'fixed',
    fixedPriceStars: 100,
  },
  apiSettings: {
    aspectRatios: ['1:1', '16:9'],
    maxImages: 4,
    supportsNegativePrompt: true,
  },
  status: 'active',
},
```

2. **Создать провайдер** (`src/providers/kieProvider.ts`):

```typescript
import { ImageGenerationProvider } from "../types/provider.interface";
import {
  getImageModelsByProvider,
  getImageModel,
} from "../config/image-models.config";

export class KieProvider implements ImageGenerationProvider {
  name = "kie";
  description = "Kie.ai image generation";

  // Реализовать все методы интерфейса
  // ...
}
```

3. **Зарегистрировать провайдер** (`src/services/providers.ts`):

```typescript
const kieProvider = new KieProvider(kieApiKey);
imageProviderRegistry.register(kieProvider);
```

**Готово!** Новый провайдер автоматически доступен через реестр.

**Файл**: `src/services/falService.ts`

```typescript
import { Service, IAgentRuntime } from "@elizaos/core";
import {
  TaskEither,
  tryCatchAsync,
  left,
} from "@/core/functional/utils/result";
import { pipe, chain } from "@/core/functional/utils/composition";
import { validate } from "@/core/validation/validate";
import { GenerateImageOptions, ImageGenerationResult } from "../types";
import { GenerateImageInputSchema } from "../types/schemas";

export class FalService extends Service {
  static serviceType = "fal";

  private apiKey: string | null = null;

  capabilityDescription =
    "AI image generation using Fal.ai API with LoRA support";

  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting("FAL_KEY");

    if (!apiKey) {
      throw new Error("FAL_KEY не найден в настройках");
    }

    this.apiKey = apiKey;
  }

  async start(): Promise<void> {
    console.log("🚀 Fal Service started");
  }

  async stop(): Promise<void> {
    this.apiKey = null;
    console.log("🛑 Fal Service stopped");
  }

  /**
   * Генерация изображения через Fal.ai (с поддержкой LoRA)
   */
  generateImage(
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult> {
    if (!this.apiKey) {
      return left(new Error("Fal Service не инициализирован"));
    }

    // Реализация через Fal.ai API
    // (аналогично ReplicateService, но с поддержкой LoRA)
    // ...
  }
}
```

---

### Фаза 4: Создание Provider (20 минут)

#### Шаг 4.1: Создание NeuroPhotoProvider

**Файл**: `src/providers/neuroPhotoProvider.ts`

```typescript
import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

export const neuroPhotoProvider: Provider = {
  name: "neuroPhotoProvider",

  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<ProviderResult> => {
    const defaultModel =
      runtime.getSetting("DEFAULT_MODEL") || "black-forest-labs/flux-schnell";

    return {
      text: `
# 🎨 NeuroPhoto - AI Image Generation

## Available Commands
- \`/neurophoto <описание>\` - Генерация AI-изображения
- \`нарисуй <описание>\` - Альтернативная команда (русский)
- \`create image <описание>\` - Альтернативная команда (английский)

## Current Configuration
- **Default Model**: ${defaultModel}
- **Generation Time**: 10-30 seconds
- **Image Format**: 9:16 (vertical, для Instagram Stories)
- **Cost**: 7.5⭐ per image

## Examples
✅ **Good prompts**:
- "/neurophoto beautiful sunset over the ocean"
- "нарисуй футуристический город с летающими машинами"
- "create image of a cat in a spacesuit"

❌ **Bad prompts**:
- "/neurophoto cat" (too short, not descriptive)
- "нарисуй" (no description)

## Tips for Better Results
1. Be specific and descriptive
2. Include details about style, colors, mood
3. Mention lighting and composition
4. Use English for best results with most models

## Available Models
- **Flux Schnell**: Fast, high-quality images (default)
- **Flux Pro**: Premium quality, slower
- **SDXL**: General-purpose, reliable
      `.trim(),
      values: {
        defaultModel,
        supportedCommands: [
          "/neurophoto",
          "нарисуй",
          "создай изображение",
          "create image",
        ],
        cost: 7.5,
        currency: "stars",
      },
    };
  },
};
```

---

### Фаза 5: Создание Action (60 минут)

#### Шаг 5.1: Создание generateImageAction

**Файл**: `src/actions/generateImage.ts`

```typescript
import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
} from "@elizaos/core";
import {
  TaskEither,
  tryCatchAsync,
  right,
  left,
} from "@/core/functional/utils/result";
import { pipe, chain, map, tapTask } from "@/core/functional/utils/composition";
import { validate } from "@/core/validation/validate";
import {
  GenerateImageInputSchema,
  NeuroPhotoActionContextSchema,
} from "../types/schemas";
import { ReplicateService } from "../services/replicateService";
import { FalService } from "../services/falService";
import { db } from "@/core/drizzle/client";
import { operations, assets, users, balances } from "@/core/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const COST_STARS = 7.5;

export const generateImageAction: Action = {
  name: "GENERATE_NEUROPHOTO",
  similes: [
    "MAKE_IMAGE",
    "CREATE_PHOTO",
    "NEUROPHOTO",
    "GENERATE_IMAGE",
    "AI_IMAGE",
    "DRAW_IMAGE",
  ],
  description: `Генерирует AI-изображения с помощью Flux/SDXL моделей.
Используй когда пользователь:
- Просит нарисовать/создать/сгенерировать изображение
- Хочет увидеть как что-то выглядит
- Спрашивает "покажи...", "сделай фото...", "нарисуй..."
- Использует команду /neurophoto
Не требует строгого формата команды - понимает естественный язык.`,

  /**
   * Валидация - должна ли выполняться эта action?
   */
  validate: async (
    runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();

    if (!text) return false;

    // Прямые команды (высокий приоритет)
    const commands = ["/neurophoto", "нейрофото", "neurophoto"];
    if (commands.some((cmd) => text.includes(cmd))) {
      return true;
    }

    // Интенты (естественный язык)
    const intents = [
      // Русский
      "нарисуй",
      "создай изображение",
      "сгенерируй",
      "сделай картинк",
      "хочу фото",
      "покажи как выглядит",
      "сделай фото",

      // English
      "generate image",
      "create image",
      "draw",
      "make a picture",
      "show me how",
      "can you draw",
      "make an image",
    ];

    return intents.some((intent) => text.includes(intent));
  },

  /**
   * Обработчик действия
   * Функциональный стиль с TaskEither
   */
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ) => {
    try {
      // Извлекаем данные из сообщения
      const text = message.content?.text || "";
      const telegramId = message.userId;

      if (!telegramId) {
        await callback?.({
          text: "❌ Не удалось определить пользователя.",
        });
        return {
          success: false,
          error: new Error("User ID not found"),
        };
      }

      // Извлекаем промпт из текста
      const prompt = extractPrompt(text);

      if (!prompt || prompt.length < 3) {
        await callback?.({
          text: `❌ Пожалуйста, опишите какое изображение вы хотите создать.

**Примеры**:
• /neurophoto красивый закат над океаном
• /neurophoto футуристический город с летающими машинами
• /neurophoto портрет кота в космическом шлеме

Минимальная длина описания: 3 символа.`,
        });
        return {
          success: false,
          error: new Error("Промпт слишком короткий"),
        };
      }

      // Уведомляем пользователя о начале генерации
      await callback?.({
        text: "🎨 Генерирую изображение, это займёт 10-30 секунд...",
      });

      // Получаем пользователя из БД
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegram_id, Number(telegramId)))
        .limit(1);

      if (!user) {
        await callback?.({
          text: "❌ Пользователь не найден в базе данных.",
        });
        return {
          success: false,
          error: new Error("User not found"),
        };
      }

      // Проверяем баланс
      const [balance] = await db
        .select()
        .from(balances)
        .where(eq(balances.user_id, user.id))
        .limit(1);

      if (!balance) {
        await callback?.({
          text: "❌ Баланс не найден.",
        });
        return {
          success: false,
          error: new Error("Balance not found"),
        };
      }

      const currentStars = (balance.currencies as any)?.stars || 0;

      if (currentStars < COST_STARS) {
        await callback?.({
          text: `❌ Недостаточно баланса. Требуется: ${COST_STARS}⭐, У вас: ${currentStars}⭐`,
        });
        return {
          success: false,
          error: new Error("Insufficient balance"),
        };
      }

      // Определяем провайдера (Replicate или Fal)
      const provider = runtime.getSetting("IMAGE_PROVIDER") || "replicate";

      let service: ReplicateService | FalService;

      if (provider === "fal") {
        const falService = runtime.getService<FalService>("fal");
        if (!falService) {
          await callback?.({
            text: "❌ Сервис генерации изображений Fal.ai недоступен.",
          });
          return {
            success: false,
            error: new Error("Fal.ai service not available"),
          };
        }
        service = falService;
      } else {
        const replicateService =
          runtime.getService<ReplicateService>("replicate");
        if (!replicateService) {
          await callback?.({
            text: "❌ Сервис генерации изображений Replicate недоступен.",
          });
          return {
            success: false,
            error: new Error("Replicate service not available"),
          };
        }
        service = replicateService;
      }

      // Формируем полный промпт с trigger_word и gender
      const userData = await getUserData(telegramId.toString());
      let genderPromptPart = "person";
      if (userData?.gender === "female") {
        genderPromptPart = "female";
      } else if (userData?.gender === "male") {
        genderPromptPart = "male";
      }

      const detailPrompt = `Cinematic Lighting, ethereal light, intricate details, extremely detailed, incredible details, full colored, complex details, insanely detailed and intricate, hypermaximalist, extremely detailed with rich colors. masterpiece, best quality, aerial view, HDR, UHD, unreal engine, Representative, fair skin, beautiful face, Rich in details High quality, gorgeous, glamorous, 8k, super detail, gorgeous light and shadow, detailed decoration, detailed lines`;

      const fullPrompt = `Fashionable ${userModel.trigger_word} ${genderPromptPart}, ${prompt}, ${detailPrompt}`;

      // Генерируем изображение функциональным способом через существующую функцию
      const result = await pipe(
        // 1. Валидация входных данных
        validate(GenerateImageInputSchema, {
          prompt: fullPrompt,
          aspectRatio: "9:16",
          numImages: 1,
        }),
        chain(async (validated) => {
          // 2. Генерация через generateNeuroPhotoHybrid с пользовательской моделью
          const { generateNeuroPhotoHybrid } = await import(
            "@/services/generateNeuroPhotoHybrid"
          );

          const generationResult = await generateNeuroPhotoHybrid(
            validated.prompt,
            userModel.model_url,
            validated.numImages || 1,
            telegramId.toString(),
            ctx,
            bot_name
          );

          if (!generationResult || !generationResult.success) {
            throw new Error(generationResult?.error || "Generation failed");
          }

          return {
            success: true,
            imageUrls: generationResult.urls || [],
            metadata: {
              prompt: validated.prompt,
              model: userModel.model_url,
              triggerWord: userModel.trigger_word,
              generationTime: 0, // Можно добавить измерение времени
            },
          };
        }),
        chain(async (generationResult) => {
          // 3. Расчет стоимости через централизованную функцию
          const costResult = await calculateNeuroPhotoCostTask(
            generationResult.imageUrls.length
          )();

          if (costResult.isLeft()) {
            throw new Error("Failed to calculate cost");
          }

          const costStars = costResult.value;

          // 4. Атомарное списание баланса
          await db.transaction(async (tx) => {
            // Блокируем строку баланса
            const [lockedBalance] = await tx
              .select()
              .from(balances)
              .where(eq(balances.user_id, user.id))
              .for("update")
              .limit(1);

            if (!lockedBalance) {
              throw new Error("Balance not found");
            }

            const currentStars = (lockedBalance.currencies as any)?.stars || 0;
            if (currentStars < costStars) {
              throw new Error("Insufficient balance");
            }

            // Списание баланса
            await tx.execute(sql`
              UPDATE balances
              SET currencies = jsonb_set(
                currencies,
                '{stars}',
                ((currencies->>'stars')::numeric - ${costStars})::text::jsonb
              ),
              updated_at = NOW()
              WHERE user_id = ${user.id}
            `);

            // Создание операции
            const [operation] = await tx
              .insert(operations)
              .values({
                user_id: user.id,
                type: "NEUROPHOTO",
                service_type: "neuro_photo",
                status: "completed",
                cost: {
                  stars: costStars,
                },
                result: generationResult as any,
                metadata: {
                  prompt: fullPrompt,
                  model: userModel.model_url,
                  model_name: userModel.model_name,
                  trigger_word: userModel.trigger_word,
                  num_images: generationResult.imageUrls.length,
                  generationTime: generationResult.metadata.generationTime,
                },
              })
              .returning();

            // Создание asset для каждого изображения
            for (const imageUrl of generationResult.imageUrls) {
              await tx.insert(assets).values({
                user_id: user.id,
                type: "image",
                url: imageUrl,
                metadata: {
                  operation_id: operation.id,
                  prompt,
                  model: generationResult.metadata.model,
                },
              });
            }
          });

          return generationResult;
        })
      )();

      if (result.isLeft()) {
        await callback?.({
          text: `❌ Ошибка при генерации: ${result.value.message}`,
        });
        return {
          success: false,
          error: result.value,
        };
      }

      const generationResult = result.value;

      // Форматируем результат для пользователя
      const modelDisplay = userModel.model_name || "Ваша модель";

      const resultText = `✨ **Изображение создано!**

━━━━━━━━━━━━━━━━━━━━
📝 **Промпт**
${prompt}

🎨 **Детали генерации**
├ 🤖 Модель: **${modelDisplay}**
├ 🔑 Trigger: **${userModel.trigger_word}**
├ 📐 Размер: **768×1365** (9:16)
├ ⏱ Время: **${Math.round(generationResult.metadata.generationTime / 1000)}с**
└ 💰 Стоимость: **${costStars}⭐**

━━━━━━━━━━━━━━━━━━━━
🔍 **Техническая информация**
Model URL: \`${userModel.model_url}\`
Trigger Word: \`${userModel.trigger_word}\`
Generated: ${new Date().toLocaleString("ru-RU")}

_Создано с помощью вашей персональной модели • @999-agents_`;

      // Отправляем результат пользователю
      await callback?.({
        text: resultText,
        attachments: generationResult.imageUrls.map((url, index) => ({
          id: `neurophoto-${Date.now()}-${index}`,
          url,
          type: "image",
          title: prompt,
          description: `Generated by ${modelDisplay}`,
        })),
      });

      return {
        success: true,
        text: "Изображение успешно сгенерировано",
        data: {
          imageUrls: generationResult.imageUrls,
          prompt,
          model: generationResult.metadata.model,
          generationTime: generationResult.metadata.generationTime,
        },
      };
    } catch (error) {
      await callback?.({
        text: "❌ Произошла непредвиденная ошибка при генерации изображения.",
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  /**
   * Примеры для обучения LLM
   */
  examples: [
    [
      {
        name: "user",
        content: { text: "/neurophoto красивый закат над океаном" },
      },
      {
        name: "assistant",
        content: {
          text: "✅ Изображение готово!",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "нарисуй футуристический город" },
      },
      {
        name: "assistant",
        content: {
          text: "🎨 Генерирую изображение...",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Извлечение промпта из текста сообщения
 */
function extractPrompt(text: string): string {
  return text
    .replace(/\/neurophoto/gi, "")
    .replace(/\/generate/gi, "")
    .replace(/нейрофото/gi, "")
    .replace(/создай изображение/gi, "")
    .replace(/сгенерируй картинку/gi, "")
    .replace(/нарисуй/gi, "")
    .replace(/generate image/gi, "")
    .replace(/create image/gi, "")
    .replace(/draw/gi, "")
    .trim();
}
```

---

### Фаза 6: Создание главного файла плагина (15 минут)

#### Шаг 6.1: Обновление index.ts

**Файл**: `src/index.ts`

```typescript
/**
 * @999-agents/plugin-vibe-avatar-face
 * ElizaOS plugin for AI image generation
 *
 * @author 999-agents
 * @license MIT
 * @version 1.0.0
 */

import { Plugin } from "@elizaos/core";
import { generateImageAction } from "./actions/generateImage";
import { neuroPhotoProvider } from "./providers/neuroPhotoProvider";
import { ReplicateService } from "./services/replicateService";
import { FalService } from "./services/falService";

/**
 * NeuroPhoto Plugin for ElizaOS
 *
 * Provides AI image generation capabilities using Replicate/Fal.ai APIs
 */
export const neuroPhotoPlugin: Plugin = {
  name: "neurophoto",
  description: "AI image generation with Replicate/Fal.ai models",

  /**
   * Actions that the agent can perform
   */
  actions: [generateImageAction],

  /**
   * Providers that give context to the LLM
   */
  providers: [neuroPhotoProvider],

  /**
   * Services that handle external integrations
   */
  services: [new ReplicateService(), new FalService()],

  /**
   * Evaluators (none for MVP)
   */
  evaluators: [],

  /**
   * Инициализация плагина
   */
  init: async (config, runtime) => {
    console.log("✅ NeuroPhoto plugin initialized");
  },
};

/**
 * Export everything for external use
 */
export * from "./types";
export * from "./actions/generateImage";
export * from "./providers/neuroPhotoProvider";
export * from "./services/replicateService";
export * from "./services/falService";

/**
 * Default export
 */
export default neuroPhotoPlugin;
```

---

### Фаза 7: Тестирование (60 минут)

#### Шаг 7.1: Создание unit тестов

**Файл**: `src/__tests__/actions/generateImage.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateImageAction } from "../../actions/generateImage";
import { IAgentRuntime, Memory } from "@elizaos/core";

describe("generateImageAction", () => {
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    mockRuntime = {
      getSetting: vi.fn(),
      getService: vi.fn(),
    } as any;
  });

  describe("validate", () => {
    it("should return true for /neurophoto command", async () => {
      const message: Memory = {
        content: { text: "/neurophoto beautiful sunset" },
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it('should return true for "нарисуй" intent', async () => {
      const message: Memory = {
        content: { text: "нарисуй кота" },
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it("should return false for unrelated message", async () => {
      const message: Memory = {
        content: { text: "привет как дела" },
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(false);
    });
  });

  // Дополнительные тесты...
});
```

#### Шаг 7.2: Создание integration тестов

**Файл**: `src/__tests__/integration/neuroPhoto.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { neuroPhotoPlugin } from "../../index";

describe("NeuroPhoto Plugin Integration", () => {
  it("should have all required components", () => {
    expect(neuroPhotoPlugin.actions).toBeDefined();
    expect(neuroPhotoPlugin.actions?.length).toBeGreaterThan(0);
    expect(neuroPhotoPlugin.providers).toBeDefined();
    expect(neuroPhotoPlugin.services).toBeDefined();
  });

  // Дополнительные тесты...
});
```

---

### Фаза 8: Интеграция в бота (30 минут)

#### Шаг 8.1: Импорт плагина в главный файл

**Файл**: `src/character.ts` или `src/bot.ts`

```typescript
import { Character } from "@elizaos/core";
import { neuroPhotoPlugin } from "@999-agents/plugin-vibe-avatar-face";

export const character: Character = {
  name: "NeuroBlogger",

  plugins: [
    "@elizaos/plugin-bootstrap",
    "@elizaos/plugin-telegram",
    neuroPhotoPlugin, // 👈 Добавляем наш плагин
  ],

  settings: {
    REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
    FAL_KEY: process.env.FAL_KEY,
    DEFAULT_MODEL: "black-forest-labs/flux-schnell",
    IMAGE_PROVIDER: "replicate", // или 'fal'
  },
};
```

#### Шаг 8.2: Настройка переменных окружения

**Файл**: `.env`

```bash
REPLICATE_API_KEY=r8_your_replicate_api_key_here
FAL_KEY=your_fal_key_here
DEFAULT_MODEL=black-forest-labs/flux-schnell
IMAGE_PROVIDER=replicate
```

---

### Фаза 9: Проверка и валидация (30 минут)

#### Шаг 9.1: Проверка типов

```bash
cd packages/plugin-vibe-avatar-face
npm run typecheck
# или
tsc --noEmit
```

#### Шаг 9.2: Запуск тестов

```bash
npm test
# или
npm run test:coverage
```

#### Шаг 9.3: Проверка линтера

```bash
npm run lint
# или
npm run lint:fix
```

---

## ✅ Чек-лист реализации

### Подготовка

- [ ] Выполнена команда `elizaos plugins create vibe-avatar-face`
- [ ] Проверена структура директорий
- [ ] Установлены зависимости (`npm install`)

### Типы и схемы

- [ ] Созданы Zod схемы (`GenerateImageInputSchema`, `GenerateImageOutputSchema`)
- [ ] Созданы TypeScript типы (`GenerateImageInput`, `GenerateImageOutput`)
- [ ] Создан тип контекста (`NeuroPhotoActionContext`)

### Services и Providers

- [ ] Создан интерфейс `ImageGenerationProvider`
- [ ] Создан реестр провайдеров `ImageProviderRegistry`
- [ ] Создана конфигурация моделей `IMAGE_MODELS` с 10+ моделями
- [ ] Создан `ReplicateProvider` (реализация интерфейса)
- [ ] Создан `FalProvider` (для LoRA и персонализации)
- [ ] Провайдеры зарегистрированы в реестре
- [ ] Все методы используют `TaskEither`
- [ ] Добавлена инструкция по добавлению новых провайдеров

### Providers

- [ ] Создан `neuroPhotoProvider`
- [ ] Provider возвращает `ProviderResult` объект (не строку)
- [ ] Добавлена информация о командах и примерах

### Actions

- [ ] Создан `generateImageAction`
- [ ] Реализован метод `validate`
- [ ] Реализован метод `handler` в функциональном стиле
- [ ] Добавлены примеры для обучения LLM
- [ ] Обработка ошибок через `TaskEither`

### Главный файл

- [ ] Обновлен `src/index.ts`
- [ ] Экспортирован объект `Plugin`
- [ ] Все компоненты подключены (actions, providers, services)

### Тестирование

- [ ] Созданы unit тесты для `validate`
- [ ] Созданы unit тесты для `handler`
- [ ] Созданы integration тесты
- [ ] Все тесты проходят (100% покрытие)

### Интеграция

- [ ] Плагин импортирован в `src/character.ts`
- [ ] Настроены переменные окружения
- [ ] Плагин зарегистрирован в системе

### Валидация

- [ ] Проверка типов проходит без ошибок
- [ ] Все тесты проходят
- [ ] Линтер не выдает ошибок
- [ ] Плагин работает в боте

---

## 🚨 Важные моменты

### 1. Функциональный стиль

- ✅ Все асинхронные операции через `TaskEither`
- ✅ Использование `pipe` для композиции
- ✅ Нет `throw/catch` - ошибки через `Either`
- ✅ Иммутабельность данных

### 2. Валидация данных

- ✅ Все входные данные валидируются через Zod
- ✅ Runtime type safety
- ✅ Автоматическая генерация TypeScript типов

### 3. Работа с БД

- ✅ Использование Drizzle ORM
- ✅ Транзакции для атомарности
- ✅ Блокировка строк (`SELECT FOR UPDATE`)

### 4. Обработка ошибок

- ✅ Все ошибки обрабатываются через `TaskEither`
- ✅ Пользователю отправляются понятные сообщения
- ✅ Логирование ошибок

### 5. Тестирование

- ✅ TDD подход (сначала тесты, потом код)
- ✅ 100% покрытие тестами
- ✅ Функциональное тестирование

---

## 📚 Ресурсы

- **ElizaOS Documentation**: https://docs.elizaos.ai/
- **Plugin Development Guide**: https://docs.elizaos.ai/guides/create-a-plugin
- **Replicate API**: https://replicate.com/docs
- **Fal.ai API**: https://fal.ai/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **Zod**: https://zod.dev/

---

## 🎯 Результат

После выполнения всех шагов у тебя будет:

1. ✅ Работающий ElizaOS плагин для генерации изображений
2. ✅ Полная интеграция с Replicate/Fal.ai
3. ✅ Функциональный стиль кода
4. ✅ 100% покрытие тестами
5. ✅ Интеграция с базой данных
6. ✅ Обработка баланса и операций
7. ✅ Отправка результатов пользователю

**Время реализации**: 3-4 часа  
**Сложность**: Средняя  
**Приоритет**: Высокий (первая функция для проверки пайплайна)

---

**🚀 Готов начать? Следуй плану шаг за шагом!**
