import { Evaluator } from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Message Auto Forward Evaluator
 *
 * Автоматически отправляет новые сообщения из Telegram групп
 * пользователю при каждом его сообщении в чат
 *
 * Это гарантирует что пользователь видит все новые сообщения
 */
export const messageAutoForwardEvaluator: Evaluator = {
  name: 'MESSAGE_AUTO_FORWARD',

  // Срабатывает при каждом сообщении
  shouldRun: async (runtime, message) => {
    // Всегда срабатываем (высокий приоритет)
    return true
  },

  evaluate: async (runtime, message, state) => {
    try {
      const telegramService = runtime.getService<TelegramService>('telegram-craft')
      if (!telegramService) {
        return { success: false, confidence: 0 }
      }

      // Получаем новые сообщения с момента последнего запроса
      const recentMessages = telegramService.getRecentMessages(5)

      // Сохраняем время последней проверки
      const lastCheck = state?.lastMessageCheck || 0
      const newMessages = recentMessages.filter(msg =>
        msg.timestamp.getTime() > lastCheck
      )

      // Если есть новые сообщения - отправляем их
      if (newMessages.length > 0) {
        console.log(`📤 [AutoForward] Отправляю ${newMessages.length} новых сообщений`)

        // Формируем текст с новыми сообщениями
        const messagesText = newMessages.map(msg => {
          const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          return `[${time}] 📨 **${msg.chatTitle}**
👤 ${msg.fromUsername}: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? '...' : ''}`
        }).join('\n\n---\n\n')

        // Добавляем в состояние для отправки
        return {
          success: true,
          confidence: 1,
          data: {
            newMessages: newMessages.length,
            autoForwardText: `📡 **Новые сообщения из Telegram (${newMessages.length}):**

${messagesText}

---
🔄 Ожидаю новые сообщения...`
          }
        }
      }

      return { success: true, confidence: 0.1 }
    } catch (error) {
      console.error('❌ [AutoForward] Error:', error)
      return { success: false, confidence: 0 }
    }
  },

  // Выполняется после evaluate
  handler: async (runtime, message, state, callback) => {
    try {
      // Если есть текст для автопересылки - отправляем
      if (state?.autoForwardText) {
        await callback({
          text: state.autoForwardText,
          action: 'MESSAGE_AUTO_FORWARD'
        })
        console.log('✅ [AutoForward] Сообщения отправлены')
      }
    } catch (error) {
      console.error('❌ [AutoForward] Handler error:', error)
    }
  },
}

export default messageAutoForwardEvaluator
