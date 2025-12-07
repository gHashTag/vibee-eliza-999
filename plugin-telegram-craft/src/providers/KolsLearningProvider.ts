/**
 * KOLS Learning Provider
 * Предоставляет контекстные знания для LLM
 */
import { Provider, IAgentRuntime } from '@elizaos/core';

export const kolsLearningProvider: Provider = {
  name: 'KOLS_LEARNING_PROVIDER',
  description: 'Провайдер знаний KOLS для обучения VibeCoding',

  get: async (runtime: IAgentRuntime, message: any) => {
    try {
      const learningService = runtime.getService('kols-learning');

      if (!learningService || !(learningService as any).getRandomLearningTip) {
        return {
          text: 'KOLS обучающий контекст недоступен',
          values: {},
          data: {}
        };
      }

      // Получаем случайный совет для контекста
      const tip = (learningService as any).getRandomLearningTip();

      return {
        text: `Контекст обучения: ${tip.title} - ${tip.content.substring(0, 200)}...`,
        values: {
          currentLearningTip: tip,
          availableTopics: ['basics', 'tools', 'agents', 'workflow', 'platform']
        },
        data: {
          learningContext: true,
          tipTopic: tip.topic,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error('❌ [KolsLearningProvider] Ошибка:', error);

      return {
        text: 'KOLS обучающий контекст временно недоступен',
        values: {},
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          learningContext: false
        }
      };
    }
  }
};

export default kolsLearningProvider;
