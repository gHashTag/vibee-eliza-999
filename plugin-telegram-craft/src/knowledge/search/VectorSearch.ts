/**
 * VectorSearch
 * Поиск по векторной базе данных с использованием pgvector
 */

import { logger } from '@elizaos/core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql, eq, and, gte } from 'drizzle-orm';
import { knowledgeChunks } from '../../db/schema';
import type { SearchResult, SearchOptions, DEFAULT_SEARCH_OPTIONS } from '../../types/knowledge.types';
import type { KnowledgeChunk, ChunkMetadata } from '../../types/knowledge.types';

/**
 * Логгер
 */
const log = {
  info: (msg: string) => logger.info(`[VectorSearch] ${msg}`),
  warn: (msg: string) => logger.warn(`[VectorSearch] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[VectorSearch] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[VectorSearch] ${msg}`),
};

/**
 * Дефолтные опции поиска
 */
const DEFAULT_OPTIONS: SearchOptions = {
  limit: 5,
  minSimilarity: 0.7,
};

/**
 * VectorSearch - поиск по pgvector
 */
export class VectorSearch {
  private db: PostgresJsDatabase | null = null;

  constructor(db?: PostgresJsDatabase) {
    if (db) {
      this.db = db;
    }
    log.debug('VectorSearch создан');
  }

  /**
   * Установить подключение к БД
   */
  setDatabase(db: PostgresJsDatabase): void {
    this.db = db;
    log.info('Database подключена');
  }

  /**
   * Поиск похожих чанков по embedding
   * Использует косинусное сходство через pgvector оператор <=>
   */
  async search(
    queryEmbedding: number[],
    chatConfigId: string,
    options?: Partial<SearchOptions>
  ): Promise<SearchResult[]> {
    if (!this.db) {
      log.warn('Database не инициализирована');
      return [];
    }

    const opts: SearchOptions = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Формируем vector literal для PostgreSQL
      const vectorLiteral = `[${queryEmbedding.join(',')}]`;

      // SQL запрос с pgvector cosine distance
      // 1 - (embedding <=> query) = cosine similarity
      const results = await this.db.execute(sql`
        SELECT
          id,
          content,
          chunk_type,
          chapter,
          title,
          tags,
          position,
          metadata,
          (1 - (embedding <=> ${vectorLiteral}::vector)) AS similarity
        FROM knowledge_chunks
        WHERE
          chat_config_id = ${chatConfigId}
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> ${vectorLiteral}::vector)) >= ${opts.minSimilarity}
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${opts.limit}
      `);

      // Маппим результаты - results это массив напрямую
      const searchResults: SearchResult[] = [];
      const rows = results as unknown as Record<string, unknown>[];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const chunk: KnowledgeChunk = {
          id: row.id as string,
          chatConfigId,
          sourceId: '', // Не возвращается в этом запросе
          content: row.content as string,
          metadata: {
            source: '',
            chunkType: (row.chunk_type as string) || 'general',
            chapter: row.chapter as string | undefined,
            title: row.title as string | undefined,
            tags: row.tags as string[] | undefined,
            position: row.position as number | undefined,
            ...(row.metadata as Record<string, unknown> || {}),
          } as ChunkMetadata,
        };

        searchResults.push({
          chunk,
          similarity: row.similarity as number,
          rank: i + 1,
        });
      }

      log.debug(`Найдено ${searchResults.length} результатов для chatConfigId=${chatConfigId}`);
      return searchResults;
    } catch (error) {
      log.error('Ошибка поиска', error);
      return [];
    }
  }

  /**
   * Поиск с использованием stored function (альтернатива)
   * Требует миграцию 001_chat_configs.sql с функцией search_similar_chunks
   */
  async searchWithFunction(
    queryEmbedding: number[],
    chatConfigId: string,
    limit: number = 5,
    minSimilarity: number = 0.7
  ): Promise<SearchResult[]> {
    if (!this.db) {
      log.warn('Database не инициализирована');
      return [];
    }

    try {
      const vectorLiteral = `[${queryEmbedding.join(',')}]`;

      const results = await this.db.execute(sql`
        SELECT * FROM search_similar_chunks(
          ${vectorLiteral}::vector,
          ${chatConfigId}::uuid,
          ${limit},
          ${minSimilarity}
        )
      `);

      const searchResults: SearchResult[] = [];
      const rows = results as unknown as Record<string, unknown>[];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const chunk: KnowledgeChunk = {
          id: row.chunk_id as string,
          chatConfigId,
          sourceId: '',
          content: row.content as string,
          metadata: {
            source: '',
            chunkType: (row.chunk_type as string) || 'general',
            chapter: row.chapter as string | undefined,
            title: row.title as string | undefined,
            ...(row.metadata as Record<string, unknown> || {}),
          } as ChunkMetadata,
        };

        searchResults.push({
          chunk,
          similarity: row.similarity as number,
          rank: i + 1,
        });
      }

      return searchResults;
    } catch (error) {
      log.error('Ошибка поиска через функцию', error as Error);
      return [];
    }
  }

  /**
   * Форматировать результаты поиска в текст для RAG контекста
   */
  formatResultsForContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return '';
    }

    const lines: string[] = [];

    results.forEach((result, index) => {
      const { chunk, similarity } = result;

      // Заголовок чанка
      let header = `[${index + 1}]`;
      if (chunk.metadata.chapter) {
        header += ` ${chunk.metadata.chapter}`;
      }
      if (chunk.metadata.title) {
        header += ` - ${chunk.metadata.title}`;
      }
      header += ` (релевантность: ${(similarity * 100).toFixed(0)}%)`;

      lines.push(header);
      lines.push(chunk.content);
      lines.push(''); // Пустая строка между чанками
    });

    return lines.join('\n');
  }

  /**
   * Получить количество чанков для чата
   */
  async getChunkCount(chatConfigId: string): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(knowledgeChunks)
        .where(eq(knowledgeChunks.chatConfigId, chatConfigId));

      return result[0]?.count || 0;
    } catch (error) {
      log.error('Ошибка получения количества чанков', error);
      return 0;
    }
  }

  /**
   * Удалить все чанки для источника
   */
  async deleteChunksBySource(sourceId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    await this.db
      .delete(knowledgeChunks)
      .where(eq(knowledgeChunks.sourceId, sourceId));

    log.info(`Удалены чанки для sourceId=${sourceId}`);
  }

  /**
   * Удалить все чанки для чата
   */
  async deleteChunksByChat(chatConfigId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    await this.db
      .delete(knowledgeChunks)
      .where(eq(knowledgeChunks.chatConfigId, chatConfigId));

    log.info(`Удалены все чанки для chatConfigId=${chatConfigId}`);
  }
}

export default VectorSearch;
