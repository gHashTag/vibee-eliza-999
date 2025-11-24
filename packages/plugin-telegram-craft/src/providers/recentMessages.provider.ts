import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Recent Messages Provider
 * 
 * Предоставляет контекст последних сообщений из Telegram чата для LLM
 */
export const recentMessagesProvider: Provider = {
  name: 'recentMessages',
  
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<ProviderResult> => {
    try {
      const service = runtime.getService<TelegramService>('telegram-craft')
      if (!service || !service.isConnected()) {
        return {
          text: '',
          values: {},
        }
      }
      
      // Получение chatId из контекста
      const chatId = message.roomId || 'me'
      
      // Получение последних 10 сообщений
      const messages = await service.getHistory(chatId, 10)
      
      // Форматирование для LLM
      const formattedMessages = messages
        .map(msg => {
          const time = new Date(msg.date * 1000).toLocaleTimeString()
          return `[${time}] ${msg.sender}: ${msg.text}`
        })
        .join('\n')
      
      return {
        text: `
# 💬 Recent Telegram Messages

## Chat: ${chatId}

\`\`\`
${formattedMessages}
\`\`\`

---
**Total messages**: ${messages.length}
**Last updated**: ${new Date().toLocaleString()}
        `.trim(),
        values: {
          chatId,
          messageCount: messages.length,
          messages: messages.map(m => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
          })),
        },
        data: {
          raw: messages,
        },
      }
    } catch (error) {
      console.error('Error in recentMessagesProvider:', error)
      return {
        text: '',
        values: {},
      }
    }
  },
}
