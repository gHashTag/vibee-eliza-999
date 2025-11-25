import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage, NewMessageEvent } from "telegram/events/index.js";
import {
  ITelegramAdapter,
  ITelegramConfig,
  ISendMessageResult,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser
} from '../../types/telegram.types'
import input from "input";

/**
 * MTProto Adapter (GramJS) - Primary Connection Strategy
 *
 * Преимущества:
 * - Полный userbot функционал
 * - Производительность <250ms
 * - TypeScript native
 * - Зрелая кодовая база (fork Telethon)
 *
 * Возможности:
 * - Прослушивание всех сообщений в реальном времени
 * - Доступ к ВСЕМ группам где аккаунт участник
 * - Реакция на триггерные слова
 * - Автоматические ответы
 */
export class MTProtoAdapter implements ITelegramAdapter {
    private client: TelegramClient;
    private config: ITelegramConfig;
    private session: StringSession;
    private messageHandlers: Set<(event: NewMessageEvent) => void> = new Set();

    constructor(config: ITelegramConfig) {
        this.config = config;
        this.session = new StringSession(config.session || "");
        this.client = new TelegramClient(this.session, config.apiId, config.apiHash, {
            connectionRetries: 5,
            deviceModel: "Desktop",
            appVersion: "1.0.0",
            systemVersion: "NodeJS",
            langCode: "en",
        });
    }

    async connect(): Promise<void> {
        console.log("🔗 Connecting to Telegram via MTProto...");

        try {
            // Если есть session string, используем его
            if (this.config.session) {
                console.log("🔑 Using existing session string");

                // Добавляем таймаут для подключения
                const connectPromise = this.client.connect();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('MTProto connection timeout after 10 seconds')), 10000);
                });

                await Promise.race([connectPromise, timeoutPromise]);
            } else {
                console.log("⚠️ No session string found, skipping auth (interactive mode not supported)");
                return;
            }

            console.log("✅ Connected to Telegram!");
            console.log("👤 User ID:", (await this.client.getMe()).id);

            // Настраиваем прослушивание всех сообщений
            this.setupMessageListener();
        } catch (error) {
            console.error("❌ MTProto connection failed:", error);
            console.log("⚠️ Telegram will be unavailable. Continuing without Telegram...");
            throw error;
        }
    }

    /**
     * Настройка прослушивания всех сообщений
     * ВАЖНО: Это позволяет читать ВСЕ сообщения во ВСЕХ группах где аккаунт участник
     */
    private setupMessageListener(): void {
        console.log('🎧 [MTProto] Setting up message listener...');

        // Добавляем обработчик для всех входящих сообщений
        this.client.addEventHandler(async (event: NewMessageEvent) => {
            console.log(`🔔 [MTProto] New message event received! Handlers count: ${this.messageHandlers.size}`);
            console.log(`📝 [MTProto] Message text: ${event.message.text || event.message.message}`);

            // Уведомляем всех подписчиков о новом сообщении
            if (this.messageHandlers.size === 0) {
                console.log('⚠️ [MTProto] No handlers registered yet!');
            }

            // Обогащаем event информацией о чате и отправителе
            // Создаем обертку с дополнительными данными
            const enrichedEvent = {
                originalEvent: event,
                message: event.message,
                // Извлекаем chatId из peerId
                chatId: undefined as string | undefined,
                chatTitle: 'Unknown Chat',
                chatUsername: undefined as string | undefined,
                senderId: undefined as string | undefined,
                senderUsername: undefined as string | undefined,
                senderFirstName: undefined as string | undefined,
                senderLastName: undefined as string | undefined,
            };

            try {
                const chat = await event.message.getChat();
                const sender = await event.message.getSender();

                // Извлекаем chatId из peerId
                const peerId = event.message.peerId;
                if (peerId) {
                    if (peerId.userId) enrichedEvent.chatId = peerId.userId.toString();
                    else if (peerId.chatId) enrichedEvent.chatId = peerId.chatId.toString();
                    else if (peerId.channelId) enrichedEvent.chatId = peerId.channelId.toString();
                }

                enrichedEvent.chatTitle = chat?.title || (chat as any)?.firstName || 'Private Chat';
                enrichedEvent.chatUsername = (chat as any)?.username;
                enrichedEvent.senderId = sender?.id?.toString() || 'unknown';
                enrichedEvent.senderUsername = (sender as any)?.username;
                enrichedEvent.senderFirstName = (sender as any)?.firstName;
                enrichedEvent.senderLastName = (sender as any)?.lastName;

                console.log(`💬 [MTProto] Chat: ${enrichedEvent.chatTitle} (${enrichedEvent.chatId}), From: ${enrichedEvent.senderFirstName} (${enrichedEvent.senderId})`);
            } catch (error) {
                console.error('⚠️ [MTProto] Failed to get chat/sender info:', error);
                // Устанавливаем базовые значения при ошибке
                if (!enrichedEvent.chatId) {
                    const peerId = event.message.peerId;
                    if (peerId) {
                        if (peerId.userId) enrichedEvent.chatId = peerId.userId.toString();
                        else if (peerId.chatId) enrichedEvent.chatId = peerId.chatId.toString();
                        else if (peerId.channelId) enrichedEvent.chatId = peerId.channelId.toString();
                        else enrichedEvent.chatId = 'unknown';
                    } else {
                        enrichedEvent.chatId = 'unknown';
                    }
                }
            }

            // Передаем обогащенное событие вместо оригинального
            this.messageHandlers.forEach(handler => {
                try {
                    console.log('📤 [MTProto] Calling handler...');
                    handler(enrichedEvent as any);
                } catch (error) {
                    console.error("❌ [MTProto] Error in message handler:", error);
                }
            });
        }, new NewMessage({}));

        console.log('✅ [MTProto] Message listener configured');
    }

    /**
     * Подписка на сообщения (вызывается из TelegramService)
     */
    onMessage(handler: (event: NewMessageEvent) => void): void {
        this.messageHandlers.add(handler);
        console.log(`📨 New message handler registered. Total handlers: ${this.messageHandlers.size}`);
    }

    /**
     * Отписка от сообщений
     */
    offMessage(handler: (event: NewMessageEvent) => void): void {
        this.messageHandlers.delete(handler);
        console.log(`📨 Message handler removed. Total handlers: ${this.messageHandlers.size}`);
    }

    async disconnect(): Promise<void> {
        await this.client.disconnect();
        console.log("🔌 Disconnected from Telegram");
    }

  async sendMessage(chatId: string, message: string, replyTo?: number): Promise<ISendMessageResult> {
    const result = await this.client.sendMessage(chatId, { 
      message,
      replyTo,
    })
    
    return {
      messageId: result.id,
      date: result.date,
      chatId: chatId,
    }
  }

  async getHistory(chatId: string, limit: number): Promise<ITelegramMessage[]> {
    const messages = await this.client.getMessages(chatId, { limit })
    
    return messages.map(msg => ({
      id: msg.id,
      text: msg.text || '',
      sender: msg.senderId?.toString() || 'unknown',
      date: msg.date,
      chatId: chatId,
    }))
  }

  async getDialogs(limit: number): Promise<ITelegramDialog[]> {
    const dialogs = await this.client.getDialogs({ limit })

    return dialogs.map(dialog => ({
      id: dialog.id.toString(),
      name: dialog.title || dialog.name || 'Unknown',
      type: dialog.isUser ? 'private' : dialog.isChannel ? 'channel' : dialog.isGroup ? 'group' : 'unknown',
      unreadCount: dialog.unreadCount,
    }))
  }
  
  getClient(): TelegramClient {
    return this.client
  }
}
