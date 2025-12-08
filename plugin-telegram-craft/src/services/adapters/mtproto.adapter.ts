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

interface MTProtoConfig {
  apiId: number
  apiHash: string
  session?: string
}

export class MTProtoAdapter implements ITelegramAdapter {
  private client: TelegramClient | null = null
  private messageHandler: ((message: ITelegramMessage) => void) | null = null
  private connected = false
  private apiId: number
  private apiHash: string
  private sessionString?: string

  constructor(config: MTProtoConfig) {
    this.apiId = config.apiId
    this.apiHash = config.apiHash
    this.sessionString = config.session
  }

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

  async sendMessage(chatId: string | number, text: string, replyTo?: number): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: 'Not connected' }
    }

    try {
      const chatIdStr = String(chatId)
      const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId

      console.log(`📤 [MTProtoAdapter] sendMessage to chatId: ${chatIdStr} (num: ${chatIdNum})`)

      // Стратегия 1: Пробуем использовать getInputEntity для получения правильного peer
      try {
        // GramJS может резолвить ID автоматически если чат есть в кэше
        const result = await this.client.sendMessage(chatIdNum, {
          message: text,
          replyTo: replyTo
        })
        console.log(`✅ [MTProtoAdapter] Message sent successfully (direct ID)`)
        return { success: true, messageId: result.id }
      } catch (firstError) {
        console.log(`⚠️ [MTProtoAdapter] Direct ID failed, trying -100 prefix...`)

        // Стратегия 2: Для channels/supergroups формат -100XXXXXXXXXX
        // Правильная формула: -1001144640997 = -(1001144640997)
        const channelFullId = BigInt(`-100${chatIdStr}`)
        console.log(`📤 [MTProtoAdapter] Trying channel format: -100${chatIdStr} = ${channelFullId}`)

        try {
          const result = await this.client.sendMessage(channelFullId, {
            message: text,
            replyTo: replyTo
          })
          console.log(`✅ [MTProtoAdapter] Message sent successfully (channel format)`)
          return { success: true, messageId: result.id }
        } catch (secondError) {
          console.log(`⚠️ [MTProtoAdapter] Channel format failed, trying getDialogs lookup...`)

          // Стратегия 3: Ищем чат в диалогах и используем его entity
          try {
            const dialogs = await this.client.getDialogs({ limit: 100 })
            for (const dialog of dialogs) {
              const dialogId = dialog.id?.toString()
              if (dialogId === chatIdStr || dialogId === `-100${chatIdStr}`) {
                console.log(`📤 [MTProtoAdapter] Found dialog: ${dialog.title} (${dialogId})`)
                const result = await this.client.sendMessage(dialog.entity, {
                  message: text,
                  replyTo: replyTo
                })
                console.log(`✅ [MTProtoAdapter] Message sent successfully (via dialog entity)`)
                return { success: true, messageId: result.id }
              }
            }
            throw new Error(`Chat ${chatIdStr} not found in dialogs`)
          } catch (thirdError) {
            console.error(`❌ [MTProtoAdapter] All strategies failed:`, thirdError)
            return { success: false, error: String(thirdError) }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [MTProtoAdapter] sendMessage error:`, error)
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

    // Если клиент уже подключен, регистрируем handler сразу
    if (this.client && this.connected) {
      console.log('[MTProtoAdapter] Registering message handler (client already connected)')
      this.client.addEventHandler(
        (event: Api.TypeUpdate) => {
          // Логируем только важные события (сообщения), пропускаем шум
          const eventName = event.className || 'unknown'
          const skipEvents = ['UpdateUserStatus', 'UpdateUserTyping', 'UpdateReadHistoryInbox', 'UpdateReadHistoryOutbox', 'UpdateReadChannelInbox', 'UpdateWebPage', 'UpdateMessagePoll']

          if (!eventName || skipEvents.includes(eventName)) {
            // Тихо пропускаем служебные события
            return
          }

          // Логируем только события с сообщениями
          if (eventName.includes('Message') || eventName.includes('Short')) {
            console.log(`[MTProtoAdapter] 📨 Event: ${eventName}`)
          }

          // Обрабатываем UpdateNewMessage (личные чаты, обычные группы)
          if (event instanceof Api.UpdateNewMessage) {
            const msg = event.message
            if (msg instanceof Api.Message) {
              // peerId может быть PeerChannel, PeerChat, PeerUser - извлекаем ID
              const peerId = msg.peerId
              let chatId = ''
              if (peerId instanceof Api.PeerChannel) {
                chatId = peerId.channelId.toString()
              } else if (peerId instanceof Api.PeerChat) {
                chatId = peerId.chatId.toString()
              } else if (peerId instanceof Api.PeerUser) {
                chatId = peerId.userId.toString()
              }

              // fromId тоже может быть объектом
              let fromId = ''
              if (msg.fromId instanceof Api.PeerUser) {
                fromId = msg.fromId.userId.toString()
              } else if (msg.fromId instanceof Api.PeerChannel) {
                fromId = msg.fromId.channelId.toString()
              }

              console.log(`📩 [Личный/Группа] chatId=${chatId} от ${fromId}: "${msg.message?.substring(0, 60) || '...'}"`)
              this.messageHandler?.({
                id: msg.id,
                chatId,
                text: msg.message || '',
                date: new Date(msg.date * 1000),
                fromId,
              })
            }
          }

          // Обрабатываем UpdateNewChannelMessage (супергруппы и каналы)
          if (event instanceof Api.UpdateNewChannelMessage) {
            const msg = event.message
            if (msg instanceof Api.Message) {
              // peerId может быть PeerChannel, PeerChat, PeerUser - извлекаем ID
              const peerId = msg.peerId
              let chatId = ''
              if (peerId instanceof Api.PeerChannel) {
                chatId = peerId.channelId.toString()
              } else if (peerId instanceof Api.PeerChat) {
                chatId = peerId.chatId.toString()
              } else if (peerId instanceof Api.PeerUser) {
                chatId = peerId.userId.toString()
              }

              // fromId тоже может быть объектом
              let fromId = ''
              if (msg.fromId instanceof Api.PeerUser) {
                fromId = msg.fromId.userId.toString()
              } else if (msg.fromId instanceof Api.PeerChannel) {
                fromId = msg.fromId.channelId.toString()
              }

              console.log(`📩 [Канал/Супергруппа] chatId=${chatId} от ${fromId}: "${msg.message?.substring(0, 60) || '...'}"`)
              this.messageHandler?.({
                id: msg.id,
                chatId,
                text: msg.message || '',
                date: new Date(msg.date * 1000),
                fromId,
              })
            }
          }

          // Обрабатываем UpdateShortMessage (личные сообщения в компактном формате)
          if (event instanceof Api.UpdateShortMessage) {
            console.log(`📩 [Личное] userId=${event.userId}: "${event.message?.substring(0, 60) || '...'}"`)
            this.messageHandler?.({
              id: event.id,
              chatId: event.userId.toString(),
              text: event.message || '',
              date: new Date(event.date * 1000),
              fromId: event.out ? undefined : event.userId.toString(),
            })
          }

          // Обрабатываем UpdateShortChatMessage (групповые сообщения в компактном формате)
          if (event instanceof Api.UpdateShortChatMessage) {
            console.log(`📩 [Группа] chatId=${event.chatId} от ${event.fromId}: "${event.message?.substring(0, 60) || '...'}"`)
            this.messageHandler?.({
              id: event.id,
              chatId: event.chatId.toString(),
              text: event.message || '',
              date: new Date(event.date * 1000),
              fromId: event.fromId.toString(),
            })
          }
        }
      )
    }
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
