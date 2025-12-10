// @ts-nocheck
import { Plugin, IAgentRuntime } from '@elizaos/core'

// Actions
import { getDialogsAction } from './actions/getDialogs.action'
import { telegramAuthActions } from './actions/telegramAuth.action'
import { configStatusAction } from './actions/configStatus.action'
import { configListAction } from './actions/configList.action'
import { configAddAction } from './actions/configAdd.action'
import { configRemoveAction } from './actions/configRemove.action'
import {
  strategyShowAction,
  strategyToneAction,
  strategySalesAction,
  strategyTriggersAction,
} from './actions/strategyUpdate.action'
import { nanoBananaAction } from './actions/nanoBanana.action'

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
import { ChatConfigService } from './services/chatConfig.service'
import { PromptBuilderService } from './services/promptBuilder.service'
import { KnowledgeService } from './services/knowledge.service'
import { NanoBananaService } from './services/nanoBanana.service'
import { ProactiveAvatarService } from './services/proactiveAvatar.service'
import { PaymentService } from './services/payment.service'
import { CryptoPaymentService } from './services/cryptoPayment.service'
import { PhotoSessionService } from './services/photoSession.service'

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
  actions: [
    getDialogsAction,
    ...telegramAuthActions,
    // Config Management Actions
    configStatusAction,
    configListAction,
    configAddAction,
    configRemoveAction,
    // Strategy Update Actions
    strategyShowAction,
    strategyToneAction,
    strategySalesAction,
    strategyTriggersAction,
    // Nano Banana Pro - генерация изображений и лидмагнитов
    nanoBananaAction,
  ],

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
   * Services - фоновые сервисы (передаём классы, не экземпляры!)
   * ElizaOS автоматически создаст экземпляры и зарегистрирует их
   * - TelegramService: MTProto через GramJS
   * - ChatConfigService: Управление конфигурациями чатов
   * - PromptBuilderService: Динамическая генерация промптов
   * - KnowledgeService: RAG и embeddings через Ollama
   */
  services: [
    TelegramService,
    ChatConfigService,
    PromptBuilderService,
    KnowledgeService,
    NanoBananaService,
    ProactiveAvatarService,
    PaymentService,
    CryptoPaymentService,
    PhotoSessionService,
  ],

  /**
   * Инициализация плагина
   * NOTE: Сервисы автоматически инициализируются ElizaOS из массива services[]
   */
  init: async (config, runtime) => {
    console.log('[telegram-craft] Initializing plugin...')

    try {
      // Получаем credentials из character secrets и устанавливаем в env
      const apiId = config.TELEGRAM_API_ID || process.env.TELEGRAM_API_ID
      const apiHash = config.TELEGRAM_API_HASH || process.env.TELEGRAM_API_HASH
      const sessionString =
        config.TELEGRAM_SESSION_STRING || process.env.TELEGRAM_SESSION_STRING

      if (!apiId || !apiHash) {
        console.warn(
          '[telegram-craft] Missing TELEGRAM_API_ID or TELEGRAM_API_HASH - MTProto disabled'
        )
      }

      // Установка env переменных для использования сервисами
      if (apiId) process.env.TELEGRAM_API_ID = String(apiId)
      if (apiHash) process.env.TELEGRAM_API_HASH = String(apiHash)
      if (sessionString)
        process.env.TELEGRAM_SESSION_STRING = String(sessionString)

      // Логируем статистику компонентов
      console.log(`[telegram-craft] Plugin initialized successfully`)
      console.log(`  Actions: ${telegramCraftPlugin.actions?.length || 0}`)
      console.log(`  Providers: ${telegramCraftPlugin.providers?.length || 0}`)
      console.log(`  Evaluators: ${telegramCraftPlugin.evaluators?.length || 0}`)
      console.log(`  Services: ${telegramCraftPlugin.services?.length || 0}`)
    } catch (error) {
      console.error('[telegram-craft] Failed to initialize:', error)
    }
  },
}

export default telegramCraftPlugin
