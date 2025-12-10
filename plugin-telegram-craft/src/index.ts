// @ts-nocheck
/**
 * Telegram Craft Plugin - Main Entry Point
 *
 * ElizaOS plugin для управления Telegram через userbot (MTProto)
 *
 * Компоненты:
 * - Actions: getDialogsAction
 * - Providers: VibeCodingKnowledgeProvider (RAG)
 * - Evaluators: ResponseQuality, FactExtraction, GoalTracking
 * - Routes: HTTP API (/telegram/status, /telegram/dialogs, /telegram/send)
 * - Services: TelegramService (GramJS MTProto)
 * - Security: TelegramSanitizer, InputValidator
 */

// Main plugin export
export { telegramCraftPlugin as default } from './plugin'
export { telegramCraftPlugin } from './plugin'

// Actions
export { getDialogsAction } from './actions/getDialogs.action'
export { telegramAuthActions } from './actions/telegramAuth.action'

// Auth Service
export { TelegramAuthService } from './services/telegram-auth.service'

// Providers
export {
  vibeCodingKnowledgeProvider,
  VibeCodingKnowledgeProvider,
} from './providers/VibeCodingKnowledgeProvider'

// Evaluators
export {
  responseQualityEvaluator,
  factExtractionEvaluator,
  goalTrackingEvaluator,
} from './evaluators'

// Routes
export { getTelegramRoutes } from './routes'

// Services
export { TelegramService } from './services/telegram.service'
export { PaymentService, PRICES } from './services/payment.service'
export { CryptoPaymentService, CRYPTO_RATES } from './services/cryptoPayment.service'

// Security
export { TelegramSanitizer, InputValidator } from './security'

// Config
export {
  getCredentials,
  hasValidCredentials,
  TARGET_CHATS,
  isTargetChat,
  isPrivateChat,
  shouldProcessChat,
  containsTrigger,
  findTriggers,
  KOLS_CONFIG,
} from './config'
