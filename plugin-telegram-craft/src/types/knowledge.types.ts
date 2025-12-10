/**
 * Knowledge Types
 * Типы для системы работы с базами знаний и RAG
 */

/**
 * Тип источника знаний
 */
export type KnowledgeSourceType =
  | 'md_directory'  // Директория с Markdown файлами
  | 'pdf_file'      // Локальный PDF файл
  | 'pdf_url'       // PDF по URL
  | 'web_url'       // Веб-страница
  | 'json';         // JSON файл с данными

/**
 * Тип чанка контента
 */
export type ChunkType =
  | 'concept'    // Концепции и определения
  | 'tip'        // Практические советы
  | 'example'    // Примеры кода/использования
  | 'question'   // Вопросы и ответы
  | 'sales'      // Sales материалы
  | 'faq'        // FAQ
  | 'general';   // Общий контент

/**
 * Метаданные чанка
 */
export interface ChunkMetadata {
  /** Исходный файл/URL */
  source: string;
  /** Глава/раздел */
  chapter?: string;
  /** Заголовок */
  title?: string;
  /** Теги */
  tags?: string[];
  /** Тип контента */
  chunkType: ChunkType;
  /** Позиция в документе */
  position?: number;
  /** Дополнительные данные */
  extra?: Record<string, unknown>;
}

/**
 * Чанк знаний для RAG
 */
export interface KnowledgeChunk {
  /** UUID чанка */
  id: string;
  /** ID конфигурации чата */
  chatConfigId: string;
  /** ID источника */
  sourceId: string;
  /** Текстовый контент */
  content: string;
  /** Embedding вектор (768 dim для Ollama nomic-embed-text) */
  embedding?: number[];
  /** Метаданные */
  metadata: ChunkMetadata;
  /** Дата создания */
  createdAt?: Date;
}

/**
 * Результат поиска в базе знаний
 */
export interface SearchResult {
  /** Чанк */
  chunk: KnowledgeChunk;
  /** Косинусное сходство (0-1) */
  similarity: number;
  /** Ранг в результатах */
  rank: number;
}

/**
 * Опции для загрузки документов
 */
export interface LoaderOptions {
  /** Размер чанка в токенах */
  chunkSize: number;
  /** Перекрытие между чанками */
  chunkOverlap: number;
  /** Сохранять ли структуру заголовков */
  preserveHeaders: boolean;
  /** Фильтр по типу контента */
  contentTypeFilter?: ChunkType[];
}

/**
 * Дефолтные опции загрузчика
 */
export const DEFAULT_LOADER_OPTIONS: LoaderOptions = {
  chunkSize: 1024,
  chunkOverlap: 100,
  preserveHeaders: true,
};

/**
 * Результат загрузки документа
 */
export interface LoadResult {
  /** Успешно ли */
  success: boolean;
  /** Количество чанков */
  chunkCount: number;
  /** Ошибки если есть */
  errors?: string[];
  /** Источник */
  source: string;
}

/**
 * Интерфейс загрузчика документов
 */
export interface IKnowledgeLoader {
  /** Тип источника */
  sourceType: KnowledgeSourceType;

  /**
   * Загрузить документ и разбить на чанки
   * @param path Путь или URL к документу
   * @param options Опции загрузки
   */
  load(path: string, options?: Partial<LoaderOptions>): Promise<KnowledgeChunk[]>;

  /**
   * Проверить доступность источника
   * @param path Путь или URL
   */
  validate(path: string): Promise<boolean>;
}

/**
 * Конфигурация Ollama для embeddings
 */
export interface OllamaEmbeddingConfig {
  /** URL Ollama API */
  baseUrl: string;
  /** Модель для embeddings */
  model: string;
  /** Размерность вектора */
  dimensions: number;
}

/**
 * Дефолтная конфигурация Ollama
 */
export const DEFAULT_OLLAMA_CONFIG: OllamaEmbeddingConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'nomic-embed-text',
  dimensions: 768,
};

/**
 * Опции поиска в базе знаний
 */
export interface SearchOptions {
  /** Максимальное количество результатов */
  limit: number;
  /** Минимальный порог сходства */
  minSimilarity: number;
  /** Фильтр по типу чанков */
  chunkTypes?: ChunkType[];
  /** Фильтр по источникам */
  sourceIds?: string[];
}

/**
 * Дефолтные опции поиска
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 5,
  minSimilarity: 0.7,
};

/**
 * Статус обработки источника знаний
 */
export interface ProcessingStatus {
  /** ID источника */
  sourceId: string;
  /** Статус */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Прогресс (0-100) */
  progress: number;
  /** Сообщение */
  message?: string;
  /** Количество обработанных чанков */
  chunksProcessed: number;
  /** Время начала */
  startedAt?: Date;
  /** Время завершения */
  completedAt?: Date;
}
