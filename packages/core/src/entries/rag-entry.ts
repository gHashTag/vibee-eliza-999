/**
 * RAG (Retrieval-Augmented Generation) Entry Pattern
 * Обработка запросов с поиском и генерацией на основе контекста
 */

import type {
  RAGEntry,
  Document,
  Source,
  ValidationResult,
} from './types';
import { validateRAGEntry } from './validators';

/**
 * Процессор для RAG обработки
 */
export class RAGProcessor {
  /**
   * Обработка RAG запроса
   */
  async process(entry: RAGEntry): Promise<RAGEntry> {
    // Валидация входных данных
    const validation = validateRAGEntry(entry);
    if (!validation.isValid) {
      throw new Error(
        `Invalid RAG entry: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    console.log(`[RAGProcessor] Processing query ${entry.queryId}`);

    // 1. Поиск релевантных документов
    const retrievedContext = await this.retrieve(entry.query);

    // 2. Генерация ответа на основе контекста
    const generatedResponse = await this.generate(entry.query, retrievedContext);

    // 3. Идентификация источников
    const sources = await this.identifySources(retrievedContext);

    // 4. Расчет уверенности
    const confidence = this.calculateRAGConfidence(retrievedContext, sources);

    return {
      ...entry,
      retrievedContext,
      generatedResponse,
      sources,
      confidence,
      metadata: {
        ...entry.metadata,
        processedAt: Date.now(),
        retrievedDocuments: retrievedContext.length,
        sourcesCount: sources.length,
        averageSimilarity: retrievedContext.reduce((sum, d) => sum + d.similarityScore, 0) / retrievedContext.length,
      },
    };
  }

  /**
   * Поиск релевантных документов
   */
  private async retrieve(query: string): Promise<Document[]> {
    try {
      console.log(`[RAGProcessor] Retrieving documents for query: ${query}`);

      // Базовая реализация поиска
      // В реальной системе здесь будет интеграция с векторной базой данных

      // Имитация поиска
      await new Promise(resolve => setTimeout(resolve, 200));

      // Генерация тестовых документов на основе запроса
      const documents: Document[] = [];

      // Основной документ
      documents.push({
        id: `doc_${Date.now()}_1`,
        content: `Information about: ${query}. This document provides detailed information related to the query.`,
        metadata: {
          source: 'knowledge_base',
          category: 'general',
          createdAt: Date.now(),
        },
        similarityScore: 0.95,
        chunkIndex: 1,
      });

      // Дополнительные документы
      for (let i = 2; i <= 3; i++) {
        documents.push({
          id: `doc_${Date.now()}_${i}`,
          content: `Additional context for: ${query}. Related information and examples.`,
          metadata: {
            source: 'knowledge_base',
            category: 'supplementary',
            createdAt: Date.now(),
          },
          similarityScore: 0.85 - (i - 1) * 0.1,
          chunkIndex: i,
        });
      }

      // Фильтрация по минимальной релевантности
      return documents.filter(doc => doc.similarityScore >= 0.7);
    } catch (error) {
      console.error('[RAGProcessor] Error retrieving documents:', error);
      return [];
    }
  }

  /**
   * Генерация ответа на основе контекста
   */
  private async generate(query: string, context: Document[]): Promise<string> {
    try {
      console.log(`[RAGProcessor] Generating response for query: ${query}`);

      if (context.length === 0) {
        return `I couldn't find relevant information for your query: "${query}". Please try rephrasing your question.`;
      }

      // Формирование промпта с контекстом
      const contextText = context
        .map(doc => doc.content)
        .join('\n\n');

      // Базовая генерация ответа
      const response = [
        `Based on the retrieved information, here is the answer to your query about "${query}":`,
        '',
        contextText,
        '',
        `This answer is based on ${context.length} relevant document(s) with an average relevance score of ${(context.reduce((sum, d) => sum + d.similarityScore, 0) / context.length * 100).toFixed(1)}%.`,
      ].join('\n');

      return response;
    } catch (error) {
      console.error('[RAGProcessor] Error generating response:', error);
      return `Error generating response: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Идентификация источников
   */
  private async identifySources(context: Document[]): Promise<Source[]> {
    try {
      const sources: Source[] = [];

      for (const document of context) {
        // Создание источника на основе документа
        const source: Source = {
          documentId: document.id,
          relevanceScore: document.similarityScore,
          excerpt: this.extractExcerpt(document.content, 200),
          pageNumber: document.chunkIndex || 1,
          timestamp: Date.now(),
        };

        sources.push(source);
      }

      // Сортировка по релевантности
      return sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('[RAGProcessor] Error identifying sources:', error);
      return [];
    }
  }

  /**
   * Извлечение выдержки из текста
   */
  private extractExcerpt(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Извлечение первых maxLength символов
    const excerpt = content.substring(0, maxLength);

    // Поиск последнего полного предложения
    const lastSentenceEnd = Math.max(
      excerpt.lastIndexOf('.'),
      excerpt.lastIndexOf('!'),
      excerpt.lastIndexOf('?')
    );

    if (lastSentenceEnd > maxLength * 0.5) {
      return excerpt.substring(0, lastSentenceEnd + 1);
    }

    return excerpt + '...';
  }

  /**
   * Расчет уверенности в RAG ответе
   */
  private calculateRAGConfidence(context: Document[], sources: Source[]): number {
    if (context.length === 0) return 0;

    // Усредненная релевантность документов
    const averageSimilarity = context.reduce((sum, d) => sum + d.similarityScore, 0) / context.length;

    // Количество найденных источников
    const sourcesCount = sources.length;

    // Бонус за количество источников (до 0.2)
    const sourcesBonus = Math.min(sourcesCount / 10, 0.2);

    // Штраф за низкую релевантность
    const lowRelevancePenalty = Math.max(0, (0.7 - averageSimilarity) * 0.5);

    // Итоговая уверенность
    const confidence = Math.max(
      0,
      Math.min(1, averageSimilarity + sourcesBonus - lowRelevancePenalty)
    );

    return Number(confidence.toFixed(3));
  }

  /**
   * Создание нового RAG запроса
   */
  static create(queryId: string, query: string): RAGEntry {
    return {
      queryId,
      query,
      retrievedContext: [],
      generatedResponse: '',
      sources: [],
      confidence: 0,
      metadata: {
        createdAt: Date.now(),
        queryType: 'text',
      },
    };
  }

  /**
   * Добавление документа в контекст
   */
  static addDocument(entry: RAGEntry, document: Document): RAGEntry {
    return {
      ...entry,
      retrievedContext: [...entry.retrievedContext, document],
    };
  }

  /**
   * Обновление источников
   */
  static updateSources(entry: RAGEntry, sources: Source[]): RAGEntry {
    return {
      ...entry,
      sources,
    };
  }

  /**
   * Создание документа для RAG
   */
  static createDocument(
    id: string,
    content: string,
    metadata: Record<string, any> = {},
    similarityScore: number = 1.0
  ): Document {
    return {
      id,
      content,
      metadata,
      similarityScore,
      chunkIndex: 1,
    };
  }

  /**
   * Создание источника для RAG
   */
  static createSource(
    documentId: string,
    relevanceScore: number,
    excerpt: string,
    pageNumber?: number
  ): Source {
    return {
      documentId,
      relevanceScore,
      excerpt,
      pageNumber,
      timestamp: Date.now(),
    };
  }

  /**
   * Поиск документов по ключевым словам
   */
  async search(query: string, documents: Document[]): Promise<Document[]> {
    try {
      const keywords = query.toLowerCase().split(' ');

      return documents
        .map(doc => {
          const content = doc.content.toLowerCase();
          const matches = keywords.filter(keyword => content.includes(keyword)).length;
          const relevanceScore = matches / keywords.length;

          return {
            ...doc,
            similarityScore: relevanceScore,
          };
        })
        .filter(doc => doc.similarityScore > 0)
        .sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      console.error('[RAGProcessor] Error searching documents:', error);
      return [];
    }
  }

  /**
   * Фильтрация документов по порогу релевантности
   */
  static filterByRelevance(documents: Document[], threshold: number = 0.7): Document[] {
    return documents.filter(doc => doc.similarityScore >= threshold);
  }

  /**
   * Получение статистики RAG обработки
   */
  static getStats(entry: RAGEntry): {
    queryId: string;
    query: string;
    documentsCount: number;
    sourcesCount: number;
    averageRelevance: number;
    confidence: number;
  } {
    return {
      queryId: entry.queryId,
      query: entry.query,
      documentsCount: entry.retrievedContext.length,
      sourcesCount: entry.sources.length,
      averageRelevance: entry.retrievedContext.length > 0
        ? entry.retrievedContext.reduce((sum, d) => sum + d.similarityScore, 0) / entry.retrievedContext.length
        : 0,
      confidence: entry.confidence,
    };
  }
}
