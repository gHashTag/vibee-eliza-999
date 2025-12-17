// @ts-nocheck
/**
 * Sales Agent Action
 *
 * Запуск wizard для создания AI-агента продаж
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'

// Импортируем сервис из plugin-sales-agent
import { salesConfiguratorService, SALES_QUESTIONS, SalesAgentStep } from 'plugin-sales-agent'

/**
 * Action для запуска Sales Agent Wizard
 */
export const salesAgentAction: Action = {
  name: 'CREATE_SALES_AGENT',
  description: 'Создать AI-агента для продаж услуг по подписке через пошаговый wizard',
  similes: [
    'CREATE_SALES_AGENT',
    'SALES_WIZARD',
    'CREATE_SELLER',
    'create_sales_agent',
    'sales agent',
    'продавец',
    'создать продавца',
    'агент продаж'
  ],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/create_sales_agent' } },
      { name: '{{agent}}', content: { text: 'Привет! Я помогу создать AI-агента для продаж услуг по подписке...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.trim().toLowerCase() || ''

    console.log('[SalesAgent] validate() called with text:', text.substring(0, 50))

    // Проверяем команду /create_sales_agent
    const isCommand = text.startsWith('/create_sales_agent') ||
                      text === 'создать продавца' ||
                      text === 'агент продаж' ||
                      text === 'sales agent'

    if (isCommand) {
      console.log('[SalesAgent] ✅ validate() returning TRUE')
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

    console.log(`[SalesAgent] 🚀 Handler started: chatId=${chatId}, userId=${userId}`)

    try {
      // Удаляем старую сессию и создаём новую
      salesConfiguratorService.deleteSession(chatId)
      const session = salesConfiguratorService.getSession(chatId, userId)
      salesConfiguratorService.saveSession(session)

      console.log(`[SalesAgent] ✅ Session created: step=${session.step}`)

      await callback({
        text: SALES_QUESTIONS[SalesAgentStep.ONBOARDING],
      })
    } catch (error) {
      console.error('[SalesAgent] ❌ Error:', error)
      await callback({
        text: 'Произошла ошибка при запуске wizard. Попробуй ещё раз.',
      })
    }
  },
}

/**
 * Action для обработки ответов в Sales Wizard
 */
export const salesAgentInputAction: Action = {
  name: 'PROCESS_SALES_INPUT',
  description: 'Обработка ответов пользователя в Sales Agent Wizard',
  similes: [],
  examples: [],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.trim() || ''

    // Пропускаем команды
    if (text.startsWith('/')) {
      return false
    }

    const chatId = message.roomId
    const session = salesConfiguratorService.getExistingSession(chatId)

    // Активируем только если есть активная сессия
    if (!session) {
      return false
    }

    const isActive = session.step !== SalesAgentStep.DONE

    if (isActive) {
      console.log(`[SalesAgent] PROCESS_INPUT validate: step=${session.step}, text="${text.substring(0, 30)}"`)
    }

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
    const text = message.content?.text || ''

    try {
      const result = await salesConfiguratorService.processMessage(chatId, userId, text)

      await callback({
        text: result.response,
      })

      // Если есть готовый character JSON
      if (result.characterJson) {
        console.log('[SalesAgent] Character JSON ready!')

        const fileName = `${result.character?.username || 'sales_agent'}.character.json`
        const filePath = `characters/${fileName}`

        try {
          const fs = await import('fs/promises')
          await fs.writeFile(filePath, result.characterJson, 'utf-8')
          console.log(`[SalesAgent] Character saved to: ${filePath}`)

          await callback({
            text: `**Character JSON:**\n\`\`\`json\n${result.characterJson}\n\`\`\`\n\n**Файл сохранён:** \`${filePath}\``,
          })
        } catch (fsError) {
          console.error('[SalesAgent] Failed to save file:', fsError)
          await callback({
            text: `**Character JSON:**\n\`\`\`json\n${result.characterJson}\n\`\`\``,
          })
        }
      }
    } catch (error) {
      console.error('[SalesAgent] Error:', error)
      await callback({
        text: 'Произошла ошибка. Попробуй ещё раз или напиши /create_sales_agent чтобы начать сначала.',
      })
    }
  },
}

export const salesAgentActions = [salesAgentAction, salesAgentInputAction]
