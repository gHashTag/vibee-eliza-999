// @ts-nocheck
/**
 * Telegram Auth Actions
 *
 * Обработка команд для авторизации пользователей в userbot
 * Позволяет пользователям привязать свой Telegram аккаунт
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'
import { TelegramAuthService, AuthState } from '../services/telegram-auth.service'

// Синглтон сервиса авторизации
let authService: TelegramAuthService | null = null

function getAuthService(runtime: IAgentRuntime): TelegramAuthService {
  if (!authService) {
    // Получаем credentials из character settings
    const settings = runtime.character?.settings?.secrets || {}
    const apiId = parseInt(settings.TELEGRAM_API_ID || process.env.TELEGRAM_API_ID || '0', 10)
    const apiHash = settings.TELEGRAM_API_HASH || process.env.TELEGRAM_API_HASH || ''
    const dbUrl = settings.DATABASE_URL || process.env.DATABASE_URL || ''

    if (!apiId || !apiHash) {
      throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH are required for user authorization')
    }

    authService = new TelegramAuthService(apiId, apiHash, dbUrl)
  }
  return authService
}

/**
 * Action для начала авторизации (/connect_telegram)
 */
export const connectTelegramAction: Action = {
  name: 'TELEGRAM_CONNECT',
  description: 'Начать процесс привязки Telegram аккаунта пользователя',
  similes: ['connect_telegram', 'привязать телеграм', 'подключить аккаунт'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/connect_telegram' } },
      { name: '{{agent}}', content: { text: 'Для привязки аккаунта введи номер телефона...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/connect_telegram' || text === 'привязать телеграм'
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId

    console.log(`[TelegramAuth] CONNECT command: chatId=${chatId}, userId=${userId}`)

    try {
      const service = getAuthService(runtime)

      // Проверяем, есть ли уже привязанный аккаунт
      const existingAccount = await service.getUserAccount(userId)
      if (existingAccount && existingAccount.isActive) {
        await callback({
          text: `✅ У тебя уже привязан аккаунт: ${existingAccount.firstName || ''} (@${existingAccount.username || 'без username'})\n\nТелефон: ${existingAccount.phone}\n\nЧтобы отвязать аккаунт, напиши /disconnect_telegram`,
        })
        return
      }

      await callback({
        text: `📱 **Привязка Telegram аккаунта**

Чтобы привязать свой аккаунт, отправь номер телефона в формате:
\`+79991234567\`

⚠️ **Важно:**
• Используй номер, привязанный к твоему Telegram
• Код придёт в Telegram (не SMS!)
• Сессия авторизации действует 5 минут

Отправь номер телефона:`,
      })
    } catch (error) {
      console.error('[TelegramAuth] Error in CONNECT:', error)
      await callback({
        text: '❌ Ошибка при запуске авторизации. Попробуй позже.',
      })
    }
  },
}

/**
 * Action для обработки номера телефона
 */
export const authPhoneAction: Action = {
  name: 'TELEGRAM_AUTH_PHONE',
  description: 'Обработка номера телефона для авторизации',
  similes: [],
  examples: [],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim() || ''

    // Проверяем формат номера телефона
    const phoneRegex = /^\+?[0-9]{10,15}$/
    if (!phoneRegex.test(text.replace(/[\s\-\(\)]/g, ''))) {
      return false
    }

    // Проверяем, ожидаем ли мы номер телефона (нет активной сессии)
    try {
      const service = getAuthService(runtime)
      const chatId = message.roomId
      const status = await service.getAuthStatus(chatId)

      // Принимаем номер если нет сессии или сессия expired/failed
      return !status || status.state === 'expired' || status.state === 'failed'
    } catch {
      return true // Если сервис не инициализирован, пропускаем
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId
    const phone = (message.content as any)?.text?.trim().replace(/[\s\-\(\)]/g, '') || ''

    console.log(`[TelegramAuth] PHONE received: chatId=${chatId}, phone=${phone.substring(0, 5)}***`)

    try {
      const service = getAuthService(runtime)
      const result = await service.requestCode(chatId, phone)

      if (result.success) {
        await callback({
          text: `✅ Код отправлен в Telegram!

📲 Открой приложение Telegram и найди сообщение с кодом от официального аккаунта Telegram.

Введи код из сообщения (5 цифр):`,
        })
      } else {
        await callback({
          text: `❌ Ошибка: ${result.error}\n\nПроверь номер и попробуй снова.`,
        })
      }
    } catch (error) {
      console.error('[TelegramAuth] Error requesting code:', error)
      await callback({
        text: '❌ Не удалось отправить код. Проверь номер телефона и попробуй снова.',
      })
    }
  },
}

/**
 * Action для обработки кода авторизации
 */
export const authCodeAction: Action = {
  name: 'TELEGRAM_AUTH_CODE',
  description: 'Обработка кода авторизации из Telegram',
  similes: [],
  examples: [],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim() || ''

    // Проверяем формат кода (5 цифр)
    const codeRegex = /^[0-9]{5}$/
    if (!codeRegex.test(text)) {
      return false
    }

    // Проверяем, ожидаем ли мы код
    try {
      const service = getAuthService(runtime)
      const chatId = message.roomId
      const status = await service.getAuthStatus(chatId)

      return status?.state === 'pending_code'
    } catch {
      return false
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId
    const code = (message.content as any)?.text?.trim() || ''

    console.log(`[TelegramAuth] CODE received: chatId=${chatId}`)

    try {
      const service = getAuthService(runtime)
      const result = await service.verifyCode(chatId, userId, code)

      if (result.success) {
        if (result.requires2FA) {
          await callback({
            text: `🔐 Требуется двухфакторная аутентификация!

Введи пароль от Cloud Password (2FA):`,
          })
        } else {
          await callback({
            text: `✅ **Аккаунт успешно привязан!**

👤 ${result.user?.firstName || ''} ${result.user?.lastName || ''}
📱 @${result.user?.username || 'без username'}

Теперь бот может отправлять сообщения от твоего имени.

Команды:
• /telegram_status - проверить статус
• /disconnect_telegram - отвязать аккаунт`,
          })
        }
      } else {
        const attemptsLeft = result.attemptsLeft || 0
        if (attemptsLeft > 0) {
          await callback({
            text: `❌ Неверный код. Осталось попыток: ${attemptsLeft}\n\nВведи код ещё раз:`,
          })
        } else {
          await callback({
            text: `❌ ${result.error}\n\nНачни заново: /connect_telegram`,
          })
        }
      }
    } catch (error) {
      console.error('[TelegramAuth] Error verifying code:', error)
      await callback({
        text: '❌ Ошибка проверки кода. Попробуй снова или начни заново: /connect_telegram',
      })
    }
  },
}

/**
 * Action для обработки 2FA пароля
 */
export const auth2FAAction: Action = {
  name: 'TELEGRAM_AUTH_2FA',
  description: 'Обработка пароля двухфакторной аутентификации',
  similes: [],
  examples: [],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim() || ''

    // Пароль может быть любым непустым текстом
    if (!text || text.startsWith('/')) {
      return false
    }

    // Проверяем, ожидаем ли мы 2FA пароль
    try {
      const service = getAuthService(runtime)
      const chatId = message.roomId
      const status = await service.getAuthStatus(chatId)

      return status?.state === 'pending_2fa'
    } catch {
      return false
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId
    const password = (message.content as any)?.text?.trim() || ''

    console.log(`[TelegramAuth] 2FA password received: chatId=${chatId}`)

    try {
      const service = getAuthService(runtime)
      const result = await service.verify2FA(chatId, userId, password)

      if (result.success) {
        await callback({
          text: `✅ **Аккаунт успешно привязан!**

👤 ${result.user?.firstName || ''} ${result.user?.lastName || ''}
📱 @${result.user?.username || 'без username'}

Теперь бот может отправлять сообщения от твоего имени.

Команды:
• /telegram_status - проверить статус
• /disconnect_telegram - отвязать аккаунт`,
        })
      } else {
        await callback({
          text: `❌ ${result.error}\n\nНачни заново: /connect_telegram`,
        })
      }
    } catch (error) {
      console.error('[TelegramAuth] Error verifying 2FA:', error)
      await callback({
        text: '❌ Ошибка проверки пароля. Попробуй снова или начни заново: /connect_telegram',
      })
    }
  },
}

/**
 * Action для отключения аккаунта (/disconnect_telegram)
 */
export const disconnectTelegramAction: Action = {
  name: 'TELEGRAM_DISCONNECT',
  description: 'Отвязать привязанный Telegram аккаунт',
  similes: ['disconnect_telegram', 'отвязать телеграм', 'отключить аккаунт'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/disconnect_telegram' || text === 'отвязать телеграм'
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId

    console.log(`[TelegramAuth] DISCONNECT command: chatId=${chatId}, userId=${userId}`)

    try {
      const service = getAuthService(runtime)
      const result = await service.disconnectAccount(userId)

      if (result.success) {
        await callback({
          text: `✅ Аккаунт отвязан.\n\nЧтобы привязать снова: /connect_telegram`,
        })
      } else {
        await callback({
          text: `❌ ${result.error}`,
        })
      }
    } catch (error) {
      console.error('[TelegramAuth] Error disconnecting:', error)
      await callback({
        text: '❌ Ошибка при отвязке аккаунта.',
      })
    }
  },
}

/**
 * Action для проверки статуса (/telegram_status)
 */
export const telegramStatusAction: Action = {
  name: 'TELEGRAM_STATUS',
  description: 'Проверить статус привязанного Telegram аккаунта',
  similes: ['telegram_status', 'статус телеграм'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/telegram_status' || text === 'статус телеграм'
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId

    console.log(`[TelegramAuth] STATUS command: chatId=${chatId}, userId=${userId}`)

    try {
      const service = getAuthService(runtime)
      const account = await service.getUserAccount(userId)

      if (account && account.isActive) {
        const lastUsed = account.lastUsedAt
          ? new Date(account.lastUsedAt).toLocaleString('ru-RU')
          : 'никогда'

        await callback({
          text: `📱 **Статус Telegram аккаунта**

✅ Аккаунт привязан

👤 Имя: ${account.firstName || ''} ${account.lastName || ''}
📱 Username: @${account.username || 'не указан'}
📞 Телефон: ${account.phone}
🕐 Последнее использование: ${lastUsed}

Команды:
• /disconnect_telegram - отвязать аккаунт`,
        })
      } else {
        await callback({
          text: `📱 **Статус Telegram аккаунта**

❌ Аккаунт не привязан

Чтобы привязать аккаунт: /connect_telegram`,
        })
      }
    } catch (error) {
      console.error('[TelegramAuth] Error getting status:', error)
      await callback({
        text: '❌ Ошибка получения статуса.',
      })
    }
  },
}

/**
 * Все actions для авторизации Telegram
 */
export const telegramAuthActions: Action[] = [
  connectTelegramAction,
  authPhoneAction,
  authCodeAction,
  auth2FAAction,
  disconnectTelegramAction,
  telegramStatusAction,
]
