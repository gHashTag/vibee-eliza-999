import { Action } from '@elizaos/core';

/**
 * PROACTIVE_LEARNING Action
 *
 * Запускает проактивное обучение студентов VibeCoding
 *
 * Использование:
 * - "расскажи о VibeCoding"
 * - "что такое AI-агенты"
 * - "обучи меня"
 */
export const proactiveLearningAction: Action = {
  name: 'PROACTIVE_LEARNING',
  similes: ['TEACH_STUDENTS', 'VIBECODING_TIPS', 'LEARN_AI'],
  description: 'Проактивно обучает студентов VibeCoding с примерами из Библии вайб-кодера',

  validate: async (runtime, message) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('vibe') ||
           text.includes('обучи') ||
           text.includes('научи') ||
           text.includes('ai-агенты') ||
           text.includes('claude code') ||
           text.includes('расскажи');
  },

  handler: async (runtime, message, state, options, callback) => {
    try {
      console.log('🎓 [VibeLearning] Начинаем обучение!');

      const learningService = runtime.getService('vibe-learning') as any;

      if (!learningService) {
        throw new Error('VibeLearning сервис не найден');
      }

      // Получаем совет из книги
      const learningTip = await learningService.getRandomLearningTip();
      console.log('📚 [VibeLearning] Получен совет:', learningTip.title);

      // Отправляем обучающий контент
      await callback?.({
        text: `🎓 **Урок VibeCoding: ${learningTip.title}**\n\n${learningTip.content}\n\n💡 **Почему это важно:** ${learningTip.why}\n\n🚀 **Практический совет:** ${learningTip.practicalTip}\n\n📖 Хотите узнать больше? Задайте вопрос!`,
        action: 'PROACTIVE_LEARNING',
        source: message.content.source,
      });

      return {
        text: 'Обучающий контент отправлен',
        values: {
          success: true,
          tip: learningTip,
        },
        data: {
          actionName: 'PROACTIVE_LEARNING',
          timestamp: Date.now(),
        },
        success: true,
      };

    } catch (error) {
      console.error('❌ Ошибка PROACTIVE_LEARNING:', error);

      await callback?.({
        text: `❌ Не удалось предоставить обучающий контент.\n\nОшибка: ${error instanceof Error ? error.message : String(error)}\n\nПопробуйте еще раз!`,
        error: true,
        action: 'PROACTIVE_LEARNING_ERROR',
      });

      return {
        text: 'Ошибка обучения',
        values: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        data: {
          actionName: 'PROACTIVE_LEARNING',
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Расскажи о VibeCoding',
        },
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '🎓 **Урок VibeCoding: Что такое VibeCoding?**\n\nVibeCoding - это новый подход к программированию, где AI-агенты помогают создавать код...',
          action: 'PROACTIVE_LEARNING',
        },
      },
    ],
  ],
};
