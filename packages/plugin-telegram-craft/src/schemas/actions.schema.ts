import { z } from 'zod'
import { TelegramChatIdSchema } from './telegram.schema'

/**
 * SEND_MESSAGE Action Schema
 */
export const SendMessageInputSchema = z.object({
  chatId: TelegramChatIdSchema,
  message: z.string()
    .min(1, 'Сообщение не может быть пустым')
    .max(4096, 'Сообщение слишком длинное (макс. 4096 символов)'),
  replyTo: z.number().int().positive().optional(),
})

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>

export const SendMessageOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    messageId: z.number().int().positive(),
    chatId: z.string(),
    date: z.number().int().positive(),
  }).optional(),
  error: z.string().optional(),
})

export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>

/**
 * READ_HISTORY Action Schema
 */
export const ReadHistoryInputSchema = z.object({
  chatId: TelegramChatIdSchema,
  limit: z.number().int().positive().max(100).default(10),
})

export type ReadHistoryInput = z.infer<typeof ReadHistoryInputSchema>

export const ReadHistoryOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    messages: z.array(z.object({
      id: z.number(),
      text: z.string(),
      sender: z.string(),
      date: z.number(),
    })),
    chatId: z.string(),
  }).optional(),
  error: z.string().optional(),
})

export type ReadHistoryOutput = z.infer<typeof ReadHistoryOutputSchema>

/**
 * GET_DIALOGS Action Schema
 */
export const GetDialogsInputSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
})

export type GetDialogsInput = z.infer<typeof GetDialogsInputSchema>

export const GetDialogsOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    dialogs: z.array(z.object({
      id: z.string(),
      name: z.string(),
      unreadCount: z.number(),
    })),
  }).optional(),
  error: z.string().optional(),
})

export type GetDialogsOutput = z.infer<typeof GetDialogsOutputSchema>

/**
 * GET_USER Action Schema
 */
export const GetUserInputSchema = z.object({
  userId: z.string().min(1),
})

export type GetUserInput = z.infer<typeof GetUserInputSchema>

export const GetUserOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    username: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
})

export type GetUserOutput = z.infer<typeof GetUserOutputSchema>

/**
 * JOIN_CHAT Action Schema
 */
export const JoinChatInputSchema = z.object({
  chatId: TelegramChatIdSchema,
})

export type JoinChatInput = z.infer<typeof JoinChatInputSchema>

/**
 * FORWARD_MESSAGE Action Schema
 */
export const ForwardMessageInputSchema = z.object({
  fromChatId: TelegramChatIdSchema,
  toChatId: TelegramChatIdSchema,
  messageId: z.number().int().positive(),
})

export type ForwardMessageInput = z.infer<typeof ForwardMessageInputSchema>
