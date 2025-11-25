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
import { uuidToTelegramId } from "../utils/userHelpers";

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
    try {
      const text = message.content?.text || "";
      const userId = message.userId; // ElizaOS userId (UUID)

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

**Примеры**:
• /neurophoto красивый закат над океаном
• /neurophoto футуристический город с летающими машинами
• /neurophoto портрет кота в космическом шлеме

Минимальная длина описания: 3 символа.`,
        });
        return {
            success: false,
            error: new Error("Prompt too short"),
        };
      }

      // CRITICAL: Проверяем наличие натренированных моделей
      // Без модели генерация НЕ работает!
      const userIdHash = userId ? uuidToTelegramId(userId) : null;

      if (!userIdHash) {
        await callback?.({
          text: "❌ Не удалось определить пользователя.",
        });
        return {
          success: false,
          error: new Error("User ID not found"),
        };
      }

      const modelsTask = getUserModelsTask(userIdHash, "web-chat");
      const modelsResult = await modelsTask();

      if (modelsResult.isLeft() || modelsResult.value.length === 0) {
        await callback?.({
          text: `❌ **У вас нет натренированных моделей!**

Чтобы генерировать изображения, сначала нужно:

1️⃣ Загрузите 10-25 своих фото
2️⃣ Натренируйте модель командой \`/face train\`
3️⃣ Дождитесь завершения обучения (10-15 минут)

Только после этого можно использовать \`/neurophoto\`!

**Начните с команды:** \`/face train моя_модель\``,
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

      // Functional pipeline
      const result = await runTaskEither(
        pipe(
            // 1. Validate Input
            validateInput({
                prompt,
                aspectRatio: "9:16",
                numImages: 1,
            }),
            // 2. Generate Image with user's LoRA model
            chain(async (validatedInput: any) => {
                // Добавляем trigger_word к промпту
                let fullPrompt = validatedInput.prompt;
                if (userModel.trigger_word) {
                    fullPrompt = `${userModel.trigger_word}, ${fullPrompt}`;
                }

                logger.info({
                  prompt: fullPrompt,
                  modelUrl: userModel.model_url,
                  triggerWord: userModel.trigger_word
                }, "Generating with user's LoRA");

                const generationResult = await generateNeuroPhotoHybrid(
                    fullPrompt,
                    userModel.model_url, // Используем LoRA модель пользователя
                    validatedInput.numImages,
                    userId,
                    { gender: userModel.gender },
                    "web-chat"
                );

                if (!generationResult.success) {
                    throw new Error(generationResult.error || "Generation failed");
                }

                return taskRight({ validatedInput, generationResult, userModel, fullPrompt });
            }),
            // 3. Send Result to User
            chain(async (ctx: any) => {
                const { generationResult, validatedInput, userModel, fullPrompt } = ctx;

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

                return taskRight(ctx);
            })
        )
      );

      if (result.isLeft()) {
        logger.error({ error: result.value }, "Generation failed");
        await callback?.({
            text: `❌ Ошибка при генерации: ${result.value.message}`,
        });
        return {
            success: false,
            error: result.value,
        };
      }

      return {
        success: true,
        text: "Изображение успешно сгенерировано",
        data: result.value.generationResult,
      };

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
        user: "{{user1}}",
        content: { text: "/neurophoto красивый закат над океаном" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "✅ Изображение готово!",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "нарисуй футуристический город" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎨 Генерирую изображение...",
          action: "GENERATE_NEUROPHOTO",
        },
      },
    ],
  ] as ActionExample[][],
};

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
