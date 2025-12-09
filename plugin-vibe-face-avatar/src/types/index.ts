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
  // LoRA support fields
  triggerWord?: string;
  gender?: string;
  numInferenceSteps?: number;
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
    // Extended metadata fields
    enhanced_prompt?: string;
    provider?: string;
    version?: string;
    lora_url?: string | null;
    lora_scale?: number | null;
    [key: string]: unknown;
  };
  error?: string;
}
