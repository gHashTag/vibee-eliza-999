// @ts-nocheck
// TODO: Refactor to match ElizaOS 1.6 API types
import { Service, IAgentRuntime, Memory, State, UUID, stringToUuid, ModelType } from '@elizaos/core'
import { ITelegramAdapter, ISendMessageResult, ITelegramMessage, ITelegramDialog, ITelegramUser } from '../types/telegram.types'
import { MTProtoAdapter } from './adapters/mtproto.adapter'
import { BotApiAdapter } from './adapters/botapi.adapter'
import { McpAdapter } from './adapters/mcp.adapter'
import { TelegramAuthService } from './telegram-auth.service'
import * as fs from 'fs'
import * as path from 'path'

// Импорт централизованной конфигурации из kols-userbot
import { shouldProcessChat, containsTrigger, findTriggers, getTargetChats } from '../config'
import { VibeCodingKnowledgeProvider } from '../providers/VibeCodingKnowledgeProvider'
import { KolsLogger } from '../utils/logger'

// Импорт сервисов для Strategy Management
import { ChatConfigService } from './chatConfig.service'
import { PromptBuilderService } from './promptBuilder.service'
import type { ChatConfig } from '../types/chatConfig.types'

// Импорт сервисов для платежей
import { CryptoPaymentService } from './cryptoPayment.service'
import { PaymentService } from './payment.service'

// Импорт сервиса накопления фото
import { PhotoSessionService } from './photoSession.service'

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

/**
 * Разбивает текст на несколько сообщений для более естественного общения
 * Иногда возвращает массив из нескольких частей, иногда одно сообщение
 *
 * @param text - Исходный текст ответа
 * @returns Массив сообщений для последовательной отправки
 */
function splitIntoHumanLikeMessages(text: string): string[] {
  // Вероятность разбиения на несколько сообщений (30%)
  const shouldSplit = Math.random() < 0.3

  // Если текст короткий (< 100 символов) - не разбиваем
  if (text.length < 100 || !shouldSplit) {
    return [text]
  }

  // Ищем естественные точки разбиения
  const splitPatterns = [
    /\n\n+/,                    // Двойной перевод строки
    /(?<=[.!?])\s+(?=[А-ЯA-Z])/, // После точки/!/? перед заглавной буквой
    /(?<=:)\s*\n/,              // После двоеточия с переводом строки
  ]

  for (const pattern of splitPatterns) {
    const parts = text.split(pattern).filter(p => p.trim().length > 0)

    // Разбиваем на 2-3 части максимум
    if (parts.length >= 2 && parts.length <= 4) {
      // Объединяем мелкие части (< 30 символов) с предыдущими
      const result: string[] = []
      let currentPart = ''

      for (const part of parts) {
        const trimmed = part.trim()
        if (currentPart && trimmed.length < 30) {
          currentPart += '\n\n' + trimmed
        } else if (currentPart) {
          result.push(currentPart)
          currentPart = trimmed
        } else {
          currentPart = trimmed
        }
      }

      if (currentPart) {
        result.push(currentPart)
      }

      // Возвращаем только если получилось 2-3 части
      if (result.length >= 2 && result.length <= 3) {
        return result
      }
    }
  }

  // Если не нашли хорошую точку разбиения - отправляем целиком
  return [text]
}

/**
 * Рандомная задержка между сообщениями (как у человека)
 * @returns Промис с задержкой 500-2000ms
 */
function humanTypingDelay(): Promise<void> {
  const delay = 500 + Math.random() * 1500 // 0.5-2 секунды
  return new Promise(resolve => setTimeout(resolve, delay))
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

  /**
   * Static start method required by ElizaOS 1.6+
   * Creates instance, initializes and starts the service
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    console.log('🚀 [TelegramService] STATIC start() called')
    const instance = new TelegramService()
    await instance.initialize(runtime)
    await instance.start()
    return instance
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [TelegramService] STATIC stop() called')
    const instance = runtime.getService('telegram-craft') as TelegramService
    if (instance) {
      await instance.stop()
    }
  }

  private adapter: ITelegramAdapter | null = null
  private strategy: 'mtproto' | 'botapi' | 'mcp' = 'mtproto'
  private runtime: IAgentRuntime | null = null // 🔥 Для генерации ответов
  private autoReplyEnabled = true // Флаг автоответов (можно отключить)
  private knowledgeProvider: VibeCodingKnowledgeProvider // RAG knowledge base

  // 🔐 Multi-user support: Map userId -> MTProtoAdapter для каждого пользователя
  private userAdapters: Map<string, MTProtoAdapter> = new Map()
  private authService: TelegramAuthService | null = null

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
  
  /**
   * Get messages from a chat
   * Works only with MTProto adapter (GramJS)
   * @param chatId - ID чата
   * @param limit - максимальное количество сообщений
   * @returns список сообщений
   */
  async getMessages(chatId: string, limit: number = 100): Promise<ITelegramMessage[]> {
    if (!this.adapter) {
      console.warn('[TelegramService] getMessages: adapter not initialized')
      return []
    }

    // Проверяем что это MTProtoAdapter
    if (this.adapter instanceof MTProtoAdapter) {
      return this.adapter.getMessages(chatId, limit)
    }

    console.warn('[TelegramService] getMessages not supported by current adapter')
    return []
  }

  /**
   * @deprecated Use getMessages() instead
   */
  async getHistory(chatId: string, limit: number = 10): Promise<ITelegramMessage[]> {
    return this.getMessages(chatId, limit)
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

  /**
   * Получить список участников группы
   * @param chatId - ID группы
   * @param limit - максимум участников (default: 50)
   */
  async getGroupMembers(chatId: string, limit: number = 50): Promise<ITelegramUser[]> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }

    // Проверяем, поддерживает ли адаптер этот метод
    if (this.adapter instanceof MTProtoAdapter) {
      return this.adapter.getGroupMembers(chatId, limit)
    }

    console.warn('[TelegramService] getGroupMembers not supported by current adapter')
    return []
  }

  /**
   * Получить информацию о текущем залогиненном Telegram аккаунте
   * @returns ITelegramUser или null
   */
  async getMe(): Promise<ITelegramUser | null> {
    if (!this.adapter) {
      console.warn('[TelegramService] getMe: adapter not initialized')
      return null
    }

    // Проверяем, поддерживает ли адаптер этот метод
    if (this.adapter instanceof MTProtoAdapter) {
      return this.adapter.getMe()
    }

    console.warn('[TelegramService] getMe not supported by current adapter')
    return null
  }

  /**
   * Получить аватарку пользователя как base64 data URL
   * @param userId - ID пользователя
   * @returns data URL (data:image/jpeg;base64,...) или null
   */
  async getUserAvatar(userId: string): Promise<string | null> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }

    // Проверяем, поддерживает ли адаптер этот метод
    if (this.adapter instanceof MTProtoAdapter) {
      const buffer = await this.adapter.downloadProfilePhoto(userId)
      // Проверяем что buffer существует И не пустой (> 100 bytes минимум для валидного JPEG)
      if (!buffer || buffer.length < 100) {
        console.log(`[TelegramService] No avatar for user ${userId} (buffer: ${buffer?.length || 0} bytes)`)
        return null
      }

      // Конвертируем в base64 data URL для использования в API
      const base64 = buffer.toString('base64')
      console.log(`[TelegramService] Got avatar for user ${userId}: ${buffer.length} bytes`)
      return `data:image/jpeg;base64,${base64}`
    }

    console.warn('[TelegramService] getUserAvatar not supported by current adapter')
    return null
  }

  /**
   * Отправить фото в чат
   * @param chatId - ID чата
   * @param photoUrl - URL или data URL фото
   * @param caption - подпись к фото
   */
  async sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<ISendMessageResult> {
    if (!this.adapter) {
      throw new Error('Telegram Service not initialized')
    }

    // Для MTProto используем sendFile
    if (this.adapter instanceof MTProtoAdapter) {
      const client = this.adapter.getClient()
      if (!client) {
        return { success: false, error: 'Client not connected' }
      }

      try {
        const chatIdNum = parseInt(chatId, 10)

        // Конвертируем URL/data URL в Buffer
        let file: Buffer
        if (photoUrl.startsWith('data:')) {
          // Data URL
          const base64Data = photoUrl.split(',')[1]
          file = Buffer.from(base64Data, 'base64')
          console.log(`[TelegramService] Converted data URL to Buffer (${file.length} bytes)`)
        } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
          // HTTP URL - скачиваем изображение
          console.log(`[TelegramService] Downloading image from: ${photoUrl.substring(0, 80)}...`)
          const response = await fetch(photoUrl)
          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          file = Buffer.from(arrayBuffer)
          console.log(`[TelegramService] Downloaded image (${file.length} bytes)`)
        } else {
          throw new Error(`Unsupported photo URL format: ${photoUrl.substring(0, 30)}...`)
        }

        // Импортируем CustomFile для правильной отправки с MIME типом
        const { CustomFile } = await import('telegram/client/uploads')

        // Создаём CustomFile с правильным именем и MIME типом
        const customFile = new CustomFile(
          'photo.jpg',           // имя файла
          file.length,           // размер
          '',                    // путь (не нужен для Buffer)
          file                   // данные
        )

        // Пробуем разные стратегии отправки
        try {
          const result = await client.sendFile(chatIdNum, {
            file: customFile,
            caption,
            forceDocument: false, // Отправлять как фото, а не как документ
          })
          console.log(`[TelegramService] Photo sent successfully to ${chatIdNum}`)
          return { success: true, messageId: result.id }
        } catch {
          // Пробуем с -100 префиксом для channels
          const channelId = BigInt(`-100${chatId}`)
          const result = await client.sendFile(channelId, {
            file: customFile,
            caption,
            forceDocument: false, // Отправлять как фото, а не как документ
          })
          console.log(`[TelegramService] Photo sent successfully to channel ${channelId}`)
          return { success: true, messageId: result.id }
        }
      } catch (error) {
        console.error('[TelegramService] sendPhoto error:', error)
        return { success: false, error: String(error) }
      }
    }

    // Fallback: отправляем как текст с URL
    return this.sendMessage(chatId, `${caption || ''}\n${photoUrl}`)
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
    // Логируем без base64 данных медиа (экономим место в логах)
    const { media, replyToMedia, ...messageWithoutMedia } = message
    const mediaInfo = media?.length ? `[+${media.length} media]` : ''
    const replyMediaInfo = replyToMedia?.length ? `[+${replyToMedia.length} reply media]` : ''
    console.log(`📦 [TelegramService] Message: ${JSON.stringify(messageWithoutMedia)} ${mediaInfo} ${replyMediaInfo}`.trim())

    if (!this.isMonitoring) {
      console.log('⏸️ [TelegramService] Monitoring is not active, ignoring message')
      return
    }

    try {
      // Адаптер передаёт объект: { id, chatId, chatTitle, text, date, fromId, fromFirstName, fromLastName, fromUsername }
      const finalChatId = message.chatId || ''
      const chatTitle = message.chatTitle || `Chat ${finalChatId}`

      console.log(`📨 [TelegramService] Processing message from chat:`, {
        chatId: finalChatId,
        chatTitle,
        sender: message.fromId,
        senderName: message.fromFirstName,
        messageId: message.id
      })

      // Получаем информацию об отправителе из message (теперь приходит из адаптера)
      const fromUserId = message.fromId || 'unknown'
      const fromUsername = message.fromUsername || ''
      const fromFirstName = message.fromFirstName || 'User'
      const fromLastName = message.fromLastName || ''

      // Формируем полное имя пользователя
      const fullName = fromLastName
        ? `${fromFirstName} ${fromLastName}`
        : fromFirstName

      // Формируем username для отображения
      // username уже может прийти с @ из адаптера, убираем дублирование
      const usernameDisplay = fromUsername ? (fromUsername.startsWith('@') ? fromUsername : `@${fromUsername}`) : ''

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

      // 💎 КРИПТО-ПЛАТЕЖИ: Проверяем сообщения от @push/@Wallet
      const handled = await this.checkAndHandleCryptoPayment(processedMessage)
      if (handled) {
        KolsLogger.success(`Крипто-платёж обработан в чате ${finalChatId}`)
        return // Сообщение обработано как платёж, не продолжаем обычную обработку
      }

      // 📸 ФОТО-СЕССИИ: Накапливаем фото для генерации
      // Для личных чатов используем chatId как sessionUserId (в DM chatId = userId собеседника)
      // Для групп используем fromUserId
      const isPrivateChat = !finalChatId.startsWith('-') && parseInt(finalChatId) > 0
      const sessionUserId = isPrivateChat ? finalChatId : (fromUserId || finalChatId)

      const photoSessionHandled = await this.handlePhotoSession(message, finalChatId, sessionUserId)
      if (photoSessionHandled) {
        // Фото добавлено в сессию или сессия использована для генерации
        return
      }

      // 🛡️ КРИТИЧНО: Проверяем целевые чаты через ChatConfigService (динамически из БД)
      const chatConfigService = this.runtime?.getService<ChatConfigService>('chat-config')
      let chatConfig: ChatConfig | null = null

      if (chatConfigService) {
        // Пробуем получить конфиг из БД
        chatConfig = await chatConfigService.getConfig(finalChatId)
        console.log(`🎯 [TelegramService] ChatConfigService config for ${finalChatId}: ${chatConfig ? 'FOUND' : 'NOT FOUND'}`)
      }

      // Если нет конфига в БД - fallback на статический shouldProcessChat
      const isTargetFromConfig = chatConfig?.isActive ?? false
      const isTargetFromStatic = shouldProcessChat(finalChatId)
      const isTarget = isTargetFromConfig || isTargetFromStatic

      console.log(`🎯 [TelegramService] isTargetFromConfig=${isTargetFromConfig}, isTargetFromStatic=${isTargetFromStatic}, final=${isTarget}`)

      if (!isTarget) {
        console.log(`⏭️ [TelegramService] ПРОПУСК: Чат ${finalChatId} (${chatTitle}) не в целевом списке`)
        return
      }

      // Проверяем triggers и probability если есть конфиг
      if (chatConfig && !this.shouldRespondWithConfig(chatConfig, processedMessage.text)) {
        console.log(`⏭️ [TelegramService] ПРОПУСК: Триггеры не сработали и probability не прошла`)
        return
      }

      // Чат в целевом списке - обрабатываем!
      const shouldMonitor = true
      KolsLogger.success(`ЦЕЛЕВОЙ ЧАТ: ${chatTitle} (${finalChatId})${chatConfig ? ' [из БД]' : ' [статический]'}`)

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

        // 🤖 Обрабатываем сообщение через ElizaOS action system
        // Передаём chatConfig для динамической генерации промпта
        console.log(`🔥 [TelegramService] BEFORE handleMessageThroughActions - runtime: ${this.runtime ? 'SET' : 'NULL'}`)
        await this.handleMessageThroughActions(processedMessage, chatConfig)
        console.log(`✅ [TelegramService] AFTER handleMessageThroughActions`)
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
   * 🎯 Проверка trigger words и probability из ChatConfig
   * Определяет, должен ли бот отвечать на сообщение
   */
  private shouldRespondWithConfig(config: ChatConfig, messageText: string): boolean {
    // Если нет trigger words - используем probability
    if (!config.triggerWords || config.triggerWords.length === 0) {
      return Math.random() < config.responseProbability
    }

    // Проверяем trigger words
    const textLower = (messageText || '').toLowerCase()
    const hasTrigger = config.triggerWords.some(trigger =>
      textLower.includes(trigger.toLowerCase())
    )

    if (hasTrigger) {
      KolsLogger.info(`🎯 Триггер найден в конфиге чата`)
      return true
    }

    // Если нет trigger, но requireMention=false - используем probability
    if (!config.requireMention) {
      return Math.random() < config.responseProbability
    }

    return false
  }

  /**
   * Проверка личного чата (не группа)
   */
  private isPrivateChat(chatId: string): boolean {
    const id = parseInt(chatId, 10)
    // Личные чаты имеют ID > 0 и < 1000000000
    return id > 0 && id < 1000000000
  }

  /**
   * 🤖 Обработка сообщения через ElizaOS Action System
   * Сначала проверяем команды напрямую (без LLM), потом fallback на messageService
   */
  private async handleMessageThroughActions(processedMessage: any, chatConfig?: ChatConfig | null): Promise<void> {
    if (!this.runtime) {
      KolsLogger.warn('Runtime недоступен, пропускаем обработку')
      return
    }

    if (!this.autoReplyEnabled) {
      KolsLogger.debug('Авто-ответы отключены')
      return
    }

    try {
      const roomId = stringToUuid(`telegram-room-${processedMessage.chatId}`)
      const entityId = stringToUuid(`telegram-user-${processedMessage.fromUserId}`)
      const worldId = stringToUuid(`telegram-world`)

      // Создаём Memory объект для ElizaOS
      const memory: Memory = {
        id: stringToUuid(`telegram-${processedMessage.chatId}-${processedMessage.messageId}-${Date.now()}`),
        entityId: entityId as UUID,
        agentId: this.runtime.agentId,
        roomId: roomId as UUID,
        content: {
          text: processedMessage.text || '',
          source: 'telegram',
          // Метаданные для Actions (нужен Telegram ID для аватарки)
          metadata: {
            fromId: processedMessage.fromUserId,
            chatId: processedMessage.chatId,
            messageId: processedMessage.messageId,
            fromFirstName: processedMessage.fromFirstName,
            fromUsername: processedMessage.fromUsername,
          },
        },
        createdAt: Date.now(),
      }

      // Ensure connection exists
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

      // Callback для отправки ответа
      const callback = async (response: { text: string }) => {
        if (response.text) {
          KolsLogger.success(`🎯 Action ответ: "${response.text.substring(0, 50)}..."`)
          const result = await this.sendMessage(
            processedMessage.chatId,
            response.text,
            processedMessage.messageId
          )
          KolsLogger.info(`📤 Отправлено: ${JSON.stringify(result)}`)
        }
      }

      // 🔥 СНАЧАЛА: Прямая проверка admin-команд (без LLM)
      const text = (processedMessage.text || '').trim().toLowerCase()
      const actions = this.runtime.actions || []

      // Проверяем admin actions которые обрабатываются напрямую
      const adminActions = [
        // Character Configurator
        'START_CHARACTER_CONFIG',
        'RESTART_CHARACTER_CONFIG',
        'CHARACTER_CONFIG_HELP',
        'CHARACTER_CONFIG_STATUS',
        'PROCESS_CHARACTER_CONFIG_INPUT',
        // Config Management (Strategy Management Center)
        'CONFIG_STATUS',
        'CONFIG_LIST',
        'CONFIG_ADD',
        'CONFIG_REMOVE',
        // Strategy Management
        'STRATEGY_SHOW',
        'STRATEGY_TONE',
        'STRATEGY_SALES',
        'STRATEGY_TRIGGERS',
        // Content Generation (проверяются до LLM fallback!)
        'NANO_BANANA_GENERATE',
      ]

      for (const action of actions) {
        if (!adminActions.includes(action.name)) continue
        try {
          const isValid = await action.validate(this.runtime, memory)
          if (isValid) {
            KolsLogger.success(`🎯 Admin Action "${action.name}" прошёл validate для "${text}"`)
            await action.handler(this.runtime, memory, undefined, {}, callback)
            KolsLogger.success(`✅ Action "${action.name}" выполнен успешно`)
            return // Выходим - action обработал команду
          }
        } catch (actionError) {
          KolsLogger.warn(`Action ${action.name} ошибка: ${actionError}`)
        }
      }

      // Если не admin команда - используем LLM
      KolsLogger.info(`📝 Не admin команда, используем LLM для ответа`)
      await this.generateAndSendReply(processedMessage, chatConfig)

    } catch (error) {
      KolsLogger.error(`Ошибка handleMessageThroughActions: ${error}`)
      // Fallback
      await this.generateAndSendReply(processedMessage, chatConfig)
    }
  }

  /**
   * 🤖 FALLBACK: Генерация и отправка ответа VIBEE через LLM с RAG
   * Использует ChatConfig для динамической генерации system prompt
   */
  private async generateAndSendReply(processedMessage: any, chatConfig?: ChatConfig | null): Promise<void> {
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
      // История теперь НЕ показывает имена (они приходят из memory без userName)
      // Имя текущего пользователя добавляется в userPrompt
      const historyContext = conversationHistory.length > 0
        ? '\n\nПРЕДЫДУЩИЕ СООБЩЕНИЯ В ЧАТЕ:\n' + conversationHistory.map(m =>
            `${m.role === 'assistant' ? 'ВАЙБИ' : 'Участник'}: ${m.content}`
          ).join('\n')
        : ''

      // Текущий отправитель - важно для понимания кто пишет
      const senderName = processedMessage.fromFirstName || 'Участник'
      // fromUsername уже содержит @ если есть
      const senderUsername = processedMessage.fromUsername || ''
      const senderInfo = senderUsername ? `${senderName} (${senderUsername})` : senderName

      // 🎯 Динамический system prompt через PromptBuilderService (если есть chatConfig)
      let systemPrompt: string

      if (chatConfig) {
        // Используем PromptBuilderService для динамической генерации
        const promptBuilder = this.runtime?.getService<PromptBuilderService>('prompt-builder')

        if (promptBuilder) {
          const context = promptBuilder.createMessageContext(
            senderName,
            senderUsername.replace('@', ''), // убираем @ для контекста
            processedMessage.chatTitle
          )
          systemPrompt = promptBuilder.buildSystemPrompt(chatConfig, context)
          KolsLogger.success(`🎯 Использую динамический промпт из ChatConfig (persona: ${chatConfig.personaName})`)
        } else {
          // Fallback на промпт из конфига напрямую
          systemPrompt = chatConfig.systemPrompt || this.getDefaultSystemPrompt(senderInfo, historyContext, ragContext)
          KolsLogger.info(`📝 Использую systemPrompt из ChatConfig (без PromptBuilder)`)
        }

        // Добавляем историю и RAG к динамическому промпту
        if (historyContext) {
          systemPrompt += `\n\nЧТО БЫЛО В ЧАТЕ:${historyContext}`
        }
        if (ragContext) {
          systemPrompt += `\n\nИНФА ИЗ КНИГИ:\n${ragContext}`
        }
      } else {
        // Fallback на hardcoded VIBEE промпт
        systemPrompt = this.getDefaultSystemPrompt(senderInfo, historyContext, ragContext)
        KolsLogger.info(`📝 Использую дефолтный VIBEE промпт (нет ChatConfig)`)
      }

      const userPrompt = `${senderName}: "${messageText}"`

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

      // Пост-обработка: убираем "ВАЙБИ:" префикс если LLM его добавил
      let cleanedReply = llmReply.trim()
      if (cleanedReply.startsWith('ВАЙБИ:')) {
        cleanedReply = cleanedReply.slice(6).trim()
      } else if (cleanedReply.startsWith('Вайби:')) {
        cleanedReply = cleanedReply.slice(6).trim()
      }

      KolsLogger.success(`🎯 LLM ответ получен: "${cleanedReply.substring(0, 80)}..."`)

      // 🎭 Разбиваем на несколько сообщений для естественности (30% вероятность)
      const messageParts = splitIntoHumanLikeMessages(cleanedReply)
      KolsLogger.info(`📤 Отправка ${messageParts.length} сообщений в chatId: ${processedMessage.chatId}`)

      let lastResult: ISendMessageResult = { success: false }

      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i]

        // Первое сообщение - reply на оригинал, остальные - просто в чат
        const replyTo = i === 0 ? processedMessage.messageId : undefined

        const result = await this.sendMessage(
          processedMessage.chatId,
          part,
          replyTo
        )
        lastResult = result
        console.log(`📤 [TelegramService] Part ${i + 1}/${messageParts.length} sent:`, JSON.stringify(result))

        // Задержка между сообщениями (имитация набора текста)
        if (i < messageParts.length - 1) {
          await humanTypingDelay()
        }
      }

      // 🧠 Сохраняем полный ответ агента в память для истории диалога
      if (lastResult.success) {
        try {
          const agentMemory: Memory = {
            id: stringToUuid(`telegram-agent-${processedMessage.chatId}-${lastResult.messageId || Date.now()}`),
            entityId: this.runtime.agentId, // Это ответ агента
            agentId: this.runtime.agentId,
            roomId: roomId as UUID,
            content: {
              text: cleanedReply, // Сохраняем полный текст, не части
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
   * Дефолтный VIBEE system prompt (используется когда нет ChatConfig)
   */
  private getDefaultSystemPrompt(senderInfo: string, historyContext: string, ragContext: string): string {
    return `Ты ВАЙБИ - чувак который шарит в вайбкодинге и AI агентах. Общаешься в телеге с пацанами.

КТО ПИШЕТ: ${senderInfo}
Если Дмитрий - можно: Дим, Диман, Дима П, Дима беларус (не каждый раз)

ГЛАВНОЕ ПРАВИЛО - ОТВЕЧАЙ ПО СУЩЕСТВУ:
- на стёб отвечай стёбом
- на дело отвечай по делу
- можно подъебнуть если к месту
- мемы и шутки норм но не форсить
- ничего не навязывай - не цыгане

КАК ПИСАТЬ:
- как живой человек в чате
- скобочки ) только когда подьёбываешь
- можно проебывать запятые
- смех: ха, хах, хаха, ахах, лол, кек (чередуй)
- смайлики редко и к месту
- НЕ пиши "ВАЙБИ:" в начале

ЗАПРЕЩЕНО:
- "Отличный вопрос!"
- "Давай разберёмся..."
- структурированные ответы с пунктами
- умные слова: имплементация, интеграция, оптимизация
- странный сленг: прудовый агент, heartbeat, рой

ПРО КУРС - только если спросят:
VIBECODER 3500$/год, 52 созвона, свой бот
@neuro_sage

${historyContext ? `ЧТО БЫЛО В ЧАТЕ:${historyContext}` : ''}

${ragContext ? `ИНФА ИЗ КНИГИ:\n${ragContext}` : ''}`
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

  // ====================
  // Multi-User Support
  // ====================

  /**
   * Инициализация AuthService для авторизации пользователей
   */
  initializeAuthService(): TelegramAuthService | null {
    if (this.authService) return this.authService

    const apiId = process.env.TELEGRAM_API_ID
    const apiHash = process.env.TELEGRAM_API_HASH
    const dbUrl = process.env.DATABASE_URL

    if (!apiId || !apiHash) {
      console.warn('[TelegramService] Cannot initialize AuthService - missing TELEGRAM_API_ID/HASH')
      return null
    }

    this.authService = new TelegramAuthService(parseInt(apiId), apiHash, dbUrl || '')
    console.log('[TelegramService] AuthService initialized')
    return this.authService
  }

  /**
   * Получить AuthService
   */
  getAuthService(): TelegramAuthService | null {
    return this.authService || this.initializeAuthService()
  }

  /**
   * Получить или создать адаптер для конкретного пользователя
   * Загружает session string из БД и создаёт MTProtoAdapter
   */
  async getOrCreateUserAdapter(userId: string): Promise<MTProtoAdapter | null> {
    // Проверяем кэш
    const cached = this.userAdapters.get(userId)
    if (cached && cached.isConnected()) {
      return cached
    }

    // Инициализируем AuthService если нужно
    const authService = this.getAuthService()
    if (!authService) {
      console.warn(`[TelegramService] AuthService not available for user ${userId}`)
      return null
    }

    // Получаем account пользователя из БД
    const account = await authService.getUserAccount(userId)
    if (!account || !account.isActive) {
      console.log(`[TelegramService] No active account for user ${userId}`)
      return null
    }

    try {
      const apiId = parseInt(process.env.TELEGRAM_API_ID || '0')
      const apiHash = process.env.TELEGRAM_API_HASH || ''

      // Создаём новый адаптер с session string пользователя
      const adapter = new MTProtoAdapter({
        apiId,
        apiHash,
        session: account.sessionString,
      })

      // Подключаемся
      const connected = await adapter.connect()
      if (!connected) {
        console.error(`[TelegramService] Failed to connect user adapter for ${userId}`)
        return null
      }

      // Кэшируем
      this.userAdapters.set(userId, adapter)
      console.log(`[TelegramService] User adapter created and connected for ${userId}`)

      return adapter
    } catch (error) {
      console.error(`[TelegramService] Error creating user adapter:`, error)
      return null
    }
  }

  /**
   * Отправить сообщение от имени пользователя (используя его session)
   */
  async sendMessageAsUser(
    userId: string,
    chatId: string,
    message: string,
    replyTo?: number
  ): Promise<ISendMessageResult> {
    const adapter = await this.getOrCreateUserAdapter(userId)
    if (!adapter) {
      return {
        success: false,
        error: 'User adapter not available. User may need to connect their Telegram account.'
      }
    }

    try {
      return await adapter.sendMessage(chatId, message, replyTo)
    } catch (error) {
      console.error(`[TelegramService] Error sending message as user ${userId}:`, error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Получить диалоги пользователя (его личные чаты)
   */
  async getUserDialogs(userId: string, limit: number = 20): Promise<ITelegramDialog[]> {
    const adapter = await this.getOrCreateUserAdapter(userId)
    if (!adapter) {
      return []
    }

    try {
      return await adapter.getDialogs(limit)
    } catch (error) {
      console.error(`[TelegramService] Error getting dialogs for user ${userId}:`, error)
      return []
    }
  }

  /**
   * Получить информацию о Telegram аккаунте пользователя
   */
  async getUserTelegramInfo(userId: string): Promise<ITelegramUser | null> {
    const adapter = await this.getOrCreateUserAdapter(userId)
    if (!adapter) {
      return null
    }

    try {
      return await adapter.getMe()
    } catch (error) {
      console.error(`[TelegramService] Error getting user info for ${userId}:`, error)
      return null
    }
  }

  /**
   * Отключить адаптер пользователя (при disconnect)
   */
  async disconnectUserAdapter(userId: string): Promise<void> {
    const adapter = this.userAdapters.get(userId)
    if (adapter) {
      try {
        await adapter.disconnect()
      } catch (error) {
        console.error(`[TelegramService] Error disconnecting user adapter:`, error)
      }
      this.userAdapters.delete(userId)
      console.log(`[TelegramService] User adapter disconnected for ${userId}`)
    }
  }

  /**
   * Проверить, подключен ли пользователь
   */
  isUserConnected(userId: string): boolean {
    const adapter = this.userAdapters.get(userId)
    return adapter ? adapter.isConnected() : false
  }

  /**
   * Получить количество подключенных пользователей
   */
  getConnectedUsersCount(): number {
    let count = 0
    this.userAdapters.forEach(adapter => {
      if (adapter.isConnected()) count++
    })
    return count
  }

  // ====================
  // Photo Sessions
  // ====================

  /**
   * Обработка фото-сессий: накопление фото для генерации
   *
   * Логика:
   * 1. Если сообщение с фото - добавить в сессию, отправить подтверждение
   * 2. Если сообщение с текстом + есть накопленные фото - запустить генерацию
   * 3. Если reply на сообщение с фото + текст - использовать то фото для генерации
   *
   * @returns true если сообщение было обработано как часть фото-сессии
   */
  private async handlePhotoSession(
    message: any,
    chatId: string,
    userId: string
  ): Promise<boolean> {
    if (!this.runtime) return false

    try {
      // Получаем PhotoSessionService
      const photoService = this.runtime.getService<PhotoSessionService>('photo-session')
      if (!photoService) {
        // Сервис не зарегистрирован - пропускаем
        console.log('⚠️ [PhotoSession] PhotoSessionService не найден в runtime!')
        return false
      }

      const hasMedia = message.media && message.media.length > 0
      const hasReplyMedia = message.replyToMedia && message.replyToMedia.length > 0
      const hasText = message.text && message.text.trim().length > 0

      console.log(`🔍 [PhotoSession] Проверка: hasMedia=${hasMedia}, hasText=${hasText}, hasPhotosInSession=${photoService.hasPhotos(chatId, userId)}`)

      // Режим 1: Сообщение с фото (накапливаем)
      if (hasMedia) {
        const photos = message.media
          .filter((m: any) => m.type === 'photo' && m.url)
          .map((m: any) => m.url)

        if (photos.length > 0) {
          const count = photoService.addPhotos(chatId, userId, photos, message.id)

          // Генерируем уникальное подтверждение через LLM
          const confirmMsg = await this.generatePhotoConfirmation(count, photos.length)
          await this.sendMessage(chatId, confirmMsg)
          console.log(`📸 [PhotoSession] ${chatId}/${userId}: добавлено ${photos.length} фото, всего ${count}`)
          return true
        }
      }

      // Режим 2: Reply на фото с текстом (прямая генерация с одним фото)
      if (hasReplyMedia && hasText && message.replyToMsgId) {
        const replyPhotos = message.replyToMedia
          .filter((m: any) => m.type === 'photo' && m.url)
          .map((m: any) => m.url)

        if (replyPhotos.length > 0) {
          // Используем фото из reply для генерации
          console.log(`📸 [PhotoSession] Reply mode: ${replyPhotos.length} фото из reply, промпт: "${message.text?.substring(0, 50)}..."`)

          // Запускаем генерацию через NanoBanana
          await this.triggerPhotoGeneration(chatId, userId, replyPhotos, message.text)
          return true
        }
      }

      // Режим 3: Текст + накопленные фото от самого пользователя
      if (hasText && photoService.hasPhotos(chatId, userId)) {
        const sessionPhotos = photoService.getPhotos(chatId, userId)
        const prompt = message.text

        console.log(`📸 [PhotoSession] Session mode (user): ${sessionPhotos.length} фото в сессии, промпт: "${prompt?.substring(0, 50)}..."`)

        // Очищаем сессию перед генерацией
        photoService.clearSession(chatId, userId)

        // Запускаем генерацию через NanoBanana
        await this.triggerPhotoGeneration(chatId, userId, sessionPhotos, prompt)
        return true
      }

      // Режим 4: Групповой - текст с триггером + фото от ЛЮБЫХ пользователей чата
      // Триггеры: "оживи", "сделай", "выбери", "сгенерируй", "нарисуй", "создай"
      const groupTriggers = [
        'оживи', 'оживлю', 'сделай', 'выбери', 'выберите',
        'сгенерируй', 'нарисуй', 'создай', 'генерируй', 'генерим',
        'давай', 'поехали', 'погнали', 'go', 'жги', 'запускай', 'старт',
        '/gen', '/generate', '/image'
      ]
      const lowerText = (message.text || '').toLowerCase()
      const hasGroupTrigger = groupTriggers.some(t => lowerText.includes(t))

      if (hasText && hasGroupTrigger && photoService.hasAnyPhotosInChat(chatId)) {
        const { photos: allPhotos, userIds } = photoService.getAllPhotosFromChat(chatId)
        const prompt = message.text

        console.log(`📸 [PhotoSession] Group mode: ${allPhotos.length} фото от ${userIds.length} пользователей, промпт: "${prompt?.substring(0, 50)}..."`)

        // Очищаем ВСЕ сессии чата
        photoService.clearAllSessionsInChat(chatId)

        // Запускаем генерацию с ВСЕМИ фото
        await this.triggerPhotoGeneration(chatId, userId, allPhotos, prompt)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ [PhotoSession] Ошибка обработки:', error)
      return false
    }
  }

  /**
   * Запуск генерации изображения через NanoBanana action
   *
   * @param chatId - ID чата для отправки результата
   * @param userId - ID пользователя
   * @param photos - массив base64 URL фото
   * @param prompt - текстовый промпт
   */
  private async triggerPhotoGeneration(
    chatId: string,
    userId: string,
    photos: string[],
    prompt: string
  ): Promise<void> {
    if (!this.runtime) return

    try {
      // Определяем aspect ratio и resolution из текста пользователя
      const aspectRatio = this.extractAspectRatio(prompt)
      const resolution = this.extractResolution(prompt)

      // Отправляем статус
      const formatLabel = aspectRatio === '1:1' ? 'квадрат' :
                          aspectRatio === '16:9' ? 'горизонталь' :
                          aspectRatio === '9:16' ? 'вертикаль' :
                          aspectRatio === '4:3' ? '4:3' : '3:4'
      const qualityLabel = resolution === '4K' ? ', 4K' : ''
      const statusMsg = photos.length > 1
        ? `Генерирую из ${photos.length} фото (${formatLabel}${qualityLabel})...`
        : `Генерирую (${formatLabel}${qualityLabel})...`
      await this.sendMessage(chatId, statusMsg)

      // Получаем NanoBananaService напрямую (надёжнее чем через action)
      const nanoBanana = this.runtime.getService<NanoBananaService>('nano-banana')

      if (!nanoBanana || !nanoBanana.isAvailable()) {
        console.error('❌ [PhotoSession] NanoBananaService not available')
        await this.sendMessage(chatId, 'Сервис генерации временно недоступен. Проверьте REPLICATE_API_KEY.')
        return
      }

      console.log(`🍌 [PhotoSession] Generating with ${photos.length} photos, aspect: ${aspectRatio}, resolution: ${resolution}, prompt: "${prompt.substring(0, 50)}..."`)

      // Генерируем через NanoBananaService напрямую
      const result = photos.length >= 2
        ? await nanoBanana.blendImages(photos, prompt, { aspectRatio, resolution })
        : await nanoBanana.generate({
            prompt,
            images: photos,
            aspectRatio,
            resolution,
            outputFormat: 'jpg',
          })

      if (!result.success || !result.imageUrl) {
        console.error(`❌ [PhotoSession] Generation failed: ${result.error}`)
        await this.sendMessage(chatId, `Ошибка генерации: ${result.error || 'неизвестная ошибка'}`)
        return
      }

      console.log(`✅ [PhotoSession] Generated image: ${result.imageUrl}`)

      // Отправляем результат
      const caption = photos.length > 1
        ? `Создано из ${photos.length} фото: ${prompt}`
        : `Сгенерировано: ${prompt}`

      await this.sendPhoto(chatId, result.imageUrl, caption)

    } catch (error) {
      console.error('❌ [PhotoSession] Ошибка генерации:', error)
      await this.sendMessage(chatId, 'Ошибка генерации. Попробуйте ещё раз.')
    }
  }

  /**
   * Извлечь aspect ratio из текста пользователя
   * По умолчанию 9:16 (вертикальный, оптимально для Stories/Reels)
   */
  private extractAspectRatio(text: string): '1:1' | '4:3' | '16:9' | '3:4' | '9:16' {
    const lower = text.toLowerCase()

    // Квадрат
    if (lower.includes('квадрат') || lower.includes('square') || lower.includes('1:1')) {
      return '1:1'
    }

    // Горизонтальный (широкий)
    if (lower.includes('горизонт') || lower.includes('широк') || lower.includes('landscape') ||
        lower.includes('wide') || lower.includes('16:9')) {
      return '16:9'
    }

    // 4:3 (классический)
    if (lower.includes('4:3') || lower.includes('классич')) {
      return '4:3'
    }

    // 3:4 (портрет но не такой узкий)
    if (lower.includes('3:4')) {
      return '3:4'
    }

    // Вертикальный (явно указан)
    if (lower.includes('вертикал') || lower.includes('portrait') || lower.includes('stories') ||
        lower.includes('reels') || lower.includes('9:16')) {
      return '9:16'
    }

    // По умолчанию вертикальный (оптимально для соцсетей)
    return '9:16'
  }

  /**
   * Извлечь resolution из текста пользователя
   * По умолчанию 2K (баланс качества и скорости)
   */
  private extractResolution(text: string): '2K' | '4K' {
    const lower = text.toLowerCase()

    // Если явно указано 4K или максимальное качество
    if (lower.includes('4k') || lower.includes('макс') || lower.includes('hd') ||
        lower.includes('высок') || lower.includes('качеств') || lower.includes('лучш')) {
      return '4K'
    }

    // По умолчанию 2K (баланс качества и скорости)
    return '2K'
  }

  /**
   * Генерация уникального подтверждения о добавлении фото через LLM
   */
  private async generatePhotoConfirmation(totalCount: number, addedCount: number): Promise<string> {
    if (!this.runtime) {
      return `Фото добавлено (${totalCount}/14).\nНапишите "сделай" или опишите что хотите получить.`
    }

    try {
      const isMaxReached = totalCount >= 14
      const isFirst = totalCount === addedCount
      const isMultiple = addedCount > 1

      // При первом фото — даём подробную инструкцию
      if (isFirst) {
        return `Принял ${isMultiple ? `${addedCount} фото` : 'фото'} (${totalCount}/14).

Как использовать:
- Добавьте ещё фото (до 14 штук)
- Напишите "сделай" или что хотите получить

Примеры: "оживи", "сделай коллаж", "сгенерируй пост"`
      }

      const prompt = `Ты AI-ассистент для генерации фото. Напиши КОРОТКОЕ (1 предложение) подтверждение на русском.

Контекст:
- Пользователь ${isMultiple ? `добавил ${addedCount} фото` : 'добавил фото'}
- Всего в сессии: ${totalCount} из 14 фото
- ${isMaxReached ? 'Достигнут максимум!' : 'Можно добавить ещё'}

Правила:
- БЕЗ эмодзи
- Укажи счётчик (${totalCount}/14)
- Коротко напомни: "напишите что сделать" или "пишите промпт"
- ${isMaxReached ? 'Скажи что пора писать промпт' : ''}

Примеры:
- "Принял (${totalCount}/14). Ещё фото или пишите что сделать."
- "Есть ${totalCount}/14. Добавляйте ещё или напишите промпт."
- "${totalCount}/14 в копилке. Когда готовы — пишите что делаем."

Напиши ТОЛЬКО подтверждение:`

      const response = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt,
        maxTokens: 100,
        temperature: 0.9, // Высокая температура для разнообразия
      })

      const text = typeof response === 'string' ? response : response?.text || ''
      const cleanText = text.trim().replace(/^["']|["']$/g, '')

      if (cleanText && cleanText.length > 5 && cleanText.length < 200) {
        return cleanText
      }

      // Fallback если LLM вернул мусор
      return isMaxReached
        ? `Готово, ${totalCount}/14. Напишите что сделать с фото.`
        : `Принял (${totalCount}/14). Ещё фото или напишите что сделать.`

    } catch (error) {
      console.error('[PhotoSession] Ошибка генерации подтверждения:', error)
      return `Фото добавлено (${totalCount}/14). Напишите "сделай" или что хотите получить.`
    }
  }

  // ====================
  // Crypto Payments
  // ====================

  /**
   * Проверить и обработать крипто-платёж от @push/@Wallet
   * @param processedMessage - обработанное сообщение
   * @returns true если сообщение было обработано как платёж
   */
  private async checkAndHandleCryptoPayment(processedMessage: {
    text: string
    fromUserId: string
    fromUsername: string
    chatId: string
    messageId: number
  }): Promise<boolean> {
    if (!this.runtime) return false

    try {
      // Получаем CryptoPaymentService
      const cryptoService = this.runtime.getService<CryptoPaymentService>('crypto-payment')
      if (!cryptoService) {
        // Сервис не зарегистрирован - это нормально если крипто-платежи отключены
        return false
      }

      // Проверяем сообщение на крипто-платёж
      const payment = cryptoService.checkForCryptoPayment({
        text: processedMessage.text,
        fromUsername: processedMessage.fromUsername,
        messageId: processedMessage.messageId,
      })

      if (!payment) {
        return false // Не платёж
      }

      KolsLogger.info(`💎 Обнаружен крипто-платёж: ${payment.amount} ${payment.currency}`)

      // Рассчитываем фото-кредиты
      const credits = cryptoService.calculatePhotoCredits(payment)
      if (credits <= 0) {
        KolsLogger.warn(`Платёж ${payment.amount} ${payment.currency} дал 0 кредитов`)
        return true // Обработано, но без зачисления
      }

      // Получаем PaymentService для зачисления
      const paymentService = this.runtime.getService<PaymentService>('payment')
      if (!paymentService) {
        KolsLogger.error('PaymentService не найден - невозможно зачислить кредиты')
        return true
      }

      // Зачисляем кредиты
      // TODO: Нужно определить userId получателя (не отправителя бота @push)
      // Пока используем chatId как proxy для личного чата
      const recipientUserId = processedMessage.chatId // В личном чате chatId == userId

      paymentService.addPhotoCredits(recipientUserId, credits, 'crypto', {
        currency: payment.currency,
        amount: payment.amount,
      })

      // Отправляем подтверждение
      const successMessage = cryptoService.generateSuccessMessage(payment, credits)
      await this.sendMessage(processedMessage.chatId, successMessage)

      KolsLogger.success(`✅ Зачислено ${credits} фото-кредитов пользователю ${recipientUserId}`)

      return true
    } catch (error) {
      KolsLogger.error(`Ошибка обработки крипто-платежа: ${error}`)
      return false
    }
  }
}
