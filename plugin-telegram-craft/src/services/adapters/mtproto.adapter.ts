// @ts-nocheck
/**
 * MTProto Adapter
 *
 * Реализация ITelegramAdapter через GramJS (MTProto)
 */
import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'
import {
  ITelegramAdapter,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
} from '../../types/telegram.types'

export class MTProtoAdapter implements ITelegramAdapter {
  private client: TelegramClient | null = null
  private messageHandler: ((message: ITelegramMessage) => void) | null = null
  private connected = false

  constructor(
    private apiId: number,
    private apiHash: string,
    private sessionString?: string
  ) {}

  async connect(): Promise<boolean> {
    try {
      const session = new StringSession(this.sessionString || '')
      this.client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      })

      await this.client.connect()
      this.connected = true

      // Setup message handler
      if (this.messageHandler) {
        this.client.addEventHandler(
          (event: Api.TypeUpdate) => {
            if (event instanceof Api.UpdateNewMessage) {
              const msg = event.message
              if (msg instanceof Api.Message) {
                this.messageHandler?.({
                  id: msg.id,
                  chatId: msg.peerId?.toString() || '',
                  text: msg.message || '',
                  date: new Date(msg.date * 1000),
                  fromId: msg.fromId?.toString(),
                })
              }
            }
          }
        )
      }

      return true
    } catch (error) {
      console.error('[MTProtoAdapter] Connection failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.connected = false
    }
  }

  isConnected(): boolean {
    return this.connected && !!this.client?.connected
  }

  async sendMessage(chatId: string | number, text: string): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: 'Not connected' }
    }

    try {
      const result = await this.client.sendMessage(chatId, { message: text })
      return { success: true, messageId: result.id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getDialogs(limit = 20): Promise<ITelegramDialog[]> {
    if (!this.client) return []

    try {
      const dialogs = await this.client.getDialogs({ limit })
      return dialogs.map((d: Api.Dialog) => ({
        id: d.id?.toString() || '',
        title: d.title || '',
        type: this.getDialogType(d),
        unreadCount: d.unreadCount || 0,
      }))
    } catch {
      return []
    }
  }

  private getDialogType(dialog: Api.Dialog): 'user' | 'group' | 'supergroup' | 'channel' {
    if (dialog.isUser) return 'user'
    if (dialog.isChannel) return 'channel'
    if (dialog.isGroup) return 'group'
    return 'group'
  }

  onMessage(handler: (message: ITelegramMessage) => void): void {
    this.messageHandler = handler
  }

  async getMe(): Promise<ITelegramUser | null> {
    if (!this.client) return null

    try {
      const me = await this.client.getMe()
      if (me instanceof Api.User) {
        return {
          id: me.id.toString(),
          firstName: me.firstName,
          lastName: me.lastName || undefined,
          username: me.username || undefined,
          phone: me.phone || undefined,
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Get the GramJS client instance for advanced operations
   */
  getClient(): TelegramClient | null {
    return this.client
  }
}
