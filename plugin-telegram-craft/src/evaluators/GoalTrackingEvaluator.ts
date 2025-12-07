// @ts-nocheck
import {
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from '@elizaos/core'

/**
 * Goal Tracking Evaluator
 *
 * Отслеживает прогресс пользователя в достижении целей обучения
 */
export const goalTrackingEvaluator: Evaluator = {
  name: 'TELEGRAM_GOAL_TRACKING',
  description: 'Отслеживает прогресс целей пользователя в обучении',
  similes: ['TRACK_PROGRESS', 'GOAL_MONITOR'],

  alwaysRun: false,

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> => {
    // Проверяем, есть ли упоминание целей/задач/прогресса
    const text = message.content?.text?.toLowerCase() || ''
    return /goal|task|progress|done|complete|цель|задача|прогресс|готово|выполнил/i.test(
      text
    )
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<void> => {
    const text = message.content?.text || ''
    const entityId = message.entityId

    // Определяем тип события прогресса
    const progressEvent = detectProgressEvent(text)

    if (progressEvent) {
      console.log(
        `[GoalTracking] User ${entityId} progress event: ${progressEvent.type}`
      )
      console.log(`[GoalTracking] Details:`, progressEvent)

      // Записываем прогресс
      try {
        await runtime.databaseAdapter.createMemory({
          id: crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
          entityId: message.entityId,
          agentId: runtime.agentId,
          roomId: message.roomId,
          content: {
            text: `Progress: ${progressEvent.type} - ${progressEvent.description}`,
            action: 'GOAL_PROGRESS_RECORDED',
          },
        })

        // Если цель достигнута - поздравляем
        if (progressEvent.type === 'completed') {
          console.log(`[GoalTracking] Goal completed! Congrats to user ${entityId}`)
        }
      } catch (error) {
        console.error('[GoalTracking] Failed to record progress:', error)
      }
    }
  },

  examples: [
    {
      context: 'Отслеживание выполнения задачи',
      messages: [
        {
          name: '{{user1}}',
          content: { text: 'Я выполнил задание по async/await!' },
        },
        {
          name: '{{agent}}',
          content: {
            text: 'Отлично! Прогресс записан.',
            action: 'GOAL_PROGRESS_RECORDED',
          },
        },
      ],
      outcome: 'Прогресс пользователя отслежен',
    },
  ],
}

interface ProgressEvent {
  type: 'started' | 'in_progress' | 'completed' | 'failed'
  description: string
  topic?: string
}

/**
 * Определяет тип события прогресса из текста
 */
function detectProgressEvent(text: string): ProgressEvent | null {
  const lowerText = text.toLowerCase()

  // Completed patterns
  if (
    /done|complete|finish|готово|выполнил|закончил|сделал/i.test(lowerText)
  ) {
    return {
      type: 'completed',
      description: 'Task or goal completed',
      topic: extractTopic(text),
    }
  }

  // Started patterns
  if (/start|begin|начал|приступил/i.test(lowerText)) {
    return {
      type: 'started',
      description: 'Started new task or goal',
      topic: extractTopic(text),
    }
  }

  // In progress patterns
  if (/working|progress|делаю|работаю|изучаю/i.test(lowerText)) {
    return {
      type: 'in_progress',
      description: 'Working on task',
      topic: extractTopic(text),
    }
  }

  // Failed patterns
  if (/stuck|help|fail|застрял|помоги|не получается/i.test(lowerText)) {
    return {
      type: 'failed',
      description: 'Needs help with task',
      topic: extractTopic(text),
    }
  }

  return null
}

/**
 * Извлекает тему из текста
 */
function extractTopic(text: string): string | undefined {
  // Пытаемся найти тему после ключевых слов
  const patterns = [
    /(?:про|about|with|по)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+(?:\s+\w+)?)\s+(?:task|задан)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return undefined
}
