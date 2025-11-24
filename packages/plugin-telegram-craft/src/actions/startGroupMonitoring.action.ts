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
 * START_GROUP_MONITORING Action
 *
 * Запускает мониторинг групповых чатов в реальном времени
 *
 * Использование:
 * - "/monitor start"
 * - "начать мониторинг групп"
 * - "слушай чаты"
 */
export const startGroupMonitoringAction: Action = {
  name: 'START_GROUP_MONITORING',
  similes: [
    'START_MONITORING',
    'GROUP_MONITOR',
    'MONITOR_CHATS',
    'LISTEN_GROUPS',
  ],
  description: 'Запускает мониторинг групповых чатов в реальном времени',

  // Валидация
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();
    if (!text) return false;

    const commands = ['/monitor start', '/monitoring start', '/ слушать'];
    const intents = [
      'запусти мониторинг',
      'начать мониторинг групп',
      'начать слушать чаты',
      'start monitoring groups',
      'listen to chats',
      'мониторь чаты',
      'слушай групповые чаты',
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
      console.log('🔍 [START_GROUP_MONITORING] Handler called');
      console.log('🔍 [START_GROUP_MONITORING] Runtime exists:', !!runtime);

      // 🔍 DEBUG: Проверяем все зарегистрированные сервисы
      const allServices = (runtime as any).services || [];
      console.log('🔍 [START_GROUP_MONITORING] Total services in runtime:', allServices.length);
      console.log('🔍 [START_GROUP_MONITORING] Service types:', allServices.map((s: any) => s.serviceType || s.constructor?.serviceType));

      // Получение сервиса
      console.log('🔍 [START_GROUP_MONITORING] Calling runtime.getService("telegram-craft")...');
      const service = runtime.getService<TelegramService>('telegram-craft');
      console.log('🔍 [START_GROUP_MONITORING] Service returned:', !!service);
      console.log('🔍 [START_GROUP_MONITORING] Service type:', service?.serviceType);

      if (!service) {
        console.error('❌ [START_GROUP_MONITORING] Service is NULL!');
        console.error('❌ [START_GROUP_MONITORING] Available services:', allServices.map((s: any) => ({
          type: s.serviceType || s.constructor?.serviceType,
          className: s.constructor?.name
        })));
        throw new Error('Telegram service not available');
      }

      console.log('✅ [START_GROUP_MONITORING] Service found and ready');

      // Уведомление
      await callback?.({
        text: '🔍 Запускаю мониторинг групповых чатов...',
      });

      // Запуск мониторинга
      const result = await service.startGroupMonitoring();

      if (result.success) {
        const stats = service.getMonitoringStats();

        await callback?.({
          text: `✅ Мониторинг запущен!\n\n📊 Статистика:\n• Всего групп: ${stats.totalGroups}\n• Активных групп: ${stats.activeGroups}\n• Сообщений обработано: ${stats.totalMessages}\n• Время работы: ${Math.floor(stats.uptime / 1000)}с\n\n💡 Отправь "добавь группу @название" чтобы добавить чат для мониторинга`,
          action: 'START_GROUP_MONITORING',
        });

        return {
          success: true,
          data: {
            monitoringStarted: true,
            stats,
          },
        };
      } else {
        await callback?.({
          text: `❌ Не удалось запустить мониторинг: ${result.message}`,
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
        text: `❌ Ошибка запуска мониторинга: ${errorMessage}`,
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
        content: { text: 'запусти мониторинг групп' },
      },
      {
        name: 'KOLS_AGENT',
        content: {
          text: '✅ Мониторинг запущен!\n\n📊 Статистика:\n• Всего групп: 0\n• Активных групп: 0',
          action: 'START_GROUP_MONITORING',
        },
      },
    ],
  ],
};
