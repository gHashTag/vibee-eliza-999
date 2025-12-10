/**
 * OllamaEmbeddingService
 * Сервис для генерации embeddings через локальный Ollama
 *
 * Использует модель nomic-embed-text (768 dimensions)
 * Запуск: ollama serve && ollama pull nomic-embed-text
 */

import { logger } from '@elizaos/core';
import type { OllamaEmbeddingConfig, DEFAULT_OLLAMA_CONFIG } from '../../types/knowledge.types';

/**
 * Логгер
 */
const log = {
  info: (msg: string) => logger.info(`[OllamaEmbedding] ${msg}`),
  warn: (msg: string) => logger.warn(`[OllamaEmbedding] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[OllamaEmbedding] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[OllamaEmbedding] ${msg}`),
};

/**
 * Интерфейс ответа Ollama API
 */
interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * OllamaEmbeddingService
 */
export class OllamaEmbeddingService {
  private config: OllamaEmbeddingConfig;
  private isAvailable: boolean = false;

  constructor(config?: Partial<OllamaEmbeddingConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'nomic-embed-text',
      dimensions: config?.dimensions || 768,
    };

    log.debug(`Создан с конфигом: ${JSON.stringify(this.config)}`);
  }

  /**
   * Проверить доступность Ollama
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        log.warn('Ollama недоступен');
        this.isAvailable = false;
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      const hasModel = models.some((m: { name: string }) =>
        m.name.includes(this.config.model)
      );

      if (!hasModel) {
        log.warn(`Модель ${this.config.model} не найдена. Запустите: ollama pull ${this.config.model}`);
        this.isAvailable = false;
        return false;
      }

      this.isAvailable = true;
      log.info(`Ollama доступен с моделью ${this.config.model}`);
      return true;
    } catch (error) {
      log.error('Ошибка проверки Ollama', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Сгенерировать embedding для одного текста
   */
  async embedSingle(text: string): Promise<number[]> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error('Ollama недоступен. Запустите: ollama serve && ollama pull nomic-embed-text');
      }
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: text,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data: OllamaEmbeddingResponse = await response.json();

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding response from Ollama');
      }

      log.debug(`Сгенерирован embedding размером ${data.embedding.length}`);
      return data.embedding;
    } catch (error) {
      log.error(`Ошибка генерации embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Сгенерировать embeddings для массива текстов
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    log.info(`Генерация embeddings для ${texts.length} текстов...`);

    const embeddings: number[][] = [];

    // Ollama не поддерживает batch API, генерируем последовательно
    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.embedSingle(texts[i]);
        embeddings.push(embedding);

        // Логируем прогресс каждые 10 текстов
        if ((i + 1) % 10 === 0) {
          log.info(`Прогресс: ${i + 1}/${texts.length}`);
        }
      } catch (error) {
        log.error(`Ошибка для текста ${i}: ${error}`);
        // Добавляем пустой вектор при ошибке
        embeddings.push(new Array(this.config.dimensions).fill(0));
      }
    }

    log.info(`Сгенерировано ${embeddings.length} embeddings`);
    return embeddings;
  }

  /**
   * Получить размерность embedding
   */
  getDimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Получить название модели
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Проверить, доступен ли сервис
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Получить конфигурацию
   */
  getConfig(): OllamaEmbeddingConfig {
    return { ...this.config };
  }
}

export default OllamaEmbeddingService;
