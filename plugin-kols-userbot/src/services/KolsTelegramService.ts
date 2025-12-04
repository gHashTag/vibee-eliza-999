/**
 * KOLS Telegram Service - ЖИВОЙ и АКТИВНЫЙ агент!
 * 🎨 С красивыми цветными логами для студентов
 * 🚀 С инициативными сообщениями и таймерами
 */
import { Service, IAgentRuntime } from '@elizaos/core';
import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import { IKolsMonitoringStats, IKolsMessage, IKolsGroup } from '../types';
import { KolsLogger } from '../utils/logger';
import { KolsProactiveService } from './KolsProactiveService';

export class KolsTelegramService extends Service {
  static serviceType = 'kols-telegram';
  serviceType = 'kols-telegram';

  /**
   * Статический метод start() - требуется ElizaOS
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new KolsTelegramService();
    await service.initialize(runtime);
    return service;
  }

  /**
   * Статический метод stop() - требуется ElizaOS
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [KolsTelegramService] static stop() called');
  }

  private client: TelegramClient | null = null;
  protected runtimeRef: IAgentRuntime | null = null; // Сохраняем runtime
  private proactiveService: KolsProactiveService;
  private autoReplyEnabled = true;
  private isMonitoring = false;
  private monitoredGroups: Map<string, IKolsGroup> = new Map();
  private messageHandlers: Set<(message: IKolsMessage) => void> = new Set();
  private totalMessages = 0;
  private monitoringStartTime = 0;

  constructor() {
    super();
    this.proactiveService = new KolsProactiveService();
    KolsLogger.timer('🎯 KolsTelegramService создан с проактивным обучением');
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtimeRef = runtime; // Сохраняем runtime
    KolsLogger.bot('📡 Инициализация MTProto...');

    const apiId = parseInt(process.env.TELEGRAM_API_ID || '27117758');
    const apiHash = process.env.TELEGRAM_API_HASH || 'a25b0b5b3ee9c3b3c0d4e5f6g7h8i9j0k';
    const sessionString = process.env.TELEGRAM_SESSION_STRING || '';

    // DEBUG: Логируем переменные окружения
    KolsLogger.debug('TELEGRAM_API_ID =', apiId);
    KolsLogger.debug('TELEGRAM_API_HASH =', apiHash.substring(0, 20) + '...');
    KolsLogger.debug('TELEGRAM_SESSION_STRING =', sessionString ? sessionString.substring(0, 50) + '...' : 'ПУСТОЙ!');

    try {
      // Создаем клиент
      const session = new StringSession(sessionString);
      this.client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });

      await this.client.connect();
      KolsLogger.success('✅ MTProto подключен!');

      // Настраиваем прослушивание сообщений
      await this.setupMessageListener();

      // 🚀 Инициализируем проактивное обучение с knowledge base
      KolsLogger.activity('🎯 Инициализация проактивного обучения...');
      
      // Целевые чаты для обучения
      const targetChats = ['2643951085', '2298297094', '-1002643951085'];
      
      // Инициализируем с runtime и функцией отправки
      await this.proactiveService.initialize(
        this.runtimeRef!,
        this.sendMessage.bind(this),
        targetChats
      );
      
      // Запускаем проактивное обучение (раз в час)
      this.proactiveService.startActivity();
      KolsLogger.success('🎉 KOLS обучающий агент активирован!');

    } catch (error) {
      KolsLogger.error('❌ Ошибка подключения:', error);
    }
  }

  /**
   * Настраивает прослушивание всех сообщений
   */
  private async setupMessageListener(): Promise<void> {
    if (!this.client) return;

    this.client.addEventHandler(this.handleNewMessage.bind(this), new NewMessage({}));
    KolsLogger.activity('👂 Настроено прослушивание сообщений');
  }

  /**
   * Обрабатывает новое сообщение
   */
  private async handleNewMessage(event: NewMessageEvent): Promise<void> {
    if (!event.message || !event.message.text) return;

    try {
      const message = event.message;

      // DEBUG: Логируем событие
      console.log('[DEBUG] Message event received');

      // Получаем chat - сначала пробуем getChat(), потом peerId
      let chat = await event.getChat() as any;

      if (!chat && message.peerId && this.client) {
        console.log('[DEBUG] event.getChat() returned undefined, using message.peerId');
        chat = await this.client.getEntity(message.peerId) as any;
      }

      console.log('[DEBUG] chat =', chat);
      console.log('[DEBUG] chat?.id =', chat?.id);
      console.log('[DEBUG] chat type =', chat?.className);
      console.log('[DEBUG] message.peerId =', message.peerId);

      // Защита от undefined chat - ПРОВЕРКА ДО обращения к chat.id!
      if (!chat || !chat.id) {
        console.log('[WARNING] Chat is invalid, skipping message');
        console.log('[DEBUG] Full event object:', JSON.stringify(event, null, 2));
        return;
      }

      const sender = await message.getSender() as any;

      const chatId = chat.id.toString();
      const chatTitle = chat.title || (sender?.firstName || 'Private Chat');

      // 🎯 ФИЛЬТР ГРУПП - обрабатываем только целевые группы!
      // ВАЖНО: Группа 1165767969 удалена по просьбе пользователя (не наша группа)
      const targetGroups = ['2643951085', '2298297094', '-1002643951085'];
      const normalizedChatId = chatId.startsWith('-100') ? chatId.slice(4) : chatId;

      if (!targetGroups.includes(chatId) && !targetGroups.includes(normalizedChatId)) {
        console.log(`[SKIP] Group ${chatId} (${chatTitle}) not in target list - skipping`);
        return;
      }

      console.log(`[TARGET] Group ${chatId} (${chatTitle}) - processing message`);

      const processedMessage: IKolsMessage = {
        chatId: chatId,
        chatTitle: chatTitle,
        fromUserId: sender?.id?.toString() || 'unknown',
        fromFirstName: sender?.firstName || 'Unknown',
        messageText: message.text || '',
        messageId: message.id,
        timestamp: Date.now()
      };

      // Логируем сообщение
      this.logMessage(processedMessage);

      // Увеличиваем счетчик
      this.totalMessages++;

      // Уведомляем обработчики
      this.messageHandlers.forEach(handler => {
        try {
          handler(processedMessage);
        } catch (error) {
          console.error('❌ [KolsTelegramService] Ошибка в обработчике:', error);
        }
      });

      // Проверяем триггеры для автоответа
      await this.checkTriggersAndReply(processedMessage);

    } catch (error) {
      console.error('❌ [KolsTelegramService] Ошибка обработки сообщения:', error);
    }
  }

  /**
   * Логирует сообщение в консоль (УЛУЧШЕНО: без цветов, понятно)
   */
  private logMessage(message: IKolsMessage): void {
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const displayText = message.messageText.length > 50
      ? message.messageText.substring(0, 50) + '...'
      : message.messageText;

    // УЛУЧШЕНО: простой текст без эмодзи и цветов
    console.log(`[${timestamp}] [MESSAGE] Group: ${message.chatTitle} | User: ${message.fromFirstName} | Text: ${displayText}`);
  }

  /**
   * Отвечает на сообщение как живой ментор (реагирует на ВСЕ сообщения!)
   */
  private async checkTriggersAndReply(message: IKolsMessage): Promise<void> {
    if (!this.autoReplyEnabled) {
      console.log(`⏸️ [KolsTelegramService] Автоответы выключены`);
      return;
    }

    console.log(`💬 [KolsTelegramService] Отвечаю в диалоге с ${message.fromFirstName}`);

    // Задержка чтобы не спамить
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Отвечаем на ЛЮБОЕ сообщение как живой ментор
    await this.generateAndSendLearningReply(message);
  }

  /**
   * Генерирует и отправляет обучающий ответ через LLM
   */
  private async generateAndSendLearningReply(message: IKolsMessage): Promise<void> {
    try {
      if (!this.client) return;

      console.log(`🤖 [KolsTelegramService] Генерирую LLM ответ для ${message.fromFirstName}...`);

      // Создаем промпт для LLM
      const systemPrompt = `Ты KOLS - наставник по VibeCoding и современной разработке с AI.

Пользователь написал: "${message.messageText}"

Твоя задача: ответить как живой ментор на русском языке. БЕЗ приветствий (не пиши "Привет", "Здравствуйте"), БЕЗ обращения по имени, БЕЗ эмодзи.

Отвечай по делу, давай конкретные советы, задавай уточняющие вопросы. Твоя экспертиза: VibeCoding, AI-агенты, Claude Code, функциональное программирование, Telegram боты.

Ответ должен быть кратким (до 200 слов) и содержательным.`;

      // Генерируем ТОЛЬКО через LLM - БЕЗ FALLBACK!
      if (!this.runtimeRef) {
        console.error('❌ [KolsTelegramService] runtime не доступен');
        return;
      }

      const response = await this.runtimeRef.useModel('TEXT_SMALL', {
        prompt: systemPrompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      const learningMessage = response?.trim();

      if (!learningMessage) {
        console.error('❌ [KolsTelegramService] Пустой ответ от LLM');
        return;
      }

      console.log(`✅ [KolsTelegramService] LLM ответ сгенерирован: "${learningMessage.substring(0, 50)}..."`);

      // Отправляем ответ
      await this.sendMessage(message.chatId, learningMessage);

      console.log('✅ [KolsTelegramService] Ответ отправлен');

    } catch (error) {
      console.error('❌ [KolsTelegramService] Ошибка генерации ответа:', error);
      // НЕ отправляем fallback - просто логируем ошибку
    }
  }

  /**
   * Отправляет сообщение
   */
  async sendMessage(chatId: string, message: string, replyTo?: number): Promise<void> {
    if (!this.client) {
      console.error('❌ [KolsTelegramService] Клиент не подключен');
      return;
    }

    try {
      await this.client.sendMessage(chatId, {
        message: message,
        replyTo: replyTo
      });
      console.log(`📤 [KolsTelegramService] Сообщение отправлено в ${chatId}`);
    } catch (error) {
      console.error('❌ [KolsTelegramService] Ошибка отправки:', error);
    }
  }

  /**
   * Запускает мониторинг групп
   */
  async startGroupMonitoring(): Promise<{ success: boolean; message: string }> {
    if (this.isMonitoring) {
      return { success: false, message: 'Мониторинг уже запущен' };
    }

    this.isMonitoring = true;
    this.monitoringStartTime = Date.now();
    this.totalMessages = 0;

    console.log('✅ [KolsTelegramService] Мониторинг групп запущен');
    return { success: true, message: 'Мониторинг успешно запущен' };
  }

  /**
   * Останавливает мониторинг
   */
  async stopGroupMonitoring(): Promise<{ success: boolean; message: string }> {
    this.isMonitoring = false;
    console.log('🛑 [KolsTelegramService] Мониторинг остановлен');
    return { success: true, message: 'Мониторинг остановлен' };
  }

  /**
   * Добавляет группу в мониторинг
   */
  async addGroupToMonitor(groupId: string, groupTitle: string): Promise<{ success: boolean; message: string }> {
    const group: IKolsGroup = {
      id: groupId,
      title: groupTitle,
      isActive: true,
      addedAt: Date.now()
    };

    this.monitoredGroups.set(groupId, group);

    console.log(`➕ [KolsTelegramService] Группа добавлена: ${groupTitle}`);
    return { success: true, message: `Группа "${groupTitle}" добавлена в мониторинг` };
  }

  /**
   * Получает статистику мониторинга
   */
  getMonitoringStats(): IKolsMonitoringStats {
    const uptime = this.isMonitoring ? Date.now() - this.monitoringStartTime : 0;

    return {
      totalGroups: this.monitoredGroups.size,
      activeGroups: Array.from(this.monitoredGroups.values()).filter(g => g.isActive).length,
      totalMessages: this.totalMessages,
      uptime: uptime
    };
  }

  /**
   * Добавляет обработчик сообщений
   */
  addMessageHandler(handler: (message: IKolsMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Удаляет обработчик сообщений
   */
  removeMessageHandler(handler: (message: IKolsMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Включает/выключает автоответы
   */
  setAutoReplyEnabled(enabled: boolean): void {
    this.autoReplyEnabled = enabled;
    console.log(`🔧 [KolsTelegramService] Автоответы: ${enabled ? 'включены' : 'выключены'}`);
  }

  get capabilityDescription(): string {
    return 'KOLS Telegram сервис - MTProto подключение и мониторинг сообщений';
  }

  async stop(): Promise<void> {
    console.log('🛑 [KolsTelegramService] Остановка...');

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    this.messageHandlers.clear();
    this.monitoredGroups.clear();
  }
}
