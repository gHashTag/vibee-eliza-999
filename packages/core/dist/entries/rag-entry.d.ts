/**
 * RAG (Retrieval-Augmented Generation) Entry Pattern
 * Обработка запросов с поиском и генерацией на основе контекста
 */
import type { RAGEntry, Document, Source } from './types';
/**
 * Процессор для RAG обработки
 */
export declare class RAGProcessor {
    /**
     * Обработка RAG запроса
     */
    process(entry: RAGEntry): Promise<RAGEntry>;
    /**
     * Поиск релевантных документов
     */
    private retrieve;
    /**
     * Генерация ответа на основе контекста
     */
    private generate;
    /**
     * Идентификация источников
     */
    private identifySources;
    /**
     * Извлечение выдержки из текста
     */
    private extractExcerpt;
    /**
     * Расчет уверенности в RAG ответе
     */
    private calculateRAGConfidence;
    /**
     * Создание нового RAG запроса
     */
    static create(queryId: string, query: string): RAGEntry;
    /**
     * Добавление документа в контекст
     */
    static addDocument(entry: RAGEntry, document: Document): RAGEntry;
    /**
     * Обновление источников
     */
    static updateSources(entry: RAGEntry, sources: Source[]): RAGEntry;
    /**
     * Создание документа для RAG
     */
    static createDocument(id: string, content: string, metadata?: Record<string, any>, similarityScore?: number): Document;
    /**
     * Создание источника для RAG
     */
    static createSource(documentId: string, relevanceScore: number, excerpt: string, pageNumber?: number): Source;
    /**
     * Поиск документов по ключевым словам
     */
    search(query: string, documents: Document[]): Promise<Document[]>;
    /**
     * Фильтрация документов по порогу релевантности
     */
    static filterByRelevance(documents: Document[], threshold?: number): Document[];
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
    };
}
//# sourceMappingURL=rag-entry.d.ts.map