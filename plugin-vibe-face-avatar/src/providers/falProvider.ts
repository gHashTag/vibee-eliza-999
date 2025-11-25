import {
  ImageGenerationProvider,
  ModelInfo,
} from "../types/provider.interface";
import {
  TaskEither,
  tryCatchAsync,
  left,
} from "../utils/functional/result";
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
        if (modelConfig.apiSettings.supportsLoRA) {
          input.loras = [];
          
          // 1. Dynamic LoRA from options (User's custom model)
          if (options.modelUrl) {
             input.loras.push({
               path: options.modelUrl,
               scale: 1.0, // Default scale
             });
          }
          
          // 2. Default LoRA from constructor (System default)
          if (this.defaultLoRA) {
            input.loras.push({
              path: this.defaultLoRA.path,
              scale: this.defaultLoRA.scale,
            });
          }
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
