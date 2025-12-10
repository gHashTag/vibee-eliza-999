/**
 * AvatarAnalysisService - анализ аватарок через CV модели на Replicate
 *
 * Использует связку YOLO11n + LLaVA для:
 * 1. Детекции человека на фото (YOLO11n) - быстро и дёшево (~$0.0001)
 * 2. Определения пола (LLaVA) - если человек обнаружен (~$0.001)
 *
 * Общая стоимость: ~$0.001 за анализ (в 10-20x дешевле Gemini Vision)
 */

import { logger } from '@elizaos/core';

const log = {
  info: (msg: string) => logger.info(`[AvatarAnalysis] ${msg}`),
  warn: (msg: string) => logger.warn(`[AvatarAnalysis] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[AvatarAnalysis] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[AvatarAnalysis] ${msg}`),
};

/**
 * Результат анализа аватарки
 */
export interface AvatarAnalysis {
  /** Есть ли человек на фото */
  hasHuman: boolean;
  /** Определённый пол */
  gender: 'male' | 'female' | 'unknown';
  /** Уверенность в результате (0-100) */
  confidence: number;
}

/**
 * Детекция объекта от YOLO
 */
interface YoloDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Кэш результатов анализа
 */
interface CacheEntry {
  analysis: AvatarAnalysis;
  timestamp: number;
}

/**
 * AvatarAnalysisService - сервис анализа аватарок
 */
export class AvatarAnalysisService {
  private readonly replicateKey: string;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 час

  // Версии моделей на Replicate
  private readonly YOLO_MODEL = 'ultralytics/yolo11n';
  private readonly YOLO_VERSION = '5b5cd6ec47664a3194d03ae0bf514ed0a887003e2d466dd938a66faab9fe7875';
  private readonly LLAVA_MODEL = 'yorickvp/llava-13b';

  constructor(replicateKey: string) {
    this.replicateKey = replicateKey;
    log.info('AvatarAnalysisService initialized');
  }

  /**
   * Полный анализ аватарки: детекция человека + определение пола
   */
  async analyze(imageDataUrl: string): Promise<AvatarAnalysis> {
    // Проверяем кэш (используем хэш начала base64)
    const cacheKey = this.getCacheKey(imageDataUrl);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      log.debug(`Cache hit for avatar analysis`);
      return cached.analysis;
    }

    try {
      log.info('Starting avatar analysis...');

      // Шаг 1: YOLO детекция - есть ли человек?
      const hasHuman = await this.detectPerson(imageDataUrl);
      log.info(`YOLO detection result: hasHuman=${hasHuman}`);

      if (!hasHuman) {
        const result: AvatarAnalysis = {
          hasHuman: false,
          gender: 'unknown',
          confidence: 95,
        };
        this.cache.set(cacheKey, { analysis: result, timestamp: Date.now() });
        return result;
      }

      // Шаг 2: LLaVA для определения пола
      const genderResult = await this.classifyGender(imageDataUrl);
      log.info(`Gender classification: ${genderResult.gender} (confidence: ${genderResult.confidence}%)`);

      const analysis: AvatarAnalysis = {
        hasHuman: true,
        gender: genderResult.gender,
        confidence: genderResult.confidence,
      };

      this.cache.set(cacheKey, { analysis, timestamp: Date.now() });
      return analysis;
    } catch (error) {
      log.error('Avatar analysis failed', error);
      // Fallback: предполагаем что есть человек, пол неизвестен
      return { hasHuman: true, gender: 'unknown', confidence: 0 };
    }
  }

  /**
   * YOLO11n детекция человека на фото
   * Стоимость: ~$0.0001 за запрос
   */
  private async detectPerson(imageDataUrl: string): Promise<boolean> {
    try {
      // Конвертируем data URL в обычный URL если нужно
      // YOLO принимает и base64 data URL
      const imageInput = imageDataUrl;

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.replicateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.YOLO_VERSION,
          input: {
            image: imageInput,
            conf: 0.25, // Порог уверенности
            iou: 0.45,  // IoU для NMS
            return_json: true, // Получить JSON с детекциями
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`YOLO API error: ${response.status} - ${errorText}`);
        return true; // Fallback: предполагаем что есть человек
      }

      const prediction = await response.json();
      const result = await this.waitForPrediction(prediction.id);

      // Парсим результат YOLO
      // Формат: { json_str: "[{...}]" } или { output: [...] }
      let detections: YoloDetection[] = [];

      if (result.output?.json_str) {
        try {
          detections = JSON.parse(result.output.json_str);
        } catch {
          log.warn('Failed to parse YOLO json_str');
        }
      } else if (Array.isArray(result.output)) {
        detections = result.output;
      }

      // Проверяем есть ли класс "person" с высокой уверенностью
      const hasPerson = detections.some(
        (d) => d.class?.toLowerCase() === 'person' && d.confidence > 0.3
      );

      log.debug(`YOLO found ${detections.length} objects, hasPerson=${hasPerson}`);
      return hasPerson;
    } catch (error) {
      log.error('YOLO detection failed', error);
      return true; // Fallback: предполагаем что есть человек
    }
  }

  /**
   * Классификация пола через LLaVA
   * Стоимость: ~$0.001 за запрос
   */
  private async classifyGender(
    imageDataUrl: string
  ): Promise<{ gender: 'male' | 'female' | 'unknown'; confidence: number }> {
    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.replicateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // LLaVA модель (без версии - использует latest)
          model: this.LLAVA_MODEL,
          input: {
            image: imageDataUrl,
            prompt: `Look at this profile photo and determine the gender of the person shown.
Answer with ONLY one word: "male" or "female".
If you cannot determine the gender or there is no person visible, answer "unknown".
Your answer:`,
            max_tokens: 10,
            temperature: 0.1, // Низкая температура для детерминированности
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`LLaVA API error: ${response.status} - ${errorText}`);
        return { gender: 'unknown', confidence: 0 };
      }

      const prediction = await response.json();
      const result = await this.waitForPrediction(prediction.id);

      // Парсим ответ LLaVA
      const output = (result.output || '').toString().toLowerCase().trim();

      if (output.includes('female') || output.includes('woman') || output.includes('girl')) {
        return { gender: 'female', confidence: 85 };
      }

      if (output.includes('male') || output.includes('man') || output.includes('boy')) {
        return { gender: 'male', confidence: 85 };
      }

      log.warn(`LLaVA returned unclear response: "${output}"`);
      return { gender: 'unknown', confidence: 30 };
    } catch (error) {
      log.error('LLaVA gender classification failed', error);
      return { gender: 'unknown', confidence: 0 };
    }
  }

  /**
   * Ожидание завершения prediction на Replicate
   */
  private async waitForPrediction(id: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Bearer ${this.replicateKey}` },
      });

      if (!res.ok) {
        log.warn(`Prediction status check failed: ${res.status}`);
        await this.sleep(1000);
        continue;
      }

      const data = await res.json();

      if (data.status === 'succeeded') {
        return data;
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error(data.error || `Prediction ${data.status}`);
      }

      // starting, processing - продолжаем ждать
      await this.sleep(1000);
    }

    throw new Error('Prediction timeout after 60 seconds');
  }

  /**
   * Генерация ключа кэша из data URL
   */
  private getCacheKey(imageDataUrl: string): string {
    // Берём часть base64 после header как ключ
    const base64Start = imageDataUrl.indexOf('base64,');
    if (base64Start === -1) {
      return imageDataUrl.substring(0, 100);
    }
    return imageDataUrl.substring(base64Start + 7, base64Start + 107);
  }

  /**
   * Утилита для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Очистка устаревшего кэша
   */
  cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      log.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Размер кэша
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export default AvatarAnalysisService;
