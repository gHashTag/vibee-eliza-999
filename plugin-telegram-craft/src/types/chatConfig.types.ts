/**
 * Chat Config Types
 * Типы для системы динамической конфигурации чатов
 */

/**
 * Правила стиля ответов для персоны
 */
export interface StyleRules {
  /** Прилагательные для описания персоны */
  adjectives: string[];
  /** Сленговые выражения для использования */
  slangs: string[];
  /** Разрешены ли эмодзи */
  emojisAllowed: boolean;
  /** Язык ответов */
  language: 'ru' | 'en' | 'mixed';
  /** Максимальная длина ответа в символах */
  maxResponseLength: number;
  /** Формальность общения */
  formality: 'casual' | 'professional' | 'mixed';
}

/**
 * Конфигурация sales режима
 */
export interface SalesConfig {
  /** Название продукта */
  productName: string;
  /** Цена продукта */
  price: string;
  /** Шаблон CTA (call to action) */
  ctaTemplate: string;
  /** Обработчики возражений: ключ - возражение, значение - ответ */
  objectionHandlers: Record<string, string>;
  /** Контакт ментора/поддержки */
  mentorContact: string;
  /** Триггеры срочности */
  urgencyTriggers: string[];
  /** Список преимуществ продукта */
  features: string[];
  /** Сравнение с конкурентами */
  competitorComparison?: Record<string, string>;
}

/**
 * Источник знаний для RAG
 */
export interface KnowledgeSource {
  /** Тип источника */
  type: 'md_directory' | 'pdf_file' | 'pdf_url' | 'web_url' | 'json';
  /** Путь или URL к источнику */
  path: string;
  /** Человекочитаемое название */
  name: string;
  /** Обработан ли источник */
  isProcessed?: boolean;
  /** Количество чанков после обработки */
  chunkCount?: number;
  /** Дата последней обработки */
  lastProcessedAt?: Date;
}

/**
 * Пример ответа для few-shot learning
 */
export interface ResponseExample {
  /** Сообщение пользователя */
  userMessage: string;
  /** Ответ бота */
  botResponse: string;
  /** Дополнительный контекст */
  context?: string;
}

/**
 * Тип чата Telegram
 */
export type ChatType = 'group' | 'supergroup' | 'channel' | 'private';

/**
 * Полная конфигурация чата
 */
export interface ChatConfig {
  /** UUID конфигурации */
  id: string;
  /** Telegram chat ID */
  chatId: string;
  /** Название чата для отображения */
  chatTitle: string;
  /** Тип чата */
  chatType: ChatType;

  // === Persona ===
  /** Название персоны (VIBEE, Sales Expert, etc) */
  personaName: string;
  /** System prompt для LLM */
  systemPrompt: string;
  /** Правила стиля */
  styleRules: StyleRules;
  /** Примеры ответов для few-shot */
  responseExamples: ResponseExample[];

  // === Knowledge ===
  /** Источники знаний для RAG */
  knowledgeSources: KnowledgeSource[];

  // === Triggers ===
  /** Триггерные слова для активации */
  triggerWords: string[];
  /** Вероятность ответа (0.0 - 1.0) */
  responseProbability: number;
  /** Требуется ли упоминание бота для ответа */
  requireMention: boolean;

  // === Sales ===
  /** Включен ли режим продаж */
  salesMode: boolean;
  /** Конфигурация продаж */
  salesConfig?: SalesConfig;

  // === Status ===
  /** Активна ли конфигурация */
  isActive: boolean;
  /** Приоритет обработки */
  priority: number;

  // === Metadata ===
  /** Дата создания */
  createdAt?: Date;
  /** Дата обновления */
  updatedAt?: Date;
  /** Кем создано */
  createdBy?: string;
}

/**
 * Данные для создания конфигурации
 */
export type CreateChatConfig = Omit<ChatConfig, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Данные для обновления конфигурации
 */
export type UpdateChatConfig = Partial<Omit<ChatConfig, 'id' | 'chatId' | 'createdAt'>>;

/**
 * Контекст сообщения для генерации промпта
 */
export interface MessageContext {
  /** Имя отправителя */
  senderName: string;
  /** Username отправителя */
  senderUsername?: string;
  /** Название чата */
  chatTitle: string;
  /** История предыдущих сообщений */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** RAG контекст из базы знаний */
  ragContext?: string;
}

/**
 * Дефолтные значения для StyleRules
 */
export const DEFAULT_STYLE_RULES: StyleRules = {
  adjectives: ['дружелюбный', 'полезный', 'профессиональный'],
  slangs: [],
  emojisAllowed: true,
  language: 'ru',
  maxResponseLength: 1000,
  formality: 'mixed',
};

/**
 * Дефолтные значения для SalesConfig
 */
export const DEFAULT_SALES_CONFIG: SalesConfig = {
  productName: 'VIBEE',
  price: 'от 500 рублей',
  ctaTemplate: 'Попробуйте бесплатно в @vibee_bot',
  objectionHandlers: {
    'дорого': 'Это в 10-100 раз дешевле фрилансеров!',
    'сложно': 'Всё работает в 3 простых шага!',
    'не уверен': 'Начните с недорогой генерации за 2 звезды',
  },
  mentorContact: '@vibee_support',
  urgencyTriggers: ['сегодня', 'сейчас', 'срочно'],
  features: [],
};
