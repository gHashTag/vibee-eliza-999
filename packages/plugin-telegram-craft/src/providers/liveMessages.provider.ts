import { Provider, IAgentRuntime, Memory } from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Live Messages Provider
 *
 * Показывает последние сообщения из групп Telegram прямо в чате с агентом
 * Пользователь видит ВСЕ сообщения в реальном времени
 */
export const liveMessagesProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const service = runtime.getService<TelegramService>('telegram-craft')

      if (!service) {
        return 'Telegram сервис не инициализирован'
      }

      // Получаем статистику
      const stats = service.getMonitoringStats()
      const groups = service.getMonitoredGroups()
      const recentMessages = service.getRecentMessages(20) // Последние 20 сообщений

      if (!service.isGroupMonitoringActive()) {
        return `📡 Мониторинг групп: Остановлен

💡 Отправь "запусти мониторинг групп" чтобы начать слушать сообщения`
      }

      if (recentMessages.length === 0) {
        return `📡 Мониторинг активен

📊 Статистика:
• Групп в мониторинге: ${stats.totalGroups}
• Сообщений обработано: ${stats.totalMessages}
• Время работы: ${Math.floor(stats.uptime / 1000 / 60)} минут

⏳ Ожидаем новые сообщения из групп...`
      }

      // Форматируем последние сообщения
      const messagesText = recentMessages
        .slice(0, 10) // Показываем последние 10
        .map(msg => {
          const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          })
          const text = msg.text.length > 100
            ? msg.text.substring(0, 100) + '...'
            : msg.text

          return `[${time}] 📨 ${msg.chatTitle}
  ${msg.fromUsername}: ${text}`
        })
        .join('\n\n')

      return `📡 Мониторинг активен | 📊 Обработано: ${stats.totalMessages} сообщений

📬 Последние сообщения из групп:

${messagesText}

---
💡 Сообщения обновляются в реальном времени`
    } catch (error) {
      console.error('❌ Error in liveMessagesProvider:', error)
      return 'Ошибка получения сообщений'
    }
  },
}

export default liveMessagesProvider
