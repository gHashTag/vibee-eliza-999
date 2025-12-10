// @ts-nocheck
/**
 * Config Remove Action
 *
 * Удаляет чат из мониторинга
 * Команда: /config_remove <chatId>
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ChatConfigService } from '../services/chatConfig.service';

/**
 * Action для удаления чата из мониторинга
 */
export const configRemoveAction: Action = {
  name: 'CONFIG_REMOVE',
  description: 'Удалить чат из мониторинга',
  similes: ['config_remove', 'удалить чат', 'remove config', 'удалить конфиг'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/config_remove 123456789' } },
      { name: '{{agent}}', content: { text: '✅ Чат удалён из мониторинга...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text.startsWith('/config_remove') || text.startsWith('удалить чат');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const text = (message.content as any)?.text?.trim() || '';

    // Парсим аргументы: /config_remove <chatId>
    const parts = text.split(/\s+/);
    const chatId = parts[1];

    console.log(`[ConfigRemove] Удаление чата: chatId=${chatId}`);

    if (!chatId) {
      await callback({
        text: `❌ Укажи ID чата для удаления:
\`/config_remove <chatId>\`

Пример:
\`/config_remove 123456789\`

Список чатов: \`/config_list\``,
      });
      return;
    }

    try {
      const chatConfigService = runtime.getService<ChatConfigService>('chat-config');

      if (!chatConfigService) {
        await callback({
          text: '❌ ChatConfigService не инициализирован. Попробуй позже.',
        });
        return;
      }

      // Проверяем, есть ли конфиг
      const existing = await chatConfigService.getConfig(String(chatId));
      if (!existing) {
        await callback({
          text: `⚠️ Чат \`${chatId}\` не найден в мониторинге.

Список чатов: \`/config_list\``,
        });
        return;
      }

      // Удаляем конфиг
      await chatConfigService.deleteConfig(String(chatId));

      await callback({
        text: `✅ **Чат удалён из мониторинга**

**ID:** \`${chatId}\`
**Название:** ${existing.chatTitle || 'N/A'}
**Персона:** ${existing.personaName}

Бот больше не будет отвечать в этом чате.

Чтобы снова добавить: \`/config_add ${chatId}\``,
      });
    } catch (error) {
      console.error('[ConfigRemove] Error:', error);
      await callback({
        text: `❌ Ошибка при удалении чата: ${(error as Error).message}`,
      });
    }
  },
};

export default configRemoveAction;
