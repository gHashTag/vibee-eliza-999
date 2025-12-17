// @ts-nocheck
/**
 * Config Status Action
 *
 * Показывает статус конфигурации текущего чата
 * Команда: /config_status
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ChatConfigService } from '../services/chatConfig.service';
import type { ChatConfig } from '../types/chatConfig.types';

/**
 * Форматирует статус конфига для отображения
 */
function formatConfigStatus(config: ChatConfig): string {
  const status = config.isActive ? '✅ Активен' : '❌ Неактивен';
  const salesStatus = config.salesMode ? '🛒 Включён' : '⭕ Выключен';
  const toneLabel = {
    casual: '😎 Неформальный',
    professional: '👔 Профессиональный',
    mixed: '🔄 Смешанный',
  }[config.styleRules.formality] || config.styleRules.formality;

  const triggers = config.triggerWords.length > 0
    ? config.triggerWords.slice(0, 5).join(', ') + (config.triggerWords.length > 5 ? '...' : '')
    : 'Нет';

  return `📊 **Статус конфигурации чата**

**Чат:** ${config.tgChatTitle || config.chatId}
**Тип:** ${config.chatType}
**Статус:** ${status}

**Стратегия:**
• Персона: ${config.personaName}
• Стиль: ${toneLabel}
• Язык: ${config.styleRules.language.toUpperCase()}
• Эмодзи: ${config.styleRules.emojisAllowed ? '✅' : '❌'}

**Sales Mode:** ${salesStatus}
${config.salesMode && config.salesConfig ? `• Продукт: ${config.salesConfig.productName}\n• Цена: ${config.salesConfig.price}` : ''}

**Триггеры:** ${triggers}
**Вероятность ответа:** ${Math.round(config.responseProbability * 100)}%
**Требуется упоминание:** ${config.requireMention ? 'Да' : 'Нет'}

**Приоритет:** ${config.priority}`;
}

/**
 * Action для показа статуса конфига
 */
export const configStatusAction: Action = {
  name: 'CONFIG_STATUS',
  description: 'Показать статус конфигурации текущего чата',
  similes: ['config_status', 'статус конфига', 'показать конфиг'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/config_status' } },
      { name: '{{agent}}', content: { text: '📊 Статус конфигурации чата...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text === '/config_status' ||
           text === 'статус конфига' ||
           text.startsWith('/config_status ');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const roomId = message.roomId;
    const text = (message.content as any)?.text?.trim() || '';

    // Можно указать chatId как аргумент: /config_status 123456
    const parts = text.split(' ');
    const chatId = parts[1] || roomId;

    console.log(`[ConfigStatus] Запрос статуса для chatId=${chatId}, roomId=${roomId}`);

    try {
      const chatConfigService = runtime.getService<ChatConfigService>('chat-config');

      if (!chatConfigService) {
        await callback({
          text: '❌ ChatConfigService не инициализирован. Попробуй позже.',
        });
        return;
      }

      const config = await chatConfigService.getConfig(String(chatId));

      if (!config) {
        await callback({
          text: `❌ Конфигурация для чата ${chatId} не найдена.

Чтобы добавить чат в мониторинг, используй:
\`/config_add ${chatId}\``,
        });
        return;
      }

      await callback({
        text: formatConfigStatus(config),
      });
    } catch (error) {
      console.error('[ConfigStatus] Error:', error);
      await callback({
        text: '❌ Ошибка при получении статуса. Попробуй позже.',
      });
    }
  },
};

export default configStatusAction;
