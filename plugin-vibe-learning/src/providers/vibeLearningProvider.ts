import { Provider } from '@elizaos/core';

/**
 * VibeLearning Provider
 *
 * Предоставляет контекстную информацию о VibeCoding для LLM
 */
export const vibeLearningProvider: Provider = {
  name: 'VIBE_LEARNING_PROVIDER',

  get: async (runtime, message) => {
    try {
      const learningService = runtime.getService('vibe-learning') as any;

      if (!learningService) {
        return {
          text: '',
          values: {},
          data: {},
        };
      }

      // Получаем случайный совет
      const tip = learningService.getRandomLearningTip();

      return {
        text: `Контекст обучения VibeCoding: ${tip.title} - ${tip.content.substring(0, 200)}...`,
        values: {
          currentTopic: tip.topic,
          learningTitle: tip.title,
        },
        data: {
          vibeLearning: true,
          topic: tip.topic,
        },
      };
    } catch (error) {
      console.warn('⚠️ [VibeLearningProvider] Ошибка:', error);
      return {
        text: '',
        values: {},
        data: {},
      };
    }
  },
};
