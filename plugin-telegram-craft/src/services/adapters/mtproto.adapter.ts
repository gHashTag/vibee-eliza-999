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
  ITelegramMedia,
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

  /**
   * Извлечение медиа из сообщения GramJS
   * Скачивает фото и конвертирует в base64 data URL
   */
  private async extractMedia(msg: Api.Message): Promise<ITelegramMedia[] | undefined> {
    console.log(`🔍 [MTProto] extractMedia called, hasMedia: ${!!msg.media}, mediaType: ${msg.media?.className || 'none'}`)

    if (!msg.media || !this.client) return undefined

    const media: ITelegramMedia[] = []

    try {
      // Обработка фото
      if (msg.media instanceof Api.MessageMediaPhoto) {
        const photo = msg.media.photo
        if (photo instanceof Api.Photo) {
          console.log(`📷 [MTProto] Скачиваю фото id=${photo.id}...`)

          // Скачиваем фото в буфер
          const buffer = await this.client.downloadMedia(msg.media, {})
          if (buffer) {
            // Конвертируем в base64 data URL
            const base64 = Buffer.from(buffer).toString('base64')
            const mimeType = 'image/jpeg' // Telegram обычно отдаёт JPEG

            media.push({
              type: 'photo',
              url: `data:${mimeType};base64,${base64}`,
              fileId: photo.id.toString(),
              mimeType,
              // Берём размеры из самого большого варианта фото
              width: photo.sizes?.reduce((max: any, size: any) =>
                (size.w || 0) > (max.w || 0) ? size : max, { w: 0, h: 0 }
              )?.w,
              height: photo.sizes?.reduce((max: any, size: any) =>
                (size.h || 0) > (max.h || 0) ? size : max, { w: 0, h: 0 }
              )?.h,
            })

            console.log(`✅ [MTProto] Фото скачано, размер base64: ${base64.length} символов`)
          }
        }
      }

      // Обработка документов (включая GIF, видео как документы)
      if (msg.media instanceof Api.MessageMediaDocument) {
        const doc = msg.media.document
        if (doc instanceof Api.Document) {
          const mimeType = doc.mimeType || 'application/octet-stream'

          // Определяем тип по MIME
          let type: ITelegramMedia['type'] = 'document'
          if (mimeType.startsWith('image/')) type = 'photo'
          if (mimeType.startsWith('video/')) type = 'video'
          if (mimeType.startsWith('audio/')) type = 'audio'
          if (mimeType === 'image/webp') type = 'sticker'

          // Для изображений — скачиваем
          if (type === 'photo' || mimeType.startsWith('image/')) {
            console.log(`📄 [MTProto] Скачиваю документ-изображение id=${doc.id}...`)

            const buffer = await this.client.downloadMedia(msg.media, {})
            if (buffer) {
              const base64 = Buffer.from(buffer).toString('base64')
              media.push({
                type: 'photo',
                url: `data:${mimeType};base64,${base64}`,
                fileId: doc.id.toString(),
                mimeType,
                fileSize: Number(doc.size),
              })
              console.log(`✅ [MTProto] Документ скачан`)
            }
          } else {
            // Для остальных — только метаданные (без скачивания)
            media.push({
              type,
              fileId: doc.id.toString(),
              mimeType,
              fileSize: Number(doc.size),
              fileName: doc.attributes?.find((a: any) => a.fileName)?.fileName,
            })
          }
        }
      }
    } catch (error) {
      console.error('[MTProto] Ошибка извлечения медиа:', error)
    }

    return media.length > 0 ? media : undefined
  }

  /**
   * Извлечение медиа из reply сообщения
   */
  private async extractReplyMedia(msg: Api.Message): Promise<ITelegramMedia[] | undefined> {
    if (!msg.replyTo || !this.client) return undefined

    try {
      const replyToMsgId = msg.replyTo.replyToMsgId
      if (!replyToMsgId) return undefined

      // Получаем оригинальное сообщение
      const peerId = msg.peerId
      const messages = await this.client.getMessages(peerId, { ids: [replyToMsgId] })

      if (messages && messages.length > 0 && messages[0] instanceof Api.Message) {
        return this.extractMedia(messages[0])
      }
    } catch (error) {
      console.error('[MTProto] Ошибка извлечения reply медиа:', error)
    }

    return undefined
  }

  async connect(): Promise<boolean> {
    try {
      const session = new StringSession(this.sessionString || '')
      this.client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      })

      await this.client.connect()
      this.connected = true
      // Handler регистрируется в onMessage(), не здесь (чтобы избежать двойной обработки)

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
        async (event: Api.TypeUpdate) => {
          // Логируем ВСЕ события для отладки
          const eventName = event.className || 'unknown'
          const skipEvents = ['UpdateUserStatus', 'UpdateUserTyping', 'UpdateReadHistoryInbox', 'UpdateReadHistoryOutbox', 'UpdateReadChannelInbox', 'UpdateWebPage', 'UpdateMessagePoll', 'UpdateDeleteChannelMessages', 'UpdateEditChannelMessage']

          // DEBUG: Логируем ВСЁ кроме skipEvents
          if (!skipEvents.includes(eventName)) {
            console.log(`[MTProtoAdapter] 📨 Event: ${eventName}`)
          }

          if (!eventName || skipEvents.includes(eventName)) {
            return
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

              // Извлекаем медиа и reply медиа
              const media = await this.extractMedia(msg)
              const replyToMedia = await this.extractReplyMedia(msg)
              const replyToMsgId = msg.replyTo?.replyToMsgId

              const hasMedia = media && media.length > 0
              console.log(`📩 [Личный/Группа] chatId=${chatId} от ${fromId}: "${msg.message?.substring(0, 60) || '...'}"${hasMedia ? ` [+${media.length} медиа]` : ''}`)

              this.messageHandler?.({
                id: msg.id,
                chatId,
                text: msg.message || '',
                date: new Date(msg.date * 1000),
                fromId,
                replyToMsgId,
                media,
                replyToMedia,
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
              let chatTitle = ''
              if (peerId instanceof Api.PeerChannel) {
                chatId = peerId.channelId.toString()
                // Получаем название чата
                try {
                  const chat = await this.client?.getEntity(peerId)
                  if (chat && 'title' in chat) {
                    chatTitle = (chat as any).title || ''
                  }
                } catch { /* ignore */ }
              } else if (peerId instanceof Api.PeerChat) {
                chatId = peerId.chatId.toString()
              } else if (peerId instanceof Api.PeerUser) {
                chatId = peerId.userId.toString()
              }

              // fromId тоже может быть объектом - получаем информацию о пользователе
              let fromId = ''
              let fromFirstName = ''
              let fromLastName = ''
              let fromUsername = ''
              if (msg.fromId instanceof Api.PeerUser) {
                fromId = msg.fromId.userId.toString()
                // Получаем информацию о пользователе
                try {
                  const user = await this.client?.getEntity(msg.fromId)
                  if (user && user instanceof Api.User) {
                    fromFirstName = user.firstName || ''
                    fromLastName = user.lastName || ''
                    fromUsername = user.username || ''
                  }
                } catch { /* ignore */ }
              } else if (msg.fromId instanceof Api.PeerChannel) {
                fromId = msg.fromId.channelId.toString()
              }

              // Извлекаем медиа и reply медиа
              const media = await this.extractMedia(msg)
              const replyToMedia = await this.extractReplyMedia(msg)
              const replyToMsgId = msg.replyTo?.replyToMsgId

              const displayName = fromFirstName || fromUsername || fromId
              const hasMedia = media && media.length > 0
              console.log(`📩 [Канал/Супергруппа] chatId=${chatId} от ${displayName}: "${msg.message?.substring(0, 60) || '...'}"${hasMedia ? ` [+${media.length} медиа]` : ''}`)
              this.messageHandler?.({
                id: msg.id,
                chatId,
                chatTitle,
                text: msg.message || '',
                date: new Date(msg.date * 1000),
                fromId,
                fromFirstName,
                fromLastName,
                fromUsername,
                replyToMsgId,
                media,
                replyToMedia,
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

  /**
   * Get messages from a chat
   * @param chatId - ID чата
   * @param limit - максимальное количество сообщений (default: 100)
   * @returns список сообщений
   */
  async getMessages(chatId: string, limit: number = 100): Promise<ITelegramMessage[]> {
    if (!this.client) {
      console.error('[MTProtoAdapter] getMessages: Not connected')
      return []
    }

    try {
      console.log(`📜 [MTProtoAdapter] Getting messages for chat: ${chatId}, limit: ${limit}`)

      // Ищем чат в диалогах по ID
      const dialogs = await this.client.getDialogs({ limit: 100 })
      let foundEntity: Api.TypeEntity | null = null

      for (const dialog of dialogs) {
        let dialogId = ''
        if (dialog.entity instanceof Api.Chat) {
          dialogId = dialog.entity.id.toString()
        } else if (dialog.entity instanceof Api.Channel) {
          dialogId = dialog.entity.id.toString()
        } else if (dialog.entity instanceof Api.User) {
          dialogId = dialog.entity.id.toString()
        }

        if (dialogId === chatId) {
          foundEntity = dialog.entity
          console.log(`✅ [MTProtoAdapter] Found chat: ${dialog.title} (ID: ${dialogId})`)
          break
        }
      }

      if (!foundEntity) {
        console.error(`[MTProtoAdapter] Chat ${chatId} not found in dialogs`)
        return []
      }

      // Получаем сообщения через GramJS
      const messages = await this.client.getMessages(foundEntity, {
        limit,
      })

      console.log(`✅ [MTProtoAdapter] Retrieved ${messages.length} messages from chat ${chatId}`)

      // Конвертируем в ITelegramMessage
      const result: ITelegramMessage[] = []
      for (const msg of messages) {
        if (msg instanceof Api.Message && msg.message) {
          // Извлекаем chatId из peerId
          let msgChatId = chatId
          const peerId = msg.peerId
          if (peerId instanceof Api.PeerChannel) {
            msgChatId = peerId.channelId.toString()
          } else if (peerId instanceof Api.PeerChat) {
            msgChatId = peerId.chatId.toString()
          } else if (peerId instanceof Api.PeerUser) {
            msgChatId = peerId.userId.toString()
          }

          // Извлекаем fromId
          let fromId = ''
          let fromFirstName = ''
          let fromLastName = ''
          let fromUsername = ''
          if (msg.fromId instanceof Api.PeerUser) {
            fromId = msg.fromId.userId.toString()
            // Пробуем получить информацию о пользователе
            try {
              const user = await this.client?.getEntity(msg.fromId)
              if (user && user instanceof Api.User) {
                fromFirstName = user.firstName || ''
                fromLastName = user.lastName || ''
                fromUsername = user.username || ''
              }
            } catch { /* ignore */ }
          } else if (msg.fromId instanceof Api.PeerChannel) {
            fromId = msg.fromId.channelId.toString()
          }

          result.push({
            id: msg.id,
            chatId: msgChatId,
            text: msg.message,
            date: new Date(msg.date * 1000),
            fromId,
            fromFirstName: fromFirstName || undefined,
            fromLastName: fromLastName || undefined,
            fromUsername: fromUsername || undefined,
          })
        }
      }

      return result
    } catch (error) {
      console.error(`[MTProtoAdapter] getMessages error:`, error)
      return []
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

  /**
   * Get members of a group/supergroup/channel
   * @param groupId - ID группы
   * @param limit - максимальное количество участников (default: 50)
   * @returns список пользователей
   */
  async getGroupMembers(groupId: string, limit: number = 50): Promise<ITelegramUser[]> {
    if (!this.client) {
      console.error('[MTProtoAdapter] getGroupMembers: Not connected')
      return []
    }

    try {
      console.log(`📋 [MTProtoAdapter] Getting members for group: ${groupId}`)

      // ГЛАВНАЯ СТРАТЕГИЯ: Ищем группу в диалогах по ID
      // Это работает для всех типов: group, supergroup, channel
      const dialogs = await this.client.getDialogs({ limit: 100 })
      let foundEntity: Api.TypeEntity | null = null
      let foundType = ''

      console.log(`🔍 [MTProtoAdapter] Searching for groupId=${groupId} in ${dialogs.length} dialogs`)

      for (const dialog of dialogs) {
        // Извлекаем ID в зависимости от типа entity
        let dialogId = ''
        if (dialog.entity instanceof Api.Chat) {
          dialogId = dialog.entity.id.toString()
        } else if (dialog.entity instanceof Api.Channel) {
          dialogId = dialog.entity.id.toString()
        } else if (dialog.entity instanceof Api.User) {
          dialogId = dialog.entity.id.toString()
        }

        // Сравниваем ID напрямую
        if (dialogId === groupId) {
          foundEntity = dialog.entity
          if (dialog.entity instanceof Api.Chat) {
            foundType = 'group'
          } else if (dialog.entity instanceof Api.Channel) {
            foundType = dialog.entity.megagroup ? 'supergroup' : 'channel'
          }
          console.log(`✅ [MTProtoAdapter] Found ${foundType}: ${dialog.title} (ID: ${dialogId})`)
          break
        }
      }

      if (!foundEntity) {
        console.error(`[MTProtoAdapter] Group ${groupId} not found in dialogs (searched ${dialogs.length} dialogs)`)
        return []
      }

      // Получаем участников - метод работает и для group, и для supergroup
      const participants = await this.client.getParticipants(foundEntity, {
        limit,
      })

      console.log(`✅ [MTProtoAdapter] Found ${participants.length} members in ${foundType} ${groupId}`)

      // Конвертируем в ITelegramUser
      return participants
        .filter((p): p is Api.User => p instanceof Api.User && !p.bot) // Исключаем ботов
        .map((user) => ({
          id: user.id.toString(),
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          username: user.username || undefined,
          phone: user.phone || undefined,
        }))
    } catch (error) {
      console.error(`[MTProtoAdapter] getGroupMembers error:`, error)
      return []
    }
  }

  /**
   * Download user's profile photo
   * @param userId - ID пользователя
   * @returns Buffer with photo data or null if no photo
   */
  async downloadProfilePhoto(userId: string): Promise<Buffer | null> {
    if (!this.client) {
      console.error('[MTProtoAdapter] downloadProfilePhoto: Not connected')
      return null
    }

    try {
      const userIdNum = parseInt(userId, 10)
      console.log(`📸 [MTProtoAdapter] Downloading profile photo for user: ${userId}`)

      // Получаем entity пользователя
      const user = await this.client.getEntity(userIdNum)

      if (!(user instanceof Api.User)) {
        console.log(`[MTProtoAdapter] Entity ${userId} is not a user`)
        return null
      }

      // Скачиваем фото профиля
      const photoBuffer = await this.client.downloadProfilePhoto(user, {
        isBig: false, // Маленькая версия для превью
      })

      if (!photoBuffer) {
        console.log(`[MTProtoAdapter] User ${userId} has no profile photo`)
        return null
      }

      // GramJS может вернуть string (path) или Buffer
      if (typeof photoBuffer === 'string') {
        console.log(`[MTProtoAdapter] Photo saved to path, reading...`)
        // Если вернулся path, читаем файл
        const fs = await import('fs')
        return fs.readFileSync(photoBuffer)
      }

      console.log(`✅ [MTProtoAdapter] Downloaded profile photo for user ${userId} (${photoBuffer.length} bytes)`)
      return photoBuffer
    } catch (error) {
      console.error(`[MTProtoAdapter] downloadProfilePhoto error:`, error)
      return null
    }
  }
}
