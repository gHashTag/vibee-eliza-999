import Replicate from "replicate";
import { IAgentRuntime } from "@elizaos/core";
import {
  TaskEither,
  left,
  right,
} from "../utils/functional/result";
import { GenerateImageOptions, ImageGenerationResult } from "../types";
import { BaseLoraServiceImpl, LoraModelConfig } from "./loraService";

export interface IReplicateService {
  initialize(runtime: IAgentRuntime): Promise<void>;
  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult>;
  generateImageWithLora(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult>;
}

export class ReplicateServiceImpl extends BaseLoraServiceImpl implements IReplicateService {
  private client: Replicate | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting("REPLICATE_API_KEY");

    if (!apiKey) {
      console.warn("⚠️  REPLICATE_API_KEY не найден. ReplicateService будет неактивен.");
      return;
    }

    // Создаем клиент Replicate
    this.client = new Replicate({
      auth: apiKey,
    });

    console.log("✅ ReplicateService инициализирован с Replicate API");
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
   * Генерация изображения через Replicate с поддержкой LoRA
   */
  generateImageWithLora(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult> {
    if (!this.client) {
      return left(new Error("Replicate Service не инициализирован. Проверьте REPLICATE_API_KEY в настройках."));
    }

    const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);

    console.log(`[Replicate] Генерация изображения с LoRA`);
    console.log(`[Replicate] Оригинальный промпт: ${prompt}`);
    console.log(`[Replicate] Улучшенный промпт: ${enhancedPrompt}`);
    console.log(`[Replicate] LoRA URL: ${loraConfig.modelUrl || 'не указан'}`);

    try {
      // Выбираем модель и версию
      const model = "flux-dev-lora";
      const version = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

      // Подготавливаем input
      const input: any = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_outputs: options.numImages || 1,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: 7.5,
      };

      // Если есть LoRA URL, добавляем его
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }

      // Для синхронного вызова (TaskEither) возвращаем ошибку
      return left(
        new Error("Используйте Replicate client напрямую или ReplicateServiceImpl для асинхронной генерации")
      );
    } catch (error) {
      console.error("[Replicate] Ошибка генерации:", error);
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Асинхронная генерация через Replicate (для реального использования)
   */
  async generateImageAsync(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): Promise<TaskEither<Error, ImageGenerationResult>> {
    if (!this.client) {
      return Promise.resolve(left(new Error("Replicate Service не инициализирован")));
    }

    try {
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);

      // Выбираем модель в зависимости от наличия LoRA
      const model = loraConfig.modelUrl
        ? "flux-dev-lora"  // Для LoRA моделей
        : "flux-schnell";  // Без LoRA

      const version = loraConfig.modelUrl
        ? "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
        : "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4";

      const input: any = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_outputs: options.numImages || 1,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: 7.5,
      };

      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }

      console.log(`[Replicate] Отправляем запрос к ${model}`);

      const output = await this.client.run(
        `${model}:${version}`,
        { input }
      );

      console.log(`[Replicate] Получен результат:`, output);

      const imageUrls = this.extractImageUrls(output);
      const success = imageUrls.length > 0;

      if (success) {
        console.log(`[Replicate] ✅ Сгенерировано ${imageUrls.length} изображений`);
        return Promise.resolve(
          right({
            success: true,
            imageUrls,
            metadata: {
              enhanced_prompt: enhancedPrompt,
              provider: "replicate",
              model,
              version,
              lora_url: loraConfig.modelUrl || null,
              lora_scale: loraConfig.modelUrl ? 0.85 : null,
            },
          })
        );
      } else {
        console.error("[Replicate] ❌ Изображения не найдены в ответе");
        return Promise.resolve(
          left(new Error("Изображения не найдены в ответе Replicate"))
        );
      }
    } catch (error) {
      console.error("[Replicate] ❌ Ошибка:", error);
      return Promise.resolve(
        left(error instanceof Error ? error : new Error(String(error)))
      );
    }
  }
}

// Экспортируем экземпляр для совместимости с существующим кодом
export const ReplicateService: IReplicateService = {
  apiKey: null,

  async initialize(runtime: IAgentRuntime): Promise<void> {
    const apiKey = runtime.getSetting("REPLICATE_API_KEY");

    if (!apiKey) {
      console.warn("⚠️  REPLICATE_API_KEY не найден. ReplicateService будет неактивен.");
      return;
    }

    (ReplicateService as any).apiKey = apiKey;
    console.log("✅ ReplicateService инициализирован");
  },

  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult> {
    if (!(ReplicateService as any).apiKey) {
      return left(new Error("Replicate Service не инициализирован. Проверьте REPLICATE_API_KEY в настройках."));
    }

    // Используем Replicate напрямую для простой генерации
    const enhancedPrompt = options.prompt + ", high quality, detailed, 8k";

    console.log("🎨 Replicate Service: Генерация изображения", options);

    try {
      // Для простой генерации без LoRA используем flux-schnell
      return left(
        new Error("Используйте Replicate client напрямую или ReplicateServiceImpl для асинхронной генерации")
      );
    } catch (error) {
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  },
};
