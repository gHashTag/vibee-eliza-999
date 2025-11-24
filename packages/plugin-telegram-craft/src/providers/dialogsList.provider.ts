import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Dialogs List Provider
 * 
 * Предоставляет контекст списка диалогов Telegram для LLM
 */
export const dialogsListProvider: Provider = {
  name: 'dialogsList',
  
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
      
      // Получение диалогов
      const dialogs = await service.getDialogs(20)
      
      // Форматирование для LLM
      const formattedDialogs = dialogs
        .slice(0, 15)
        .map((d, i) => `${i + 1}. ${d.name} (ID: ${d.id}) - ${d.unreadCount} unread`)
        .join('\n')
      
      return {
        text: `
# 📋 Telegram Dialogs List

## Active Chats

${formattedDialogs}

---
**Total dialogs**: ${dialogs.length}
**Last updated**: ${new Date().toLocaleString()}
        `.trim(),
        values: {
          dialogCount: dialogs.length,
          dialogs: dialogs.map(d => ({
            id: d.id,
            name: d.name,
            unread: d.unreadCount,
          })),
        },
        data: {
          raw: dialogs,
        },
      }
    } catch (error) {
      console.error(' Error in dialogsListProvider:', error)
      return {
        text: '',
        values: {},
      }
    }
  },
}
