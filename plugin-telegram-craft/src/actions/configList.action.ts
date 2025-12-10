// @ts-nocheck
/**
 * Config List Action
 *
 * Показывает список всех целевых чатов с конфигурациями
 * Команда: /config_list
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ChatConfigService } from '../services/chatConfig.service';
import type { ChatConfig } from '../types/chatConfig.types';

/**
 * Форматирует список конфигов для отображения
 */
function formatConfigList(configs: ChatConfig[]): string {
  if (configs.length === 0) {
    return `📋 **Список целевых чатов**

Нет настроенных чатов.

Чтобы добавить чат, используй:
\`/config_add <chatId>\``;
  }

  const lines: string[] = ['📋 **Список целевых чатов**', ''];

  // Группируем по статусу
  const active = configs.filter(c => c.isActive);
  const inactive = configs.filter(c => !c.isActive);

  if (active.length > 0) {
    lines.push(`**Активные (${active.length}):**`);
    active.forEach((config, i) => {
      const salesIcon = config.salesMode ? '🛒' : '';
      const title = config.chatTitle || `Chat ${config.chatId}`;
      lines.push(`${i + 1}. ${salesIcon} **${title}**`);
      lines.push(`   ID: \`${config.chatId}\` | Персона: ${config.personaName}`);
    });
  }

  if (inactive.length > 0) {
    lines.push('');
    lines.push(`**Неактивные (${inactive.length}):**`);
    inactive.forEach((config, i) => {
      const title = config.chatTitle || `Chat ${config.chatId}`;
      lines.push(`${i + 1}. ⏸️ ${title} (\`${config.chatId}\`)`);
    });
  }

  lines.push('');
  lines.push('**Команды:**');
  lines.push('• `/config_status <chatId>` - подробный статус');
  lines.push('• `/config_add <chatId>` - добавить чат');
  lines.push('• `/config_remove <chatId>` - удалить чат');

  return lines.join('\n');
}

/**
 * Action для показа списка конфигов
 */
export const configListAction: Action = {
  name: 'CONFIG_LIST',
  description: 'Показать список всех целевых чатов с конфигурациями',
  similes: ['config_list', 'список чатов', 'показать чаты', 'list configs'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/config_list' } },
      { name: '{{agent}}', content: { text: '📋 Список целевых чатов...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text === '/config_list' ||
           text === 'список чатов' ||
           text === 'list configs';
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    console.log(`[ConfigList] Запрос списка конфигов`);

    try {
      const chatConfigService = runtime.getService<ChatConfigService>('chat-config');

      if (!chatConfigService) {
        await callback({
          text: '❌ ChatConfigService не инициализирован. Попробуй позже.',
        });
        return;
      }

      const configs = await chatConfigService.listConfigs();
      const stats = chatConfigService.getStats();

      let response = formatConfigList(configs);

      // Добавляем статистику
      response += `\n\n📊 **Статистика:**`;
      response += `\nВсего конфигов: ${stats.totalConfigs}`;
      response += `\nАктивных: ${stats.activeConfigs}`;
      response += `\nВ кэше: ${stats.cachedConfigs}`;

      await callback({
        text: response,
      });
    } catch (error) {
      console.error('[ConfigList] Error:', error);
      await callback({
        text: '❌ Ошибка при получении списка. Попробуй позже.',
      });
    }
  },
};

export default configListAction;
