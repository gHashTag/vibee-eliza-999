/**
 * KnowledgeService
 * Unified сервис для работы с базами знаний и RAG
 *
 * Объединяет:
 * - Загрузку документов (MD, PDF, Web)
 * - Генерацию embeddings (Ollama)
 * - Поиск по векторной БД (pgvector)
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { OllamaEmbeddingService } from '../knowledge/embeddings/OllamaEmbeddingService';
import { VectorSearch } from '../knowledge/search/VectorSearch';
import { knowledgeChunks, knowledgeSources } from '../db/schema';
import type {
  KnowledgeChunk,
  SearchResult,
  SearchOptions,
  LoaderOptions,
  ChunkMetadata,
  ChunkType,
} from '../types/knowledge.types';

/**
 * Логгер
 */
const log = {
  info: (msg: string) => logger.info(`[KnowledgeService] ${msg}`),
  warn: (msg: string) => logger.warn(`[KnowledgeService] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[KnowledgeService] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[KnowledgeService] ${msg}`),
};

/**
 * KnowledgeService
 */
export class KnowledgeService extends Service {
  static serviceType = 'knowledge';
  serviceType = 'knowledge';

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    console.log('🚀 [KnowledgeService] STATIC start() called');
    const instance = new KnowledgeService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [KnowledgeService] STATIC stop() called');
    const instance = runtime.getService('knowledge') as KnowledgeService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription = 'Управление базами знаний и RAG поиском';

  private db: PostgresJsDatabase | null = null;

  private embeddingService: OllamaEmbeddingService;
  private vectorSearch: VectorSearch;

  private isInitialized = false;

  constructor() {
    super();
    this.embeddingService = new OllamaEmbeddingService();
    this.vectorSearch = new VectorSearch();
    log.debug('KnowledgeService создан');
  }

  /**
   * Запуск сервиса (required by ElizaOS Service interface)
   */
  async start(): Promise<void> {
    log.info('KnowledgeService started');
  }

  /**
   * Остановка сервиса (required by Service abstract class)
   */
  async stop(): Promise<void> {
    this.db = null;
    this.isInitialized = false;
    log.info('KnowledgeService остановлен');
  }

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    log.info('Инициализация KnowledgeService...');

    this.runtime = runtime; // Service base class property

    // Получаем database adapter
    try {
      // @ts-ignore - ElizaOS internal API
      const databaseAdapter = runtime.databaseAdapter;

      if (databaseAdapter?.db) {
        this.db = databaseAdapter.db as PostgresJsDatabase;
        this.vectorSearch.setDatabase(this.db);
        log.info('Database подключена');
      } else {
        log.warn('Database недоступна - RAG функционал ограничен');
      }

      // Проверяем Ollama
      const ollamaAvailable = await this.embeddingService.checkAvailability();
      if (!ollamaAvailable) {
        log.warn('Ollama недоступен - embeddings не будут генерироваться');
        log.warn('Запустите: ollama serve && ollama pull nomic-embed-text');
      }

      this.isInitialized = true;
      log.info('KnowledgeService инициализирован');
    } catch (error) {
      log.error('Ошибка инициализации', error);
      this.isInitialized = true; // Помечаем как инициализированный, но с ограничениями
    }
  }

  /**
   * Поиск релевантного контента для сообщения
   */
  async searchRelevantContent(
    query: string,
    chatConfigId: string,
    options?: Partial<SearchOptions>
  ): Promise<SearchResult[]> {
    if (!this.embeddingService.isServiceAvailable()) {
      log.warn('Ollama недоступен - поиск невозможен');
      return [];
    }

    try {
      // Генерируем embedding для запроса
      const queryEmbedding = await this.embeddingService.embedSingle(query);

      // Ищем похожие чанки
      const results = await this.vectorSearch.search(
        queryEmbedding,
        chatConfigId,
        options
      );

      log.debug(`Найдено ${results.length} релевантных чанков`);
      return results;
    } catch (error) {
      log.error('Ошибка поиска', error);
      return [];
    }
  }

  /**
   * Получить RAG контекст для сообщения в формате строки
   */
  async getRagContext(
    query: string,
    chatConfigId: string,
    limit: number = 5
  ): Promise<string> {
    const results = await this.searchRelevantContent(query, chatConfigId, { limit });
    return this.vectorSearch.formatResultsForContext(results);
  }

  /**
   * Обработать и сохранить чанки для источника знаний
   */
  async processAndSaveChunks(
    chunks: Array<{ content: string; metadata: Partial<ChunkMetadata> }>,
    chatConfigId: string,
    sourceId: string
  ): Promise<number> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    if (!this.embeddingService.isServiceAvailable()) {
      throw new Error('Ollama недоступен');
    }

    log.info(`Обработка ${chunks.length} чанков...`);

    let savedCount = 0;

    // Обрабатываем чанки пакетами по 10
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Генерируем embeddings для пакета
      const contents = batch.map((c) => c.content);
      const embeddings = await this.embeddingService.embedBatch(contents);

      // Сохраняем в БД
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];

        try {
          await this.db.insert(knowledgeChunks).values({
            chatConfigId,
            sourceId,
            content: chunk.content,
            embedding,
            chunkType: chunk.metadata.chunkType || 'general',
            chapter: chunk.metadata.chapter,
            title: chunk.metadata.title,
            tags: chunk.metadata.tags,
            position: chunk.metadata.position || i + j,
            metadata: chunk.metadata as ChunkMetadata,
          });

          savedCount++;
        } catch (error) {
          log.error(`Ошибка сохранения чанка ${i + j}`, error);
        }
      }

      log.info(`Прогресс: ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
    }

    // Обновляем статус источника
    await this.db
      .update(knowledgeSources)
      .set({
        isProcessed: true,
        lastProcessedAt: new Date(),
        chunkCount: savedCount,
      })
      .where(eq(knowledgeSources.id, sourceId));

    log.info(`Сохранено ${savedCount} чанков`);
    return savedCount;
  }

  /**
   * Простой chunking текста
   */
  chunkText(
    text: string,
    options: Partial<LoaderOptions> = {}
  ): Array<{ content: string; metadata: Partial<ChunkMetadata> }> {
    const chunkSize = options.chunkSize || 1024;
    const overlap = options.chunkOverlap || 100;

    const chunks: Array<{ content: string; metadata: Partial<ChunkMetadata> }> = [];

    // Разбиваем по параграфам сначала
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';
    let position = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize) {
        // Сохраняем текущий чанк
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              chunkType: 'general',
              position,
            },
          });
          position++;
        }

        // Начинаем новый чанк с overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + ' ' + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Сохраняем последний чанк
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkType: 'general',
          position,
        },
      });
    }

    return chunks;
  }

  /**
   * Загрузить Markdown файл и разбить на чанки
   */
  async loadMarkdownFile(
    filePath: string,
    chatConfigId: string,
    sourceId: string
  ): Promise<number> {
    const fs = await import('fs/promises');

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Парсим заголовки для метаданных
      const chunks = this.parseMarkdownToChunks(content);

      return await this.processAndSaveChunks(chunks, chatConfigId, sourceId);
    } catch (error) {
      log.error(`Ошибка загрузки файла ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Парсинг Markdown с сохранением структуры заголовков
   */
  private parseMarkdownToChunks(
    content: string
  ): Array<{ content: string; metadata: Partial<ChunkMetadata> }> {
    const chunks: Array<{ content: string; metadata: Partial<ChunkMetadata> }> = [];

    // Разбиваем по заголовкам
    const sections = content.split(/(?=^#{1,3}\s)/m);

    let currentChapter = '';
    let position = 0;

    for (const section of sections) {
      if (!section.trim()) continue;

      // Извлекаем заголовок
      const headerMatch = section.match(/^(#{1,3})\s+(.+)/m);
      const title = headerMatch ? headerMatch[2].trim() : undefined;
      const level = headerMatch ? headerMatch[1].length : 0;

      if (level === 1 || level === 2) {
        currentChapter = title || currentChapter;
      }

      // Определяем тип контента
      let chunkType: ChunkType = 'general';
      const lowerContent = section.toLowerCase();

      if (lowerContent.includes('```') || lowerContent.includes('пример')) {
        chunkType = 'example';
      } else if (lowerContent.includes('совет') || lowerContent.includes('tip')) {
        chunkType = 'tip';
      } else if (lowerContent.includes('?') || lowerContent.includes('вопрос')) {
        chunkType = 'question';
      } else if (lowerContent.includes('цена') || lowerContent.includes('стоимость')) {
        chunkType = 'sales';
      }

      // Разбиваем длинные секции
      if (section.length > 1500) {
        const subChunks = this.chunkText(section, { chunkSize: 1000, chunkOverlap: 100 });
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            metadata: {
              chapter: currentChapter,
              title,
              chunkType,
              position: position++,
            },
          });
        }
      } else {
        chunks.push({
          content: section.trim(),
          metadata: {
            chapter: currentChapter,
            title,
            chunkType,
            position: position++,
          },
        });
      }
    }

    return chunks;
  }

  /**
   * Получить статистику
   */
  async getStats(): Promise<{
    isOllamaAvailable: boolean;
    isDatabaseAvailable: boolean;
    embeddingModel: string;
    embeddingDimensions: number;
  }> {
    return {
      isOllamaAvailable: this.embeddingService.isServiceAvailable(),
      isDatabaseAvailable: !!this.db,
      embeddingModel: this.embeddingService.getModel(),
      embeddingDimensions: this.embeddingService.getDimensions(),
    };
  }

  /**
   * Получить количество чанков для чата
   */
  async getChunkCount(chatConfigId: string): Promise<number> {
    return this.vectorSearch.getChunkCount(chatConfigId);
  }
}

export default KnowledgeService;
