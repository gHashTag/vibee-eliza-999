import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'
import { SendMessageInputSchema } from '../schemas/actions.schema'

/**
 * SEND_TELEGRAM_MESSAGE Action
 * 
 * Отправляет сообщение в Telegram чат через userbot
 * 
 * Использование:
 * - "/send @username сообщение"
 * - "отправь в telegram сообщение"
 */
export const sendMessageAction: Action = {
  name: 'SEND_TELEGRAM_MESSAGE',
  similes: ['SEND_TG_MESSAGE', 'TELEGRAM_SEND', 'TG_SEND'],
  description: 'Отправляет сообщение в Telegram чат через userbot (MTProto)',
  
  // Валидация - когда использовать action
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase()
    if (!text) return false
    
    // Триггеры для action
    const commands = ['/send', '/tgsend', 'telegram send']
    const intents = [
      'отправь в telegram',
      'отправить сообщение в tg',
      'написать в телеграм',
      'send to telegram',
    ]
    
    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent))
  },
  
  // Обработчик действия
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      // 1. Извлечение параметров
      const params = extractSendMessageParams(message, state)
      
      // 2. Валидация через Zod
      const validatedInput = SendMessageInputSchema.parse(params)
      
      // 3. Получение сервиса
      const service = runtime.getService<TelegramService>('telegram-craft')
      if (!service) {
        throw new Error('Telegram service not available')
      }
      
      // 4. Уведомление пользователя
      await callback?.({
        text: `📤 Отправляю сообщение в ${validatedInput.chatId}...`,
      })
      
      // 5. Отправка сообщения
      const result = await service.sendMessage(
        validatedInput.chatId,
        validatedInput.message,
        validatedInput.replyTo
      )
      
      // 6. Успешный результат
      await callback?.({
        text: `✅ Сообщение отправлено!\n\n📨 Chat ID: ${validatedInput.chatId}\n📝 Message ID: ${result.messageId}`,
      })
      
      return {
        success: true,
        data: {
          messageId: result.messageId,
          chatId: validatedInput.chatId,
          date: result.date,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await callback?.({
        text: `❌ Ошибка отправки сообщения:\n${errorMessage}`,
      })
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  },
  
  // Примеры для обучения LLM
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/send @john Hello from ElizaOS!' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '✅ Сообщение отправлено!',
          action: 'SEND_TELEGRAM_MESSAGE',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Отправь в telegram сообщение привет всем' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '📤 Отправляю сообщение...',
          action: 'SEND_TELEGRAM_MESSAGE',
        },
      },
    ],
  ],
}

/**
 * Вспомогательная функция для извлечения параметров
 */
function extractSendMessageParams(message: Memory, state: State | undefined): {
  chatId: string
  message: string
  replyTo?: number
} {
  const text = message.content?.text || ''
  
  // Простое извлечение: /send @username текст сообщения
  const match = text.match(/\/send\s+(@?\w+)\s+(.+)/i)
  
  if (match) {
    return {
      chatId: match[1],
      message: match[2],
    }
  }
  
  // Fallback: использовать roomId как chatId
  return {
    chatId: message.roomId || 'me',
    message: text,
  }
}
