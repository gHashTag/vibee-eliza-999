/**
 * KOLS Knowledge Provider
 *
 * Изолированный провайдер знаний для ElizaOS.
 * Использует встроенную базу знаний (embeddedKnowledge.json) через KnowledgeLoader.
 * Никаких зависимостей на файловую систему!
 */

import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { knowledgeLoader, KnowledgeChunk } from '../knowledge';
import { KolsLogger } from '../utils/logger';

/**
 * Класс для работы с базой знаний KOLS
 * Singleton - использует глобальный knowledgeLoader
 */
export class KolsKnowledgeProvider {
  private isInitialized = false;

  /**
   * Инициализация провайдера
   * Загружает встроенную базу знаний
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Загружаем через KnowledgeLoader (он сам singleton)
    knowledgeLoader.load();

    const totalChunks = knowledgeLoader.getTotalChunks();
    if (totalChunks > 0) {
      KolsLogger.success(`KolsKnowledgeProvider: Загружено ${totalChunks} чанков знаний`);
      this.isInitialized = true;
    } else {
      KolsLogger.error('KolsKnowledgeProvider: База знаний пуста!');
    }
  }

  /**
   * Проверяет готовность провайдера
   */
  isReady(): boolean {
    return this.isInitialized && knowledgeLoader.isReady();
  }

  /**
   * Получает случайный чанк для проактивного сообщения
   * @param type - опциональный тип (concept, tip, example, question, exercise)
   */
  getRandomChunk(type?: KnowledgeChunk['type']): KnowledgeChunk | null {
    if (!this.isInitialized) {
      this.initialize();
    }
    return knowledgeLoader.getRandomChunk(type);
  }

  /**
   * Поиск релевантного контента по запросу
   * @param query - поисковый запрос
   * @param limit - максимальное количество результатов
   */
  searchContent(query: string, limit = 3): KnowledgeChunk[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return knowledgeLoader.search(query, limit);
  }

  /**
   * Получает чанки по главе
   * @param chapter - название главы
   */
  getByChapter(chapter: string): KnowledgeChunk[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return knowledgeLoader.getByChapter(chapter);
  }

  /**
   * Получает чанки по тегу
   * @param tag - тег для поиска
   */
  getByTag(tag: string): KnowledgeChunk[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return knowledgeLoader.getByTag(tag);
  }

  /**
   * Генерирует обучающий промпт на основе контента книги
   * @param topic - опциональная тема для поиска
   */
  generateTeachingPrompt(topic?: string): string {
    const chunk = topic
      ? this.searchContent(topic, 1)[0]
      : this.getRandomChunk();

    if (!chunk) {
      return 'Расскажи о VibeCoding - подходе к разработке с AI-агентами.';
    }

    const prompts: Record<KnowledgeChunk['type'], string> = {
      concept: `Объясни студентам концепцию из главы "${chunk.chapter}": ${chunk.content}`,
      tip: `Поделись полезным советом из Библии VibeCoder: ${chunk.content}`,
      example: `Разбери практический пример из главы "${chunk.chapter}": ${chunk.content}`,
      question: `Задай студентам вопрос для проверки понимания: ${chunk.content}`,
      exercise: `Предложи упражнение по теме "${chunk.chapter}": ${chunk.content}`
    };

    return prompts[chunk.type] || `Расскажи о: ${chunk.content}`;
  }

  /**
   * Статистика knowledge base
   */
  getStats(): { total: number; available: number; byType: Record<string, number> } {
    if (!this.isInitialized) {
      this.initialize();
    }

    return {
      total: knowledgeLoader.getTotalChunks(),
      available: knowledgeLoader.getAvailableChunks(),
      byType: knowledgeLoader.getTypeStats()
    };
  }

  /**
   * Сбрасывает состояние использованных чанков
   * Полезно для начала нового цикла обучения
   */
  reset(): void {
    knowledgeLoader.reset();
  }
}

/**
 * Глобальный экземпляр провайдера для удобства
 */
export const kolsKnowledgeProvider = new KolsKnowledgeProvider();

/**
 * ElizaOS Provider для интеграции с агентом
 * Заменяет vibeCodingKnowledgeProvider
 */
export const kolsKnowledgeElizaProvider: Provider = {
  name: 'kols-knowledge',
  description: 'Предоставляет знания из встроенной базы VibeCoding для обучения',

  async get(runtime: IAgentRuntime, message: Memory, state: State) {
    // Инициализируем если нужно
    if (!kolsKnowledgeProvider.isReady()) {
      kolsKnowledgeProvider.initialize();
    }

    // Если есть текст сообщения - ищем релевантный контент
    const messageText = message.content?.text || '';

    if (messageText.length > 5) {
      const relevant = kolsKnowledgeProvider.searchContent(messageText, 2);
      if (relevant.length > 0) {
        const text = relevant
          .map(c => `[${c.chapter}] ${c.content}`)
          .join('\n\n');
        return { text };
      }
    }

    // Иначе возвращаем случайный инсайт
    const chunk = kolsKnowledgeProvider.getRandomChunk();
    const text = chunk ? `[${chunk.chapter}] ${chunk.content}` : '';
    return { text };
  }
};

export default KolsKnowledgeProvider;
