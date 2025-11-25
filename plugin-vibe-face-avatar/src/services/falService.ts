import { fal } from "@fal-ai/client";
import { IAgentRuntime } from "@elizaos/core";
import {
  TaskEither,
  left,
  right,
} from "../utils/functional/result";
import { GenerateImageOptions, ImageGenerationResult } from "../types";
import { BaseLoraServiceImpl, LoraModelConfig } from "./loraService";

export interface IFalService {
  initialize(runtime: IAgentRuntime): Promise<void>;
  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult>;
  generateImageWithLora(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult>;
}

export class FalServiceImpl extends BaseLoraServiceImpl implements IFalService {
  private apiKey: string | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting("FAL_KEY");

    if (!apiKey) {
      console.warn("⚠️  FAL_KEY не найден. FalService будет неактивен.");
      return;
    }

    // Настраиваем Fal.ai клиент
    fal.config({
      credentials: apiKey,
    });

    this.apiKey = apiKey;
    console.log("✅ FalService инициализирован с Fal.ai");
  }

  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult> {
    return this.generateImageWithLora(
      options.prompt,
      {
        triggerWord: options.triggerWord,
        gender: options.gender,
      },
      options
    );
  }

  /**
   * Генерация изображения через Fal.ai с поддержкой LoRA
   */
  generateImageWithLora(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult> {
    if (!this.apiKey) {
      return left(new Error("Fal Service не инициализирован. Проверьте FAL_KEY в настройках."));
    }

    const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);

    console.log(`[Fal.ai] Генерация изображения с LoRA`);
    console.log(`[Fal.ai] Оригинальный промпт: ${prompt}`);
    console.log(`[Fal.ai] Улучшенный промпт: ${enhancedPrompt}`);
    console.log(`[Fal.ai] LoRA URL: ${loraConfig.modelUrl || 'не указан'}`);

    try {
      // Выбираем модель в зависимости от наличия LoRA
      const modelId = loraConfig.modelUrl
        ? "fal-ai/flux-dev-lora"  // Для LoRA моделей
        : "fal-ai/flux-schnell";  // Без LoRA

      const input: any = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_inference_steps: options.numInferenceSteps || 28,
        guidance_scale: 3.5,
        num_images: options.numImages || 1,
      };

      // Если есть LoRA URL, добавляем его
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }

      // Используем subscriptions для получения результата
      return left(
        new Error("Synchronous generation not supported. Use async/await pattern.")
      );
    } catch (error) {
      console.error("[Fal.ai] Ошибка генерации:", error);
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Асинхронная генерация через Fal.ai (для реального использования)
   */
  async generateImageAsync(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): Promise<TaskEither<Error, ImageGenerationResult>> {
    if (!this.apiKey) {
      return Promise.resolve(left(new Error("Fal Service не инициализирован")));
    }

    try {
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);

      const modelId = loraConfig.modelUrl
        ? "fal-ai/flux-dev-lora"
        : "fal-ai/flux-schnell";

      const input: any = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_inference_steps: options.numInferenceSteps || 28,
        guidance_scale: 3.5,
        num_images: options.numImages || 1,
      };

      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }

      console.log(`[Fal.ai] Отправляем запрос к ${modelId}`);

      const result = await fal.subscribe(modelId, {
        input,
        logs: true,
      });

      console.log(`[Fal.ai] Получен результат:`, result);

      const imageUrls = this.extractImageUrls(result);
      const success = imageUrls.length > 0;

      if (success) {
        console.log(`[Fal.ai] ✅ Сгенерировано ${imageUrls.length} изображений`);
        return Promise.resolve(
          right({
            success: true,
            imageUrls,
            metadata: {
              enhanced_prompt: enhancedPrompt,
              provider: "fal-ai",
              model: modelId,
              lora_url: loraConfig.modelUrl || null,
              lora_scale: loraConfig.modelUrl ? 0.85 : null,
            },
          })
        );
      } else {
        console.error("[Fal.ai] ❌ Изображения не найдены в ответе");
        return Promise.resolve(
          left(new Error("Изображения не найдены в ответе Fal.ai"))
        );
      }
    } catch (error) {
      console.error("[Fal.ai] ❌ Ошибка:", error);
      return Promise.resolve(
        left(error instanceof Error ? error : new Error(String(error)))
      );
    }
  }
}

// Экспортируем экземпляр для совместимости с существующим кодом
export const FalService: IFalService = {
  apiKey: null,

  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting("FAL_KEY");

    if (!apiKey) {
      console.warn("⚠️  FAL_KEY не найден. FalService будет неактивен.");
      return;
    }

    fal.config({
      credentials: apiKey,
    });

    (FalService as any).apiKey = apiKey;
    console.log("✅ FalService инициализирован");
  },

  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult> {
    if (!(FalService as any).apiKey) {
      return left(new Error("Fal Service не инициализирован. Проверьте FAL_KEY в настройках."));
    }

    // Используем fal-ai напрямую для простой генерации
    const enhancedPrompt = options.prompt + ", high quality, detailed, 8k";

    console.log("🎨 Fal Service: Генерация изображения", options);

    try {
      // Для простой генерации без LoRA используем fal-ai/flux-schnell
      return left(
        new Error("Используйте fal-ai client напрямую или FalServiceImpl для асинхронной генерации")
      );
    } catch (error) {
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  },
};
