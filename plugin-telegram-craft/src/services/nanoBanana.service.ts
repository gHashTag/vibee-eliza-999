// @ts-nocheck
/**
 * NanoBananaService
 * Универсальный сервис для генерации изображений через Replicate API
 *
 * Поддерживаемые модели:
 * - bytedance/seedream-4.5 (DEFAULT) - лучшее качество, spatial understanding
 * - google/nano-banana-pro - альтернатива
 *
 * Возможности:
 * - Генерация изображений по текстовому промпту
 * - Создание лидмагнитов из аватарки пользователя
 * - Редактирование/трансформация фото (до 14 изображений)
 * - Поддержка разных разрешений (2K, 4K) и форматов
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core';
import Replicate from 'replicate';

/**
 * Логгер для NanoBananaService
 */
const log = {
  info: (msg: string) => logger.info(`[NanoBananaService] ${msg}`),
  warn: (msg: string) => logger.warn(`[NanoBananaService] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[NanoBananaService] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[NanoBananaService] ${msg}`),
};

/**
 * Доступные модели для генерации
 */
export type ModelType = 'seedream' | 'nano-banana';

export const MODELS: Record<ModelType, string> = {
  'seedream': 'bytedance/seedream-4.5',
  'nano-banana': 'google/nano-banana-pro',
};

/**
 * Типы для API
 */
export type AspectRatio = '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | 'match_input_image';
export type Resolution = '2K' | '4K';
export type OutputFormat = 'png' | 'jpg';
export type SafetyFilterLevel = 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high' | 'block_none';

export interface GenerateOptions {
  /** Текстовый промпт для генерации */
  prompt: string;
  /** URLs изображений для редактирования/трансформации (до 14) */
  images?: string[];
  /** Соотношение сторон (default: 9:16) */
  aspectRatio?: AspectRatio;
  /** Разрешение (default: 2K) */
  resolution?: Resolution;
  /** Формат выходного файла (default: jpg) */
  outputFormat?: OutputFormat;
  /** Уровень фильтра безопасности (default: block_only_high) */
  safetyFilterLevel?: SafetyFilterLevel;
  /** Негативный промпт */
  negativePrompt?: string;
  /** Seed для воспроизводимости */
  seed?: number;
  /** Модель для генерации (default: seedream) */
  model?: ModelType;
}

export interface LeadMagnetOptions {
  /** URL аватарки пользователя */
  avatarUrl: string;
  /** Тип лидмагнита */
  type: 'business_card' | 'social_media' | 'promo_banner' | 'profile_photo' | 'custom';
  /** Имя пользователя (для текста на изображении) */
  userName?: string;
  /** Заголовок/слоган */
  headline?: string;
  /** Кастомный промпт (для type: custom) */
  customPrompt?: string;
  /** Соотношение сторон */
  aspectRatio?: AspectRatio;
  /** Разрешение */
  resolution?: Resolution;
  /** Модель для генерации */
  model?: ModelType;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    prompt: string;
    resolution: Resolution;
    aspectRatio: AspectRatio;
    format: OutputFormat;
    model: string;
    processingTime?: number;
  };
}

/**
 * Шаблоны промптов для лидмагнитов
 */
const LEAD_MAGNET_TEMPLATES: Record<LeadMagnetOptions['type'], string> = {
  business_card: 'Professional business card design with elegant typography, featuring the person from the reference image. Modern minimalist style with subtle gradients. Name: "{userName}", headline: "{headline}". High quality corporate design.',
  social_media: 'Eye-catching social media profile picture featuring the person from the reference image. Vibrant colors, professional lighting, modern aesthetic. Perfect for Instagram, LinkedIn, Twitter avatar.',
  promo_banner: 'Promotional banner featuring the person from the reference image. Dynamic composition with bold typography. Text: "{headline}". Modern marketing design, attention-grabbing visuals.',
  profile_photo: 'Professional portrait photo enhancement of the person from the reference image. Studio lighting, clean background, polished appearance. Perfect for business profiles.',
  custom: '{customPrompt}',
};

/**
 * NanoBananaService - генерация изображений через Replicate API
 * По умолчанию использует Seedream 4.5 (bytedance/seedream-4.5)
 */
export class NanoBananaService extends Service {
  static serviceType = 'nano-banana';
  serviceType = 'nano-banana';

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info('STATIC start() called');
    const instance = new NanoBananaService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info('STATIC stop() called');
    const instance = runtime.getService('nano-banana') as NanoBananaService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription = 'Генерация изображений через Replicate API (Nano Banana Pro по умолчанию)';

  /** Replicate клиент */
  private replicate: Replicate | null = null;

  /** Runtime агента */
  private runtime: IAgentRuntime | null = null;

  /** Флаг инициализации */
  private isInitialized = false;

  /** Модель по умолчанию */
  private defaultModel: ModelType = 'nano-banana';

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      log.warn('Service already initialized');
      return;
    }

    this.runtime = runtime;

    // Получаем API ключ из секретов
    const apiKey = runtime.getSetting('REPLICATE_API_KEY') ||
                   runtime.getSetting('REPLICATE_API_TOKEN') ||
                   process.env.REPLICATE_API_KEY ||
                   process.env.REPLICATE_API_TOKEN;

    if (!apiKey) {
      log.error('REPLICATE_API_KEY not found in settings or environment');
      throw new Error('REPLICATE_API_KEY is required for NanoBananaService');
    }

    this.replicate = new Replicate({
      auth: apiKey,
    });

    this.isInitialized = true;
    log.info(`Service initialized successfully (default model: ${MODELS[this.defaultModel]})`);
  }

  /**
   * Запуск сервиса
   */
  async start(): Promise<void> {
    log.info('Service started');
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    this.replicate = null;
    this.isInitialized = false;
    log.info('Service stopped');
  }

  /**
   * Генерация изображения по промпту
   */
  async generate(options: GenerateOptions): Promise<GenerationResult> {
    if (!this.replicate) {
      return {
        success: false,
        error: 'Service not initialized',
      };
    }

    const startTime = Date.now();

    try {
      const {
        prompt,
        images = [],
        aspectRatio = '9:16', // Вертикальный формат по умолчанию
        resolution = '2K',
        outputFormat = 'jpg',
        negativePrompt,
        seed,
        model = this.defaultModel,
      } = options;

      const modelId = MODELS[model];
      log.info(`Generating image with ${modelId}, prompt: "${prompt.substring(0, 50)}..."`);

      // Формируем input в зависимости от модели
      const input: Record<string, unknown> = this.buildInput(model, {
        prompt,
        images,
        aspectRatio,
        resolution,
        outputFormat,
        negativePrompt,
        seed,
      });

      log.info(`Calling Replicate API (${modelId}) with input: ${JSON.stringify(Object.keys(input))}`);

      // Используем predictions API для более надёжного результата
      const prediction = await this.replicate.predictions.create({
        model: modelId,
        input,
      });

      log.info(`Prediction created: ${prediction.id}, status: ${prediction.status}`);

      // Ждём завершения prediction
      let completedPrediction = prediction;
      let attempts = 0;
      const maxAttempts = 90; // 90 * 2 сек = 3 минуты максимум

      while (completedPrediction.status !== 'succeeded' && completedPrediction.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Ждём 2 секунды
        completedPrediction = await this.replicate.predictions.get(prediction.id);
        attempts++;
        if (attempts % 5 === 0) {
          log.info(`Waiting for prediction... status: ${completedPrediction.status}, attempt: ${attempts}`);
        }
      }

      const processingTime = Date.now() - startTime;

      log.info(`Prediction completed: status=${completedPrediction.status}, output=${JSON.stringify(completedPrediction.output)?.substring(0, 200)}`);

      if (completedPrediction.status === 'failed') {
        throw new Error(`Prediction failed: ${completedPrediction.error}`);
      }

      const output = completedPrediction.output;

      // output может быть string (URL) или массивом
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error(`Invalid response from Replicate API: ${JSON.stringify(output)?.substring(0, 500)}`);
      }

      log.info(`Image generated successfully in ${processingTime}ms`);

      return {
        success: true,
        imageUrl,
        metadata: {
          prompt,
          resolution,
          aspectRatio,
          format: outputFormat,
          model: modelId,
          processingTime,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Generation failed', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Построение input параметров в зависимости от модели
   */
  private buildInput(model: ModelType, params: {
    prompt: string;
    images: string[];
    aspectRatio: AspectRatio;
    resolution: Resolution;
    outputFormat: OutputFormat;
    negativePrompt?: string;
    seed?: number;
  }): Record<string, unknown> {
    const { prompt, images, aspectRatio, resolution, outputFormat, negativePrompt, seed } = params;

    if (model === 'seedream') {
      // Seedream 4.5 API
      const input: Record<string, unknown> = {
        prompt,
        size: resolution,
        aspect_ratio: aspectRatio,
        max_images: 1,
        sequential_image_generation: 'disabled',
      };

      // Добавляем изображения для image-to-image
      if (images.length > 0) {
        const processedImages = this.processImages(images);
        if (processedImages.length > 0) {
          input.image_input = processedImages;
          // При наличии входного изображения используем match_input_image
          if (aspectRatio === '9:16' || aspectRatio === '16:9') {
            input.aspect_ratio = aspectRatio; // Сохраняем заданный aspect ratio
          }
        }
      }

      return input;
    } else {
      // Nano Banana Pro API (google/nano-banana-pro)
      // Параметры согласно документации: prompt, image_input, aspect_ratio, resolution, output_format, safety_filter_level
      const input: Record<string, unknown> = {
        prompt,
        aspect_ratio: aspectRatio, // 1:1, 4:3, 16:9, 3:4, 9:16
        resolution, // 1K, 2K, 4K
        output_format: outputFormat, // jpg, png
        safety_filter_level: 'block_only_high',
      };

      // Добавляем изображения для редактирования (до 14)
      // Nano Banana Pro поддерживает до 14 входных изображений и сохраняет сходство до 5 людей
      if (images.length > 0) {
        const processedImages = this.processImages(images);
        if (processedImages.length > 0) {
          // Для Nano Banana Pro используем URLs напрямую (предпочтительнее чем base64)
          input.image_input = processedImages;
        }
        log.info(`Using ${processedImages.length} reference images for face/object consistency`);
      }

      // Nano Banana Pro не поддерживает negative_prompt и seed напрямую
      // Эти параметры специфичны для Seedream

      return input;
    }
  }

  /**
   * Обработка изображений - конвертация data URLs в File objects
   */
  private processImages(images: string[]): (File | string)[] {
    const processedImages: (File | string)[] = [];

    for (const img of images.slice(0, 14)) {
      log.info(`Processing image, starts with: "${img.substring(0, 30)}..."`);

      if (img.startsWith('data:')) {
        // Конвертируем data URL в File
        const file = this.dataUrlToFile(img);
        if (file) {
          processedImages.push(file);
        }
      } else {
        // HTTP URL - передаём как есть
        processedImages.push(img);
      }
    }

    return processedImages;
  }

  /**
   * Создание лидмагнита из аватарки пользователя
   */
  async createLeadMagnet(options: LeadMagnetOptions): Promise<GenerationResult> {
    const {
      avatarUrl,
      type,
      userName = 'User',
      headline = 'Professional Services',
      customPrompt = '',
      aspectRatio = type === 'social_media' ? '1:1' : '9:16',
      resolution = '2K',
      model = this.defaultModel,
    } = options;

    // Получаем шаблон промпта
    let prompt = LEAD_MAGNET_TEMPLATES[type];

    // Подставляем переменные
    prompt = prompt
      .replace('{userName}', userName)
      .replace('{headline}', headline)
      .replace('{customPrompt}', customPrompt);

    log.info(`Creating ${type} lead magnet for ${userName} with ${MODELS[model]}`);

    return this.generate({
      prompt,
      images: [avatarUrl],
      aspectRatio,
      resolution,
      outputFormat: 'jpg',
      model,
    });
  }

  /**
   * Редактирование фото с промптом
   */
  async editPhoto(photoUrl: string, prompt: string, options?: Partial<GenerateOptions>): Promise<GenerationResult> {
    log.info(`Editing photo with prompt: "${prompt.substring(0, 50)}..."`);

    return this.generate({
      prompt,
      images: [photoUrl],
      aspectRatio: options?.aspectRatio || '9:16',
      resolution: options?.resolution || '2K',
      outputFormat: options?.outputFormat || 'jpg',
      model: options?.model || this.defaultModel,
      ...options,
    });
  }

  /**
   * Смешивание нескольких изображений
   */
  async blendImages(imageUrls: string[], prompt: string, options?: Partial<GenerateOptions>): Promise<GenerationResult> {
    if (imageUrls.length < 2) {
      return {
        success: false,
        error: 'At least 2 images required for blending',
      };
    }

    if (imageUrls.length > 14) {
      log.warn(`Too many images (${imageUrls.length}), using first 14`);
    }

    log.info(`Blending ${Math.min(imageUrls.length, 14)} images`);

    return this.generate({
      prompt,
      images: imageUrls.slice(0, 14),
      aspectRatio: options?.aspectRatio || '9:16',
      resolution: options?.resolution || '2K',
      outputFormat: options?.outputFormat || 'jpg',
      model: options?.model || this.defaultModel,
      ...options,
    });
  }

  /**
   * Установить модель по умолчанию
   */
  setDefaultModel(model: ModelType): void {
    this.defaultModel = model;
    log.info(`Default model set to: ${MODELS[model]}`);
  }

  /**
   * Получить текущую модель по умолчанию
   */
  getDefaultModel(): ModelType {
    return this.defaultModel;
  }

  /**
   * Получить список доступных моделей
   */
  getAvailableModels(): Record<ModelType, string> {
    return MODELS;
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    return this.isInitialized && this.replicate !== null;
  }

  /**
   * Конвертация data URL в File объект для Replicate API
   */
  private dataUrlToFile(dataUrl: string): File | null {
    try {
      // Парсим data URL: data:image/jpeg;base64,/9j/4AAQ...
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        log.warn('Invalid data URL format');
        return null;
      }

      const mimeType = match[1];
      const base64Data = match[2];

      // Декодируем base64 в бинарные данные
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Создаём Blob и File
      const blob = new Blob([bytes], { type: mimeType });
      const extension = mimeType.split('/')[1] || 'jpg';
      const file = new File([blob], `image.${extension}`, { type: mimeType });

      log.info(`Converted data URL to File: ${file.name} (${file.size} bytes)`);
      return file;
    } catch (error) {
      log.error('Failed to convert data URL to File', error);
      return null;
    }
  }
}

export default NanoBananaService;
