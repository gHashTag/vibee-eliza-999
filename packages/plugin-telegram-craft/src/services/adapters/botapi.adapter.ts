import { Telegraf } from 'telegraf'
import { 
  ITelegramAdapter, 
  ITelegramConfig, 
  ISendMessageResult, 
  ITelegramMessage, 
  ITelegramDialog 
} from '../../types/telegram.types'

/**
 * Bot API Adapter (Telegraf) - Fallback #1
 * 
 * Ограничения:
 * - ❌ НЕ поддерживает userbot функции
 * - ❌ НЕ может читать историю чужих чатов
 * - ✅ Официальная поддержка Telegram
 * - ✅ Стабильный API
 */
export class BotApiAdapter implements ITelegramAdapter {
  private bot: Telegraf | null = null
  private config: ITelegramConfig

  constructor(config: ITelegramConfig) {
    this.config = config
    
    if (!config.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN required for Bot API')
    }
    
    this.bot = new Telegraf(config.botToken)
  }

  async connect(): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not initialized')
    }

    console.log('🤖 Connecting via Bot API...')

    try {
      // Проверка подключения
      const me = await this.bot.telegram.getMe()
      console.log(`✅ Bot API connected as @${me.username}`)
    } catch (error) {
      console.error('❌ Bot API connection failed:', error)
      throw new Error(`Failed to connect to Telegram Bot API: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop()
      console.log('🛑 Bot API disconnected')
    }
  }

  async sendMessage(chatId: string, message: string, replyTo?: number): Promise<ISendMessageResult> {
    if (!this.bot) {
      throw new Error('Bot not connected')
    }
    
    const options = replyTo ? { reply_parameters: { message_id: replyTo } } : {}
    
    const result = await this.bot.telegram.sendMessage(chatId, message, options)
    
    return {
      messageId: result.message_id,
      date: result.date,
      chatId: chatId,
    }
  }

  async getHistory(chatId: string, limit: number): Promise<ITelegramMessage[]> {
    // ⚠️ Bot API НЕ ПОДДЕРЖИВАЕТ чтение истории чужих чатов
    console.warn('⚠️ Bot API does not support reading message history')
    throw new Error('getHistory not supported by Bot API - use MTProto for userbot features')
  }

  async getDialogs(limit: number): Promise<ITelegramDialog[]> {
    // ⚠️ Bot API НЕ ПОДДЕРЖИВАЕТ получение списка диалогов
    console.warn('⚠️ Bot API does not support getting dialogs list')
    throw new Error('getDialogs not supported by Bot API - use MTProto for userbot features')
  }
}
