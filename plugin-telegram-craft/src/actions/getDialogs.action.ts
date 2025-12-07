// @ts-nocheck
import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from '@elizaos/core'
import { z } from 'zod'
import { TelegramService } from '../services/telegram.service'

/**
 * Inline schema for GetDialogs input
 */
const GetDialogsInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
})

/**
 * GET_TELEGRAM_DIALOGS Action
 *
 * Получает список диалогов/чатов Telegram
 */
export const getDialogsAction: Action = {
  name: 'GET_TELEGRAM_DIALOGS',
  similes: ['LIST_TG_CHATS', 'TELEGRAM_CHATS', 'TG_DIALOGS'],
  description: 'Получает список диалогов и чатов из Telegram (userbot)',

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase()
    if (!text) return false

    const commands = ['/dialogs', '/chats', '/tgdialogs']
    const intents = [
      'покажи мои чаты',
      'список диалогов',
      'мои telegram чаты',
      'show my chats',
      'list dialogs',
    ]

    return (
      commands.some((cmd) => text.includes(cmd)) ||
      intents.some((intent) => text.includes(intent))
    )
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const params = extractDialogsParams(message)
      const validatedInput = GetDialogsInputSchema.parse(params)

      const service = runtime.getService<TelegramService>('telegram-craft')
      if (!service) {
        throw new Error('Telegram service not available')
      }

      await callback?.({
        text: 'Получаю список диалогов...',
      })

      const dialogs = await service.getDialogs(validatedInput.limit)

      const formattedDialogs = dialogs
        .slice(0, 15)
        .map(
          (d, i) =>
            `${i + 1}. **${d.name}** (ID: \`${d.id}\`) - ${d.unreadCount} непрочитанных`
        )
        .join('\n')

      await callback?.({
        text: `Ваши диалоги Telegram:\n\n${formattedDialogs}\n\nВсего: ${dialogs.length} диалогов`,
      })

      return {
        success: true,
        data: { dialogs },
      }
    } catch (error) {
      await callback?.({
        text: `Ошибка получения диалогов:\n${error instanceof Error ? error.message : 'Unknown error'}`,
      })

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/dialogs' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Список диалогов получен',
          action: 'GET_TELEGRAM_DIALOGS',
        },
      },
    ],
  ],
}

function extractDialogsParams(message: Memory): { limit: number } {
  const text = message.content?.text || ''
  const match = text.match(/\/dialogs\s+(\d+)/i)

  return {
    limit: match ? parseInt(match[1]) : 20,
  }
}
