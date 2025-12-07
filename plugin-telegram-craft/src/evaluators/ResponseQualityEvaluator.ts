// @ts-nocheck
import {
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from '@elizaos/core'

/**
 * Response Quality Evaluator
 *
 * Проверяет качество ответов перед отправкой в Telegram:
 * - Длина сообщения (Telegram limit = 4096)
 * - Подозрительный контент
 * - Форматирование
 */
export const responseQualityEvaluator: Evaluator = {
  name: 'TELEGRAM_RESPONSE_QUALITY',
  description: 'Оценивает качество ответов перед отправкой в Telegram',
  similes: ['QUALITY_CHECK', 'VALIDATE_RESPONSE'],

  alwaysRun: true,

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> => {
    // Всегда валидировать ответы агента
    return true
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<void> => {
    const text = message.content?.text || ''

    // 1. Проверяем размер сообщения (Telegram limit = 4096)
    if (text.length > 4000) {
      console.log(
        `[ResponseQuality] Message too long (${text.length}), will be truncated`
      )
    }

    // 2. Проверяем на подозрительный контент
    if (containsSuspiciousContent(text)) {
      console.warn(`[ResponseQuality] Suspicious content detected in response`)
    }

    // 3. Логируем метрики качества
    const metrics = analyzeResponseQuality(text)
    console.log(`[ResponseQuality] Metrics:`, metrics)
  },

  examples: [
    {
      context: 'Проверка качества ответа агента',
      messages: [
        {
          name: '{{user1}}',
          content: { text: 'Как создать Telegram бота?' },
        },
        {
          name: '{{agent}}',
          content: {
            text: 'Для создания Telegram бота нужно...',
            action: 'RESPONSE_QUALITY_CHECKED',
          },
        },
      ],
      outcome: 'Ответ проверен на качество',
    },
  ],
}

/**
 * Проверяет текст на подозрительный контент
 */
function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /rm\s+-rf/i,
    /<script>/i,
    /eval\s*\(/i,
  ]
  return suspiciousPatterns.some((pattern) => pattern.test(text))
}

/**
 * Анализирует качество ответа
 */
function analyzeResponseQuality(text: string): {
  length: number
  hasCodeBlocks: boolean
  hasLinks: boolean
  paragraphs: number
} {
  return {
    length: text.length,
    hasCodeBlocks: /```[\s\S]*?```/.test(text),
    hasLinks: /https?:\/\//.test(text),
    paragraphs: text.split('\n\n').length,
  }
}
