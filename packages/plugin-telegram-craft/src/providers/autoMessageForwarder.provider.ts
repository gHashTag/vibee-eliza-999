import { Provider } from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Auto Message Forwarder Provider
 *
 * Автоматически пересылает ВСЕ новые сообщения из Telegram групп
 * в активные чаты с агентом в реальном времени
 *
 * Этот provider работает в фоне и не требует команд для активации
 */
export const autoMessageForwarderProvider: Provider = {
  name: 'AUTO_MESSAGE_FORWARDER',
  description: 'Автоматическая пересылка сообщений из Telegram групп в чат',

  get: async (runtime, message) => {
    // Получаем Telegram сервис
    const telegramService = runtime.getService<TelegramService>('telegram-craft')
    if (!telegramService) {
      return null
    }

    // Устанавливаем distributor только один раз
    if (!telegramService.hasMessageDistributor()) {
      // Создаем distributor который будет отправлять сообщения в текущий чат
      const distributor = (messageText: string) => {
        // Сохраняем сообщение для следующего ответа
        // Оно будет отправлено при следующем взаимодействии
        runtime.addMemory({
          id: `auto-forward-${Date.now()}`,
          content: {
            text: messageText,
            action: 'AUTO_FORWARD_MESSAGE',
            type: 'auto-forward'
          },
          roomId: message.roomId || 'default',
          userId: 'system',
          createdAt: new Date()
        })
      }

      // Устанавливаем distributor
      telegramService.setMessageDistributor(distributor)
      console.log('✅ [AutoForwarder] Message distributor активирован')
    }

    return null // Provider не возвращает текст, он работает в фоне
  },
}

export default autoMessageForwarderProvider
