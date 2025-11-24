import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from '@elizaos/core';
import { TelegramService } from '../services/telegram.service';

/**
 * ADD_GROUP_TO_MONITOR Action
 *
 * Добавляет группу в список мониторинга
 *
 * Использование:
 * - "/monitor add @groupname"
 * - "добавь группу @название"
 */
export const addGroupToMonitorAction: Action = {
  name: 'ADD_GROUP_TO_MONITOR',
  similes: [
    'ADD_GROUP_MONITOR',
    'MONITOR_ADD_GROUP',
    'JOIN_GROUP_MONITOR',
  ],
  description: 'Добавляет группу в список мониторинга',

  // Валидация
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();
    if (!text) return false;

    const commands = ['/monitor add', '/monitor add', 'добавь группу'];
    const intents = [
      'добавь чат',
      'добавь в мониторинг',
      'начать слушать',
      'add group to monitor',
      'monitor this chat',
    ];

    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent));
  },

  // Обработчик
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      // Извлечение параметров
      const text = message.content?.text || '';
      const chatId = message?.roomId || 'unknown';

      // Если это групповой чат, добавляем его автоматически
      let groupId = chatId;
      let groupName = 'текущий чат';

      // Пытаемся извлечь ID группы из команды
      const match = text.match(/@([a-zA-Z0-9_]+)/);
      if (match) {
        groupId = match[1];
        groupName = `@${match[1]}`;
      }

      // Получение сервиса
      const service = runtime.getService<TelegramService>('telegram-craft');
      if (!service) {
        throw new Error('Telegram service not available');
      }

      // Добавление группы
      const result = await service.addGroupToMonitoring(groupId, groupName);

      if (result.success) {
        await callback?.({
          text: `✅ Группа "${groupName}" добавлена в мониторинг!\n\n💡 Чтобы увидеть все мониторимые группы, отправь "покажи группы"`,
          action: 'ADD_GROUP_TO_MONITOR',
        });

        return {
          success: true,
          data: {
            groupAdded: true,
            groupId,
            groupName,
          },
        };
      } else {
        await callback?.({
          text: `❌ Не удалось добавить группу: ${result.message}`,
          error: true,
        });

        return {
          success: false,
          error: new Error(result.message),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await callback?.({
        text: `❌ Ошибка добавления группы: ${errorMessage}`,
        error: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  },

  // Примеры
  examples: [
    [
      {
        name: '{{user1}}',
        content: { text: 'добавь группу @mygroup' },
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '✅ Группа "@mygroup" добавлена в мониторинг!',
          action: 'ADD_GROUP_TO_MONITOR',
        },
      },
    ],
  ],
};
