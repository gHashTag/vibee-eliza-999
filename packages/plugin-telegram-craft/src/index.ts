/**
 * Telegram Craft Plugin - Main Entry Point
 * 
 * ElizaOS plugin для управления Telegram через userbot (MTProto)
 */

// Main plugin export
export { telegramCraftPlugin as default } from './plugin'
export { telegramCraftPlugin } from './plugin'

// Actions
export { sendMessageAction } from './actions/sendMessage.action'
export { readHistoryAction } from './actions/readHistory.action'
export { getDialogsAction } from './actions/getDialogs.action'
export { startGroupMonitoringAction } from './actions/startGroupMonitoring.action'
export { addGroupToMonitorAction } from './actions/addGroupToMonitor.action'

// Providers
export { recentMessagesProvider } from './providers/recentMessages.provider'
export { dialogsListProvider } from './providers/dialogsList.provider'
export { capabilitiesProvider } from './providers/capabilities.provider'

// Services
export { TelegramService } from './services/telegram.service'

// Adapters
export { MTProtoAdapter } from './services/adapters/mtproto.adapter'
export { BotApiAdapter } from './services/adapters/botapi.adapter'
export { McpAdapter } from './services/adapters/mcp.adapter'

// Types
export type {
  ITelegramAdapter,
  ITelegramConfig,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
} from './types/telegram.types'

// Schemas
export {
  TelegramConfigSchema,
  TelegramChatIdSchema,
  TelegramMessageSchema,
  TelegramDialogSchema,
  TelegramUserSchema,
} from './schemas/telegram.schema'

export {
  SendMessageInputSchema,
  ReadHistoryInputSchema,
  GetDialogsInputSchema,
  GetUserInputSchema,
  JoinChatInputSchema,
  ForwardMessageInputSchema,
} from './schemas/actions.schema'
