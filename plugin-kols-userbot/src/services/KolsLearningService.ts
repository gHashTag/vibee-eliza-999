/**
 * KOLS Learning Service
 *
 * Сервис обучения студентов VibeCoding.
 * Использует встроенную базу знаний (embeddedKnowledge.json).
 * Никаких зависимостей на файловую систему!
 */
import { Service, IAgentRuntime } from '@elizaos/core';
import { IKolsLearningTip } from '../types';
import { KolsLogger } from '../utils/logger';
import { knowledgeLoader, KnowledgeChunk } from '../knowledge';

export class KolsLearningService extends Service {
  static serviceType = 'kols-learning';
  serviceType = 'kols-learning';

  // Singleton паттерн для идемпотентности
  private static instance: KolsLearningService | null = null;
  private isInitialized = false;

  /**
   * Статический метод start() - требуется ElizaOS
   * Идемпотентный - повторные вызовы безопасны
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    if (KolsLearningService.instance?.isInitialized) {
      KolsLogger.debug('KolsLearningService: Уже инициализирован, переиспользуем');
      return KolsLearningService.instance;
    }

    const service = new KolsLearningService();
    await service.initialize(runtime);
    KolsLearningService.instance = service;
    return service;
  }

  /**
   * Статический метод stop() - требуется ElizaOS
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    KolsLogger.info('KolsLearningService: static stop() called');
    if (KolsLearningService.instance) {
      await KolsLearningService.instance.stop();
      KolsLearningService.instance = null;
    }
  }

  /**
   * Инициализация сервиса
   * Загружает встроенную базу знаний
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      KolsLogger.debug('KolsLearningService: Уже инициализирован');
      return;
    }

    KolsLogger.info('KolsLearningService: Инициализация обучения...');

    // Загружаем встроенную базу знаний
    knowledgeLoader.load();

    const metadata = knowledgeLoader.getMetadata();
    if (metadata) {
      KolsLogger.success(
        `KolsLearningService: Загружено ${metadata.totalChunks} обучающих фрагментов ` +
        `(v${metadata.version}, ${metadata.totalFiles} файлов)`
      );
    }

    this.isInitialized = true;
  }

  /**
   * Получает случайный обучающий совет
   * @param type - опциональный тип контента (concept, tip, example, question, exercise)
   */
  getRandomLearningTip(type?: string): IKolsLearningTip {
    const chunk = knowledgeLoader.getRandomChunk(type as any);

    if (!chunk) {
      // Возвращаем дефолтный совет если база пуста
      return {
        title: 'Что такое VibeCoding?',
        content: 'VibeCoding - это новый подход к программированию с AI-агентами.',
        why: 'AI помогает сосредоточиться на решении проблем.',
        practicalTip: 'Начните с простых проектов и постепенно усложняйте.',
        topic: 'basics'
      };
    }

    return this.chunkToTip(chunk);
  }

  /**
   * Получает советы по теме
   * @param topic - тема для поиска
   */
  getTipsByTopic(topic: string): IKolsLearningTip[] {
    const chunks = knowledgeLoader.search(topic, 20);
    return chunks.map(chunk => this.chunkToTip(chunk));
  }

  /**
   * Получает советы по главе
   * @param chapter - название главы
   */
  getTipsByChapter(chapter: string): IKolsLearningTip[] {
    const chunks = knowledgeLoader.getByChapter(chapter);
    return chunks.map(chunk => this.chunkToTip(chunk));
  }

  /**
   * Поиск по тексту
   * @param query - поисковый запрос
   * @param limit - максимальное количество результатов
   */
  searchTips(query: string, limit = 10): IKolsLearningTip[] {
    const chunks = knowledgeLoader.search(query, limit);
    return chunks.map(chunk => this.chunkToTip(chunk));
  }

  /**
   * Конвертирует KnowledgeChunk в IKolsLearningTip
   */
  private chunkToTip(chunk: KnowledgeChunk): IKolsLearningTip {
    return {
      title: chunk.title,
      content: chunk.content,
      why: `Полезная информация из раздела "${chunk.chapter}"`,
      practicalTip: this.generatePracticalTip(chunk.type),
      topic: chunk.type
    };
  }

  /**
   * Генерирует практический совет в зависимости от типа контента
   */
  private generatePracticalTip(type: string): string {
    const tips: Record<string, string> = {
      concept: 'Попробуйте объяснить эту концепцию своими словами',
      tip: 'Примените этот совет в своём следующем проекте',
      example: 'Попробуйте воспроизвести этот пример самостоятельно',
      question: 'Обдумайте этот вопрос и поделитесь своим мнением',
      exercise: 'Выполните это упражнение для закрепления навыков'
    };
    return tips[type] || 'Попробуйте применить это на практике';
  }

  /**
   * Форматирует совет для отправки в Telegram
   */
  formatLearningMessage(tip: IKolsLearningTip): string {
    // Ограничиваем длину контента для Telegram
    const maxContentLength = 800;
    const content = tip.content.length > maxContentLength
      ? tip.content.substring(0, maxContentLength) + '...'
      : tip.content;

    return `**${tip.title}**

${content}

**Почему это важно:** ${tip.why}

**Практический совет:** ${tip.practicalTip}

Хотите узнать больше? Задайте вопрос!`;
  }

  /**
   * Получает статистику базы знаний
   */
  getStats(): { total: number; available: number; types: Record<string, number> } {
    return {
      total: knowledgeLoader.getTotalChunks(),
      available: knowledgeLoader.getAvailableChunks(),
      types: knowledgeLoader.getTypeStats()
    };
  }

  get capabilityDescription(): string {
    return 'KOLS обучающий сервис - проактивное обучение студентов VibeCoding';
  }

  async stop(): Promise<void> {
    KolsLogger.info('KolsLearningService: Остановка...');
    this.isInitialized = false;
  }
}
