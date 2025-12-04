/**
 * Start Group Monitoring Action
 * Запускает мониторинг групповых чатов
 */
import { Action, IAgentRuntime } from '@elizaos/core';

export const startGroupMonitoringAction: Action = {
  name: 'START_GROUP_MONITORING',
  similes: [
    'START_MONITORING',
    'GROUP_MONITOR',
    'MONITOR_CHATS',
    'LISTEN_GROUPS'
  ],
  description: 'Запускает мониторинг групповых чатов в реальном времени',

  validate: async (runtime: IAgentRuntime, message: any): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    if (!text) return false;

    const commands = [
      '/monitor start',
      '/monitoring start',
      'слушать'
    ];

    const intents = [
      'запусти мониторинг',
      'начать мониторинг групп',
      'начать слушать чаты',
      'start monitoring groups',
      'listen to chats',
      'мониторь чаты',
      'слушай групповые чаты',
      'включи мониторинг',
      'активируй мониторинг'
    ];

    return commands.some(cmd => text.includes(cmd)) ||
           intents.some(intent => text.includes(intent));
  },

  handler: async (runtime: IAgentRuntime, message: any, state: any, options: any, callback: any) => {
    try {
      console.log('🔍 [StartGroupMonitoringAction] Запуск мониторинга групп...');

      const telegramService = runtime.getService('kols-telegram');

      if (!telegramService || !(telegramService as any).startGroupMonitoring) {
        throw new Error('Telegram сервис не найден');
      }

      const result = await (telegramService as any).startGroupMonitoring();

      if (result.success) {
        const stats = (telegramService as any).getMonitoringStats();

        const formatUptime = (ms: number): string => {
          const seconds = Math.floor(ms / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          if (hours > 0) {
            return `${hours}ч ${minutes % 60}м`;
          } else if (minutes > 0) {
            return `${minutes}м ${seconds % 60}с`;
          } else {
            return `${seconds}с`;
          }
        };

        await callback?.({
          text: `✅ Мониторинг запущен!

📊 Статистика:
• Всего групп: ${stats.totalGroups}
• Активных групп: ${stats.activeGroups}
• Сообщений обработано: ${stats.totalMessages}
• Время работы: ${formatUptime(stats.uptime)}

💡 Отправь "добавь группу @название" чтобы добавить чат для мониторинга`,
          action: 'START_GROUP_MONITORING'
        });

        return {
          success: true,
          data: {
            monitoringStarted: true,
            stats: stats
          }
        };
      } else {
        await callback?.({
          text: `❌ Не удалось запустить мониторинг: ${result.message}`,
          error: true
        });

        return {
          success: false,
          error: new Error(result.message)
        };
      }

    } catch (error) {
      console.error('❌ [StartGroupMonitoringAction] Ошибка:', error);

      await callback?.({
        text: `❌ Ошибка запуска мониторинга: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        content: { text: 'запусти мониторинг групп' }
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '✅ Мониторинг запущен!\n\n📊 Статистика:\n• Всего групп: 0\n• Активных групп: 0\n• Сообщений обработано: 0',
          action: 'START_GROUP_MONITORING'
        }
      }
    ]
  ] as any
};
