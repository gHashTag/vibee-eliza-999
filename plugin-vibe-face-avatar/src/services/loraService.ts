import { fal } from "@fal-ai/client";
import Replicate from "replicate";
import { IAgentRuntime } from "@elizaos/core";
import {
  TaskEither,
  left,
  right,
} from "../utils/functional/result";
import { GenerateImageOptions, ImageGenerationResult } from "../types";

export interface LoraModelConfig {
  modelUrl?: string;
  triggerWord?: string;
  gender?: string;
}

export interface BaseLoraService {
  generateImage(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult>;
}

/**
 * Базовый сервис для работы с LoRA моделями
 * Содержит общую логику обработки промптов и работы с изображениями
 */
export class BaseLoraServiceImpl implements BaseLoraService {
  protected runtime: IAgentRuntime;

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Обогащает промпт trigger word и дополнительными параметрами
   */
  protected buildEnhancedPrompt(
    prompt: string,
    loraConfig: LoraModelConfig
  ): string {
    const parts = [];

    // Добавляем trigger word
    if (loraConfig.triggerWord) {
      parts.push(loraConfig.triggerWord);
    }

    // Добавляем пол для улучшения качества
    if (loraConfig.gender) {
      const genderPrompts = {
        male: "man, male, masculine",
        female: "woman, female, feminine",
        person: "person",
      };
      parts.push(genderPrompts[loraConfig.gender as keyof typeof genderPrompts] || "person");
    }

    // Добавляем оригинальный промпт
    parts.push(prompt);

    // Добавляем улучшители качества
    parts.push("high quality, detailed, 8k resolution, photorealistic");

    return parts.join(", ");
  }

  /**
   * Извлекает URL изображения из результата
   */
  protected extractImageUrls(result: any): string[] {
    // Проверяем различные форматы ответов от разных API
    if (result.images && Array.isArray(result.images)) {
      return result.images.map((img: any) => img.url || img).filter(Boolean);
    }

    if (result.image && typeof result.image === 'string') {
      return [result.image];
    }

    if (result.url && typeof result.url === 'string') {
      return [result.url];
    }

    if (Array.isArray(result)) {
      return result.filter(Boolean);
    }

    return [];
  }

  /**
   * Создает стандартный ответ с изображениями
   */
  protected createSuccessResult(
    result: any,
    metadata: Record<string, any>
  ): ImageGenerationResult {
    const imageUrls = this.extractImageUrls(result);

    return {
      success: imageUrls.length > 0,
      imageUrls,
      metadata: {
        ...metadata,
        enhanced_prompt: metadata.enhanced_prompt,
        provider: metadata.provider,
      },
    };
  }

  generateImage(
    prompt: string,
    loraConfig: LoraModelConfig,
    options: GenerateImageOptions
  ): TaskEither<Error, ImageGenerationResult> {
    throw new Error("Must be implemented by subclass");
  }
}
