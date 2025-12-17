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

// Main plugin export - ONLY EXPORT DEFAULT PLUGIN
export { telegramCraftPlugin as default } from './plugin'
