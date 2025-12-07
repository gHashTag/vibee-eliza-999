/**
 * KOLS Telegram Service - ЖИВОЙ и АКТИВНЫЙ агент!
 *
 * Изолированный сервис с:
 * - Singleton паттерном для идемпотентности
 * - State Machine для управления состоянием
 * - Централизованной конфигурацией из ../config
 */
import { Service, IAgentRuntime } from '@elizaos/core';
import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { IKolsMonitoringStats, IKolsMessage, IKolsGroup } from '../types';
import { KolsLogger } from '../utils/logger';
import { KolsProactiveService } from './KolsProactiveService';
import { GramJSEventMonitor } from './GramJSEventMonitor';

// Импорт централизованной конфигурации
import {
  getCredentials,
  containsTrigger,
  findTriggers,
  isTargetChat,
  getTargetChats,
  PROACTIVE_LLM
} from '../config';

/** Состояния сервиса */
type ServiceState = 'idle' | 'initializing' | 'connected' | 'error' | 'stopped';

export class KolsTelegramService extends Service {
  static serviceType = 'kols-telegram';
  serviceType = 'kols-telegram';

  // Singleton паттерн для идемпотентности
  private static instance: KolsTelegramService | null = null;
  private state: ServiceState = 'idle';

  /**
   * Статический метод start() - требуется ElizaOS
   * Идемпотентный - повторные вызовы безопасны
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    // Singleton: переиспользуем существующий экземпляр
    if (KolsTelegramService.instance?.state === 'connected') {
      KolsLogger.debug('KolsTelegramService: Уже подключен, переиспользуем');
      return KolsTelegramService.instance;
    }

    // Если инициализируется - ждём
    if (KolsTelegramService.instance && KolsTelegramService.instance.getState() === 'initializing') {
      KolsLogger.debug('KolsTelegramService: Инициализация в процессе...');
      // Ждём завершения инициализации (максимум 30 сек)
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const instance = KolsTelegramService.instance;
        if (!instance) break;
        const currentState = instance.getState();
        if (currentState === 'connected') {
          return instance;
        }
        if (currentState === 'error') {
          break;
        }
      }
    }

    const service = new KolsTelegramService();
    KolsTelegramService.instance = service;
    await service.initialize(runtime);
    return service;
  }

  /**
   * Статический метод stop() - требуется ElizaOS
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    KolsLogger.info('KolsTelegramService: static stop() called');
    if (KolsTelegramService.instance) {
      await KolsTelegramService.instance.stop();
      KolsTelegramService.instance = null;
    }
  }

  private client: TelegramClient | null = null;
  protected runtimeRef: IAgentRuntime | null = null;
  private proactiveService: KolsProactiveService;
  private eventMonitor: GramJSEventMonitor | null = null;
  private autoReplyEnabled = true;
  private isMonitoring = false;
  private monitoredGroups: Map<string, IKolsGroup> = new Map();
  private messageHandlers: Set<(message: IKolsMessage) => void> = new Set();
  private totalMessages = 0;
  private monitoringStartTime = 0;

  constructor() {
    super();
    this.proactiveService = new KolsProactiveService();
    KolsLogger.timer('KolsTelegramService создан с проактивным обучением');
  }

  /**
   * Проверяет сообщение на наличие триггерных слов VibeCoding
   * Использует централизованную конфигурацию из ../config/triggers
   */
  private checkForTriggers(messageText: string): boolean {
    // Используем централизованную функцию containsTrigger
    const hasTrigger = containsTrigger(messageText);

    if (hasTrigger) {
      const triggers = findTriggers(messageText);
      KolsLogger.debug(`Найдены триггеры: ${triggers.join(', ')} в: "${messageText.substring(0, 50)}..."`);
      return true;
    }

    // Дополнительно: отвечаем на вопросы (содержат ? или вопросительные слова)
    const lowerMessage = messageText.toLowerCase();
    const questionWords = ['?', 'как', 'что', 'где', 'когда', 'почему', 'зачем', 'помоги', 'подскажи', 'объясни'];
    const hasQuestion = questionWords.some(word => lowerMessage.includes(word));

    if (hasQuestion) {
      KolsLogger.debug(`Обнаружен вопрос: "${messageText.substring(0, 50)}..."`);
      return true;
    }

    return false;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Проверяем состояние - идемпотентность
    if (this.state === 'connected') {
      KolsLogger.debug('KolsTelegramService: Уже инициализирован');
      return;
    }

    if (this.state === 'initializing') {
      KolsLogger.debug('KolsTelegramService: Инициализация уже в процессе');
      return;
    }

    this.state = 'initializing';
    this.runtimeRef = runtime;
    KolsLogger.bot('Инициализация MTProto...');

    // Используем централизованную функцию getCredentials
    const credentials = getCredentials(runtime);

    if (!credentials) {
      KolsLogger.error('Не удалось получить Telegram credentials!');
      KolsLogger.error('Проверьте character.settings.secrets содержит TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING');
      this.state = 'error';
      return;
    }

    // DEBUG: Логируем БЕЗ секретов!
    KolsLogger.debug('Credentials загружены успешно');

    try {
      // Создаем клиент
      const session = new StringSession(credentials.sessionString);
      this.client = new TelegramClient(session, credentials.apiId, credentials.apiHash, {
        connectionRetries: 5,
      });

      await this.client.connect();
      KolsLogger.success('MTProto подключен!');

      // Настраиваем прослушивание сообщений
      await this.setupMessageListener();

      // Включаем мониторинг ВСЕХ событий GramJS
      this.eventMonitor = new GramJSEventMonitor(this.client);
      this.eventMonitor.setupAllEventMonitoring();

      // Инициализируем проактивное обучение с knowledge base
      KolsLogger.activity('Инициализация проактивного обучения...');

      // Целевые чаты из централизованной конфигурации
      const targetChats = getTargetChats();

      // Инициализируем с runtime и функцией отправки
      await this.proactiveService.initialize(
        this.runtimeRef!,
        this.sendMessage.bind(this),
        targetChats
      );

      // Запускаем проактивное обучение (раз в час)
      this.proactiveService.startActivity();

      this.state = 'connected';
      KolsLogger.success('KOLS обучающий агент активирован!');

    } catch (error) {
      KolsLogger.error('Ошибка подключения:', error);
      this.state = 'error';
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

      // Получаем chat - сначала пробуем getChat(), потом peerId
      let chat = await event.getChat() as any;

      if (!chat && message.peerId && this.client) {
        chat = await this.client.getEntity(message.peerId) as any;
      }

      // Защита от undefined chat
      if (!chat || !chat.id) {
        return;
      }

      const sender = await message.getSender() as any;

      const chatId = chat.id.toString();
      const chatTitle = chat.title || (sender?.firstName || 'Private Chat');

      // Определяем тип чата по className от Telegram API
      // User = личный чат, Channel/Chat = группа/канал
      const chatClassName = chat.className || '';
      const isPrivate = chatClassName === 'User' || (!chat.title && !chatClassName.includes('Channel') && !chatClassName.includes('Chat'));

      // ВАЖНО: Отвечаем ТОЛЬКО в целевые группы!
      // Личные чаты - только логируем, не отвечаем
      const canReply = isTargetChat(chatId);

      if (!canReply) {
        // Логируем пропущенные сообщения компактно
        const shortText = message.text?.substring(0, 30) || '';
        const chatType = isPrivate ? 'ЛС' : 'группа';
        KolsLogger.debug(`Пропущено [${chatType}]: ${chatTitle} | ${shortText}...`);
        return;
      }

      // Логируем сообщения с указанием типа чата
      const chatType = isPrivate ? 'ЛС' : 'группа';
      KolsLogger.activity(`Новое сообщение [${chatType}] "${chatTitle}"`);

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
          KolsLogger.error('Ошибка в обработчике сообщений', error);
        }
      });

      // Проверяем триггеры для автоответа
      await this.checkTriggersAndReply(processedMessage);

    } catch (error) {
      KolsLogger.error('Ошибка обработки сообщения', error);
    }
  }

  /**
   * Логирует сообщение в консоль - ПОЛНАЯ ИНФОРМАЦИЯ
   */
  private logMessage(message: IKolsMessage): void {
    KolsLogger.incomingMessage({
      chatId: message.chatId,
      chatTitle: message.chatTitle,
      chatType: 'группа',
      userId: message.fromUserId,
      userName: message.fromFirstName,
      text: message.messageText
    });
  }

  /**
   * Разбивает длинные сообщения на части для Telegram
   * Telegram лимит: 4096 символов, но лучше отправлять до 3000 символов
   */
  private splitLongMessage(message: string): string[] {
    const maxLength = 3000; // Используем запас до лимита Telegram

    if (message.length <= maxLength) {
      return [message];
    }

    // Пытаемся разбить по абзацам
    const paragraphs = message.split('\n\n');
    const parts: string[] = [];
    let currentPart = '';

    for (const paragraph of paragraphs) {
      // Если добавление параграфа превысит лимит
      if (currentPart && (currentPart + '\n\n' + paragraph).length > maxLength) {
        // Сохраняем текущую часть и начинаем новую
        parts.push(currentPart.trim());
        currentPart = paragraph;
      } else {
        // Добавляем параграф к текущей части
        currentPart = currentPart ? currentPart + '\n\n' + paragraph : paragraph;
      }
    }

    // Добавляем последнюю часть
    if (currentPart) {
      parts.push(currentPart.trim());
    }

    // Если всё ещё слишком длинно (например, один очень длинный абзац)
    // разбиваем принудительно по предложениям
    return parts.map(part => {
      if (part.length <= maxLength) {
        return part;
      }

      // Принудительное разбиение
      const sentences = part.split(/(?<=[.!?])\s+/);
      const forcedParts: string[] = [];
      let currentSentence = '';

      for (const sentence of sentences) {
        if ((currentSentence + ' ' + sentence).length > maxLength) {
          if (currentSentence) {
            forcedParts.push(currentSentence);
            currentSentence = sentence;
          } else {
            // Одно предложение слишком длинно, разбиваем по словам
            const words = sentence.split(' ');
            let wordPart = '';
            for (const word of words) {
              if ((wordPart + ' ' + word).length > maxLength) {
                forcedParts.push(wordPart);
                wordPart = word;
              } else {
                wordPart = wordPart ? wordPart + ' ' + word : word;
              }
            }
            if (wordPart) {
              currentSentence = wordPart;
            }
          }
        } else {
          currentSentence = currentSentence ? currentSentence + ' ' + sentence : sentence;
        }
      }

      if (currentSentence) {
        forcedParts.push(currentSentence);
      }

      return forcedParts.join('\n\n');
    }).flat();
  }

  /**
   * Отвечает на сообщение как живой ментор (реагирует только на ТРИГГЕРЫ!)
   */
  private async checkTriggersAndReply(message: IKolsMessage): Promise<void> {
    if (!this.autoReplyEnabled) {
      KolsLogger.info('Автоответы выключены');
      return;
    }

    // ПРОВЕРЯЕМ ТРИГГЕРЫ!
    const hasTrigger = this.checkForTriggers(message.messageText);

    if (!hasTrigger) {
      KolsLogger.debug(`Нет триггеров - пропускаю сообщение от ${message.fromFirstName}`);
      return;
    }

    KolsLogger.trigger('Найдены триггеры', message.messageText);

    // Задержка чтобы не спамить
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Отвечаем только на сообщения с триггерами
    await this.generateAndSendLearningReply(message);
  }

  /**
   * Генерирует и отправляет обучающий ответ через LLM
   */
  private async generateAndSendLearningReply(message: IKolsMessage): Promise<void> {
    try {
      if (!this.client) return;

      KolsLogger.llmGeneration({
        forUser: message.fromFirstName,
        userId: message.fromUserId,
        prompt: message.messageText
      });

      // Промпт в стиле character файла - неформальный бро-наставник
      const systemPrompt = `Ты KOLS - бро-наставник по VibeCoding.

Пользователь написал: "${message.messageText}"

ТВОЙ СТИЛЬ:
- Общайся неформально, как с другом
- Давай КОНКРЕТНЫЕ команды которые можно скопировать
- Если человек спрашивает КАК сделать - дай команду в формате: "Скажи агенту: '...'"
- Объясняй просто, без заумных терминов

ПРАВИЛА:
- Короткий ответ: 50-150 слов
- НЕ грузи теорией - сразу к делу
- Можешь использовать сленг: бро, йо, го, чекни
- Разбивай сложное на шаги с командами
- ОТВЕЧАЙ НА РУССКОМ

Твоя экспертиза: Claude Code команды, ElizaOS плагины, Telegram боты, TypeScript, настройка окружения.`;

      // Генерируем ТОЛЬКО через LLM - БЕЗ FALLBACK!
      if (!this.runtimeRef) {
        KolsLogger.error('runtime не доступен');
        return;
      }

      const response = await this.runtimeRef.useModel('TEXT_SMALL', {
        prompt: systemPrompt,
        maxTokens: 1000,  // Достаточно для полных ответов (≈700-800 символов)
        temperature: 0.7,
      });

      const learningMessage = response?.trim();

      if (!learningMessage) {
        KolsLogger.error('Пустой ответ от LLM');
        return;
      }

      KolsLogger.llmGeneration({
        forUser: message.fromFirstName,
        userId: message.fromUserId,
        responseLength: learningMessage.length
      });

      // Разбиваем длинные сообщения на части (Telegram лимит 4096 символов)
      const messages = this.splitLongMessage(learningMessage);

      // Отправляем все части сообщения
      for (const msg of messages) {
        await this.sendMessage(message.chatId, msg);
        // Небольшая задержка между сообщениями
        if (messages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      KolsLogger.success('Ответ отправлен');

    } catch (error) {
      KolsLogger.error('Ошибка генерации ответа', error);
      // НЕ отправляем fallback - просто логируем ошибку
    }
  }

  /**
   * Отправляет сообщение
   */
  async sendMessage(chatId: string, message: string, replyTo?: number): Promise<void> {
    if (!this.client) {
      KolsLogger.error('Клиент не подключен');
      return;
    }

    try {
      await this.client.sendMessage(chatId, {
        message: message,
        replyTo: replyTo
      });
      KolsLogger.outgoingMessage({
        chatId,
        chatTitle: 'Chat',
        text: message
      });
    } catch (error) {
      KolsLogger.error('Ошибка отправки сообщения', error);
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

    KolsLogger.success('Мониторинг групп запущен');
    return { success: true, message: 'Мониторинг успешно запущен' };
  }

  /**
   * Останавливает мониторинг
   */
  async stopGroupMonitoring(): Promise<{ success: boolean; message: string }> {
    this.isMonitoring = false;
    KolsLogger.info('Мониторинг остановлен');
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

    KolsLogger.chat(`Группа добавлена: ${groupTitle}`);
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
    KolsLogger.info(`Автоответы: ${enabled ? 'включены' : 'выключены'}`);
  }

  get capabilityDescription(): string {
    return 'KOLS Telegram сервис - MTProto подключение и мониторинг сообщений';
  }

  /**
   * Возвращает текущее состояние сервиса
   */
  getState(): ServiceState {
    return this.state;
  }

  async stop(): Promise<void> {
    if (this.state === 'stopped') {
      KolsLogger.debug('KolsTelegramService: Уже остановлен');
      return;
    }

    KolsLogger.info('KolsTelegramService: Остановка...');

    // Останавливаем проактивное обучение
    if (this.proactiveService) {
      this.proactiveService.stopActivity();
    }

    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        KolsLogger.error('Ошибка при отключении клиента:', error);
      }
      this.client = null;
    }

    this.messageHandlers.clear();
    this.monitoredGroups.clear();
    this.state = 'stopped';

    KolsLogger.info('KolsTelegramService: Остановлен');
  }
}
