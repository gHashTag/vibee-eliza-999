import { Service, IAgentRuntime, Memory, State, UUID, stringToUuid } from '@elizaos/core'
import { ITelegramAdapter, ISendMessageResult, ITelegramMessage, ITelegramDialog, ITelegramUser } from '../types/telegram.types'
import { MTProtoAdapter } from './adapters/mtproto.adapter'
import { BotApiAdapter } from './adapters/botapi.adapter'
import { McpAdapter } from './adapters/mcp.adapter'
import fs from 'node:fs'
import path from 'node:path'

// 🎨 ANSI Colors для красивого вывода
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',

  // Основные цвета
  cyan: '\x1b[36m',      // 🔵 Группы/чаты
  yellow: '\x1b[33m',    // 🟡 Имена пользователей
  white: '\x1b[37m',     // ⚪ Текст сообщений
  green: '\x1b[32m',     // 🟢 Успех
  red: '\x1b[31m',       // 🔴 Ошибки
  magenta: '\x1b[35m',   // 🟣 Метаданные
  blue: '\x1b[34m',      // 🔷 Системные сообщения
  gray: '\x1b[90m',      // ⚫ Вспомогательная инфо
}

// Утилиты для цветного текста
const colorize = {
  chat: (text: string) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
  user: (text: string) => `${colors.bright}${colors.yellow}${text}${colors.reset}`,
  message: (text: string) => `${colors.white}${text}${colors.reset}`,
  success: (text: string) => `${colors.green}${text}${colors.reset}`,
  error: (text: string) => `${colors.red}${text}${colors.reset}`,
  meta: (text: string) => `${colors.magenta}${text}${colors.reset}`,
  system: (text: string) => `${colors.blue}${text}${colors.reset}`,
  time: (text: string) => `${colors.gray}${text}${colors.reset}`,
}

/**
 * TelegramService - главный сервис для работы с Telegram
 * 
 * Использует Adapter Pattern для поддержки различных стратегий подключения:
 * - MTProto (GramJS) - Primary
 * - Bot API (Telegraf) - Fallback #1
 * - MCP Server - Fallback #2
 */
export class TelegramService extends Service {
  static serviceType = 'telegram-craft'

  serviceType = 'telegram-craft' // Instance property for compatibility

  /**
   * 🔑 Статический метод start() - требуется ElizaOS для регистрации сервиса
   *
   * ElizaOS вызывает этот метод при registerService(TelegramService)
   * Создает экземпляр, инициализирует и возвращает его
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    console.log('🚀 [TelegramService] static start() called')

    const instance = new TelegramService()
    await instance.initialize(runtime)

    console.log('✅ [TelegramService] static start() completed')
    return instance
  }

  /**
   * 🛑 Статический метод stop() - требуется ElizaOS
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [TelegramService] static stop() called')
    // Cleanup если нужно
  }

  private adapter: ITelegramAdapter | null = null
  private strategy: 'mtproto' | 'botapi' | 'mcp' = 'mtproto'
  private runtime: IAgentRuntime | null = null // 🔥 Для генерации ответов
  private autoReplyEnabled = true // Флаг автоответов (можно отключить)

  capabilityDescription = 'Telegram userbot управление через MTProto (GramJS) с fallback стратегиями'
  
  /**
   * Инициализация сервиса
   * Выбирает адаптер на основе TELEGRAM_STRATEGY
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log('🔧 [TelegramService] initialize() called')
    console.log('🔑 [TelegramService] Runtime received: ' + (runtime ? 'YES' : 'NO'))

    // 🔥 Сохраняем runtime для генерации ответов
    this.runtime = runtime
    console.log('✅ [TelegramService] Runtime saved!')

    this.strategy = (runtime.getSetting('TELEGRAM_STRATEGY') as any) || 'mtproto'

    console.log(`🔧 [TelegramService] Strategy: ${this.strategy}`)

    try {
      // Выбор адаптера на основе стратегии
      switch (this.strategy) {
        case 'mtproto':
          console.log('🔧 [TelegramService] Initializing MTProto adapter...')
          await this.initializeMTProto(runtime)
          console.log('✅ [TelegramService] MTProto adapter initialized')
          break

        case 'botapi':
          console.log('🔧 [TelegramService] Initializing BotAPI adapter...')
          await this.initializeBotApi(runtime)
          console.log('✅ [TelegramService] BotAPI adapter initialized')
          break

        case 'mcp':
          console.log('🔧 [TelegramService] Initializing MCP adapter...')
          await this.initializeMcp(runtime)
          console.log('✅ [TelegramService] MCP adapter initialized')
          break

        default:
          throw new Error(`Unknown Telegram strategy: ${this.strategy}`)
      }

      console.log(`✅ [TelegramService] Service initialized successfully with ${this.strategy}`)
      console.log(`✅ [TelegramService] Adapter is ${this.adapter ? 'SET' : 'NULL'}`)
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to initialize:`, error)
      throw error
    }
  }
  
  /**
   * Инициализация MTProto адаптера (Primary)
   */
  private async initializeMTProto(runtime: IAgentRuntime): Promise<void> {
    const apiId = runtime.getSetting('TELEGRAM_API_ID')
    const apiHash = runtime.getSetting('TELEGRAM_API_HASH')
    const session = runtime.getSetting('TELEGRAM_SESSION_STRING') || process.env.TELEGRAM_SESSION_STRING

    console.log(`🔧 [MTProto] API ID: ${apiId ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] API Hash: ${apiHash ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] Session: ${session ? '✅ SET' : '⚠️ OPTIONAL'}`)

    if (!apiId || !apiHash) {
      throw new Error('TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны для MTProto')
    }

    console.log('🔧 [MTProto] Creating adapter instance...')
    this.adapter = new MTProtoAdapter({
      apiId: parseInt(apiId),
      apiHash,
      session,
    })
    console.log('✅ [MTProto] Adapter instance created')
  }
  
  /**
   * Инициализация Bot API адаптера (Fallback #1)
   */
  private async initializeBotApi(runtime: IAgentRuntime): Promise<void> {
    const botToken = runtime.getSetting('TELEGRAM_BOT_TOKEN')
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN обязателен для Bot API')
    }
    
    this.adapter = new BotApiAdapter({
      apiId: 0, // Не используется в Bot API
      apiHash: '',
      botToken,
    })
  }
  
  /**
   * Инициализация MCP адаптера (Fallback #2)
   */
  private async initializeMcp(runtime: IAgentRuntime): Promise<void> {
    this.adapter = new McpAdapter({
      apiId: 0,
      apiHash: '',
    })
  }
  
  /**
   * Запуск сервиса - подключение к Telegram
   */
  async start(): Promise<void> {
    console.log('🚀 [TelegramService] start() called')

    // Если адаптер еще не инициализирован, инициализируем его
    if (!this.adapter) {
      console.log('⚠️ [TelegramService] Adapter not initialized, initializing now...')
      // Инициализация без runtime - используем process.env напрямую
      await this.initializeFromEnv()
    }

    if (!this.adapter) {
      throw new Error('Telegram adapter not initialized')
    }

    try {
      console.log('🚀 [TelegramService] Connecting adapter...')
      await this.adapter.connect()
      console.log('✅ [TelegramService] Telegram Service started successfully')

      // 🔥 АВТОЗАПУСК МОНИТОРИНГА
      console.log('🔥 [TelegramService] Auto-starting group monitoring...')
      const result = await this.startGroupMonitoring()
      if (result.success) {
        console.log('✅ [TelegramService] Group monitoring auto-started successfully')
      } else {
        console.error('⚠️ [TelegramService] Failed to auto-start monitoring:', result.error)
      }
    } catch (error) {
      console.error('❌ [TelegramService] Failed to start:', error)
      console.log('⚠️ [TelegramService] Telegram connection failed, but continuing without Telegram functionality...')

      // Не бросаем ошибку, чтобы агент мог продолжить работу без Telegram
      // throw error
    }
  }

  /**
   * Инициализация из переменных окружения (для случая когда initialize не вызван)
   */
  private async initializeFromEnv(): Promise<void> {
    const strategy = (process.env.TELEGRAM_STRATEGY as any) || 'mtproto'
    this.strategy = strategy

    console.log(`🔧 [TelegramService] Initializing from ENV with strategy: ${strategy}`)

    try {
      switch (strategy) {
        case 'mtproto':
          await this.initializeMTProtoFromEnv()
          break
        case 'botapi':
          await this.initializeBotApiFromEnv()
          break
        case 'mcp':
          await this.initializeMcpFromEnv()
          break
        default:
          throw new Error(`Unknown Telegram strategy: ${strategy}`)
      }

      console.log(`✅ [TelegramService] Initialized from ENV successfully`)
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to initialize from ENV:`, error)
      throw error
    }
  }

  /**
   * Инициализация MTProto из переменных окружения
   */
  private async initializeMTProtoFromEnv(): Promise<void> {
    const apiId = process.env.TELEGRAM_API_ID
    const apiHash = process.env.TELEGRAM_API_HASH
    const session = process.env.TELEGRAM_SESSION_STRING

    console.log(`🔧 [MTProto] API ID from ENV: ${apiId ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] API Hash from ENV: ${apiHash ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] Session from ENV: ${session ? '✅ SET' : '⚠️ OPTIONAL'}`)

    if (!apiId || !apiHash) {
      throw new Error('TELEGRAM_API_ID и TELEGRAM_API_HASH обязательны для MTProto')
    }

    console.log('🔧 [MTProto] Creating adapter instance from ENV...')
    this.adapter = new MTProtoAdapter({
      apiId: parseInt(apiId),
      apiHash,
      session,
    })
    console.log('✅ [MTProto] Adapter instance created from ENV')
  }

  /**
   * Инициализация Bot API из переменных окружения
   */
  private async initializeBotApiFromEnv(): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN обязателен для Bot API')
    }

    this.adapter = new BotApiAdapter({
      apiId: 0,
      apiHash: '',
      botToken,
    })
  }

  /**
   * Инициализация MCP из переменных окружения
   */
  private async initializeMcpFromEnv(): Promise<void> {
    this.adapter = new McpAdapter({
      apiId: 0,
      apiHash: '',
    })
  }
  
  /**
   * Остановка сервиса - отключение от Telegram
   */
  async stop(): Promise<void> {
    if (this.adapter) {
      try {
        await this.adapter.disconnect()
        console.log('🛑 Telegram Service stopped')
      } catch (error) {
        console.error('⚠️ Error stopping Telegram Service:', error)
      }
    }

    // 🔒 Сбрасываем флаг регистрации обработчика
    this.messageHandlerRegistered = false
    console.log('🔒 [TelegramService] Message handler registration flag reset')
  }
  
  /**
   * Публичные методы для использования в Actions
   */
  
  async sendMessage(
    chatId: string,
    message: string,
    replyTo?: number
  ): Promise<ISendMessageResult> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }

    // 🛡️ ФИЛЬТР: Проверяем разрешённую группу перед отправкой
    const allowedGroupId = process.env.ALLOWED_GROUP_ID
    if (allowedGroupId && chatId !== allowedGroupId) {
      console.log(`⛔ [TelegramService] БЛОКИРОВКА: Попытка написать в чужую группу: ${chatId} (разрешена только ${allowedGroupId})`)
      return {
        success: false,
        error: `Group ${chatId} is not allowed. Only ${allowedGroupId} is permitted.`
      }
    }

    return this.adapter.sendMessage(chatId, message, replyTo)
  }
  
  async getHistory(chatId: string, limit: number = 10): Promise<ITelegramMessage[]> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }
    
    return this.adapter.getHistory(chatId, limit)
  }
  
  async getDialogs(limit: number = 20): Promise<ITelegramDialog[]> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }
    
    return this.adapter.getDialogs(limit)
  }
  
  async getUser(userId: string): Promise<ITelegramUser | undefined> {
    if (!this.adapter || !this.adapter.getUser) {
      throw new Error('getUser not supported by current adapter')
    }
    
    return this.adapter.getUser(userId)
  }
  
  async joinChat(chatId: string): Promise<void> {
    if (!this.adapter || !this.adapter.joinChat) {
      throw new Error('joinChat not supported by current adapter')
    }
    
    return this.adapter.joinChat(chatId)
  }
  
  async forwardMessage(
    fromChatId: string,
    toChatId: string,
    messageId: number
  ): Promise<ISendMessageResult | undefined> {
    if (!this.adapter || !this.adapter.forwardMessage) {
      throw new Error('forwardMessage not supported by current adapter')
    }
    
    return this.adapter.forwardMessage(fromChatId, toChatId, messageId)
  }
  
  // ====================
  // Group Monitoring
  // ====================

  private isMonitoring = false
  private monitoredGroups: Map<string, { id: string; title: string; type: string }> = new Map()
  private messageHandlers: Set<(message: any) => void> = new Set()
  private totalMessages = 0
  private monitoringStartTime: Date | null = null

  // Callback для автоматической отправки сообщений в чат
  private liveFeedCallbacks: Set<(message: string) => void> = new Set()

  // Глобальный callback для отправки сообщений пользователям
  private messageDistributor: ((message: string) => void) | null = null
  private messageHandlerRegistered = false // 🔒 Защита от дублирования обработчиков

  /**
   * Установить distributor для отправки сообщений пользователям
   * Этот метод вызывается один раз при инициализации агента
   */
  setMessageDistributor(distributor: (message: string) => void): void {
    this.messageDistributor = distributor
    console.log(`📺 [TelegramService] Message distributor установлен`)
  }

  /**
   * Добавить callback для live feed (автоматическая отправка в чат)
   */
  addLiveFeedCallback(callback: (message: string) => void): void {
    this.liveFeedCallbacks.add(callback)
    console.log(`📺 [TelegramService] Live feed callback добавлен (всего: ${this.liveFeedCallbacks.size})`)
  }

  /**
   * Удалить callback для live feed
   */
  removeLiveFeedCallback(callback: (message: string) => void): void {
    this.liveFeedCallbacks.delete(callback)
    console.log(`📺 [TelegramService] Live feed callback удален (осталось: ${this.liveFeedCallbacks.size})`)
  }

  /**
   * Отправить сообщение через live feed
   */
  private sendToLiveFeed(message: any): void {
    try {
      const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // 🎨 Форматированный вывод с цветами
      const header = `${colorize.time(`[${time}]`)} 📨 ${colorize.chat(message.chatTitle)}`
      const sender = `${colorize.user(message.fromFirstName)}${message.fromUsername ? colorize.meta(` ${message.fromUsername}`) : ''}`
      const messageText = colorize.message(`${message.text.substring(0, 150)}${message.text.length > 150 ? '...' : ''}`)

      const formattedMessage = `${header}\n👤 ${sender}\n💬 ${messageText}`

      // Отправляем через все live feed callbacks
      this.liveFeedCallbacks.forEach(callback => {
        try {
          callback(formattedMessage)
        } catch (error) {
          console.error(colorize.error('❌ [TelegramService] Live feed callback error:'), error)
        }
      })

      // Отправляем через глобальный distributor (для автоматической отправки в чат)
      if (this.messageDistributor) {
        try {
          this.messageDistributor(formattedMessage)
        } catch (error) {
          console.error(colorize.error('❌ [TelegramService] Message distributor error:'), error)
        }
      }
    } catch (error) {
      console.error(colorize.error('❌ [TelegramService] Failed to send to live feed:'), error)
    }
  }

  /**
   * Запуск мониторинга групповых чатов
   */
  async startGroupMonitoring(): Promise<{ success: boolean; message: string; error?: string }> {
    if (this.isMonitoring) {
      return { success: true, message: 'Мониторинг уже запущен' }
    }

    if (!this.adapter) {
      return { success: false, message: 'Telegram сервис не инициализирован' }
    }

    try {
      this.isMonitoring = true
      this.monitoringStartTime = new Date()
      this.totalMessages = 0

      console.log('🚀 Запущен мониторинг групповых чатов')
      console.log('📡 Стратегия:', this.getStrategy())
      console.log('🔍 Мониторим все группы где аккаунт участник')

      // Автоматически подписываемся на сообщения от адаптера
      this.onMessage((message) => {
        // Сообщения уже обрабатываются в handleIncomingMessage
        // Этот обработчик для дополнительной логики
      })

      console.log('✅ Подписка на сообщения установлена')

      return {
        success: true,
        message: `Мониторинг запущен для ${this.monitoredGroups.size} групп`,
      }
    } catch (error) {
      this.isMonitoring = false
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      console.error('❌ Ошибка запуска мониторинга:', errorMessage)
      return { success: false, message: 'Ошибка запуска', error: errorMessage }
    }
  }

  /**
   * Остановка мониторинга
   */
  async stopGroupMonitoring(): Promise<{ success: boolean; message: string }> {
    if (!this.isMonitoring) {
      return { success: true, message: 'Мониторинг уже остановлен' }
    }

    this.isMonitoring = false
    console.log('⏹️ Мониторинг групповых чатов остановлен')

    return { success: true, message: 'Мониторинг остановлен' }
  }

  /**
   * Добавление группы в мониторинг
   */
  async addGroupToMonitoring(
    groupId: string,
    groupTitle: string
  ): Promise<{ success: boolean; message: string }> {
    if (this.monitoredGroups.has(groupId)) {
      return { success: false, message: 'Группа уже добавлена в мониторинг' }
    }

    this.monitoredGroups.set(groupId, {
      id: groupId,
      title: groupTitle,
      type: 'group',
    })

    console.log(`✅ Группа добавлена в мониторинг: ${groupTitle} (${groupId})`)

    return {
      success: true,
      message: `Группа "${groupTitle}" добавлена в мониторинг`,
    }
  }

  /**
   * Удаление группы из мониторинга
   */
  async removeGroupFromMonitoring(groupId: string): Promise<{ success: boolean; message: string }> {
    const removed = this.monitoredGroups.delete(groupId)

    if (removed) {
      console.log(`🗑️ Группа удалена из мониторинга: ${groupId}`)
      return { success: true, message: `Группа ${groupId} удалена из мониторинга` }
    } else {
      return { success: false, message: 'Группа не найдена в мониторинге' }
    }
  }

  /**
   * Получение списка мониторимых групп
   */
  getMonitoredGroups(): Array<{ id: string; title: string; type: string }> {
    return Array.from(this.monitoredGroups.values())
  }

  /**
   * Получение статистики мониторинга
   */
  getMonitoringStats(): {
    totalGroups: number
    activeGroups: number
    totalMessages: number
    uptime: number
  } {
    return {
      totalGroups: this.monitoredGroups.size,
      activeGroups: this.isMonitoring ? this.monitoredGroups.size : 0,
      totalMessages: this.totalMessages,
      uptime: this.monitoringStartTime
        ? Date.now() - this.monitoringStartTime.getTime()
        : 0,
    }
  }

  /**
   * Проверка активности мониторинга
   */
  isGroupMonitoringActive(): boolean {
    return this.isMonitoring
  }

  /**
   * Обработка входящего сообщения из MTProto (GramJS)
   * Это РЕАЛЬНЫЕ сообщения из Telegram!
   */
  async handleIncomingMessage(event: any): Promise<void> {
    console.log('🎯 [TelegramService] handleIncomingMessage() called!')
    console.log(`🔍 [TelegramService] Monitoring active: ${this.isMonitoring}`)

    if (!this.isMonitoring) {
      console.log('⏸️ [TelegramService] Monitoring is not active, ignoring message')
      return
    }

    try {
      const message = event.message

      // Используем уже извлечённую информацию из адаптера
      const finalChatId = (event as any).chatId || this.extractChatId(message.peerId)
      const chatTitle = (event as any).chatTitle || 'Unknown Chat'

      console.log(`📨 [TelegramService] Processing message from chat:`, {
        chatId: finalChatId,
        chatTitle,
        sender: (event as any).senderId || message.senderId?.toString(),
        messageId: message.id
      })

      // Получаем информацию об отправителе
      const fromUserId = (event as any).senderId || message.senderId?.toString() || 'unknown'
      const fromUsername = (event as any).senderUsername || ''
      const fromFirstName = (event as any).senderFirstName || 'Unknown'
      const fromLastName = (event as any).senderLastName || ''

      // Формируем полное имя пользователя
      const fullName = fromLastName
        ? `${fromFirstName} ${fromLastName}`
        : fromFirstName

      // Формируем username для отображения
      const usernameDisplay = fromUsername ? `@${fromUsername}` : ''

      this.totalMessages++

      // Формируем обработанное сообщение
      const processedMessage = {
        messageId: message.id,
        chatId: finalChatId,
        chatTitle,
        fromUserId,
        fromUsername: usernameDisplay,
        fromFirstName: fullName,  // теперь это полное имя
        text: message.text || message.message || '',
        timestamp: new Date(message.date * 1000),
        hasMedia: message.media ? true : false,
        mediaType: this.detectMediaType(message.media),
      }

      // 🛡️ КРИТИЧНО: Проверяем разрешённую группу (ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА)
      const allowedGroupId = process.env.ALLOWED_GROUP_ID
      if (allowedGroupId && finalChatId !== allowedGroupId) {
        console.log(`⛔ [TelegramService] ИГНОРИРУЕМ сообщение из неразрешённой группы: ${finalChatId} (разрешена только ${allowedGroupId})`)
        console.log(`   📍 Группа: "${chatTitle}"`)
        console.log(`   💬 Сообщение: "${(message.text || message.message || '').substring(0, 50)}..."`)
        return
      }

      // Проверяем, нужно ли мониторить этот чат
      const shouldMonitor = this.monitoredGroups.has(finalChatId) ||
                           this.monitoredGroups.has(chatTitle) ||
                           (allowedGroupId && finalChatId === allowedGroupId)

      console.log(`🔍 [TelegramService] Should monitor this chat: ${shouldMonitor}`)
      console.log(`💬 [TelegramService] Message text preview:`, {
        text: (message.text || message.message || '').substring(0, 100),
        chatTitle,
        fromFirstName
      })

      if (shouldMonitor) {
        // Сохраняем в историю для админки
        this.saveMessageToHistory(processedMessage)

        // 📺 Отправляем в live feed если активирован
        this.sendToLiveFeed(processedMessage)

        // Уведомляем всех подписчиков о новом сообщении
        this.messageHandlers.forEach(handler => {
          try {
            handler(processedMessage)
          } catch (error) {
            console.error('❌ Ошибка в обработчике сообщения:', error)
          }
        })

        // Логируем входящее сообщение с цветами
        const timestamp = new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })

        console.log(
          `${colorize.time(`[${timestamp}]`)} 📨 ${colorize.chat(chatTitle)} » ${colorize.user(fromFirstName)}${usernameDisplay ? colorize.meta(` ${usernameDisplay}`) : ''}: ${colorize.message(processedMessage.text?.substring(0, 100) || '...')}`
        )

        // Проверяем триггерные слова
        this.checkTriggerWords(processedMessage)

        // 🤖 Генерируем автоматический ответ через LLM
        console.log(`🔥 [TelegramService] BEFORE generateAndSendReply - runtime: ${this.runtime ? 'SET' : 'NULL'}`)
        await this.generateAndSendReply(processedMessage)
        console.log(`✅ [TelegramService] AFTER generateAndSendReply`)
      }
    } catch (error) {
      console.error('❌ [TelegramService] Ошибка обработки сообщения:', error)
    }
  }

  /**
   * Извлечение chat ID из объекта peerId
   */
  private extractChatId(peerId: any): string {
    if (!peerId) return 'unknown'

    // PeerUser, PeerChat, PeerChannel имеют свойства userId, chatId, channelId
    if (peerId.userId) return peerId.userId.toString()
    if (peerId.chatId) return peerId.chatId.toString()
    if (peerId.channelId) return peerId.channelId.toString()

    // Fallback - пытаемся toString()
    return peerId.toString?.() || 'unknown'
  }

  /**
   * Определение типа медиа
   */
  private detectMediaType(media: any): string | undefined {
    if (!media) return undefined

    if (media._ === 'MessageMediaPhoto') return 'photo'
    if (media._ === 'MessageMediaDocument') {
      const mimeType = media.document?.mimeType || ''
      if (mimeType.startsWith('video/')) return 'video'
      if (mimeType.startsWith('audio/')) return 'audio'
      return 'document'
    }
    if (media._ === 'MessageMediaVoice') return 'voice'
    if (media._ === 'MessageMediaGeo') return 'location'

    return 'unknown'
  }

  /**
   * Проверка триггерных слов в сообщении
   * Если нашли триггерное слово - реагируем!
   */
  private checkTriggerWords(message: any): void {
    const triggerWords = [
      'help',
      'помощь',
      'пожаловаться',
      'report',
      'urgent',
      'срочно',
    ]

    const text = message.text?.toLowerCase() || ''

    const foundTriggers = triggerWords.filter(word => text.includes(word))

    if (foundTriggers.length > 0) {
      console.log(`⚠️ Триггерные слова найдены: ${foundTriggers.join(', ')}`)
      console.log(`📍 В чате: ${message.chatTitle}`)
      console.log(`👤 От: ${message.fromFirstName} (${message.fromUserId})`)
      console.log(`💬 Сообщение: ${message.text?.substring(0, 100)}...`)

      // Отправляем уведомление и записываем в лог
      this.sendTriggerNotification(message, foundTriggers)
    }
  }

  /**
   * Отправка уведомления о триггерных словах
   * В канал мониторинга (если настроен) и в лог-файл
   */
  private sendTriggerNotification(message: any, foundTriggers: string[]): void {
    try {
      const timestamp = new Date().toISOString()
      const monitoringChannelId = process.env.TELEGRAM_MONITORING_CHANNEL_ID

      // Формируем текст уведомления
      const notificationText = `🚨 ТРИГГЕР ОБНАРУЖЕН
📍 Чат: ${message.chatTitle}
👤 От: ${message.fromFirstName} (${message.fromUserId})
🔑 Слова: ${foundTriggers.join(', ')}
💬 Сообщение: ${message.text?.substring(0, 150)}${message.text && message.text.length > 150 ? '...' : ''}
⏰ Время: ${timestamp}`

      // Отправляем в канал мониторинга если настроен
      if (monitoringChannelId) {
        this.sendMessage(monitoringChannelId, notificationText).catch(error => {
          console.error('❌ Ошибка отправки уведомления в канал мониторинга:', error)
        })
      }

      // Записываем в лог-файл
      const logFilePath = path.join(process.cwd(), 'trigger-alerts.log')
      const logEntry = `[${timestamp}] TRIGGER ALERT
Chat: ${message.chatTitle} (${message.chatId})
From: ${message.fromFirstName} (${message.fromUserId})
Triggers: ${foundTriggers.join(', ')}
Message: ${message.text}
---
`

      fs.appendFileSync(logFilePath, logEntry)
      console.log(`📝 Записано в лог: ${logFilePath}`)
    } catch (error) {
      console.error('❌ Ошибка при отправке уведомления о триггере:', error)
    }
  }

  /**
   * 🤖 Генерация и отправка автоматического ответа через LLM
   */
  private async generateAndSendReply(processedMessage: any): Promise<void> {
    // Проверяем наличие runtime и флага автоответов
    if (!this.runtime) {
      console.log('⚠️ [TelegramService] Runtime not available, skipping auto-reply')
      return
    }

    if (!this.autoReplyEnabled) {
      console.log('⏸️ [TelegramService] Auto-reply disabled, skipping')
      return
    }

    try {
      console.log(`🤖 [TelegramService] Generating reply for message from ${processedMessage.fromFirstName}...`)

      // 🛡️ ПРОВЕРКА messageManager - если нет, используем упрощенный режим
      if (!this.runtime.messageManager) {
        console.log('⚠️ [TelegramService] messageManager not available, using simplified mode')
        const simpleReply = this.generateSimpleReply(processedMessage.text, processedMessage.fromFirstName)
        await this.sendMessage(
          processedMessage.chatId,
          simpleReply,
          processedMessage.messageId
        )
        return
      }

      // Создаем Memory объект из сообщения
      const userMemory: Memory = {
        id: stringToUuid(`telegram-${processedMessage.chatId}-${processedMessage.messageId}-${Date.now()}`),
        userId: stringToUuid(`telegram-user-${processedMessage.fromUserId}`) as UUID,
        agentId: this.runtime.agentId,
        roomId: stringToUuid(`telegram-room-${processedMessage.chatId}`) as UUID,
        content: {
          text: processedMessage.text,
          source: 'telegram',
          metadata: {
            chatId: processedMessage.chatId,
            chatTitle: processedMessage.chatTitle,
            messageId: processedMessage.messageId,
            fromUsername: processedMessage.fromUsername,
            fromFirstName: processedMessage.fromFirstName,
          }
        },
        createdAt: processedMessage.timestamp.getTime(),
      }

      // Сохраняем сообщение пользователя в память
      await this.runtime.messageManager.createMemory(userMemory)

      // Получаем историю чата для контекста (последние 10 сообщений)
      const roomId = stringToUuid(`telegram-room-${processedMessage.chatId}`) as UUID
      const conversationHistory = await this.runtime.messageManager.getMemories({
        roomId,
        count: 10,
        unique: true,
      })

      console.log(`📚 [TelegramService] Получено ${conversationHistory.length} сообщений из истории для контекста`)

      // Создаем начальное состояние
      const state: State = await this.runtime.composeState(userMemory)

      // Генерируем ответ через ElizaOS с полным контекстом
      const response = await this.runtime.processActions(
        userMemory,
        conversationHistory, // Передаем ВСЮ историю чата!
        state,
        async (response: Memory) => {
          // Callback - отправляем ответ в Telegram
          if (response.content?.text) {
            console.log(`💬 [TelegramService] Sending reply: ${response.content.text.substring(0, 100)}...`)

            await this.sendMessage(
              processedMessage.chatId,
              response.content.text,
              processedMessage.messageId // reply to original message
            )

            // Логируем отправленный ответ с цветами
            const timestamp = new Date().toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })

            console.log(
              `${colorize.time(`[${timestamp}]`)} 📤 ${colorize.chat(processedMessage.chatTitle)} » ${colorize.success('VIBEE')}: ${colorize.message(response.content.text.substring(0, 100))}`
            )
          }
        }
      )

      console.log(`✅ [TelegramService] Reply generation completed`)
    } catch (error) {
      console.error(`❌ [TelegramService] Failed to generate reply:`, error)

      // 🧠 УМНЫЙ FALLBACK - генерируем ответ на основе контекста
      const fallbackReply = this.generateSimpleReply(processedMessage.text, processedMessage.fromFirstName)
      try {
        await this.sendMessage(
          processedMessage.chatId,
          fallbackReply,
          processedMessage.messageId
        )
      } catch (sendError) {
        console.error(`❌ [TelegramService] Failed to send fallback message:`, sendError)
      }
    }
  }

  /**
   * 🧠 Простая генерация умных ответов без LLM
   */
  private generateSimpleReply(messageText: string, fromFirstName: string): string {
    const text = messageText.toLowerCase().trim()

    // Анализируем содержание сообщения и генерируем умный ответ
    if (text.includes('привет') || text.includes('hi') || text.includes('hello')) {
      const greetings = [
        `Привет, ${fromFirstName}! Как дела? 😊`,
        `Здравствуй, ${fromFirstName}! Чем могу помочь?`,
        `Привет! Рад тебя видеть, ${fromFirstName}!`
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    if (text.includes('как дела') || text.includes('как ты')) {
      return `Спасибо что спросил, ${fromFirstName}! Дела отлично, изучаю новое и готов к интересным задачам! А у тебя как?`
    }

    if (text.includes('помощь') || text.includes('help')) {
      return `Конечно, ${fromFirstName}! Я готов помочь. Что конкретно тебя интересует?`
    }

    if (text.includes('спасибо') || text.includes('thanks')) {
      return `Пожалуйста, ${fromFirstName}! Рад был помочь! 👍`
    }

    if (text.includes('работа') || text.includes('дела')) {
      return `Понимаю, ${fromFirstName}. Работа бывает разной. Если нужна помощь или совет - обращайся!`
    }

    if (text.includes('?')) {
      return `Интересный вопрос, ${fromFirstName}! Дай-ка подумаю... Это зависит от контекста, но я готов обсудить это с тобой.`
    }

    // Общий умный ответ на основе анализа сообщения
    const generalReplies = [
      `Понятно, ${fromFirstName}! Расскажи подробнее, что думаешь об этом?`,
      `Интересно, ${fromFirstName}! Я слушаю.`,
      `${fromFirstName}, это любопытно. Какие у тебя мысли на этот счет?`,
      `Понял тебя, ${fromFirstName}. А что ты об этом думаешь?`,
      `${fromFirstName}, давай разберем это вместе!`,
    ]

    return generalReplies[Math.floor(Math.random() * generalReplies.length)]
  }

  /**
   * Подписка на сообщения от адаптера
   * Это связывает MTProto адаптер с мониторингом
   */
  onMessage(handler: (message: any) => void): void {
    console.log('🔗 [TelegramService] onMessage() called')
    this.messageHandlers.add(handler)
    console.log(`📨 [TelegramService] Подписка на сообщения установлена (${this.messageHandlers.size} обработчиков)`)

    // 🔒 ЗАЩИТА ОТ ДУБЛИРОВАНИЯ: Регистрируем обработчик только один раз
    if (!this.messageHandlerRegistered && this.adapter?.onMessage) {
      console.log('✅ [TelegramService] Adapter supports onMessage, registering handler...')
      // Связываем обработчик адаптера с нашим сервисом
      const adapterHandler = (event: any) => {
        console.log('📥 [TelegramService] Adapter handler called, forwarding to handleIncomingMessage')
        this.handleIncomingMessage(event)
      }
      this.adapter.onMessage(adapterHandler)
      this.messageHandlerRegistered = true // 🔒 Отмечаем, что обработчик зарегистрирован
      console.log('✅ [TelegramService] Handler registered with adapter (ONCE ONLY)')
    } else if (!this.adapter?.onMessage) {
      console.log('⚠️ [TelegramService] Adapter does NOT support onMessage!')
    } else {
      console.log(`🔒 [TelegramService] Handler already registered (skipping duplicate registration)`)
    }
  }

  /**
   * Отписка от сообщений
   */
  offMessage(handler: (message: any) => void): void {
    this.messageHandlers.delete(handler)
    console.log(`📨 Отписка от сообщений (${this.messageHandlers.size} обработчиков)`)
  }

  /**
   * Получение текущей стратегии подключения
   */
  getStrategy(): string {
    return this.strategy
  }

  /**
   * Проверка активности адаптера
   */
  isConnected(): boolean {
    return this.adapter !== null
  }

  /**
   * Проверка установлен ли message distributor
   */
  hasMessageDistributor(): boolean {
    return this.messageDistributor !== null
  }

  /**
   * Получить список всех групп из Telegram
   */
  async getAllGroups(): Promise<Array<{
    id: string
    title: string
    type: string
    unreadCount: number
    isMonitored: boolean
  }>> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }

    try {
      const dialogs = await this.adapter.getDialogs(100)

      return dialogs
        .filter(d => d.name !== 'Unknown') // Фильтруем неизвестные
        .map(dialog => ({
          id: dialog.id,
          title: dialog.name,
          type: dialog.type || 'unknown',
          unreadCount: dialog.unreadCount || 0,
          isMonitored: this.monitoredGroups.has(dialog.id) || this.monitoredGroups.has(dialog.name)
        }))
    } catch (error) {
      console.error('❌ Failed to get groups:', error)
      return []
    }
  }

  /**
   * Получить последние сообщения (для админки)
   */
  private recentMessages: Array<{
    chatId: string
    chatTitle: string
    fromUsername: string
    text: string
    timestamp: Date
  }> = []

  /**
   * Сохранить сообщение в историю (вызывается из handleIncomingMessage)
   */
  private saveMessageToHistory(message: any): void {
    this.recentMessages.unshift({
      chatId: message.chatId,
      chatTitle: message.chatTitle,
      fromUsername: message.fromUsername || message.fromFirstName,
      text: message.text,
      timestamp: message.timestamp
    })

    // Храним только последние 100 сообщений
    if (this.recentMessages.length > 100) {
      this.recentMessages = this.recentMessages.slice(0, 100)
    }
  }

  /**
   * Получить последние сообщения для админки
   */
  getRecentMessages(limit: number = 50): Array<{
    chatId: string
    chatTitle: string
    fromUsername: string
    text: string
    timestamp: Date
  }> {
    return this.recentMessages.slice(0, limit)
  }
}
