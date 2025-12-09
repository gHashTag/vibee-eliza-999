// @ts-nocheck
import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
  logger,
} from "@elizaos/core";
import {
  TaskEither,
  tryCatchAsync,
  taskRight,
  runTaskEither,
  Either,
} from "../utils/functional/result";
import { pipe, chain, map } from "../utils/functional/composition";
import { GenerateImageInputSchema } from "../types/schemas";
import { generateNeuroPhotoHybrid } from "../services/generateNeuroPhotoHybrid";
import { getUserModelsTask, UserModelDB } from "../services/modelLoader";
import { getTelegramId } from "../utils/getTelegramId";

const COST_STARS = 7.5;

// Helper to validate input using Zod
const validateInput = (input: unknown): TaskEither<Error, any> => {
    return tryCatchAsync(
        async () => GenerateImageInputSchema.parseAsync(input),
        (error) => error instanceof Error ? error : new Error(String(error))
    );
};

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

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();

    if (!text) return false;

    const commands = ["/neurophoto", "нейрофото", "neurophoto"];
    if (commands.some((cmd) => text.includes(cmd))) {
      return true;
    }

    const intents = [
      "нарисуй",
      "создай изображение",
      "сгенерируй",
      "сделай картинк",
      "хочу фото",
      "покажи как выглядит",
      "сделай фото",
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

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: any,
    callback?: HandlerCallback
  ) => {
    console.log("🔥🔥🔥 generateImageAction HANDLER CALLED! 🔥🔥🔥");
    console.log("Message:", JSON.stringify(message, null, 2));
    try {
      const text = message.content?.text || "";
      let userId = message.entityId; // ElizaOS entityId (UUID)

      // FIX: Если entityId отсутствует, пытаемся получить из metadata
      const rawMetadata = message.metadata as Record<string, unknown> | undefined;
      if (!userId && rawMetadata?.raw) {
        const raw = rawMetadata.raw as Record<string, unknown>;
        userId = raw.senderId as string;
      }

      if (!userId) {
        await callback?.({
          text: "❌ Не удалось определить пользователя.",
        });
        return {
            success: false,
            error: new Error("User ID not found"),
        };
      }

      logger.info({ userId, text }, "Processing image generation request");

      const prompt = extractPrompt(text);

      if (!prompt || prompt.length < 3) {
        await callback?.({
          text: `❌ Пожалуйста, опишите какое изображение вы хотите создать.

**Просто напишите что хотите создать:**

**Примеры**:
• "нарисуй красивый закат над океаном"
• "создай футуристический город с летающими машинами"
• "сгенерируй портрет кота в космическом шлеме"
• "нарисуй супермена"

**Минимальная длина описания: 3 символа.**`,
        });
        return {
            success: false,
            error: new Error("Prompt too short"),
        };
      }

      // CRITICAL: Получаем идентификаторы пользователя
      // Поддерживает как реальные Telegram ID, так и UUID для веб-интерфейса
      const telegramId = getTelegramId(message);

      // Для веб-интерфейса используем UUID (entity_id) напрямую для поиска моделей
      // userId - это UUID пользователя из ElizaOS (aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf)
      const userIdentifier = userId || (telegramId ? String(telegramId) : null);

      if (!userIdentifier) {
        await callback?.({
          text: "❌ Не удалось определить пользователя.",
        });
        return {
          success: false,
          error: new Error("User ID not found"),
        };
      }

      logger.info({ userId, telegramId, userIdentifier }, "Using user ID for model lookup");

      // Передаём UUID напрямую - modelLoader умеет искать по entity_id
      const modelsTask = getUserModelsTask(userIdentifier, 'neuro_face_bot');
      const modelsResult = await modelsTask();

      if (modelsResult.isLeft() || modelsResult.value.length === 0) {
        await callback?.({
          text: `❌ **Сначала создайте свою модель!**

Чтобы я мог генерировать изображения с вашим лицом, нужно:

1️⃣ Загрузите 10-25 своих фотографий (в хорошем качестве)
2️⃣ Скажите "обучить модель" и укажите имя модели
3️⃣ Подождите 10-15 минут пока модель обучится

**Как начать:**
Просто скажите "обучить модель мое_имя" и приложите фото.

Тогда я смогу создавать изображения с вами! 🎨`,
        });
        return {
          success: false,
          error: new Error("No trained models found"),
        };
      }

      const userModel = modelsResult.value[0]; // Берем первую активную модель
      logger.info({ userId, modelName: userModel.model_name }, "Using user's trained model");

      await callback?.({
        text: `🎨 Генерирую изображение с вашей моделью **${userModel.model_name}**...
⏱ Это займёт 10-30 секунд...`,
      });

      // Prepare generation parameters
      let fullPrompt = prompt;
      if (userModel.trigger_word) {
        fullPrompt = `${userModel.trigger_word}, ${fullPrompt}`;
      }

      logger.info({
        prompt: fullPrompt,
        modelUrl: userModel.model_url,
        triggerWord: userModel.trigger_word
      }, "Generating with user's LoRA");

      // Generate Image directly (simplified approach)
      try {
        const generationResult = await generateNeuroPhotoHybrid(
            fullPrompt,
            userModel.model_url,
            1,
            userId,
            { gender: userModel.gender },
            "web-chat"
        );

        if (!generationResult.success) {
            throw new Error(generationResult.error || "Generation failed");
        }

        const resultText = `✨ **Изображение создано!**

━━━━━━━━━━━━━━━━━━━━
📝 **Промпт**
${fullPrompt}

🎨 **Детали генерации**
├ 🤖 Модель: **${userModel.model_name}** (ваша LoRA)
├ 🎯 Trigger: **${userModel.trigger_word}**
├ ⏱ Время: **${Math.round(generationResult.metadata.generationTime / 1000)}с**
└ 💰 Стоимость: **${COST_STARS}⭐**

_Создано с вашей персональной моделью • @999-agents_`;

        if (callback) {
            await callback({
                text: resultText,
                attachments: generationResult.imageUrls.map((url: string, index: number) => ({
                    id: `neurophoto-${Date.now()}-${index}`,
                    url,
                    type: "image",
                    title: fullPrompt,
                    description: `Generated by ${userModel.model_name}`,
                })),
            });
        }

        return {
            success: true,
            text: "Изображение успешно сгенерировано",
            data: generationResult,
        };
      } catch (error) {
        logger.error({ error }, "Generation failed");
        throw error;
      }

    } catch (error) {
      logger.error({ error }, "Unexpected error in generateImageAction");
      await callback?.({
        text: "❌ Произошла непредвиденная ошибка при генерации изображения.",
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "/neurophoto красивый закат над океаном" },
      },
      {
        name: "{{agentName}}",
        content: {
          text: "✅ Изображение готово!",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "нарисуй футуристический город" },
      },
      {
        name: "{{agentName}}",
        content: {
          text: "🎨 Генерирую изображение...",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
  ] as ActionExample[][],
};

function extractPrompt(text: string): string {
  // Try to extract prompt by removing command words
  const cleaned = text
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

  // If cleaned text is too short, use original text (for natural language)
  // This handles cases like "нарисуй супермена" -> we want "супермена"
  if (cleaned.length < 3 && text.length > cleaned.length) {
    // Extract words after common command words
    const words = text.split(/\s+/);
    const commandWords = ['нарисуй', 'создай', 'сгенерируй', 'draw', 'generate'];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^\w]/g, '');
      if (commandWords.includes(word) && i + 1 < words.length) {
        return words.slice(i + 1).join(' ').trim();
      }
    }

    // If no command words found, return original text
    return text;
  }

  return cleaned;
}
