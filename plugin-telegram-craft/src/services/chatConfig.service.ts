// @ts-nocheck
/**
 * ChatConfigService
 * Сервис для управления конфигурациями чатов из PostgreSQL
 * Заменяет статический TARGET_CHATS на динамическую конфигурацию
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core';
import { eq, and, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  chatConfigs,
  knowledgeSources,
  type InsertChatConfig,
  type ChatConfigRecord,
  type KnowledgeSourceRecord,
} from '../db/schema';
import type {
  ChatConfig,
  CreateChatConfig,
  UpdateChatConfig,
  StyleRules,
  SalesConfig,
  KnowledgeSource,
  ResponseExample,
  DEFAULT_STYLE_RULES,
  DEFAULT_SALES_CONFIG,
} from '../types/chatConfig.types';

/**
 * Логгер для ChatConfigService
 */
const log = {
  info: (msg: string) => logger.info(`[ChatConfigService] ${msg}`),
  warn: (msg: string) => logger.warn(`[ChatConfigService] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[ChatConfigService] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[ChatConfigService] ${msg}`),
};

/**
 * ChatConfigService - управление конфигурациями чатов
 */
export class ChatConfigService extends Service {
  static serviceType = 'chat-config';
  serviceType = 'chat-config';

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    console.log('🚀 [ChatConfigService] STATIC start() called');
    const instance = new ChatConfigService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [ChatConfigService] STATIC stop() called');
    const instance = runtime.getService('chat-config') as ChatConfigService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription = 'Управление конфигурациями целевых чатов для цифрового клона';

  /** Кэш конфигов в памяти */
  private configCache: Map<string, ChatConfig> = new Map();

  /** Database client (будет установлен при initialize) */
  private db: PostgresJsDatabase | null = null;

  /** Флаг инициализации */
  private isInitialized = false;

  /**
   * Запуск сервиса (required by ElizaOS Service interface)
   */
  async start(): Promise<void> {
    log.info('ChatConfigService started');
  }

  /**
   * Остановка сервиса (required by Service abstract class)
   */
  async stop(): Promise<void> {
    this.configCache.clear();
    this.db = null;
    this.isInitialized = false;
    log.info('ChatConfigService остановлен');
  }

  constructor() {
    super();
    log.debug('ChatConfigService создан');
  }

  /**
   * Инициализация сервиса
   * Загружает все активные конфигурации из БД в кэш
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    log.info('Инициализация ChatConfigService...');

    this.runtime = runtime;

    // Получаем database adapter из ElizaOS
    // В ElizaOS 1.6+ база данных доступна через runtime.databaseAdapter
    try {
      // @ts-ignore - ElizaOS internal API
      const databaseAdapter = runtime.databaseAdapter;

      if (databaseAdapter && databaseAdapter.db) {
        this.db = databaseAdapter.db as PostgresJsDatabase;
        log.info('Database adapter подключен');
      } else {
        log.warn('Database adapter недоступен - работаем в fallback режиме');
        // В fallback режиме используем статические конфигурации
        await this.loadStaticConfigs();
        this.isInitialized = true;
        return;
      }

      // Загружаем все активные конфиги
      await this.loadAllConfigs();

      this.isInitialized = true;
      log.info(`ChatConfigService инициализирован. Загружено конфигов: ${this.configCache.size}`);
    } catch (error) {
      log.error('Ошибка инициализации ChatConfigService', error);
      // Fallback на статическую конфигурацию
      await this.loadStaticConfigs();
      this.isInitialized = true;
    }
  }

  /**
   * Загрузка всех активных конфигов из БД в кэш
   */
  async loadAllConfigs(): Promise<void> {
    if (!this.db) {
      log.warn('loadAllConfigs: БД недоступна');
      return;
    }

    try {
      const configs = await this.db
        .select()
        .from(chatConfigs)
        .where(eq(chatConfigs.isActive, true))
        .orderBy(desc(chatConfigs.priority));

      this.configCache.clear();

      for (const config of configs) {
        const mapped = this.mapRecordToConfig(config);
        this.configCache.set(config.chatId, mapped);
      }

      log.info(`Загружено ${configs.length} активных конфигураций`);
    } catch (error) {
      log.error('Ошибка загрузки конфигов из БД', error);
      throw error;
    }
  }

  /**
   * Fallback: загрузка статических конфигов из targetChats.ts
   */
  private async loadStaticConfigs(): Promise<void> {
    log.info('Загрузка статических конфигураций (fallback режим)...');

    // Импортируем статические чаты
    const { TARGET_CHATS } = await import('../config/targetChats');

    // Создаём базовые конфигурации для статических чатов
    for (const chatId of TARGET_CHATS) {
      const config: ChatConfig = {
        id: `static-${chatId}`,
        chatId: chatId,
        chatTitle: `Chat ${chatId}`,
        chatType: 'supergroup',
        personaName: 'VIBEE',
        systemPrompt: this.getDefaultSystemPrompt(),
        styleRules: this.getDefaultStyleRules(),
        responseExamples: [],
        knowledgeSources: [],
        triggerWords: ['vibecoding', 'вайбкодинг', 'elizaos', 'агент'],
        responseProbability: 1.0,
        requireMention: false,
        salesMode: false,
        isActive: true,
        priority: 0,
      };

      this.configCache.set(chatId, config);
    }

    log.info(`Загружено ${TARGET_CHATS.length} статических конфигураций`);
  }

  /**
   * Получить конфигурацию по chatId
   */
  async getConfig(chatId: string): Promise<ChatConfig | null> {
    // Нормализуем chatId (убираем -100 префикс если есть)
    const normalizedId = this.normalizeChatId(chatId);

    // Сначала проверяем кэш
    if (this.configCache.has(normalizedId)) {
      return this.configCache.get(normalizedId)!;
    }

    // Если в кэше нет - пробуем загрузить из БД
    if (this.db) {
      try {
        const configs = await this.db
          .select()
          .from(chatConfigs)
          .where(eq(chatConfigs.chatId, normalizedId))
          .limit(1);

        if (configs.length > 0) {
          const mapped = this.mapRecordToConfig(configs[0]);
          this.configCache.set(normalizedId, mapped);
          return mapped;
        }
      } catch (error) {
        log.error(`Ошибка получения конфига для чата ${chatId}`, error);
      }
    }

    return null;
  }

  /**
   * Проверка, нужно ли обрабатывать чат
   * Заменяет shouldProcessChat() из targetChats.ts
   */
  async shouldProcessChat(chatId: string): Promise<boolean> {
    const config = await this.getConfig(chatId);

    if (!config) {
      // Если конфига нет - проверяем, является ли это личным сообщением
      return this.isPrivateChat(chatId);
    }

    return config.isActive;
  }

  /**
   * Получить вероятность ответа для чата
   */
  async getResponseProbability(chatId: string): Promise<number> {
    const config = await this.getConfig(chatId);
    return config?.responseProbability ?? 1.0;
  }

  /**
   * Проверка требования упоминания
   */
  async requiresMention(chatId: string): Promise<boolean> {
    const config = await this.getConfig(chatId);
    return config?.requireMention ?? false;
  }

  /**
   * Получить все активные конфигурации
   */
  async listConfigs(): Promise<ChatConfig[]> {
    return Array.from(this.configCache.values());
  }

  /**
   * Создать новую конфигурацию
   */
  async createConfig(data: CreateChatConfig): Promise<ChatConfig> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    const insertData = {
      chatId: data.chatId,
      chatTitle: data.chatTitle,
      chatType: data.chatType,
      personaName: data.personaName,
      systemPrompt: data.systemPrompt,
      styleRules: data.styleRules,
      responseExamples: data.responseExamples || [],
      knowledgeSources: data.knowledgeSources || [],
      triggerWords: data.triggerWords || [],
      responseProbability: data.responseProbability,
      requireMention: data.requireMention,
      salesMode: data.salesMode,
      salesConfig: data.salesConfig,
      isActive: data.isActive,
      priority: data.priority,
      createdBy: data.createdBy,
    } satisfies InsertChatConfig;

    const result = await this.db
      .insert(chatConfigs)
      .values(insertData)
      .returning();

    const config = this.mapRecordToConfig(result[0]);

    // Добавляем в кэш
    this.configCache.set(config.chatId, config);

    log.info(`Создана конфигурация для чата ${config.chatId}`);
    return config;
  }

  /**
   * Обновить конфигурацию
   */
  async updateConfig(chatId: string, updates: UpdateChatConfig): Promise<ChatConfig> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    const normalizedId = this.normalizeChatId(chatId);

    const result = await this.db
      .update(chatConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chatConfigs.chatId, normalizedId))
      .returning();

    if (result.length === 0) {
      throw new Error(`Конфигурация для чата ${chatId} не найдена`);
    }

    const config = this.mapRecordToConfig(result[0]);

    // Обновляем кэш
    this.configCache.set(normalizedId, config);

    log.info(`Обновлена конфигурация для чата ${chatId}`);
    return config;
  }

  /**
   * Удалить конфигурацию
   */
  async deleteConfig(chatId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database не инициализирована');
    }

    const normalizedId = this.normalizeChatId(chatId);

    await this.db
      .delete(chatConfigs)
      .where(eq(chatConfigs.chatId, normalizedId));

    // Удаляем из кэша
    this.configCache.delete(normalizedId);

    log.info(`Удалена конфигурация для чата ${chatId}`);
  }

  /**
   * Перезагрузить кэш из БД
   */
  async refreshCache(): Promise<void> {
    await this.loadAllConfigs();
    log.info('Кэш конфигураций перезагружен');
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Нормализация chatId (убираем -100 префикс)
   */
  private normalizeChatId(chatId: string | number): string {
    const chatIdStr = String(chatId);
    return chatIdStr.replace(/^-100/, '');
  }

  /**
   * Проверка, является ли чат личным сообщением
   */
  private isPrivateChat(chatId: string | number): boolean {
    const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

    // Отрицательные ID - группы/каналы
    if (chatIdNum < 0) return false;

    // ID > 5 миллиардов - реальные пользователи
    if (chatIdNum > 5000000000) return true;

    // Маленькие ID < 1 миллиарда - тоже пользователи
    if (chatIdNum > 0 && chatIdNum < 1000000000) return true;

    return false;
  }

  /**
   * Маппинг DB record в ChatConfig interface
   */
  private mapRecordToConfig(record: ChatConfigRecord): ChatConfig {
    return {
      id: record.id,
      chatId: record.chatId,
      chatTitle: record.chatTitle || '',
      chatType: record.chatType as ChatConfig['chatType'],
      personaName: record.personaName,
      systemPrompt: record.systemPrompt,
      styleRules: record.styleRules as StyleRules,
      responseExamples: (record.responseExamples || []) as ResponseExample[],
      knowledgeSources: (record.knowledgeSources || []) as KnowledgeSource[],
      triggerWords: record.triggerWords || [],
      responseProbability: record.responseProbability,
      requireMention: record.requireMention,
      salesMode: record.salesMode,
      salesConfig: record.salesConfig as SalesConfig | undefined,
      isActive: record.isActive,
      priority: record.priority,
      createdAt: record.createdAt || undefined,
      updatedAt: record.updatedAt || undefined,
      createdBy: record.createdBy || undefined,
    };
  }

  /**
   * Дефолтный system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `Ты ВАЙБИ (VIBEE) - наставник по вайбкодингу с отличным чувством юмора!

ГЛАВНОЕ ПРАВИЛО: ПИШИ ТОЛЬКО НА РУССКОМ! Никаких английских слов!

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
- Ты как друг который шарит в коде - дружелюбный и полезный
- Можешь пошутить по теме, но НЕ в каждом сообщении
- Подбадривай людей когда уместно
- НИКОГДА НЕ ИСПОЛЬЗУЙ ЭМОДЗИ!

ВАЖНО - РАЗНООБРАЗИЕ:
- НЕ начинай каждое сообщение одинаково!
- НЕ используй "йо", "бро", "красава" в каждом сообщении - максимум 1 раз на 5 сообщений
- Варьируй стиль: иногда формально, иногда casual
- Чередуй короткие и средние ответы

ПРАВИЛА:
1. НЕ грузи теорией - сразу к делу
2. НЕ пиши простыни текста - короткие ответы
3. ВСЕГДА давай готовую команду если спрашивают КАК
4. Отвечай по существу вопроса`;
  }

  /**
   * Дефолтные StyleRules
   */
  private getDefaultStyleRules(): StyleRules {
    return {
      adjectives: ['дружелюбный', 'практичный', 'понятный', 'толковый'],
      slangs: [], // Убрали - сленг должен использоваться редко и естественно, не принудительно
      emojisAllowed: false,
      language: 'ru',
      maxResponseLength: 1000,
      formality: 'adaptive', // Адаптируется под собеседника
    };
  }

  /**
   * Получить статистику
   */
  getStats(): { totalConfigs: number; activeConfigs: number; cachedConfigs: number } {
    return {
      totalConfigs: this.configCache.size,
      activeConfigs: Array.from(this.configCache.values()).filter(c => c.isActive).length,
      cachedConfigs: this.configCache.size,
    };
  }
}

export default ChatConfigService;
