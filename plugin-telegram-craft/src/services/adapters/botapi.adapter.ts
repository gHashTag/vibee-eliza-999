/**
 * Bot API Adapter
 *
 * Реализация ITelegramAdapter через Bot API (Fallback #1)
 * Используется когда MTProto недоступен
 */
import {
  ITelegramAdapter,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
} from '../../types/telegram.types'

export class BotApiAdapter implements ITelegramAdapter {
  private connected = false
  private messageHandler: ((message: ITelegramMessage) => void) | null = null

  constructor(private botToken: string) {}

  async connect(): Promise<boolean> {
    // Bot API doesn't require persistent connection
    // Just validate the token
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      this.connected = data.ok === true
      return this.connected
    } catch {
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async sendMessage(chatId: string | number, text: string): Promise<ISendMessageResult> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      const data = await response.json()
      if (data.ok) {
        return { success: true, messageId: data.result.message_id }
      }
      return { success: false, error: data.description }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getDialogs(_limit = 20): Promise<ITelegramDialog[]> {
    // Bot API doesn't support getting dialogs list
    // This would need to be implemented via getUpdates or webhook
    console.warn('[BotApiAdapter] getDialogs not supported in Bot API mode')
    return []
  }

  onMessage(handler: (message: ITelegramMessage) => void): void {
    this.messageHandler = handler
    // In real implementation, this would set up long polling or webhook
    console.warn('[BotApiAdapter] Message handling requires webhook setup')
  }

  async getMe(): Promise<ITelegramUser | null> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      if (data.ok) {
        return {
          id: data.result.id,
          firstName: data.result.first_name,
          lastName: data.result.last_name,
          username: data.result.username,
        }
      }
      return null
    } catch {
      return null
    }
  }
}
