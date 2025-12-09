/**
 * @fileoverview Avatar Face Plugin - Digital Avatar Body Action
 *
 * Action for training personal LoRA models
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import type {
  Action,
  ActionResult,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  ActionExample,
} from "@elizaos/core";
import { TrainAvatarBodyInputSchema } from "../types/schemas";
import {
  SERVICE_PRICING,
  calculateServiceCost,
} from "../database/servicePricing.config.js";

export const digitalAvatarBodyAction: Action = {
  name: "TRAIN_DIGITAL_AVATAR_BODY",
  similes: [
    "TRAIN_AVATAR",
    "CREATE_LORA_MODEL",
    "DIGITAL_AVATAR_BODY",
    "ОБУЧИТЬ_МОДЕЛЬ",
    "ЦИФРОВОЕ_ТЕЛО",
  ],
  description: `Обучает персональную LoRA модель пользователя через Fal.ai.
Используй когда пользователь:
- Хочет обучить свою модель
- Говорит про "цифровое тело аватара"
- Упоминает обучение модели
- Спрашивает про LoRA
- Использует команды "🤖 Цифровое тело аватара"

Поддерживает два типа обучения:
1. Portrait Trainer (550⭐, 15-30 мин, 2500 шагов) - премиум качество
2. Fast Training (220⭐, 10-15 мин, 1000 шагов) - быстрое обучение`,

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
    const commands = [
      "🤖 Цифровое тело",
      "digital avatar body",
      "train avatar",
      "обучить модель",
      "создать lora",
      "lora training",
      "создать модель",
    ];

    if (commands.some((cmd) => text.includes(cmd))) {
      return true;
    }

    // Интенты (естественный язык)
    const intents = [
      "хочу обучить",
      "нужна модель",
      "создать цифрового аватара",
      "обучить lora",
      "personal model",
      "my model",
      "trained model",
      "自己的模型",
    ];

    return intents.some((intent) => text.includes(intent));
  },

  /**
   * Обработчик действия
   */
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const text = message.content?.text || "";
      // Безопасное получение userId из Memory
      const userId = (message as any).userId;
      const telegramId = userId ? Number(userId) : 0;

      if (!telegramId) {
        await callback?.({
          text: "❌ Не удалось определить пользователя.",
        });
        return {
          success: false,
          error: new Error("User ID not found"),
        };
      }

      // Извлекаем данные из сообщения для wizard flow
      const userIntent = extractUserIntent(text);

      // Формируем ответ для wizard flow
      const response = buildWizardResponse(userIntent);

      await callback?.({
        text: response.text,
      });

      return {
        success: true,
        text: "Digital Avatar Body wizard started",
        values: {
          action: "TRAIN_DIGITAL_AVATAR_BODY",
          wizard: userIntent.step,
          pricing: SERVICE_PRICING,
        },
        data: {
          action: "TRAIN_DIGITAL_AVATAR_BODY",
          wizard: userIntent.step,
          pricing: SERVICE_PRICING,
        },
      };
    } catch (error) {
      await callback?.({
        text: "❌ Произошла ошибка при обработке запроса на обучение модели.",
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
        content: { text: "🤖 Цифровое тело аватара" },
      },
      {
        name: "assistant",
        content: {
          text: "🎨 Выберите тип обучения модели:",
          attachments: [
            {
              type: "button",
              text: "🎨 Portrait Trainer (550⭐)",
              action: "SELECT_PORTRAIT_TRAINER",
            },
            {
              type: "button",
              text: "⚡ Fast Training (220⭐)",
              action: "SELECT_FAST_TRAINING",
            },
          ],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "Хочу обучить свою модель" },
      },
      {
        name: "assistant",
        content: {
          text: "🎨 Выберите тип обучения модели:",
          attachments: [
            {
              type: "button",
              text: "🎨 Portrait Trainer (550⭐)",
              action: "SELECT_PORTRAIT_TRAINER",
            },
            {
              type: "button",
              text: "⚡ Fast Training (220⭐)",
              action: "SELECT_FAST_TRAINING",
            },
          ],
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Извлечение интента пользователя
 */
function extractUserIntent(text: string) {
  const lowerText = text.toLowerCase();

  // Определяем шаг в wizard flow
  let step = 1;
  let modelType: "portrait" | "fast" | null = null;
  let gender: "male" | "female" | null = null;

  // Парсим выбор типа модели
  if (lowerText.includes("portrait") || lowerText.includes("премиум")) {
    modelType = "portrait";
    step = 2;
  } else if (lowerText.includes("fast") || lowerText.includes("быстро")) {
    modelType = "fast";
    step = 2;
  }

  // Парсим выбор пола
  if (
    lowerText.includes("мужской") ||
    lowerText.includes("male") ||
    lowerText.includes("♂")
  ) {
    gender = "male";
    step = Math.max(step, 3);
  } else if (
    lowerText.includes("женский") ||
    lowerText.includes("female") ||
    lowerText.includes("♀")
  ) {
    gender = "female";
    step = Math.max(step, 3);
  }

  return {
    step,
    modelType,
    gender,
    userInput: text,
  };
}

/**
 * Построение ответа для wizard flow
 */
function buildWizardResponse(userIntent: any) {
  const { step, modelType, gender } = userIntent;

  switch (step) {
    case 1:
      // Шаг 1: Выбор типа обучения
      return {
        text: `🎨 **Выберите тип обучения модели**

┌─ 🎨 **Portrait Trainer** (550⭐)
│  ├─ Качество: ⭐⭐⭐⭐⭐
│  ├─ Время: 15-30 минут
│  └─ Шаги: 2500
│
└─ ⚡ **Fast Training** (220⭐)
   ├─ Качество: ⭐⭐⭐
   ├─ Время: 10-15 минут
   └─ Шаги: 1000

Выберите тип обучения для продолжения.`,
        attachments: [
          {
            type: "button",
            text: "🎨 Portrait Trainer (550⭐)",
            action: "SELECT_PORTRAIT_TRAINER",
          },
          {
            type: "button",
            text: "⚡ Fast Training (220⭐)",
            action: "SELECT_FAST_TRAINING",
          },
        ],
      };

    case 2:
      // Шаг 2: Выбор пола
      const modelTypeText =
        modelType === "portrait" ? "Portrait Trainer" : "Fast Training";
      const modelCost = modelType === "portrait" ? 550 : 220;

      return {
        text: `⚡ **Выбран тип**: ${modelTypeText} (${modelCost}⭐)

♂️♀️ **Выберите пол аватара**

Это поможет модели лучше понять, как генерировать изображения.`,
        attachments: [
          {
            type: "button",
            text: "♂️ Мужской",
            action: "SELECT_GENDER_MALE",
          },
          {
            type: "button",
            text: "♀️ Женский",
            action: "SELECT_GENDER_FEMALE",
          },
        ],
      };

    case 3:
      // Шаг 3: Ввод названия модели
      const genderText = gender === "male" ? "Мужской" : "Женский";

      return {
        text: `♂️♀️ **Выбран пол**: ${genderText}

📝 **Введите название модели** (2-50 символов)

Название будет использоваться как trigger word для генерации изображений.
Примеры: "МойАватар", "Avatar2024", "MyModel"

Введите название модели для продолжения.`,
        attachments: [
          {
            type: "input",
            text: "Введите название модели",
            action: "INPUT_MODEL_NAME",
          },
        ],
      };

    case 4:
      // Шаг 4: Загрузка изображений
      return {
        text: `📸 **Загрузка изображений**

Загрузите **10-25 фотографий** вашего лица:

✅ **Требования**:
├─ Формат: JPG, PNG, WEBP
├─ Размер: максимум 10MB
├─ Качество: четкие, хорошо освещенные
└─ Разнообразие: разные ракурсы и выражения

❌ **НЕ подходят**:
├─ Фото в масках или солнцезащитных очках
├─ Размытые или темные изображения
└─ Групповые фото с другими людьми

После загрузки отправьте команду \`/done\` для завершения.`,
        attachments: [
          {
            type: "button",
            text: "✅ Готово (отправить /done)",
            action: "COMPLETE_UPLOAD",
          },
          {
            type: "button",
            text: "❌ Отменить",
            action: "CANCEL_UPLOAD",
          },
        ],
      };

    default:
      return {
        text: `🎨 **Добро пожаловать в Цифровое Тело Аватара**

Для начала обучения нажмите кнопку ниже.`,
        attachments: [
          {
            type: "button",
            text: "🎨 Начать обучение модели",
            action: "START_TRAINING",
          },
        ],
      };
  }
}
