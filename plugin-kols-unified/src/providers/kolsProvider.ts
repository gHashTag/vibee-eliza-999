/**
 * Provider для предоставления контекста KOLS в LLM
 */

import { Provider } from '@elizaos/core';
import { KolsLogger } from '../utils/logger';
import { KolsUnifiedService } from '../services/KolsUnifiedService';

export const kolsProvider: Provider = {
  name: 'KOLS_PROVIDER',

  get: async (runtime, message) => {
    try {
      const telegramService = runtime.getService('kols-unified') as KolsUnifiedService;
      const status = telegramService?.getStatus();

      const contextText = `Ты KOLS (Knowledge Oriented Learning System) - наставник по современной разработке и VibeCoding.

Контекст работы:
- Активность мониторинга: ${status?.isActive ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}
- Количество целевых чатов: ${status?.targetChats || 0}
- Обработано сообщений: ${status?.totalMessages || 0}

Твоя роль:
1. Обучать студентов современным методам разработки
2. Рассказывать про AI-агентов, Claude Code, ElizaOS
3. Делиться знаниями про VibeCoding, функциональное программирование
4. Отвечать на вопросы по TypeScript, Python, Telegram MTProto
5. Давать практические советы и лайфхаки

Обязательные правила:
- НИКОГДА не используй эмодзи
- НИКОГДА не начинай с приветствий
- НИКОГДА не обращайся по имени
- Пиши деловым языком
- Отвечай кратко (2-4 предложения)
- Всегда на русском языке
- Сразу переходи к сути`;

      return {
        text: contextText,
        values: {
          kolsStatus: status,
          expertise: [
            'VibeCoding',
            'AI-агенты',
            'ElizaOS',
            'Claude Code',
            'TypeScript',
            'Функциональное программирование',
            'Rainbow Bridge',
            'MTProto',
            'Python',
            'Тестирование'
          ]
        },
        data: {
          isKOLSActive: status?.isActive || false,
          targetChatsCount: status?.targetChats || 0,
          messagesProcessed: status?.totalMessages || 0
        }
      };
    } catch (error) {
      KolsLogger.warning('⚠️ Ошибка получения контекста KOLS:', error);

      // Fallback контекст
      return {
        text: `Ты KOLS - наставник по современной разработке.

Обязательные правила:
- НИКОГДА не используй эмодзи
- НИКОГДА не начинай с приветствий
- НИКОГДА не обращайся по имени
- Пиши деловым языком
- Отвечай кратко на русском языке`,

        values: {
          expertise: ['VibeCoding', 'AI-агенты', 'ElizaOS', 'Claude Code']
        },
        data: {
          isKOLSActive: false
        }
      };
    }
  }
};

export default kolsProvider;
