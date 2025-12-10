// @ts-nocheck
/**
 * Config Wizard Action
 *
 * Обработка сообщений для пошаговой конфигурации Character
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'
import { configuratorService } from '../services/configurator.service.ts'
import { QUESTIONS, HELP_TEXT, COMMANDS } from '../templates/questions.ts'
import { ConfigStep } from '../types/session.types.ts'

/**
 * Action для запуска конфигурации (/create_character)
 */
export const startConfigAction: Action = {
  name: 'START_CHARACTER_CONFIG',
  description: 'Начать создание нового Character для ElizaOS',
  similes: ['create_character', 'создать персонажа', 'новый character', 'создать агента'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/create_character' } },
      { name: '{{agent}}', content: { text: 'Привет! Я помогу создать Character...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    // Проверяем startsWith чтобы /create_character "описание" тоже работало
    const isCommand = text.startsWith('/create_character') || text === 'создать персонажа' || text === 'создать агента'
    if (isCommand) {
      console.log('[CharacterConfig] Validate START_CHARACTER_CONFIG: TRUE for', text.substring(0, 50))
    }
    return isCommand
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId

    console.log(`[CharacterConfig] START handler: chatId=${chatId}, userId=${userId}`)

    // Удаляем старую сессию и создаём новую
    configuratorService.deleteSession(chatId)
    const session = configuratorService.getSession(chatId, userId)
    configuratorService.saveSession(session)  // Обновляем updatedAt чтобы PROCESS_INPUT работал

    console.log(`[CharacterConfig] Session created: step=${session.step}, updatedAt=${session.updatedAt}`)

    await callback({
      text: QUESTIONS[ConfigStep.ONBOARDING],
    })
  },
}

/**
 * Action для рестарта (/restart)
 */
export const restartConfigAction: Action = {
  name: 'RESTART_CHARACTER_CONFIG',
  description: 'Начать создание Character заново',
  similes: ['restart', 'заново', 'сначала'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/restart' || text === COMMANDS.restart
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId

    configuratorService.deleteSession(chatId)
    configuratorService.getSession(chatId, userId)

    await callback({
      text: `Начинаем заново!\n\n${QUESTIONS[ConfigStep.ONBOARDING]}`,
    })
  },
}

/**
 * Action для справки (/help)
 */
export const helpAction: Action = {
  name: 'CHARACTER_CONFIG_HELP',
  description: 'Показать справку по Character Configurator',
  similes: ['help', 'помощь', 'справка'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/help' || text === COMMANDS.help
  },

  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    await callback({
      text: HELP_TEXT,
    })
  },
}

/**
 * Action для статуса (/status)
 */
export const statusAction: Action = {
  name: 'CHARACTER_CONFIG_STATUS',
  description: 'Показать текущий статус конфигурации',
  similes: ['status', 'статус'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    return text === '/status' || text === COMMANDS.status
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const status = configuratorService.getStatus(chatId)

    await callback({
      text: status,
    })
  },
}

/**
 * Action для обработки ответов пользователя (основной)
 */
export const processConfigInputAction: Action = {
  name: 'PROCESS_CHARACTER_CONFIG_INPUT',
  description: 'Обработка ответов пользователя в процессе конфигурации',
  similes: [],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim() || ''

    // Пропускаем команды - они обрабатываются другими actions
    if (text.startsWith('/')) {
      return false
    }

    const chatId = message.roomId

    // Проверяем СУЩЕСТВУЮЩУЮ сессию, НЕ создавая новую!
    // Это исправляет баг автоматического запуска онбординга на любое сообщение
    const session = configuratorService.getExistingSession(chatId)

    // Если сессии нет - пропускаем (пусть другие actions обработают)
    if (!session) {
      return false
    }

    // Если сессия завершена - тоже пропускаем
    const isActive = session.step !== ConfigStep.DONE
    console.log(`[CharacterConfig] PROCESS_INPUT validate: chatId=${chatId}, step=${session.step}, isActive=${isActive}, text="${text.substring(0, 30)}"`)

    return isActive
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const userId = (message as any).userId || message.entityId || chatId
    const text = (message.content as any)?.text || ''

    try {
      const result = await configuratorService.processMessage(chatId, userId, text)

      await callback({
        text: result.response,
      })

      // Если есть готовый character JSON - отправляем пользователю
      if (result.characterJson) {
        console.log('[ConfigWizard] Character JSON ready:', result.characterJson.substring(0, 100) + '...')

        // Сохраняем файл локально
        const fileName = `${result.character?.username || 'agent'}.character.json`
        const filePath = `characters/${fileName}`

        try {
          const fs = await import('fs/promises')
          await fs.writeFile(filePath, result.characterJson, 'utf-8')
          console.log(`[ConfigWizard] Character saved to: ${filePath}`)

          // Отправляем JSON пользователю
          await callback({
            text: `📄 **Character JSON:**\n\`\`\`json\n${result.characterJson}\n\`\`\`\n\n✅ Файл сохранён: \`${filePath}\``,
          })
        } catch (fsError) {
          console.error('[ConfigWizard] Failed to save file:', fsError)
          // Всё равно отправляем JSON в сообщении
          await callback({
            text: `📄 **Character JSON (скопируй и сохрани):**\n\`\`\`json\n${result.characterJson}\n\`\`\``,
          })
        }
      }
    } catch (error) {
      console.error('[ConfigWizard] Error:', error)
      await callback({
        text: 'Произошла ошибка. Попробуй ещё раз или напиши /restart чтобы начать сначала.',
      })
    }
  },
}

/**
 * Все actions плагина
 */
export const configWizardActions: Action[] = [
  startConfigAction,
  restartConfigAction,
  helpAction,
  statusAction,
  processConfigInputAction,
]
