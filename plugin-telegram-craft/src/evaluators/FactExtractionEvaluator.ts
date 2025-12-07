// @ts-nocheck
import {
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from '@elizaos/core'

/**
 * Fact Extraction Evaluator
 *
 * Извлекает факты и знания из контента RAG для обучения агента
 */
export const factExtractionEvaluator: Evaluator = {
  name: 'TELEGRAM_FACT_EXTRACTION',
  description: 'Извлекает факты и знания из контента',
  similes: ['EXTRACT_FACTS', 'LEARN_FROM_CONTENT'],

  alwaysRun: false, // Только когда есть RAG контент

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> => {
    // Извлекать факты только если есть RAG контекст или обучающий материал
    const text = message.content?.text?.toLowerCase() || ''
    return /learn|teach|fact|знание|обучение|факт/i.test(text)
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<void> => {
    const text = message.content?.text || ''

    // Извлекаем ключевые факты из сообщения
    const facts = extractKeyFacts(text)

    if (facts.length > 0) {
      console.log(`[FactExtraction] Extracted ${facts.length} facts:`)
      facts.forEach((fact, i) => console.log(`  ${i + 1}. ${fact}`))

      // Сохраняем факты в память агента для будущего использования
      try {
        await runtime.databaseAdapter.createMemory({
          id: crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
          entityId: message.entityId,
          agentId: runtime.agentId,
          roomId: message.roomId,
          content: {
            text: `Extracted facts: ${facts.join('; ')}`,
            action: 'FACT_EXTRACTED',
          },
        })
      } catch (error) {
        console.error('[FactExtraction] Failed to save facts:', error)
      }
    }
  },

  examples: [
    {
      context: 'Извлечение фактов из обучающего материала',
      messages: [
        {
          name: '{{user1}}',
          content: { text: 'Расскажи про async/await в TypeScript' },
        },
        {
          name: '{{agent}}',
          content: {
            text: 'async/await - это синтаксис для работы с Promise...',
            action: 'FACT_EXTRACTED',
          },
        },
      ],
      outcome: 'Факты извлечены и сохранены',
    },
  ],
}

/**
 * Извлекает ключевые факты из текста
 */
function extractKeyFacts(text: string): string[] {
  const facts: string[] = []

  // Паттерны для определения фактов
  const factPatterns = [
    // "X - это Y" patterns
    /(\w+(?:\s+\w+)?)\s+[-—]\s+это\s+([^.]+)/gi,
    // "X is Y" patterns
    /(\w+(?:\s+\w+)?)\s+is\s+(?:a\s+)?([^.]+)/gi,
    // Numbered lists
    /^\s*\d+\.\s+(.+)/gm,
    // Key definitions
    /(?:Definition|Определение):\s*(.+)/gi,
  ]

  for (const pattern of factPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const fact = match[1]?.trim() || match[0]?.trim()
      if (fact && fact.length > 10 && fact.length < 200) {
        facts.push(fact)
      }
    }
  }

  // Убираем дубликаты и ограничиваем количество
  return [...new Set(facts)].slice(0, 10)
}
