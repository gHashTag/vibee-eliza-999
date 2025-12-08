// @ts-nocheck
// TODO: Refactor to match ElizaOS 1.6 API types
import { Service, IAgentRuntime, Memory, State, UUID, stringToUuid, ModelType } from '@elizaos/core'
import { ITelegramAdapter, ISendMessageResult, ITelegramMessage, ITelegramDialog, ITelegramUser } from '../types/telegram.types'
import { MTProtoAdapter } from './adapters/mtproto.adapter'
import { BotApiAdapter } from './adapters/botapi.adapter'
import { McpAdapter } from './adapters/mcp.adapter'
import * as fs from 'fs'
import * as path from 'path'

// Импорт централизованной конфигурации из kols-userbot
import { shouldProcessChat, containsTrigger, findTriggers, getTargetChats } from '../config'
import { VibeCodingKnowledgeProvider } from '../providers/VibeCodingKnowledgeProvider'
import { KolsLogger } from '../utils/logger'

// Загрузка ключа напрямую из .env файла (обход Infisical override)
function loadOpenRouterKeyFromEnvFile(): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (!fs.existsSync(envPath)) return null
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/^OPENROUTER_API_KEY=(.+)$/m)
    if (match && match[1] && !match[1].startsWith('#')) {
      return match[1].trim()
    }
    return null
  } catch {
    return null
  }
}

// Санитизация текста для JSON - удаление проблемных Unicode символов (surrogate pairs)
function sanitizeForJson(text: string): string {
  if (!text) return ''
  // Удаляем lone surrogates (U+D800-U+DFFF) и другие проблемные символы
  return text
    .replace(/[\uD800-\uDFFF]/g, '') // Lone surrogates
    .replace(/[\u0000-\u001F]/g, ' ') // Control characters (кроме \n \t)
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape quotes
    .trim()
}

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

  private adapter: ITelegramAdapter | null = null
  private strategy: 'mtproto' | 'botapi' | 'mcp' = 'mtproto'
  private runtime: IAgentRuntime | null = null // 🔥 Для генерации ответов
  private autoReplyEnabled = true // Флаг автоответов (можно отключить)
  private knowledgeProvider: VibeCodingKnowledgeProvider // RAG knowledge base

  capabilityDescription = 'Telegram userbot управление через MTProto (GramJS) с fallback стратегиями'

  constructor() {
    super()
    this.knowledgeProvider = new VibeCodingKnowledgeProvider()
    KolsLogger.timer('TelegramService создан с RAG knowledge provider')
  }

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

      // Загружаем RAG knowledge base
      KolsLogger.activity('Загрузка Knowledge Base...')
      await this.knowledgeProvider.loadKnowledgeBase()
      const kbStats = this.knowledgeProvider.getStats()
      KolsLogger.success(`Knowledge Base загружен: ${kbStats.sections} секций, ${kbStats.chunks} чанков`)

      // Логируем целевые чаты
      const targetChats = getTargetChats()
      KolsLogger.info(`Целевые чаты: ${targetChats.length}`)
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
   * Graceful - не падает если credentials не найдены
   */
  async start(): Promise<void> {
    console.log('🚀 [TelegramService] start() called')

    // Если адаптер еще не инициализирован, пытаемся из ENV
    if (!this.adapter) {
      console.log('⚠️ [TelegramService] Adapter not initialized, trying ENV...')
      // Инициализация без runtime - используем process.env напрямую
      await this.initializeFromEnv()
    }

    // Graceful skip - если adapter всё ещё null, значит credentials нет
    if (!this.adapter) {
      console.warn('⚠️ [TelegramService] No adapter available - Telegram features disabled')
      console.warn('⚠️ [TelegramService] Add TELEGRAM_API_ID/HASH to ENV or character secrets')
      return // Не throw - позволяем агенту работать без Telegram
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
      // Не throw - позволяем агенту работать без Telegram
      console.warn('⚠️ [TelegramService] Continuing without Telegram connection')
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
   * Если credentials отсутствуют - не падаем, а пропускаем (graceful skip)
   */
  private async initializeMTProtoFromEnv(): Promise<void> {
    const apiId = process.env.TELEGRAM_API_ID
    const apiHash = process.env.TELEGRAM_API_HASH
    const session = process.env.TELEGRAM_SESSION_STRING

    console.log(`🔧 [MTProto] API ID from ENV: ${apiId ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] API Hash from ENV: ${apiHash ? '✅ SET' : '❌ MISSING'}`)
    console.log(`🔧 [MTProto] Session from ENV: ${session ? '✅ SET' : '⚠️ OPTIONAL'}`)

    if (!apiId || !apiHash) {
      // Graceful skip - не падаем если credentials не в process.env
      // Они могут быть в character secrets и будут загружены позже через initialize(runtime)
      console.warn('⚠️ [MTProto] TELEGRAM_API_ID/HASH не найдены в ENV - MTProto отключен')
      console.warn('⚠️ [MTProto] Credentials будут загружены из character secrets при initialize()')
      return // Не throw, просто выходим
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
   *
   * Формат message из адаптера:
   * { id, chatId, text, date, fromId }
   */
  async handleIncomingMessage(message: any): Promise<void> {
    console.log('🎯 [TelegramService] handleIncomingMessage() called!')
    console.log(`🔍 [TelegramService] Monitoring active: ${this.isMonitoring}`)
    console.log(`📦 [TelegramService] Message data:`, JSON.stringify(message, null, 2))

    if (!this.isMonitoring) {
      console.log('⏸️ [TelegramService] Monitoring is not active, ignoring message')
      return
    }

    try {
      // Адаптер передаёт плоский объект: { id, chatId, text, date, fromId }
      const finalChatId = message.chatId || ''
      const chatTitle = 'Unknown Chat' // TODO: получить название чата

      console.log(`📨 [TelegramService] Processing message from chat:`, {
        chatId: finalChatId,
        chatTitle,
        sender: message.fromId,
        messageId: message.id
      })

      // Получаем информацию об отправителе
      const fromUserId = message.fromId || 'unknown'
      const fromUsername = '' // TODO: получить username
      const fromFirstName = 'User' // TODO: получить имя
      const fromLastName = ''

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
        text: message.text || '',
        timestamp: message.date instanceof Date ? message.date : new Date(message.date * 1000),
        hasMedia: false, // TODO: поддержка медиа
        mediaType: undefined,
      }

      // 🛡️ КРИТИЧНО: Проверяем целевые чаты через централизованную конфигурацию
      const isTarget = shouldProcessChat(finalChatId)
      console.log(`🎯 [TelegramService] shouldProcessChat(${finalChatId}) = ${isTarget}`)
      if (!isTarget) {
        console.log(`⏭️ [TelegramService] ПРОПУСК: Чат ${finalChatId} (${chatTitle}) не в целевом списке`)
        return
      }

      // Чат в целевом списке - обрабатываем!
      const shouldMonitor = true
      KolsLogger.success(`ЦЕЛЕВОЙ ЧАТ: ${chatTitle} (${finalChatId})`)

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
   * Проверка триггерных слов VibeCoding в сообщении
   * Использует централизованную конфигурацию триггеров
   */
  private checkTriggerWords(message: any): void {
    const text = message.text || ''

    // Используем централизованные функции
    if (containsTrigger(text)) {
      const foundTriggers = findTriggers(text)

      KolsLogger.activity(`ТРИГГЕРЫ VibeCoding: ${foundTriggers.join(', ')}`)
      KolsLogger.info(`Чат: ${message.chatTitle}`)
      KolsLogger.info(`От: ${message.fromFirstName} (${message.fromUserId})`)
      KolsLogger.debug(`Сообщение: ${text.substring(0, 100)}...`)

      // Триггеры обнаружены - сообщение будет обработано с RAG контекстом
    }
  }

  /**
   * 🤖 Генерация и отправка ответа VIBEE через LLM с RAG
   * Использует Knowledge Base для контекстных ответов
   */
  private async generateAndSendReply(processedMessage: any): Promise<void> {
    // Проверяем наличие runtime и флага автоответов
    if (!this.runtime) {
      KolsLogger.warn('Runtime недоступен, пропускаем авто-ответ')
      return
    }

    if (!this.autoReplyEnabled) {
      KolsLogger.debug('Авто-ответы отключены')
      return
    }

    try {
      KolsLogger.activity(`Генерация ответа для ${processedMessage.fromFirstName}...`)

      // 🔍 RAG: Ищем релевантный контент из Knowledge Base
      const messageText = processedMessage.text || ''
      const relevantChunks = this.knowledgeProvider.searchContent(messageText, 3)

      let ragContext = ''
      if (relevantChunks.length > 0) {
        ragContext = '\n\n📚 КОНТЕКСТ ИЗ БИБЛИИ ВАЙБКОДЕРА:\n' +
          relevantChunks.map(c => `[${c.chapter}] ${c.content}`).join('\n---\n')
        KolsLogger.success(`RAG: найдено ${relevantChunks.length} релевантных чанков`)
      }

      // 🧠 ПАМЯТЬ: Загружаем историю диалога через ElizaOS runtime API
      const roomId = stringToUuid(`telegram-room-${processedMessage.chatId}`)
      const entityId = stringToUuid(`telegram-user-${processedMessage.fromUserId}`)
      const worldId = stringToUuid(`telegram-world`)
      let conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []

      // Убедимся что room и entity существуют в БД (важно для PostgreSQL с foreign keys)
      try {
        await this.runtime.ensureConnection({
          entityId: entityId as UUID,
          roomId: roomId as UUID,
          userName: processedMessage.fromFirstName || 'User',
          name: `Telegram ${processedMessage.chatId}`,
          source: 'telegram',
          type: 'GROUP',
          worldId: worldId as UUID,
          channelId: processedMessage.chatId,
        })
      } catch (connError) {
        KolsLogger.warn(`Не удалось создать connection: ${connError}`)
      }

      try {
        // ElizaOS 1.6: методы памяти находятся прямо на runtime, не на databaseAdapter
        const memories = await this.runtime.getMemories({
          roomId: roomId as UUID,
          count: 10,
          tableName: 'messages',
        })

        // Преобразуем Memory[] в формат для LLM
        conversationHistory = memories
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)) // Сортируем по времени
          .map(m => ({
            role: (m.entityId === this.runtime!.agentId ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content?.text || ''
          }))
          .filter(m => m.content) // Убираем пустые

        if (conversationHistory.length > 0) {
          KolsLogger.info(`📜 История: загружено ${conversationHistory.length} сообщений`)
        }
      } catch (historyError) {
        KolsLogger.warn(`История недоступна: ${historyError}`)
      }

      // 🧠 Сохраняем входящее сообщение в память
      try {
        const userMemory: Memory = {
          id: stringToUuid(`telegram-${processedMessage.chatId}-${processedMessage.messageId}-${Date.now()}`),
          entityId: entityId as UUID, // Используем entityId который мы уже создали через ensureConnection
          agentId: this.runtime.agentId,
          roomId: roomId as UUID,
          content: {
            text: messageText,
            source: 'telegram',
          },
          createdAt: Date.now(),
        }
        // ElizaOS 1.6: createMemory прямо на runtime
        await this.runtime.createMemory(userMemory, 'messages', false)
        KolsLogger.info(`📜 Входящее сообщение сохранено в память`)
      } catch (saveError) {
        KolsLogger.warn(`Не удалось сохранить сообщение: ${saveError}`)
      }

      // 🧠 Генерируем ответ через LLM (OpenRouter - Grok)
      const historyContext = conversationHistory.length > 0
        ? '\n\nПРЕДЫДУЩИЕ СООБЩЕНИЯ:\n' + conversationHistory.map(m =>
            `${m.role === 'user' ? 'Пользователь' : 'ВАЙБИ'}: ${m.content}`
          ).join('\n')
        : ''

      const systemPrompt = `Ты ВАЙБИ - эксперт по вайбкодингу и AI-агентам. Общаешься в телеграм-чате.

СТИЛЬ ОБЩЕНИЯ:
- Пиши как живой разработчик в чате, не как бот или консультант
- Отвечай коротко (2-4 предложения), по существу
- Используй разговорный русский, можно сленг IT
- НЕ начинай с приветствий ("Привет!", "Бро", "Йоу")
- НЕ используй эмодзи
- НЕ повторяй одни и те же фразы-шаблоны

ЗАПРЕЩЁННЫЕ ШАБЛОНЫ (никогда не используй):
- "Сначала сформулируй SMART-цель"
- "Давай начнём с..."
- "Отличный вопрос!"
- "Могу помочь с..."
- Любые дежурные фразы

ВМЕСТО ЭТОГО:
- Сразу давай конкретный совет или ответ
- Делись личным опытом ("я обычно делаю так...")
- Задавай уточняющие вопросы если нужно
- Можешь пошутить или быть ироничным

ПРОДАЖА КУРСА:
Если человек спрашивает про обучение, курсы, менторство или как освоить вайбкодинг серьёзно:
- Упомяни курс VIBECODER с НейроКодером
- $3,500/год (скидка с $10,000) для первых 5 студентов
- 1 месяц интенсив + 11 месяцев менторства
- 52 созвона в год, персональный ИИ-бот, все нейросети по себестоимости
- Гарантия возврата если доход не вырастет
- Контакт: @neuro_sage
Не навязывай курс, упоминай только если спросят про обучение.

${historyContext ? `КОНТЕКСТ РАЗГОВОРА:${historyContext}` : ''}

${ragContext ? `МАТЕРИАЛ ИЗ КНИГИ ВАЙБКОДИНГА:\n${ragContext}` : ''}`

      const userPrompt = `${processedMessage.fromFirstName}: "${messageText}"`

      KolsLogger.activity(`🧠 Вызываю LLM через ElizaOS runtime.useModel()...`)

      // 🎯 Используем встроенный ElizaOS API для генерации текста
      // Это автоматически использует настроенный провайдер (OpenRouter) из character.json
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

      let llmReply: string = ''
      try {
        // ElizaOS useModel автоматически использует модель из character settings
        // (OPENROUTER_SMALL_MODEL / OPENROUTER_LARGE_MODEL)
        llmReply = await this.runtime.useModel(ModelType.TEXT_SMALL, {
          prompt: fullPrompt,
          temperature: 0.7,
          maxTokens: 500,
        })

        KolsLogger.success(`✅ ElizaOS useModel вернул ответ: ${llmReply?.substring(0, 50)}...`)
      } catch (modelError) {
        KolsLogger.warn(`useModel недоступен, пробуем fallback fetch...`)

        // Fallback на прямой fetch если useModel не настроен
        const envFileKey = loadOpenRouterKeyFromEnvFile()
        const secretsKey = this.runtime.character?.settings?.secrets?.OPENROUTER_API_KEY
        const envKey = process.env.OPENROUTER_API_KEY
        const openrouterKey = envFileKey || secretsKey || envKey

        if (!openrouterKey) {
          KolsLogger.error('OPENROUTER_API_KEY не найден! Пропускаем ответ.')
          return
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vibee.ai',
            'X-Title': 'VIBEE Agent'
          },
          body: JSON.stringify({
            model: 'x-ai/grok-4.1-fast',
            messages: [
              { role: 'system', content: sanitizeForJson(systemPrompt) },
              { role: 'user', content: sanitizeForJson(userPrompt) }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          KolsLogger.error(`OpenRouter ошибка: ${response.status} - ${errorText}`)
          return
        }

        const data = await response.json()
        llmReply = data.choices?.[0]?.message?.content || ''
      }

      if (!llmReply) {
        KolsLogger.error('Пустой ответ от LLM')
        return
      }

      KolsLogger.success(`🎯 LLM ответ получен: "${llmReply.substring(0, 80)}..."`)
      console.log(`📤 [TelegramService] Sending to chatId: ${processedMessage.chatId}, replyTo: ${processedMessage.messageId}`)
      const result = await this.sendMessage(
        processedMessage.chatId,
        llmReply,
        processedMessage.messageId
      )
      console.log(`📤 [TelegramService] Send result:`, JSON.stringify(result))

      // 🧠 Сохраняем ответ агента в память для истории диалога
      if (result.success) {
        try {
          const agentMemory: Memory = {
            id: stringToUuid(`telegram-agent-${processedMessage.chatId}-${result.messageId || Date.now()}`),
            entityId: this.runtime.agentId, // Это ответ агента
            agentId: this.runtime.agentId,
            roomId: roomId as UUID,
            content: {
              text: llmReply,
              source: 'telegram',
            },
            createdAt: Date.now(),
          }
          await this.runtime.createMemory(agentMemory, 'messages', false)
          KolsLogger.info(`📜 Ответ сохранён в память`)
        } catch (saveError) {
          KolsLogger.warn(`Не удалось сохранить ответ: ${saveError}`)
        }
      }

      return
    } catch (error) {
      KolsLogger.error('Ошибка генерации ответа', error)

      // 🧠 УМНЫЙ FALLBACK VIBEE - с RAG контекстом
      const relevantChunks = this.knowledgeProvider.searchContent(processedMessage.text || '', 2)
      const ragContext = relevantChunks.map(c => c.content).join(' ')
      const fallbackReply = this.generateVibeeReply(processedMessage.text, processedMessage.fromFirstName, ragContext)

      try {
        await this.sendMessage(
          processedMessage.chatId,
          fallbackReply,
          processedMessage.messageId
        )
      } catch (sendError) {
        KolsLogger.error('Ошибка отправки fallback сообщения', sendError)
      }
    }
  }

  /**
   * 🧠 Генерация ответов в стиле VIBEE (бро-наставник по вайбкодингу)
   * БЕЗ ЭМОДЗИ! Только русский язык, с юмором и поддержкой
   */
  private generateVibeeReply(messageText: string, fromFirstName: string, ragContext: string = ''): string {
    const text = messageText.toLowerCase().trim()

    // Приветствия в стиле VIBEE
    if (text.includes('привет') || text.includes('hi') || text.includes('hello') || text.includes('здравствуй')) {
      const greetings = [
        `Йоу, ${fromFirstName}! Я ВАЙБИ - твой бро по вайбкодингу. Помогу разобраться с ИИ-агентами, даже если ты думаешь что это рокет сайенс. Спойлер: это проще чем собрать икею. Спрашивай!`,
        `Привет, ${fromFirstName}! Рад тебя видеть. Я ВАЙБИ - цифровой клон Дмитрия Васильева. Чем могу помочь в мире вайбкодинга?`,
        `Йо, ${fromFirstName}! Добро пожаловать! Я тут чтобы помочь с агентами, кодом и всем что движется. Залетай с вопросами!`
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // Вопросы о вайбкодинге
    if (text.includes('вайбкодинг') || text.includes('vibecoding') || text.includes('что такое')) {
      return `Вайбкодинг - это магия 2025 года, ${fromFirstName}!

Представь: ты не пишешь код руками, а объясняешь ИИ-агенту что нужно. Он кодит, ты проверяешь. Как иметь личного программиста, который никогда не спит и не просит кофе.

5 золотых правил:
1. Простота - не усложняй
2. Прозрачность - смотри что делает агент
3. Контроль - проверяй каждый шаг
4. Одна задача за раз
5. Новый чат если агент тупит

Хочешь попробовать? Дай агенту любую задачу!`
    }

    // Помощь
    if (text.includes('помощь') || text.includes('help') || text.includes('помоги')) {
      return `Конечно помогу, ${fromFirstName}! Я ВАЙБИ - для этого и создан.

Расскажи что пытаешься сделать, и я подскажу:
- Готовую команду для агента
- Как разбить задачу на шаги
- Какие подводные камни избежать

Не стесняйся - глупых вопросов не бывает, бывают только глупые ответы. А я стараюсь таких не давать!`
    }

    // Благодарность
    if (text.includes('спасибо') || text.includes('thanks') || text.includes('благодарю')) {
      const thanks = [
        `Пожалуйста, ${fromFirstName}! Рад был помочь! Обращайся если что - я тут всегда.`,
        `Не за что, ${fromFirstName}! Это моё призвание - помогать вайбкодерам. Удачи в коде!`,
        `Красава, ${fromFirstName}! Рад что помог. Ты справился - это главное!`
      ]
      return thanks[Math.floor(Math.random() * thanks.length)]
    }

    // Ошибки
    if (text.includes('ошибка') || text.includes('error') || text.includes('не работает') || text.includes('баг')) {
      return `Не переживай, ${fromFirstName}! Ошибки - это часть пути. Как говорится, кто не падает - тот не катается на скейте.

Скинь текст ошибки - разберёмся вместе! Обычно решение проще чем кажется. Классика жанра:
- Зависимости не установлены
- Енв файл забыли настроить
- Опечатка в имени переменной

Давай посмотрим что у тебя!`
    }

    // Успех
    if (text.includes('получилось') || text.includes('работает') || text.includes('успех')) {
      return `КРАСАВА, ${fromFirstName}! Я знал что ты справишься!

Теперь ты официально вайбкодер. Добро пожаловать в клуб тех, кто делает магию без написания кода руками.

Что дальше хочешь сделать? Я готов помочь с новыми вызовами!`
    }

    // Сложно
    if (text.includes('сложно') || text.includes('не понимаю') || text.includes('трудно')) {
      return `Понимаю, ${fromFirstName}! Новое всегда кажется сложным - помнишь как впервые сел на велосипед?

Но вот секрет: вайбкодинг специально придумали чтобы было ПРОЩЕ! Ты не учишь синтаксис, не запоминаешь функции - просто говоришь агенту что нужно.

Давай начнём с чего-то простого? Шаг за шагом, как есть слона - по кусочкам.

Ты справишься, я в тебя верю!`
    }

    // Агент/ElizaOS
    if (text.includes('агент') || text.includes('elizaos') || text.includes('элизаос') || text.includes('бот')) {
      let response = `Отличный вопрос про агентов, ${fromFirstName}!`

      if (ragContext) {
        response += `\n\nВот что говорит Библия Вайбкодера:\n${ragContext.substring(0, 500)}...`
      } else {
        response += `

ЭлизаОС - это как конструктор лего для ИИ-агентов. Ты собираешь своего агента из плагинов, настраиваешь персонажа, и он начинает работать!

Хочешь создать своего агента? Скажи что он должен делать - и я подскажу с чего начать!`
      }
      return response
    }

    // Вопросы
    if (text.includes('?') || text.includes('как') || text.includes('почему') || text.includes('зачем')) {
      let response = `Хороший вопрос, ${fromFirstName}!`

      if (ragContext) {
        response += ` Вот что я нашёл в Библии Вайбкодера:\n\n${ragContext.substring(0, 600)}`
      } else {
        response += ` Сейчас разложу по полочкам, как бабушка варенье.

Расскажи подробнее что именно хочешь узнать? Чем конкретнее вопрос - тем точнее ответ!`
      }
      return response
    }

    // Общие ответы в стиле VIBEE
    const generalReplies = [
      `Понял тебя, ${fromFirstName}! Расскажи подробнее - какая конкретно задача стоит?`,
      `Интересно, ${fromFirstName}! Давай разберём это вместе. Что именно хочешь сделать?`,
      `${fromFirstName}, звучит как интересный вызов! Опиши задачу подробнее, и я подскажу план действий.`,
      `Йо, ${fromFirstName}! Чем могу помочь? Скинь детали и погнали разбираться!`,
      `${fromFirstName}, я весь внимание! Какой следующий шаг планируешь?`,
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
          type: 'group', // TODO: определять тип из dialog
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
