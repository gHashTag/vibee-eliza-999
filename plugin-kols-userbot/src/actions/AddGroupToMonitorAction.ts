/**
 * Add Group To Monitor Action
 * Добавляет группу в список мониторинга
 */
import { Action, IAgentRuntime } from '@elizaos/core';

export const addGroupToMonitorAction: Action = {
  name: 'ADD_GROUP_TO_MONITOR',
  similes: [
    'ADD_GROUP_MONITOR',
    'MONITOR_ADD_GROUP',
    'JOIN_GROUP_MONITOR'
  ],
  description: 'Добавляет группу в список мониторинга',

  validate: async (runtime: IAgentRuntime, message: any): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    if (!text) return false;

    const commands = [
      '/monitor add',
      '/monitor add'
    ];

    const intents = [
      'добавь группу',
      'добавить группу',
      'подключи группу',
      'мониторь группу',
      'слушай группу',
      'add group to monitor',
      'add group',
      'подключи к мониторингу',
      'добавь в мониторинг'
    ];

    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent));
  },

  handler: async (runtime: IAgentRuntime, message: any, state: any, options: any, callback: any) => {
    try {
      console.log('➕ [AddGroupToMonitorAction] Добавление группы в мониторинг...');

      const telegramService = runtime.getService('kols-telegram');

      if (!telegramService || !(telegramService as any).addGroupToMonitor) {
        throw new Error('Telegram сервис не найден');
      }

      // Извлекаем название группы из сообщения
      const text = message.content?.text || '';

      // Ищем @username или название группы
      const groupMatch = text.match(/@(\w+)/) || text.match(/"([^"]+)"/) || text.match(/'([^']+)'/);

      if (!groupMatch) {
        await callback?.({
          text: '❌ Не указано название группы\n\nПример: "добавь группу @mygroup" или "добавь группу \"Моя группа\"',
          error: true
        });

        return {
          success: false,
          error: 'Group name not provided'
        };
      }

      const groupName = groupMatch[1];

      // Для демо добавляем группу в мониторинг
      // В реальности здесь была бы логика присоединения к группе через MTProto
      const result = await (telegramService as any).addGroupToMonitor(`group_${groupName}`, groupName);

      if (result.success) {
        await callback?.({
          text: `✅ ${result.message}

💡 Чтобы увидеть все мониторимые группы, отправь "покажи группы"`,
          action: 'ADD_GROUP_TO_MONITOR'
        });

        return {
          success: true,
          data: {
            groupAdded: true,
            groupName: groupName
          }
        };
      } else {
        await callback?.({
          text: `❌ Не удалось добавить группу: ${result.message}`,
          error: true
        });

        return {
          success: false,
          error: new Error(result.message)
        };
      }

    } catch (error) {
      console.error('❌ [AddGroupToMonitorAction] Ошибка:', error);

      await callback?.({
        text: `❌ Ошибка добавления группы: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: 'добавь группу @mygroup' }
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '✅ Группа "@mygroup" добавлена в мониторинг!\n\n💡 Чтобы увидеть все мониторимые группы, отправь "покажи группы"',
          action: 'ADD_GROUP_TO_MONITOR'
        }
      }
    ]
  ] as any
};
