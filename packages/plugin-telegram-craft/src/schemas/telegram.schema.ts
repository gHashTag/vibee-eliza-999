import { z } from 'zod'

/**
 * Конфигурация плагина Telegram Craft
 */
export const TelegramConfigSchema = z.object({
  TELEGRAM_API_ID: z.string().min(1, 'TELEGRAM_API_ID обязателен'),
  TELEGRAM_API_HASH: z.string().min(1, 'TELEGRAM_API_HASH обязателен'),
  TELEGRAM_SESSION: z.string().optional(),
  TELEGRAM_STRATEGY: z.enum(['mtproto', 'botapi', 'mcp']).default('mtproto'),
  TELEGRAM_BOT_TOKEN: z.string().optional(), // Для Bot API fallback
  TELEGRAM_PHONE: z.string().optional(), // Для MTProto auth
  TELEGRAM_PASSWORD: z.string().optional(),
  TELEGRAM_MONITORING_CHANNEL_ID: z.string().optional(),
})

export type TelegramConfig = z.infer<typeof TelegramConfigSchema>

/**
 * Базовые Telegram типы с валидацией
 */
export const TelegramChatIdSchema = z.string().min(1, 'Chat ID не может быть пустым')

export const TelegramMessageSchema = z.object({
  id: z.number().int().positive(),
  text: z.string(),
  sender: z.string(),
  date: z.number().int().positive(),
  chatId: z.string().optional(),
})

export const TelegramDialogSchema = z.object({
  id: z.string(),
  name: z.string(),
  unreadCount: z.number().int().nonnegative(),
  lastMessage: TelegramMessageSchema.optional(),
})

export const TelegramUserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
})
