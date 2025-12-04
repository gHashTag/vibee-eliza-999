/**
 * Унифицированный сервис KOLS
 * Объединяет Telegram MTProto + Proactive Messaging + LLM
 */

import { Service, IAgentRuntime, ModelType } from '@elizaos/core';
import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { KolsLogger } from '../utils/logger';
import { KolsMessage, KolsConfig, ProactiveMessageConfig } from '../types';

export class KolsUnifiedService extends Service {
  static serviceType = 'kols-unified';
  serviceType = 'kols-unified';

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new KolsUnifiedService();
    await service.initialize(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [KolsUnifiedService] static stop() called');
  }

  private client: TelegramClient | null = null;
  private runtimeRef: IAgentRuntime | null = null;
  private isActive = false;
  private targetChats: Set<string> = new Set();
  private autoReplyEnabled = true;
  private proactiveEnabled = true;
  private totalMessages = 0;
  private monitoringStartTime = 0;
  private proactiveTimerId: NodeJS.Timeout | null = null;
  private lastMessageTime: Map<string, number> = new Map();

  constructor() {
    super();
    KolsLogger.timer('🎯 KolsUnifiedService создан');
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtimeRef = runtime;
    KolsLogger.bot('📡 Инициализация KolsUnifiedService...');

    // Получаем конфигурацию
    const config = this.loadConfig(runtime);

    // Инициализируем Telegram клиент
    await this.initializeTelegram(config);

    // Запускаем мониторинг
    this.startMonitoring();

    // Запускаем проактивную активность если включена
    if (config.proactiveEnabled) {
      this.startProactiveActivity();
    }

    KolsLogger.success('✅ KolsUnifiedService инициализирован!');
  }

  private loadConfig(runtime: IAgentRuntime): KolsConfig {
    const targetChatIds = [
      runtime.getSetting('KOLS_TARGET_CHAT_IDS') ||
      '-1002643951085,2298297094'
    ].join(',').split(',').filter(Boolean);

    return {
      targetChatIds,
      autoReplyEnabled: runtime.getSetting('KOLS_AUTO_REPLY_ENABLED') !== 'false',
      proactiveEnabled: runtime.getSetting('KOLS_PROACTIVE_ENABLED') !== 'false',
      proactiveIntervalMin: parseInt(runtime.getSetting('KOLS_PROACTIVE_INTERVAL_MIN') || '60'),
      proactiveIntervalMax: parseInt(runtime.getSetting('KOLS_PROACTIVE_INTERVAL_MAX') || '90'),
      autoReplyTriggers: [
        'vibe', 'вайб', 'vibecoding', 'обучи', 'научи', 'учить', 'обучение',
        'урок', 'курс', 'ai-агент', 'ai агент', 'ии агент', 'агент',
        'eliza', 'элиза', 'claude code', 'claude', 'клод', 'chatgpt', 'gpt',
        'расскажи', 'объясни', 'покажи', 'помоги', 'подскажи', 'как работать',
        'как сделать', 'как написать', 'как создать', 'что такое', 'что значит',
        'зачем', 'почему', 'как', 'код', 'программ', 'разработ', 'typescript',
        'javascript', 'python', 'бот', 'telegram', 'телеграм', 'привет',
        'здравствуй', 'добрый', 'хай', 'hello', 'hi'
      ],
      llmModelType: runtime.getSetting('KOLS_LLM_MODEL_TYPE') || 'TEXT_SMALL',
      llmMaxTokens: parseInt(runtime.getSetting('KOLS_LLM_MAX_TOKENS') || '300'),
      llmTemperature: parseFloat(runtime.getSetting('KOLS_LLM_TEMPERATURE') || '0.8'),
      systemPrompts: {
        autoReply: `Ты VIBEE Agent - наставник по современной разработке и VibeCoding.

СТРОГИЕ ЗАПРЕТЫ:
- СТРОГИЙ ЗАПРЕТ НА ПРИВЕТСТВИЯ: НИКОГДА не начинай сообщение со слов: Привет, Здравствуй, Добрый день, Здравствуйте, Hello, Hi.
- СТРОГИЙ ЗАПРЕТ НА ОБРАЩЕНИЯ: НИКОГДА не обращайся по имени (Иван, Дмитрий и т.д.).
- СТРОГИЙ ЗАПРЕТ НА ЭМОДЗИ: НИКОГДА не используй эмодзи и смайлики. Пиши деловым языком.
- НЕМЕДЛЕННО переходи к сути ответа.
- Будь разнообразным в формулировках.
- Отвечай кратко (2-4 предложения).
- Всегда на русском языке.

Темы экспертизы: VibeCoding, AI-агенты, ElizaOS, Claude Code, TypeScript, функциональное программирование, Rainbow Bridge, MTProto.`,
        proactive: [
          `Ты наставник KOLS по современной разработке.
СТРОГИЕ ЗАПРЕТЫ:
- НИКОГДА не начинай с приветствий
- НИКОГДА не обращайся по имени
- НИКОГДА не используй эмодзи и смайлики
Сразу к сути. Придумай УНИКАЛЬНЫЙ интересный вопрос к студентам про AI-агенты, Claude Code, VibeCoding, ElizaOS. Провокационный вопрос который заставит задуматься. На русском, 2-3 предложения.`,
          `Ты эксперт KOLS по AI-агентам.
СТРОГИЕ ЗАПРЕТЫ:
- НИКОГДА не начинай с приветствий
- НИКОГДА не обращайся по имени
- НИКОГДА не используй эмодзи и смайлики
Поделись УДИВИТЕЛЬНЫМ фактом о том, как AI меняет программирование. Расскажи что-то уникальное про ElizaOS, Claude Code, автоматизацию. На русском, 2-3 предложения.`
        ]
      }
    };
  }

  private async initializeTelegram(config: KolsConfig): Promise<void> {
    const apiId = parseInt(
      this.runtimeRef?.getSetting('TELEGRAM_API_ID') ||
      process.env.TELEGRAM_API_ID ||
      '94892'
    );
    const apiHash =
      this.runtimeRef?.getSetting('TELEGRAM_API_HASH') ||
      process.env.TELEGRAM_API_HASH ||
      'cacf9ad137d228611b49b2ecc6d68d43';
    const sessionString =
      this.runtimeRef?.getSetting('TELEGRAM_SESSION_STRING') ||
      process.env.TELEGRAM_SESSION_STRING ||
      '';

    try {
      const session = new StringSession(sessionString);
      this.client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });

      await this.client.connect();
      KolsLogger.success('✅ MTProto подключен!');

      // Настраиваем целевые чаты
      config.targetChatIds.forEach(chatId => {
        this.targetChats.add(chatId.trim());
        KolsLogger.chat(`🎯 Добавлен целевой чат: ${chatId.trim()}`);
      });

      // Настраиваем прослушивание сообщений
      await this.setupMessageListener();

    } catch (error) {
      KolsLogger.error('❌ Ошибка подключения:', error);
    }
  }

  private async setupMessageListener(): Promise<void> {
    if (!this.client) return;

    this.client.addEventHandler(this.handleNewMessage.bind(this), new NewMessage({}));
    KolsLogger.activity('👂 Настроено прослушивание сообщений');
  }

  private async handleNewMessage(event: NewMessageEvent): Promise<void> {
    if (!event.message || !event.message.text) return;

    try {
      const message = event.message;
      let chat = await event.getChat() as any;

      if (!chat && message.peerId && this.client) {
        chat = await this.client.getEntity(message.peerId) as any;
      }

      if (!chat || !chat.id) {
        KolsLogger.warning('⚠️ Chat is invalid, skipping message');
        return;
      }

      const sender = await message.getSender() as any;

      const processedMessage: KolsMessage = {
        chatId: chat.id.toString(),
        chatTitle: chat.title || (sender?.firstName || 'Private Chat'),
        fromUserId: sender?.id?.toString() || 'unknown',
        fromFirstName: sender?.firstName || 'Unknown',
        messageText: message.text || '',
        messageId: message.id,
        timestamp: Date.now()
      };

      this.logMessage(processedMessage);
      this.totalMessages++;

      // Фильтруем только целевые группы
      const isTargetGroup = this.targetChats.has(processedMessage.chatId);
      if (!isTargetGroup) {
        console.log(`🚫 Игнорируем сообщение из чужой группы: ${processedMessage.chatId}`);
        return;
      }

      console.log(`✅ Целевая группа: ${processedMessage.chatId} - обрабатываем сообщение`);

      // Проверяем триггеры для автоответа
      if (this.autoReplyEnabled) {
        await this.checkTriggersAndReply(processedMessage);
      }

    } catch (error) {
      console.error('❌ Ошибка обработки сообщения:', error);
    }
  }

  private logMessage(message: KolsMessage): void {
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const displayText = message.messageText.length > 50
      ? message.messageText.substring(0, 50) + '...'
      : message.messageText;

    console.log(`[${timestamp}] 📨 ${message.chatTitle} » ${message.fromFirstName}: ${displayText}`);
  }

  private async checkTriggersAndReply(message: KolsMessage): Promise<void> {
    const config = this.loadConfig(this.runtimeRef!);
    const text = message.messageText.toLowerCase();

    const hasTrigger = config.autoReplyTriggers.some(trigger => text.includes(trigger));

    if (hasTrigger) {
      KolsLogger.activity(`🎯 Найден триггер в сообщении от ${message.fromFirstName}`);

      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      await this.generateAndSendLearningReply(message);
    }
  }

  private async generateAndSendLearningReply(message: KolsMessage): Promise<void> {
    try {
      if (!this.client || !this.runtimeRef) return;

      KolsLogger.bot(`🤖 Генерирую ответ для ${message.fromFirstName}...`);

      let responseText = '';

      try {
        const config = this.loadConfig(this.runtimeRef);
        const systemPrompt = config.systemPrompts.autoReply;

        const userPrompt = `Сообщение: "${message.messageText}"

Дай полезный ответ по теме. Сразу к сути, без приветствий.`;

        const response = await this.runtimeRef.useModel(ModelType.TEXT_SMALL, {
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          maxTokens: config.llmMaxTokens,
          temperature: config.llmTemperature,
        });

        responseText = response?.trim() || '';

        if (responseText && responseText.length > 10) {
          KolsLogger.success(`🧠 LLM сгенерировал ответ`);
        } else {
          throw new Error('LLM вернул пустой ответ');
        }
      } catch (llmError) {
        KolsLogger.warning(`⚠️ LLM недоступен, использую fallback`);
        responseText = '';
      }

      // Fallback если LLM не сработал
      if (!responseText || responseText.length < 10) {
        const fallbackResponses = [
          `Интересный вопрос! VibeCoding - это подход, где код "вибрирует" с требованиями. Расскажи подробнее, что именно интересует?`,
          `В мире AI-агентов ElizaOS - мощный фреймворк для создания автономных систем. Уточни вопрос, и я помогу разобраться.`,
          `Современная разработка с Claude Code меняет правила игры. Что конкретно хочешь узнать?`,
          `Функциональное программирование с TaskEither и pipe - это путь к чистому коду. Давай разберем твой вопрос детальнее.`
        ];
        responseText = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }

      await this.sendMessage(message.chatId, responseText);
      KolsLogger.success(`✅ Ответ отправлен в чат ${message.chatId}`);

    } catch (error) {
      KolsLogger.error('❌ Ошибка генерации ответа:', error);
    }
  }

  private async sendMessage(chatId: string, message: string, replyTo?: number): Promise<void> {
    if (!this.client) {
      console.error('❌ Клиент не подключен');
      return;
    }

    try {
      await this.client.sendMessage(chatId, {
        message: message,
        replyTo: replyTo
      });
      console.log(`📤 Сообщение отправлено в ${chatId}`);
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
    }
  }

  private startMonitoring(): void {
    this.isActive = true;
    this.monitoringStartTime = Date.now();
    this.totalMessages = 0;
    KolsLogger.activity('✅ Мониторинг групп запущен');
  }

  private startProactiveActivity(): void {
    if (!this.proactiveEnabled) return;

    this.scheduleNextProactiveMessage();
    KolsLogger.activity('🚀 Proактивная активность запущена');
  }

  private scheduleNextProactiveMessage(): void {
    if (!this.proactiveEnabled || !this.isActive) return;

    const config = this.loadConfig(this.runtimeRef!);
    const delay = this.calculateRandomDelay(config.proactiveIntervalMin, config.proactiveIntervalMax);

    KolsLogger.timer(`⏰ Следующее сообщение через ${Math.round(delay / 1000)} сек`);

    this.proactiveTimerId = setTimeout(() => {
      if (!this.proactiveEnabled || !this.isActive) return;
      this.sendProactiveMessage();
      this.scheduleNextProactiveMessage();
    }, delay);
  }

  private calculateRandomDelay(minMinutes: number, maxMinutes: number): number {
    const minDelay = minMinutes * 60 * 1000;
    const maxDelay = maxMinutes * 60 * 1000;
    const randomMultiplier = 0.5 + Math.random() * 1.5;
    const randomDelay = minDelay + (maxDelay - minDelay) * Math.random() * randomMultiplier;
    return Math.round(randomDelay);
  }

  private async sendProactiveMessage(): Promise<void> {
    if (this.targetChats.size === 0) {
      KolsLogger.warning('⚠️ Нет целевых чатов для отправки!');
      return;
    }

    KolsLogger.activity(`🎬 KOLS инициирует разговор!`);
    KolsLogger.bot(`🤖 Генерирую уникальное сообщение через LLM...`);

    try {
      const config = this.loadConfig(this.runtimeRef!);
      const prompts = config.systemPrompts.proactive;
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      const generatedText = await this.generateLLMMessage(randomPrompt);

      if (!generatedText || generatedText.length < 10) {
        KolsLogger.error('❌ LLM вернул пустой ответ');
        return;
      }

      KolsLogger.success(`✅ LLM сгенерировал сообщение`);

      for (const chatId of this.targetChats) {
        try {
          await this.sendMessage(chatId, generatedText);
          KolsLogger.sendMessage(chatId, generatedText);
          KolsLogger.success(`✅ Сообщение отправлено в чат ${chatId}`);
        } catch (error) {
          KolsLogger.error(`❌ Ошибка отправки в чат ${chatId}:`, error);
        }
      }
    } catch (error) {
      KolsLogger.error('❌ Ошибка генерации LLM сообщения:', error);
    }
  }

  private async generateLLMMessage(systemPrompt: string): Promise<string> {
    if (!this.runtimeRef) {
      throw new Error('Runtime не установлен');
    }

    try {
      const config = this.loadConfig(this.runtimeRef);
      const response = await this.runtimeRef.useModel(ModelType.TEXT_SMALL, {
        prompt: systemPrompt,
        maxTokens: config.llmMaxTokens,
        temperature: config.llmTemperature,
      });

      const cleanedResponse = response?.trim() || '';
      KolsLogger.success(`🧠 LLM ответил`);
      return cleanedResponse;
    } catch (error) {
      KolsLogger.error('❌ Ошибка вызова LLM:', error);
      throw error;
    }
  }

  // Публичные методы для управления сервисом
  setAutoReplyEnabled(enabled: boolean): void {
    this.autoReplyEnabled = enabled;
    console.log(`🔧 Автоответы: ${enabled ? 'включены' : 'выключены'}`);
  }

  setProactiveEnabled(enabled: boolean): void {
    this.proactiveEnabled = enabled;
    if (!enabled && this.proactiveTimerId) {
      clearTimeout(this.proactiveTimerId);
      this.proactiveTimerId = null;
    } else if (enabled) {
      this.scheduleNextProactiveMessage();
    }
    console.log(`🔧 Proактивность: ${enabled ? 'включена' : 'выключена'}`);
  }

  addTargetChat(chatId: string): void {
    this.targetChats.add(chatId);
    KolsLogger.chat(`➕ Добавлен целевой чат: ${chatId}`);
  }

  removeTargetChat(chatId: string): void {
    this.targetChats.delete(chatId);
    KolsLogger.chat(`➖ Удален целевой чат: ${chatId}`);
  }

  getStatus(): { isActive: boolean; targetChats: number; totalMessages: number } {
    return {
      isActive: this.isActive,
      targetChats: this.targetChats.size,
      totalMessages: this.totalMessages
    };
  }

  async stop(): Promise<void> {
    console.log('🛑 [KolsUnifiedService] Остановка...');

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    if (this.proactiveTimerId) {
      clearTimeout(this.proactiveTimerId);
      this.proactiveTimerId = null;
    }

    this.isActive = false;
  }

  get capabilityDescription(): string {
    return 'KOLS Unified Service - Telegram MTProto + Proactive Messaging + LLM в одном сервисе';
  }
}
