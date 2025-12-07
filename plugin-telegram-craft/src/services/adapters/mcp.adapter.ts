/**
 * MCP Adapter
 *
 * Реализация ITelegramAdapter через MCP Server (Fallback #2)
 * Используется когда MTProto и Bot API недоступны
 */
import {
  ITelegramAdapter,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
} from '../../types/telegram.types'

export class McpAdapter implements ITelegramAdapter {
  private connected = false
  private messageHandler: ((message: ITelegramMessage) => void) | null = null

  constructor(private mcpServerUrl: string) {}

  async connect(): Promise<boolean> {
    // MCP Server connection
    try {
      const response = await fetch(`${this.mcpServerUrl}/health`)
      this.connected = response.ok
      return this.connected
    } catch {
      console.warn('[McpAdapter] MCP Server not available')
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
    if (!this.connected) {
      return { success: false, error: 'Not connected to MCP Server' }
    }

    try {
      const response = await fetch(`${this.mcpServerUrl}/telegram/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text }),
      })
      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getDialogs(limit = 20): Promise<ITelegramDialog[]> {
    if (!this.connected) return []

    try {
      const response = await fetch(`${this.mcpServerUrl}/telegram/dialogs?limit=${limit}`)
      const data = await response.json()
      return data.dialogs || []
    } catch {
      return []
    }
  }

  onMessage(handler: (message: ITelegramMessage) => void): void {
    this.messageHandler = handler
    // In real implementation, this would set up WebSocket or SSE connection
    console.warn('[McpAdapter] Message handling requires WebSocket setup')
  }

  async getMe(): Promise<ITelegramUser | null> {
    if (!this.connected) return null

    try {
      const response = await fetch(`${this.mcpServerUrl}/telegram/me`)
      const data = await response.json()
      return data.user || null
    } catch {
      return null
    }
  }
}
