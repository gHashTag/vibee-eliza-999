/**
 * PromptBuilderService
 * Сервис для динамической генерации system prompts на основе конфигурации чата
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core';
import type {
  ChatConfig,
  StyleRules,
  SalesConfig,
  MessageContext,
  ResponseExample,
} from '../types/chatConfig.types';

/**
 * Логгер для PromptBuilderService
 */
const log = {
  info: (msg: string) => logger.info(`[PromptBuilder] ${msg}`),
  debug: (msg: string) => logger.debug(`[PromptBuilder] ${msg}`),
};

/**
 * PromptBuilderService - динамическая генерация промптов
 */
export class PromptBuilderService extends Service {
  static serviceType = 'prompt-builder';
  serviceType = 'prompt-builder';

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    console.log('🚀 [PromptBuilderService] STATIC start() called');
    const instance = new PromptBuilderService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [PromptBuilderService] STATIC stop() called');
    const instance = runtime.getService('prompt-builder') as PromptBuilderService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription = 'Динамическая генерация system prompts для разных чатов';

  constructor() {
    super();
    log.debug('PromptBuilderService создан');
  }

  /**
   * Запуск сервиса (required by ElizaOS Service interface)
   */
  async start(): Promise<void> {
    log.info('PromptBuilderService started');
  }

  /**
   * Остановка сервиса (required by Service abstract class)
   */
  async stop(): Promise<void> {
    log.info('PromptBuilderService остановлен');
  }

  async initialize(_runtime: IAgentRuntime): Promise<void> {
    log.info('PromptBuilderService инициализирован');
  }

  /**
   * Построить полный system prompt для чата
   */
  buildSystemPrompt(config: ChatConfig, context: MessageContext): string {
    const parts: string[] = [];

    // 1. Идентичность и основной промпт
    parts.push(this.buildIdentity(config));

    // 2. Правила стиля
    parts.push(this.buildStyleRules(config.styleRules));

    // 3. Контекст отправителя
    parts.push(this.buildSenderContext(context));

    // 4. Sales правила (если включены)
    if (config.salesMode && config.salesConfig) {
      parts.push(this.buildSalesRules(config.salesConfig));
    }

    // 5. Примеры ответов (few-shot)
    if (config.responseExamples && config.responseExamples.length > 0) {
      parts.push(this.buildResponseExamples(config.responseExamples));
    }

    // 6. История разговора (если есть)
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      parts.push(this.buildConversationHistory(context.conversationHistory));
    }

    // 7. RAG контекст (если есть)
    if (context.ragContext) {
      parts.push(this.buildRagContext(context.ragContext));
    }

    return parts.filter(Boolean).join('\n\n');
  }

  /**
   * Построить user prompt для сообщения
   */
  buildUserPrompt(senderName: string, messageText: string): string {
    return `${senderName}: "${messageText}"`;
  }

  // ============================================
  // PRIVATE BUILDERS
  // ============================================

  /**
   * Построить секцию идентичности
   */
  private buildIdentity(config: ChatConfig): string {
    return `Ты ${config.personaName}.

${config.systemPrompt}`;
  }

  /**
   * Построить правила стиля
   */
  private buildStyleRules(rules: StyleRules): string {
    const lines: string[] = ['КАК ПИСАТЬ:'];

    // Язык
    if (rules.language === 'ru') {
      lines.push('- ТОЛЬКО РУССКИЙ ЯЗЫК! Никаких английских слов!');
    } else if (rules.language === 'en') {
      lines.push('- ENGLISH ONLY! No Russian words!');
    } else {
      lines.push('- Отвечай на языке пользователя');
    }

    // Эмодзи
    if (!rules.emojisAllowed) {
      lines.push('- НЕ используй эмодзи и смайлики!');
    } else {
      lines.push('- Используй эмодзи для выразительности');
    }

    // Формальность
    switch (rules.formality) {
      case 'casual':
        lines.push('- Общайся неформально, как с другом');
        break;
      case 'professional':
        lines.push('- Общайся профессионально и вежливо');
        break;
      default:
        lines.push('- Адаптируй стиль под собеседника');
    }

    // Сленг
    if (rules.slangs && rules.slangs.length > 0) {
      lines.push(`- Используй сленг: ${rules.slangs.join(', ')}`);
    }

    // Длина ответа
    if (rules.maxResponseLength) {
      lines.push(`- Максимум ${rules.maxResponseLength} символов в ответе`);
    }

    // Прилагательные как характеристики
    if (rules.adjectives && rules.adjectives.length > 0) {
      lines.push(`- Будь ${rules.adjectives.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Построить контекст отправителя
   */
  private buildSenderContext(context: MessageContext): string {
    const lines: string[] = ['КТО ПИШЕТ:'];

    lines.push(`- Имя: ${context.senderName}`);

    if (context.senderUsername) {
      lines.push(`- Username: @${context.senderUsername}`);
    }

    lines.push(`- Чат: ${context.chatTitle}`);

    // Персонализация для известных пользователей
    const knownUsers: Record<string, string> = {
      'Дмитрий': 'Можно: Дим, Диман, Дима (не каждый раз)',
      'Александр': 'Можно: Саш, Санёк',
      'Павел': 'Можно: Паш, Паша',
    };

    if (knownUsers[context.senderName]) {
      lines.push(`- ${knownUsers[context.senderName]}`);
    }

    return lines.join('\n');
  }

  /**
   * Построить правила продаж
   */
  private buildSalesRules(config: SalesConfig): string {
    const lines: string[] = [
      'РЕЖИМ ПРОДАЖ АКТИВЕН:',
      `- Продукт: ${config.productName}`,
      `- Цена: ${config.price}`,
      `- Контакт: ${config.mentorContact}`,
      '',
      'ВОРОНКА ПРОДАЖ:',
      '1. Сначала помоги с вопросом пользователя',
      '2. Естественно упомяни продукт если уместно',
      `3. Используй CTA: "${config.ctaTemplate}"`,
    ];

    // Преимущества
    if (config.features && config.features.length > 0) {
      lines.push('', 'ПРЕИМУЩЕСТВА ПРОДУКТА:');
      config.features.forEach((feature, i) => {
        lines.push(`${i + 1}. ${feature}`);
      });
    }

    // Обработка возражений
    if (config.objectionHandlers && Object.keys(config.objectionHandlers).length > 0) {
      lines.push('', 'ОБРАБОТКА ВОЗРАЖЕНИЙ:');
      Object.entries(config.objectionHandlers).forEach(([objection, response]) => {
        lines.push(`- "${objection}" → "${response}"`);
      });
    }

    // Триггеры срочности
    if (config.urgencyTriggers && config.urgencyTriggers.length > 0) {
      lines.push('', `ТРИГГЕРЫ СРОЧНОСТИ (реагируй активнее): ${config.urgencyTriggers.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Построить примеры ответов (few-shot)
   */
  private buildResponseExamples(examples: ResponseExample[]): string {
    const lines: string[] = ['ПРИМЕРЫ ОТВЕТОВ:'];

    examples.slice(0, 5).forEach((example, i) => {
      lines.push(`\nПример ${i + 1}:`);
      if (example.context) {
        lines.push(`Контекст: ${example.context}`);
      }
      lines.push(`Пользователь: "${example.userMessage}"`);
      lines.push(`Ты: "${example.botResponse}"`);
    });

    return lines.join('\n');
  }

  /**
   * Построить историю разговора
   */
  private buildConversationHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    if (history.length === 0) return '';

    const lines: string[] = ['ЧТО БЫЛО В ЧАТЕ (последние сообщения):'];

    // Берём последние 10 сообщений
    const recentHistory = history.slice(-10);

    recentHistory.forEach((msg) => {
      const role = msg.role === 'user' ? 'Пользователь' : 'Ты';
      // Обрезаем длинные сообщения
      const content = msg.content.length > 200
        ? msg.content.slice(0, 200) + '...'
        : msg.content;
      lines.push(`${role}: ${content}`);
    });

    return lines.join('\n');
  }

  /**
   * Построить RAG контекст
   */
  private buildRagContext(ragContext: string): string {
    return `ИНФОРМАЦИЯ ИЗ БАЗЫ ЗНАНИЙ:
${ragContext}

ВАЖНО: Используй информацию выше для ответа, но отвечай своими словами.`;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Создать контекст сообщения из данных Telegram
   */
  createMessageContext(
    senderName: string,
    senderUsername: string | undefined,
    chatTitle: string,
    options?: {
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      ragContext?: string;
    }
  ): MessageContext {
    return {
      senderName,
      senderUsername,
      chatTitle,
      conversationHistory: options?.conversationHistory,
      ragContext: options?.ragContext,
    };
  }

  /**
   * Сгенерировать промпт для Sales режима
   */
  buildSalesPrompt(
    config: ChatConfig,
    userMessage: string,
    senderName: string
  ): string {
    if (!config.salesMode || !config.salesConfig) {
      throw new Error('Sales mode не включен для этого чата');
    }

    const context = this.createMessageContext(senderName, undefined, config.chatTitle);

    const systemPrompt = this.buildSystemPrompt(config, context);
    const userPrompt = this.buildUserPrompt(senderName, userMessage);

    return `${systemPrompt}\n\n---\n\n${userPrompt}`;
  }

  /**
   * Получить статистику
   */
  getStats(): { promptsGenerated: number } {
    return {
      promptsGenerated: 0, // TODO: добавить счётчик
    };
  }
}

export default PromptBuilderService;
