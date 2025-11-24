import { Plugin } from '@elizaos/core'

// Actions
import { sendMessageAction } from './actions/sendMessage.action'
import { readHistoryAction } from './actions/readHistory.action'
import { getDialogsAction } from './actions/getDialogs.action'
import { startGroupMonitoringAction } from './actions/startGroupMonitoring.action'
import { addGroupToMonitorAction } from './actions/addGroupToMonitor.action'
import { liveFeedAction } from './actions/liveFeed.action'

// Providers
import { recentMessagesProvider } from './providers/recentMessages.provider'
import { dialogsListProvider } from './providers/dialogsList.provider'
import { capabilitiesProvider } from './providers/capabilities.provider'
import { liveMessagesProvider } from './providers/liveMessages.provider'
import { autoMessageForwarderProvider } from './providers/autoMessageForwarder.provider'

// Evaluators
import { messageAutoForwardEvaluator } from './evaluators/messageAutoForward.evaluator'

// Services
import { TelegramService } from './services/telegram.service'

// Schemas
import { TelegramConfigSchema } from './schemas/telegram.schema'

/**
 * Telegram Craft Plugin
 * 
 * ElizaOS plugin для управления Telegram через userbot (MTProto via GramJS)
 * 
 * Поддерживаемые стратегии:
 * - MTProto (GramJS) - Primary (полный userbot функционал)
 * - Bot API (Telegraf) - Fallback #1 (официальный API)
 * - MCP Server - Fallback #2 (стандартизированный протокол)
 */
export const telegramCraftPlugin: Plugin = {
  name: 'telegram-craft',
  description: 'ElizaOS plugin для Telegram userbot через MTProto (GramJS) с fallback стратегиями',
  
  /**
   * Actions - что агент может делать
   */
  actions: [
    sendMessageAction,
    readHistoryAction,
    getDialogsAction,
    startGroupMonitoringAction,
    addGroupToMonitorAction,
    liveFeedAction, // 📺 Live feed сообщений из групп
  ],
  
  /**
   * Providers - контекст для LLM
   */
  providers: [
    recentMessagesProvider,
    dialogsListProvider,
    capabilitiesProvider,
    liveMessagesProvider, // 🔥 Показывает ВСЕ сообщения из групп в реальном времени
    autoMessageForwarderProvider, // 🔄 Автоматическая пересылка сообщений в чат
  ],

  /**
   * Evaluators - анализ и автоматические действия
   */
  evaluators: [
    messageAutoForwardEvaluator, // 📡 Автоматически отправляет новые сообщения
  ],
  
  /**
   * Services - фоновые сервисы
   */
  services: [new TelegramService()],
  
  /**
   * Инициализация плагина
   */
  init: async (config, runtime) => {
    console.log('🔧 Initializing Telegram Craft Plugin...')

    try {
      // Валидация конфигурации через Zod
      const validatedConfig = await TelegramConfigSchema.parseAsync({
        TELEGRAM_API_ID: config.TELEGRAM_API_ID || process.env.TELEGRAM_API_ID,
        TELEGRAM_API_HASH: config.TELEGRAM_API_HASH || process.env.TELEGRAM_API_HASH,
        TELEGRAM_SESSION: config.TELEGRAM_SESSION_STRING || process.env.TELEGRAM_SESSION_STRING,
        TELEGRAM_STRATEGY: config.TELEGRAM_STRATEGY || process.env.TELEGRAM_STRATEGY || 'mtproto',
        TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_PHONE: config.TELEGRAM_PHONE || process.env.TELEGRAM_PHONE,
        TELEGRAM_PASSWORD: config.TELEGRAM_PASSWORD || process.env.TELEGRAM_PASSWORD,
      })

      // Установка env переменных для runtime
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) {
          process.env[key] = String(value)
        }
      }

      // ✅ TELEГРАМ СЕРВИС УЖЕ ЗАРЕГИСТРИРОВАН!
      // ElizaOS автоматически регистрирует все сервисы из plugin.services array
      // Он сам вызовет TelegramService.start(runtime) для каждого сервиса

      console.log('✅ [Plugin] TelegramService will be auto-registered by ElizaOS')
      console.log('🔍 [Plugin] Services in plugin definition:', telegramCraftPlugin.services?.length || 0)
      console.log('🔍 [Plugin] Service types:', telegramCraftPlugin.services?.map(s => (s as any).serviceType))

      console.log(`✅ Telegram Craft Plugin initialized with strategy: ${validatedConfig.TELEGRAM_STRATEGY}`)
      console.log(`📦 Registered ${telegramCraftPlugin.actions?.length || 0} actions`)
      console.log(`📡 Registered ${telegramCraftPlugin.providers?.length || 0} providers`)
      console.log(`⚙️  Registered ${telegramCraftPlugin.services?.length || 0} services`)
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Craft Plugin:', error)
      throw error
    }
  },
}

export default telegramCraftPlugin
