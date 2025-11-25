import { TaskEither } from "../utils/functional/result";
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
