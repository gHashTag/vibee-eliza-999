// @ts-nocheck
/**
 * Sales Wizard Actions
 *
 * ElizaOS Actions для пошаговой конфигурации Sales Agent
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'
import { salesConfiguratorService } from '../services/salesConfigurator.service.ts'
import { SALES_QUESTIONS, SALES_HELP_TEXT, SALES_COMMANDS } from '../templates/questions.ts'
import { SalesAgentStep } from '../types/session.types.ts'

/**
 * Action для запуска конфигурации (/create_sales_agent)
 */
export const startSalesWizardAction: Action = {
  name: 'START_SALES_AGENT_CONFIG',
  description: 'Начать создание Sales Agent для продаж услуг по подписке',
  similes: ['create_sales_agent', 'создать продавца', 'новый sales agent', 'агент продаж'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/create_sales_agent' } },
      { name: '{{agent}}', content: { text: 'Привет! Я помогу создать AI-агента для продаж...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''
    const isCommand = text.startsWith('/create_sales_agent') || text === 'создать продавца' || text === 'агент продаж'
    // ВСЕГДА логируем для отладки
    console.log('[SalesAgent] Validate START_SALES_AGENT_CONFIG:', {
      rawText: (message.content as any)?.text,
      normalizedText: text.substring(0, 50),
      isCommand,
      messageType: typeof message.content,
      roomId: message.roomId
    })
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

    console.log(`[SalesAgent] START handler: chatId=${chatId}, userId=${userId}`)

    // Удаляем старую сессию и создаём новую
    salesConfiguratorService.deleteSession(chatId)
    const session = salesConfiguratorService.getSession(chatId, userId)
    salesConfiguratorService.saveSession(session)

    console.log(`[SalesAgent] Session created: step=${session.step}, updatedAt=${session.updatedAt}`)

    await callback({
      text: SALES_QUESTIONS[SalesAgentStep.ONBOARDING],
    })
  },
}

/**
 * Action для рестарта (/restart)
 */
export const restartSalesWizardAction: Action = {
  name: 'RESTART_SALES_AGENT_CONFIG',
  description: 'Начать создание Sales Agent заново',
  similes: ['restart sales', 'заново продавца', 'сначала'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''

    // Проверяем есть ли активная сессия SALES
    const chatId = message.roomId
    const session = salesConfiguratorService.getExistingSession(chatId)

    // Активируем только если есть сессия sales agent И команда restart
    if (!session) return false

    return text === '/restart' || text === SALES_COMMANDS.restart
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

    salesConfiguratorService.deleteSession(chatId)
    salesConfiguratorService.getSession(chatId, userId)

    await callback({
      text: `Начинаем заново!\n\n${SALES_QUESTIONS[SalesAgentStep.ONBOARDING]}`,
    })
  },
}

/**
 * Action для справки (/help)
 */
export const helpSalesWizardAction: Action = {
  name: 'SALES_AGENT_HELP',
  description: 'Показать справку по Sales Agent Configurator',
  similes: ['help sales', 'помощь продавец', 'справка'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''

    // Проверяем есть ли активная сессия SALES
    const chatId = message.roomId
    const session = salesConfiguratorService.getExistingSession(chatId)

    // Активируем только если есть сессия sales agent И команда help
    if (!session) return false

    return text === '/help' || text === SALES_COMMANDS.help
  },

  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    await callback({
      text: SALES_HELP_TEXT,
    })
  },
}

/**
 * Action для статуса (/status)
 */
export const statusSalesWizardAction: Action = {
  name: 'SALES_AGENT_STATUS',
  description: 'Показать текущий статус конфигурации Sales Agent',
  similes: ['status sales', 'статус продавца'],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || ''

    // Проверяем есть ли активная сессия SALES
    const chatId = message.roomId
    const session = salesConfiguratorService.getExistingSession(chatId)

    // Активируем только если есть сессия sales agent И команда status
    if (!session) return false

    return text === '/status' || text === SALES_COMMANDS.status
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const chatId = message.roomId
    const status = salesConfiguratorService.getStatus(chatId)

    await callback({
      text: status,
    })
  },
}

/**
 * Action для обработки ответов пользователя (основной)
 */
export const processSalesInputAction: Action = {
  name: 'PROCESS_SALES_AGENT_INPUT',
  description: 'Обработка ответов пользователя в процессе конфигурации Sales Agent',
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
    const session = salesConfiguratorService.getExistingSession(chatId)

    // Если сессии нет - пропускаем
    if (!session) {
      return false
    }

    // Если сессия завершена - тоже пропускаем
    const isActive = session.step !== SalesAgentStep.DONE
    console.log(`[SalesAgent] PROCESS_INPUT validate: chatId=${chatId}, step=${session.step}, isActive=${isActive}, text="${text.substring(0, 30)}"`)

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
      const result = await salesConfiguratorService.processMessage(chatId, userId, text)

      await callback({
        text: result.response,
      })

      // Если есть готовый character JSON - отправляем пользователю
      if (result.characterJson) {
        console.log('[SalesWizard] Character JSON ready:', result.characterJson.substring(0, 100) + '...')

        // Сохраняем файл локально
        const fileName = `${result.character?.username || 'sales_agent'}.character.json`
        const filePath = `characters/${fileName}`

        try {
          const fs = await import('fs/promises')
          await fs.writeFile(filePath, result.characterJson, 'utf-8')
          console.log(`[SalesWizard] Character saved to: ${filePath}`)

          // Отправляем JSON пользователю
          await callback({
            text: `**Character JSON:**\n\`\`\`json\n${result.characterJson}\n\`\`\`\n\n**Файл сохранён:** \`${filePath}\``,
          })
        } catch (fsError) {
          console.error('[SalesWizard] Failed to save file:', fsError)
          // Всё равно отправляем JSON в сообщении
          await callback({
            text: `**Character JSON (скопируй и сохрани):**\n\`\`\`json\n${result.characterJson}\n\`\`\``,
          })
        }
      }
    } catch (error) {
      console.error('[SalesWizard] Error:', error)
      await callback({
        text: 'Произошла ошибка. Попробуй ещё раз или напиши /restart чтобы начать сначала.',
      })
    }
  },
}

/**
 * Все actions плагина
 */
export const salesWizardActions: Action[] = [
  startSalesWizardAction,
  restartSalesWizardAction,
  helpSalesWizardAction,
  statusSalesWizardAction,
  processSalesInputAction,
]
