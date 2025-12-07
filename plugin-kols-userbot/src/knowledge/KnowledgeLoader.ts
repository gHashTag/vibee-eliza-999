/**
 * KOLS Plugin - KnowledgeLoader
 *
 * Singleton загрузчик встроенной базы знаний.
 * Использует embeddedKnowledge.json который генерируется скриптом.
 */

import { KolsLogger } from '../utils/logger';
import { ContentType } from '../config/proactive';

// Импортируем JSON напрямую
import embeddedKnowledge from './embeddedKnowledge.json';

/**
 * Чанк знаний
 */
export interface KnowledgeChunk {
  id: string;
  chapter: string;
  title: string;
  content: string;
  type: 'concept' | 'tip' | 'example' | 'question' | 'exercise';
  tags: string[];
}

/**
 * Метаданные базы знаний
 */
export interface KnowledgeMetadata {
  version: string;
  generatedAt: string;
  totalFiles: number;
  totalChunks: number;
}

/**
 * Singleton загрузчик базы знаний
 */
export class KnowledgeLoader {
  private static instance: KnowledgeLoader | null = null;

  private chunks: KnowledgeChunk[] = [];
  private usedChunkIds: Set<string> = new Set();
  private isLoaded = false;
  private metadata: KnowledgeMetadata | null = null;

  /**
   * Приватный конструктор для Singleton
   */
  private constructor() {}

  /**
   * Получить единственный экземпляр загрузчика
   */
  static getInstance(): KnowledgeLoader {
    if (!KnowledgeLoader.instance) {
      KnowledgeLoader.instance = new KnowledgeLoader();
    }
    return KnowledgeLoader.instance;
  }

  /**
   * Загружает базу знаний из встроенного JSON
   * Идемпотентная операция - повторные вызовы безопасны
   */
  load(): void {
    if (this.isLoaded) {
      KolsLogger.debug('KnowledgeLoader: База уже загружена');
      return;
    }

    try {
      this.chunks = embeddedKnowledge.chunks as KnowledgeChunk[];
      this.metadata = {
        version: embeddedKnowledge.version,
        generatedAt: embeddedKnowledge.generatedAt,
        totalFiles: embeddedKnowledge.totalFiles,
        totalChunks: embeddedKnowledge.totalChunks
      };

      this.isLoaded = true;
      KolsLogger.success(`KnowledgeLoader: Загружено ${this.chunks.length} чанков (v${this.metadata.version})`);

    } catch (error) {
      KolsLogger.error('KnowledgeLoader: Ошибка загрузки', error);
      this.chunks = [];
      this.isLoaded = false;
    }
  }

  /**
   * Проверяет, загружена ли база
   */
  isReady(): boolean {
    return this.isLoaded && this.chunks.length > 0;
  }

  /**
   * Возвращает метаданные базы знаний
   */
  getMetadata(): KnowledgeMetadata | null {
    return this.metadata;
  }

  /**
   * Возвращает общее количество чанков
   */
  getTotalChunks(): number {
    return this.chunks.length;
  }

  /**
   * Возвращает количество доступных (неиспользованных) чанков
   */
  getAvailableChunks(): number {
    return this.chunks.length - this.usedChunkIds.size;
  }

  /**
   * Получает случайный чанк указанного типа
   * Помечает чанк как использованный
   *
   * @param type - тип контента (concept, tip, example, question, exercise)
   * @returns чанк или null если нет доступных
   */
  getRandomChunk(type?: ContentType): KnowledgeChunk | null {
    if (!this.isLoaded) {
      this.load();
    }

    // Фильтруем по типу и исключаем использованные
    let available = this.chunks.filter(chunk =>
      !this.usedChunkIds.has(chunk.id) &&
      (!type || chunk.type === type)
    );

    // Если все использованы, сбрасываем
    if (available.length === 0) {
      KolsLogger.info('KnowledgeLoader: Все чанки использованы, сброс');
      this.usedChunkIds.clear();
      available = this.chunks.filter(chunk => !type || chunk.type === type);
    }

    if (available.length === 0) {
      return null;
    }

    // Выбираем случайный
    const index = Math.floor(Math.random() * available.length);
    const chunk = available[index];

    // Помечаем как использованный
    this.usedChunkIds.add(chunk.id);

    return chunk;
  }

  /**
   * Поиск чанков по тексту
   *
   * @param query - поисковый запрос
   * @param limit - максимальное количество результатов
   * @returns массив найденных чанков
   */
  search(query: string, limit = 10): KnowledgeChunk[] {
    if (!this.isLoaded) {
      this.load();
    }

    const lowerQuery = query.toLowerCase();

    return this.chunks
      .filter(chunk =>
        chunk.title.toLowerCase().includes(lowerQuery) ||
        chunk.content.toLowerCase().includes(lowerQuery) ||
        chunk.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit);
  }

  /**
   * Получает чанки по главе
   *
   * @param chapter - название главы
   * @returns массив чанков из этой главы
   */
  getByChapter(chapter: string): KnowledgeChunk[] {
    if (!this.isLoaded) {
      this.load();
    }

    return this.chunks.filter(chunk =>
      chunk.chapter.toLowerCase().includes(chapter.toLowerCase())
    );
  }

  /**
   * Получает чанки по тегу
   *
   * @param tag - тег для поиска
   * @returns массив чанков с этим тегом
   */
  getByTag(tag: string): KnowledgeChunk[] {
    if (!this.isLoaded) {
      this.load();
    }

    const lowerTag = tag.toLowerCase();
    return this.chunks.filter(chunk =>
      chunk.tags.some(t => t.toLowerCase() === lowerTag)
    );
  }

  /**
   * Получает статистику по типам контента
   */
  getTypeStats(): Record<string, number> {
    if (!this.isLoaded) {
      this.load();
    }

    const stats: Record<string, number> = {};
    for (const chunk of this.chunks) {
      stats[chunk.type] = (stats[chunk.type] || 0) + 1;
    }
    return stats;
  }

  /**
   * Сбрасывает состояние использованных чанков
   */
  reset(): void {
    this.usedChunkIds.clear();
    KolsLogger.info('KnowledgeLoader: Состояние сброшено');
  }
}

/**
 * Глобальный экземпляр загрузчика для удобства
 */
export const knowledgeLoader = KnowledgeLoader.getInstance();
