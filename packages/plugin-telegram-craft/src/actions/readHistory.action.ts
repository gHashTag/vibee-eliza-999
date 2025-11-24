import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'
import { ReadHistoryInputSchema } from '../schemas/actions.schema'

/**
 * READ_TELEGRAM_HISTORY Action
 * 
 * Читает историю сообщений из Telegram чата
 * 
 * Использование:
 * - "/history @username"
 * - "покажи историю чата"
 */
export const readHistoryAction: Action = {
  name: 'READ_TELEGRAM_HISTORY',
  similes: ['GET_TG_HISTORY', 'TELEGRAM_HISTORY', 'TG_HISTORY'],
  description: 'Читает историю сообщений из Telegram чата (userbot)',
  
  // Валидация
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase()
    if (!text) return false
    
    const commands = ['/history', '/tghistory', 'telegram history']
    const intents = [
      'покажи историю',
      'прочитай сообщения из',
      'что писали в',
      'show history',
      'read messages from',
    ]
    
    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent))
  },
  
  // Обработчик
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      // 1. Извлечение параметров
      const params = extractHistoryParams(message, state)
      
      // 2. Валидация через Zod
      const validatedInput = ReadHistoryInputSchema.parse(params)
      
      // 3. Получение сервиса
      const service = runtime.getService<TelegramService>('telegram-craft')
      if (!service) {
        throw new Error('Telegram service not available')
      }
      
      // 4. Уведомление
      await callback?.({
        text: `📜 Читаю историю из ${validatedInput.chatId}...`,
      })
      
      // 5. Получение истории
      const messages = await service.getHistory(
        validatedInput.chatId,
        validatedInput.limit
      )
      
      // 6. Форматирование результата
      const formattedMessages = messages
        .slice(0, 10) // Ограничение для отображения
        .map(msg => `[${new Date(msg.date * 1000).toLocaleTimeString()}] ${msg.sender}: ${msg.text}`)
        .join('\n')
      
      await callback?.({
        text: `✅ История чата ${validatedInput.chatId}\n\n${formattedMessages}\n\n📊 Всего сообщений: ${messages.length}`,
      })
      
      return {
        success: true,
        data: {
          messages,
          chatId: validatedInput.chatId,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await callback?.({
        text: `❌ Ошибка чтения истории:\n${errorMessage}`,
      })
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  },
  
  // Примеры
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/history @mygroup' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '✅ История чата получена',
          action: 'READ_TELEGRAM_HISTORY',
        },
      },
    ],
  ],
}

function extractHistoryParams(message: Memory, state: State | undefined): {
  chatId: string
  limit: number
} {
  const text = message.content?.text || ''
  
  // /history @username [limit]
  const match = text.match(/\/history\s+(@?\w+)(?:\s+(\d+))?/i)
  
  if (match) {
    return {
      chatId: match[1],
      limit: match[2] ? parseInt(match[2]) : 10,
    }
  }
  
  return {
    chatId: message.roomId || 'me',
    limit: 10,
  }
}
