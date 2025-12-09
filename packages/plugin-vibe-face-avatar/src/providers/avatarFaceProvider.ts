/**
 * @fileoverview Avatar Face Plugin - Provider
 *
 * Provider for Avatar Face plugin context and capabilities
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import type {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

export const avatarFaceProvider: Provider = {
  name: "AVATAR_FACE_PROVIDER",
  description:
    "Provides context for Avatar Face plugin (Digital Avatar Body + NeuroPhoto)",

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state?: State
  ): Promise<ProviderResult> => {
    const defaultModel = runtime.getSetting("DEFAULT_MODEL") || "custom-lora";

    return {
      text: `
# 🎭 Avatar Face - Цифровое Тело Аватара

## Доступные Команды
- \`🤖 Цифровое тело аватара\` - Обучение персональной LoRA модели
- \`📸 NeuroPhoto\` - Генерация фото из обученных моделей

## Как это работает

### 1️⃣ Обучение Модели
**Шаг 1**: Выберите тип обучения
├─ 🎨 **Portrait Trainer** (550⭐, 15-30 мин, 2500 шагов)
└─ ⚡ **Fast Training** (220⭐, 10-15 мин, 1000 шагов)

**Шаг 2**: Выберите пол аватара
├─ Мужской ♂️
└─ Женский ♀️

**Шаг 3**: Введите название модели (2-50 символов)
**Шаг 4**: Загрузите фото (10-25 штук)
**Шаг 5**: Запуск обучения 

### 2️⃣ Генерация Фото
**Шаг 1**: Выберите модель из списка ваших моделей
**Шаг 2**: Опишите желаемое изображение (минимум 3 символа)
**Шаг 3**: Автоматически добавляется trigger_word из вашей модели
**Шаг 4**: Генерация 1 изображения

## Текущая Конфигурация
- **Модель по умолчанию**: ${defaultModel}
- **Время обучения**: 10-30 минут
- **Время генерации**: 10-30 секунд
- **Формат изображений**: 9:16 (вертикальный)
- **Стоимость обучения**: 220-550⭐
- **Стоимость генерации**: 7.5⭐ за изображение

## Важные моменты
✅ **Только ваши модели**: NeuroPhoto использует исключительно модели, которые вы обучили
✅ **Персонализация**: Каждая модель имеет уникальный trigger_word
✅ **Качество**: Модели обучаются на ваших фотографиях через Fal.ai
✅ **Безопасность**: Все данные хранятся в вашем аккаунте

## Примеры команд
✅ **Обучение**:
- "🤖 Цифровое тело аватара"
- "Хочу обучить свою модель"
- "Создать LoRA модель"

✅ **Генерация**:
- "📸 NeuroPhoto"
- "Сгенерируй фото моего аватара"
- "Создай изображение используя мою модель"

## Требования
- Активная подписка
- Минимум 220⭐ для Fast Training
- Минимум 550⭐ для Portrait Trainer
- Минимум 7.5⭐ для генерации каждого изображения
- 10-25 фотографий для обучения (JPG, PNG, WEBP, максимум 10MB)

## Поддерживаемые форматы
- **Фото**: JPG, PNG, WEBP
- **Размер фото**: Максимум 10MB
- **Формат вывода**: 768×1365 (9:16)

_Создано с помощью Avatar Face Plugin • Vibe Team_
      `.trim(),
      values: {
        defaultModel,
        supportedCommands: [
          "🤖 Цифровое тело",
          "📸 NeuroPhoto",
          "обучить модель",
          "сгенерировать фото",
        ],
        pricing: {
          portraitTrainer: 550,
          fastTraining: 220,
          neuroPhoto: 7.5,
        },
        currency: "stars",
      },
    };
  },
};
