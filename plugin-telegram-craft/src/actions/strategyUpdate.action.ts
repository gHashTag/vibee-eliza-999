// @ts-nocheck
/**
 * Strategy Update Actions
 *
 * Команды для обновления стратегий чатов:
 * - /strategy <chatId> - показать стратегию
 * - /strategy_tone <chatId> casual|professional|mixed
 * - /strategy_sales <chatId> on|off
 * - /strategy_triggers <chatId> слово1,слово2,слово3
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ChatConfigService } from '../services/chatConfig.service';
import type { ChatConfig, StyleRules, SalesConfig } from '../types/chatConfig.types';

// ============================================
// /strategy <chatId> - показать стратегию
// ============================================

function formatStrategy(config: ChatConfig): string {
  const lines: string[] = [
    `🎯 **Стратегия чата ${config.chatTitle || config.chatId}**`,
    '',
    '**Персона и промпт:**',
    `• Имя: ${config.personaName}`,
    `• Промпт: ${config.systemPrompt.slice(0, 100)}...`,
    '',
    '**Tone of Voice:**',
    `• Формальность: ${config.styleRules.formality}`,
    `• Язык: ${config.styleRules.language}`,
    `• Эмодзи: ${config.styleRules.emojisAllowed ? 'Да' : 'Нет'}`,
    `• Сленг: ${config.styleRules.slangs?.join(', ') || 'Нет'}`,
    `• Макс. длина: ${config.styleRules.maxResponseLength} символов`,
    '',
    '**Sales Mode:**',
    `• Статус: ${config.salesMode ? '✅ Включён' : '❌ Выключен'}`,
  ];

  if (config.salesMode && config.salesConfig) {
    lines.push(`• Продукт: ${config.salesConfig.productName}`);
    lines.push(`• Цена: ${config.salesConfig.price}`);
    lines.push(`• CTA: ${config.salesConfig.ctaTemplate}`);
  }

  lines.push('');
  lines.push('**Триггеры:**');
  lines.push(`• Слова: ${config.triggerWords.join(', ') || 'Нет'}`);
  lines.push(`• Вероятность: ${Math.round(config.responseProbability * 100)}%`);
  lines.push(`• Требуется @mention: ${config.requireMention ? 'Да' : 'Нет'}`);

  return lines.join('\n');
}

export const strategyShowAction: Action = {
  name: 'STRATEGY_SHOW',
  description: 'Показать стратегию чата',
  similes: ['strategy', 'стратегия', 'показать стратегию'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/strategy 123456' } },
      { name: '{{agent}}', content: { text: '🎯 Стратегия чата...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return (text.startsWith('/strategy') && !text.startsWith('/strategy_')) ||
           text === 'стратегия';
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const text = (message.content as any)?.text?.trim() || '';
    const parts = text.split(/\s+/);
    const chatId = parts[1] || message.roomId;

    try {
      const service = runtime.getService<ChatConfigService>('chat-config');
      if (!service) {
        await callback({ text: '❌ ChatConfigService не инициализирован.' });
        return;
      }

      const config = await service.getConfig(String(chatId));
      if (!config) {
        await callback({ text: `❌ Конфиг для чата ${chatId} не найден.` });
        return;
      }

      await callback({ text: formatStrategy(config) });
    } catch (error) {
      console.error('[StrategyShow] Error:', error);
      await callback({ text: '❌ Ошибка при получении стратегии.' });
    }
  },
};

// ============================================
// /strategy_tone <chatId> casual|professional|mixed
// ============================================

export const strategyToneAction: Action = {
  name: 'STRATEGY_TONE',
  description: 'Изменить tone of voice чата',
  similes: ['strategy_tone', 'изменить стиль'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/strategy_tone 123456 casual' } },
      { name: '{{agent}}', content: { text: '✅ Стиль изменён на casual' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text.startsWith('/strategy_tone');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const text = (message.content as any)?.text?.trim() || '';
    const parts = text.split(/\s+/);
    const chatId = parts[1];
    const tone = parts[2]?.toLowerCase();

    if (!chatId || !tone) {
      await callback({
        text: `❌ Формат: \`/strategy_tone <chatId> <tone>\`

Варианты tone:
• \`casual\` - неформальный, дружелюбный
• \`professional\` - профессиональный, вежливый
• \`mixed\` - адаптивный

Пример: \`/strategy_tone 123456 casual\``,
      });
      return;
    }

    if (!['casual', 'professional', 'mixed'].includes(tone)) {
      await callback({
        text: `❌ Неизвестный tone: ${tone}

Допустимые значения: casual, professional, mixed`,
      });
      return;
    }

    try {
      const service = runtime.getService<ChatConfigService>('chat-config');
      if (!service) {
        await callback({ text: '❌ ChatConfigService не инициализирован.' });
        return;
      }

      const config = await service.getConfig(String(chatId));
      if (!config) {
        await callback({ text: `❌ Конфиг для чата ${chatId} не найден.` });
        return;
      }

      const newStyleRules: StyleRules = {
        ...config.styleRules,
        formality: tone as 'casual' | 'professional' | 'mixed',
      };

      await service.updateConfig(String(chatId), { styleRules: newStyleRules });

      const toneLabels = {
        casual: '😎 Неформальный',
        professional: '👔 Профессиональный',
        mixed: '🔄 Смешанный',
      };

      await callback({
        text: `✅ **Tone of voice обновлён**

Чат: \`${chatId}\`
Новый стиль: ${toneLabels[tone as keyof typeof toneLabels]}`,
      });
    } catch (error) {
      console.error('[StrategyTone] Error:', error);
      await callback({ text: '❌ Ошибка при обновлении стиля.' });
    }
  },
};

// ============================================
// /strategy_sales <chatId> on|off
// ============================================

export const strategySalesAction: Action = {
  name: 'STRATEGY_SALES',
  description: 'Включить/выключить sales mode',
  similes: ['strategy_sales', 'sales mode'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/strategy_sales 123456 on' } },
      { name: '{{agent}}', content: { text: '✅ Sales mode включён' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text.startsWith('/strategy_sales');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const text = (message.content as any)?.text?.trim() || '';
    const parts = text.split(/\s+/);
    const chatId = parts[1];
    const mode = parts[2]?.toLowerCase();

    if (!chatId || !mode) {
      await callback({
        text: `❌ Формат: \`/strategy_sales <chatId> <on|off>\`

Пример: \`/strategy_sales 123456 on\``,
      });
      return;
    }

    if (!['on', 'off'].includes(mode)) {
      await callback({
        text: `❌ Неизвестный режим: ${mode}

Допустимые значения: on, off`,
      });
      return;
    }

    try {
      const service = runtime.getService<ChatConfigService>('chat-config');
      if (!service) {
        await callback({ text: '❌ ChatConfigService не инициализирован.' });
        return;
      }

      const config = await service.getConfig(String(chatId));
      if (!config) {
        await callback({ text: `❌ Конфиг для чата ${chatId} не найден.` });
        return;
      }

      const enabled = mode === 'on';

      // Если включаем - создаём дефолтный salesConfig
      const updates: any = { salesMode: enabled };

      if (enabled && !config.salesConfig) {
        updates.salesConfig = {
          productName: 'VIBEE',
          price: '99 Stars',
          ctaTemplate: 'Напиши мне для старта!',
          mentorContact: '@vibee_support',
          urgencyTriggers: [],
          features: [],
          objectionHandlers: {},
        } as SalesConfig;
      }

      await service.updateConfig(String(chatId), updates);

      await callback({
        text: enabled
          ? `✅ **Sales Mode включён**

Чат: \`${chatId}\`
Продукт: ${updates.salesConfig?.productName || config.salesConfig?.productName || 'VIBEE'}

Для настройки sales конфига используй HTTP API:
\`PUT /api/chat-configs/${chatId}/strategy/sales\``
          : `✅ **Sales Mode выключен**

Чат: \`${chatId}\``,
      });
    } catch (error) {
      console.error('[StrategySales] Error:', error);
      await callback({ text: '❌ Ошибка при изменении sales mode.' });
    }
  },
};

// ============================================
// /strategy_triggers <chatId> слово1,слово2,слово3
// ============================================

export const strategyTriggersAction: Action = {
  name: 'STRATEGY_TRIGGERS',
  description: 'Обновить trigger words',
  similes: ['strategy_triggers', 'триггеры'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/strategy_triggers 123456 бот,помощь,вайб' } },
      { name: '{{agent}}', content: { text: '✅ Триггеры обновлены' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text.startsWith('/strategy_triggers');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    const text = (message.content as any)?.text?.trim() || '';
    const parts = text.split(/\s+/);
    const chatId = parts[1];
    const triggersStr = parts.slice(2).join(' ');

    if (!chatId) {
      await callback({
        text: `❌ Формат: \`/strategy_triggers <chatId> <слова через запятую>\`

Пример: \`/strategy_triggers 123456 бот,помощь,вайбкодинг\`

Чтобы очистить триггеры: \`/strategy_triggers 123456 clear\``,
      });
      return;
    }

    try {
      const service = runtime.getService<ChatConfigService>('chat-config');
      if (!service) {
        await callback({ text: '❌ ChatConfigService не инициализирован.' });
        return;
      }

      const config = await service.getConfig(String(chatId));
      if (!config) {
        await callback({ text: `❌ Конфиг для чата ${chatId} не найден.` });
        return;
      }

      let triggerWords: string[] = [];

      if (triggersStr && triggersStr.toLowerCase() !== 'clear') {
        triggerWords = triggersStr.split(',').map(w => w.trim()).filter(Boolean);
      }

      await service.updateConfig(String(chatId), { triggerWords });

      await callback({
        text: triggerWords.length > 0
          ? `✅ **Триггеры обновлены**

Чат: \`${chatId}\`
Триггеры: ${triggerWords.join(', ')}

Бот будет отвечать когда сообщение содержит одно из этих слов.`
          : `✅ **Триггеры очищены**

Чат: \`${chatId}\`

Бот будет отвечать на все сообщения (с учётом вероятности).`,
      });
    } catch (error) {
      console.error('[StrategyTriggers] Error:', error);
      await callback({ text: '❌ Ошибка при обновлении триггеров.' });
    }
  },
};

// Экспортируем все actions
export default {
  strategyShowAction,
  strategyToneAction,
  strategySalesAction,
  strategyTriggersAction,
};
