/**
 * Telegram Adapter Interface
 *
 * Универсальный интерфейс для всех типов подключений к Telegram
 */

export interface ITelegramConfig {
  apiId: number
  apiHash: string
  session?: string
  botToken?: string
  strategy?: 'mtproto' | 'botapi' | 'mcp'
}

export interface ITelegramMessage {
  id: number
  text: string
  sender: string
  date: number
  chatId?: string
}

export interface ITelegramDialog {
  id: string
  name: string
  type?: 'private' | 'group' | 'channel' | 'unknown'
  unreadCount: number
  lastMessage?: ITelegramMessage
}

export interface ITelegramUser {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface ISendMessageResult {
  messageId: number
  date: number
  chatId?: string
}

/**
 * Основной интерфейс адаптера Telegram
 *
 * Поддерживает:
 * - MTProto (GramJS) - полный userbot функционал
 * - Bot API - ограниченный бот функционал
 * - MCP - стандартизированный протокол
 */
export interface ITelegramAdapter {
  /**
   * Подключение к Telegram
   */
  connect(): Promise<void>

  /**
   * Отключение от Telegram
   */
  disconnect(): Promise<void>

  /**
   * Отправка сообщения
   */
  sendMessage(
    chatId: string,
    message: string,
    replyTo?: number
  ): Promise<ISendMessageResult>

  /**
   * Получение истории сообщений
   */
  getHistory(
    chatId: string,
    limit: number
  ): Promise<ITelegramMessage[]>

  /**
   * Получение списка диалогов
   */
  getDialogs(limit: number): Promise<ITelegramDialog[]>

  /**
   * Получение информации о пользователе
   */
  getUser?(userId: string): Promise<ITelegramUser>

  /**
   * Присоединение к чату
   */
  joinChat?(chatId: string): Promise<void>

  /**
   * Пересылка сообщения
   */
  forwardMessage?(
    fromChatId: string,
    toChatId: string,
    messageId: number
  ): Promise<ISendMessageResult>

  /**
   * Подписка на новые сообщения (для MTProto адаптера)
   */
  onMessage?(handler: (event: any) => void): void

  /**
   * Отписка от сообщений
   */
  offMessage?(handler: (event: any) => void): void

  /**
   * Получение клиента (для MTProto адаптера)
   */
  getClient?(): any
}

