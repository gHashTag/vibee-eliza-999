/**
 * Telegram Types
 *
 * Интерфейсы для работы с Telegram адаптерами
 */

export interface ITelegramMessage {
  id: number
  chatId: string | number
  text: string
  date: Date
  fromId?: string | number
  fromName?: string
  replyToMsgId?: number
}

export interface ITelegramDialog {
  id: string | number
  title: string
  type: 'user' | 'group' | 'supergroup' | 'channel'
  unreadCount?: number
  lastMessage?: ITelegramMessage
}

export interface ITelegramUser {
  id: string | number
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
}

export interface ISendMessageResult {
  success: boolean
  messageId?: number
  error?: string
}

/**
 * Telegram Adapter Interface
 *
 * Единый интерфейс для разных стратегий подключения к Telegram
 */
export interface ITelegramAdapter {
  /**
   * Подключение к Telegram
   */
  connect(): Promise<boolean>

  /**
   * Отключение от Telegram
   */
  disconnect(): Promise<void>

  /**
   * Проверка соединения
   */
  isConnected(): boolean

  /**
   * Отправка сообщения
   */
  sendMessage(chatId: string | number, text: string): Promise<ISendMessageResult>

  /**
   * Получение диалогов
   */
  getDialogs(limit?: number): Promise<ITelegramDialog[]>

  /**
   * Подписка на новые сообщения
   */
  onMessage(handler: (message: ITelegramMessage) => void): void

  /**
   * Получение информации о пользователе
   */
  getMe(): Promise<ITelegramUser | null>
}
