import { 
  ITelegramAdapter, 
  ITelegramConfig, 
  ISendMessageResult, 
  ITelegramMessage, 
  ITelegramDialog 
} from '../../types/telegram.types'

/**
 * MCP Adapter - Fallback #2 (STUB)
 *
 * @status STUB - Заглушка для будущей реализации
 * @future Планируется интеграция с MCP серверами Telegram
 * @see https://github.com/modelcontextprotocol для спецификации MCP
 */
export class McpAdapter implements ITelegramAdapter {
  private config: ITelegramConfig
  private connected: boolean = false
  private mcpServerUrl?: string

  constructor(config: ITelegramConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting via MCP...')
    // FUTURE: Реализовать подключение к MCP серверу согласно спецификации MCP
    this.connected = true
    console.log('✅ MCP connected (mock)')
  }

  async disconnect(): Promise<void> {
    this.connected = false
    console.log('🛑 MCP disconnected')
  }

  async sendMessage(chatId: string, message: string, replyTo?: number): Promise<ISendMessageResult> {
    if (!this.connected) {
      throw new Error('MCP not connected')
    }

    // FUTURE: Реализовать отправку сообщений через MCP API
    console.log(`📤 MCP: Send to ${chatId}: ${message}`)

    return {
      messageId: Math.floor(Math.random() * 1000000),
      date: Date.now(),
      chatId,
    }
  }

  async getHistory(chatId: string, limit: number): Promise<ITelegramMessage[]> {
    if (!this.connected) {
      throw new Error('MCP not connected')
    }

    // FUTURE: Реализовать получение истории через MCP API
    console.log(`📜 MCP: Get history from ${chatId}, limit: ${limit}`)

    return []
  }

  async getDialogs(limit: number): Promise<ITelegramDialog[]> {
    if (!this.connected) {
      throw new Error('MCP not connected')
    }

    // FUTURE: Реализовать получение диалогов через MCP API
    console.log(`📋 MCP: Get dialogs, limit: ${limit}`)

    return []
  }
}
