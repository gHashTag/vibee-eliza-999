/**
 * Proactive Learning Action
 * Проактивно обучает студентов VibeCoding при упоминании ключевых слов
 */
import { Action, IAgentRuntime } from '@elizaos/core';

export const proactiveLearningAction: Action = {
  name: 'PROACTIVE_LEARNING',
  similes: [
    'TEACH_STUDENTS',
    'VIBECODING_TIPS',
    'LEARN_AI',
    'VIBE_LEARNING'
  ],
  description: 'Проактивно обучает студентов VibeCoding с примерами из Библии вайб-кодера',

  validate: async (runtime: IAgentRuntime, message: any): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';

    // Проверяем триггеры для обучения
    const triggers = [
      'vibe',           // VibeCoding
      'обучи',          // обучи меня
      'научи',          // научи меня
      'ai-агенты',      // что такое AI-агенты
      'claude code',    // про Claude Code
      'расскажи',       // расскажи о...
      'как работать',   // как работать с...
      'что такое',      // что такое...
      'как',            // как делать...
      'объясни',        // объясни...
      'помоги',         // помоги с...
      'наставник',      // наставник
      'учи',            // учи
      'элайза',         // про ElizaOS
      'elizaos'         // про платформу
    ];

    return triggers.some(trigger => text.includes(trigger));
  },

  handler: async (runtime: IAgentRuntime, message: any, state: any, options: any, callback: any) => {
    try {
      console.log('🎓 [ProactiveLearningAction] Активировано обучение!');

      // Получаем обучающий сервис
      const learningService = runtime.getService('kols-learning');

      if (!learningService || !(learningService as any).getRandomLearningTip) {
        await callback?.({
          text: '❌ Сервис обучения не найден',
          error: true
        });
        return { success: false, error: 'Service not found' };
      }

      // Получаем случайный совет
      const tip = (learningService as any).getRandomLearningTip();
      console.log('📚 [ProactiveLearningAction] Получен совет:', tip.title);

      // Форматируем сообщение
      const learningMessage = (learningService as any).formatLearningMessage(tip);

      // Отправляем обучающий контент
      await callback?.({
        text: learningMessage,
        action: 'PROACTIVE_LEARNING',
        source: message.content?.source,
      });

      return {
        success: true,
        text: 'Обучающий контент отправлен',
        values: {
          tip: tip,
        },
        data: {
          actionName: 'PROACTIVE_LEARNING',
          timestamp: Date.now(),
          tipTitle: tip.title,
        },
      };

    } catch (error) {
      console.error('❌ [ProactiveLearningAction] Ошибка:', error);

      await callback?.({
        text: '❌ Произошла ошибка при обучении. Попробуйте позже.',
        error: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: 'student',
        content: { text: 'что такое VibeCoding?' }
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '🎓 **Урок VibeCoding: Что такое VibeCoding?**\n\nVibeCoding - это новый подход к программированию...',
          action: 'PROACTIVE_LEARNING'
        }
      }
    ],
    [
      {
        name: 'student',
        content: { text: 'обучи меня работе с AI-агентами' }
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '🎓 **Урок VibeCoding: Что такое AI-агенты?**\n\nAI-агенты - это автономные программы...',
          action: 'PROACTIVE_LEARNING'
        }
      }
    ]
  ] as any
};
