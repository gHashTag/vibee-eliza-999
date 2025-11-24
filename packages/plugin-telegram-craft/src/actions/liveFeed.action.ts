import { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Live Feed Action
 *
 * Автоматически показывает сообщения из Telegram групп в чате с агентом
 * Работает постоянно в фоне и отправляет каждое новое сообщение пользователю
 */
export const liveFeedAction: Action = {
  name: 'LIVE_FEED',
  similes: ['live feed', 'live messages', 'show live', 'real-time', 'включи трансляцию', 'покажи онлайн'],
  description: 'Показывает сообщения из Telegram групп в реальном времени прямо в чате',

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Активируется если пользователь просит показать сообщения онлайн
    const text = message.content.text.toLowerCase()
    return text.includes('трансляц') ||
           text.includes('онлайн') ||
           text.includes('live') ||
           text.includes('покажи сообщения') ||
           text.includes('что в группах')
  },

  handler: async (runtime, message, state, options, callback) => {
    try {
      const service = runtime.getService<TelegramService>('telegram-craft')

      if (!service) {
        await callback({
          text: 'Telegram сервис не инициализирован',
          error: true
        })
        return { success: false, text: 'Service not found' }
      }

      // Получаем последние сообщения
      const recentMessages = service.getRecentMessages(10)
      const stats = service.getMonitoringStats()

      if (recentMessages.length === 0) {
        await callback({
          text: `📡 Мониторинг активен

📊 Статистика:
• Обработано сообщений: ${stats.totalMessages}
• Время работы: ${Math.floor(stats.uptime / 1000 / 60)} минут

⏳ Ожидаем новые сообщения...
💡 Как только придет новое сообщение - я сразу покажу!`,
          action: 'LIVE_FEED'
        })

        return {
          success: true,
          text: 'No messages yet'
        }
      }

      // Форматируем сообщения
      const messagesText = recentMessages.map(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        return `[${time}] 📨 **${msg.chatTitle}**
👤 ${msg.fromUsername}: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? '...' : ''}`
      }).join('\n\n---\n\n')

      await callback({
        text: `📡 **Трансляция сообщений из Telegram**

📊 Обработано: ${stats.totalMessages} сообщений

${messagesText}

---
✅ Обновляется автоматически при каждом новом сообщении`,
        action: 'LIVE_FEED'
      })

      return {
        success: true,
        text: 'Live feed activated',
        data: {
          messageCount: recentMessages.length,
          totalMessages: stats.totalMessages
        }
      }
    } catch (error) {
      console.error('❌ Live Feed Action error:', error)
      await callback({
        text: 'Ошибка получения сообщений из Telegram',
        error: true
      })

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: 'покажи сообщения из групп' }
      },
      {
        name: 'assistant',
        content: {
          text: '📡 Показываю последние сообщения из Telegram групп...',
          action: 'LIVE_FEED'
        }
      }
    ],
    [
      {
        name: 'user',
        content: { text: 'что происходит в группах?' }
      },
      {
        name: 'assistant',
        content: {
          text: 'Сейчас проверю последние сообщения в ваших группах',
          action: 'LIVE_FEED'
        }
      }
    ]
  ] as ActionExample[][]
}

export default liveFeedAction
