// @ts-nocheck
import { Plugin, IAgentRuntime } from '@elizaos/core'

// Actions
import { getDialogsAction } from './actions/getDialogs.action'

// Providers
import { vibeCodingKnowledgeProvider } from './providers/VibeCodingKnowledgeProvider'

// Evaluators
import {
  responseQualityEvaluator,
  factExtractionEvaluator,
  goalTrackingEvaluator,
} from './evaluators'

// Routes (временно отключены - см. комментарий в routes секции)
// import { getTelegramRoutes } from './routes'

// Services
import { TelegramService } from './services/telegram.service'

/**
 * Telegram Craft Plugin
 *
 * ElizaOS plugin для управления Telegram через userbot (MTProto via GramJS)
 *
 * Компоненты:
 * - Actions: getDialogsAction - получение диалогов
 * - Providers: VibeCodingKnowledgeProvider - RAG для обучения
 * - Evaluators: ResponseQuality, FactExtraction, GoalTracking
 * - Routes: HTTP API для управления (/telegram/status, /telegram/dialogs, etc.)
 * - Services: TelegramService - MTProto через GramJS
 */
export const telegramCraftPlugin: Plugin = {
  name: 'telegram-craft',
  description:
    'ElizaOS plugin для Telegram userbot через MTProto (GramJS) с RAG, Evaluators и HTTP API',

  /**
   * Actions - что агент может делать
   */
  actions: [getDialogsAction],

  /**
   * Providers - контекст для LLM
   */
  providers: [vibeCodingKnowledgeProvider],

  /**
   * Evaluators - анализ ответов и автоматические действия
   */
  evaluators: [
    responseQualityEvaluator,
    factExtractionEvaluator,
    goalTrackingEvaluator,
  ],

  /**
   * Routes - HTTP API endpoints
   * NOTE: Routes временно отключены - getTelegramRoutes требует runtime,
   * но ElizaOS 1.6.x ожидает статический массив routes.
   * TODO: Переделать routes чтобы получать runtime из request или init()
   */
  // routes: getTelegramRoutes as unknown as Plugin['routes'],

  /**
   * Services - фоновые сервисы
   */
  services: [new TelegramService()],

  /**
   * Инициализация плагина
   */
  init: async (config, runtime) => {
    console.log('[telegram-craft] Initializing plugin...')

    try {
      // Получаем credentials из character secrets
      const apiId = config.TELEGRAM_API_ID || process.env.TELEGRAM_API_ID
      const apiHash = config.TELEGRAM_API_HASH || process.env.TELEGRAM_API_HASH
      const sessionString =
        config.TELEGRAM_SESSION_STRING || process.env.TELEGRAM_SESSION_STRING

      if (!apiId || !apiHash) {
        console.warn(
          '[telegram-craft] Missing TELEGRAM_API_ID or TELEGRAM_API_HASH - MTProto disabled'
        )
        return
      }

      // Установка env переменных для runtime
      if (apiId) process.env.TELEGRAM_API_ID = String(apiId)
      if (apiHash) process.env.TELEGRAM_API_HASH = String(apiHash)
      if (sessionString)
        process.env.TELEGRAM_SESSION_STRING = String(sessionString)

      // Инициализируем TelegramService с runtime
      const telegramService = telegramCraftPlugin.services?.[0] as TelegramService
      if (telegramService && runtime) {
        console.log('[telegram-craft] Initializing TelegramService...')
        await telegramService.initialize(runtime)
        console.log('[telegram-craft] TelegramService initialized!')
      } else {
        console.warn('[telegram-craft] TelegramService or runtime not available')
      }

      // Логируем статистику компонентов
      console.log(`[telegram-craft] Plugin initialized successfully`)
      console.log(`  Actions: ${telegramCraftPlugin.actions?.length || 0}`)
      console.log(`  Providers: ${telegramCraftPlugin.providers?.length || 0}`)
      console.log(`  Evaluators: ${telegramCraftPlugin.evaluators?.length || 0}`)
      console.log(`  Services: ${telegramCraftPlugin.services?.length || 0}`)
      console.log(`  Routes: enabled`)
    } catch (error) {
      console.error('[telegram-craft] Failed to initialize:', error)
      // Не throw - позволяем агенту работать без Telegram
    }
  },
}

export default telegramCraftPlugin
