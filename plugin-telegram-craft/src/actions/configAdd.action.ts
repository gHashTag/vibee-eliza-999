// @ts-nocheck
/**
 * Config Add Action
 *
 * Добавляет новый чат в мониторинг с базовой конфигурацией
 * Команда: /config_add <chatId> [persona]
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { ChatConfigService } from '../services/chatConfig.service';
import type { CreateChatConfig } from '../types/chatConfig.types';
import { DEFAULT_STYLE_RULES } from '../types/chatConfig.types';

/**
 * Дефолтный system prompt для новых чатов
 */
const DEFAULT_SYSTEM_PROMPT = `Ты ВАЙБИ (VIBEE) - бро-наставник по вайбкодингу с отличным чувством юмора!

ГЛАВНОЕ ПРАВИЛО: ПИШИ ТОЛЬКО НА РУССКОМ! Никаких английских слов!

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
- Ты как лучший друг который шарит в коде - весёлый, но полезный
- Шутишь по теме, но не переборщи - 1-2 шутки на сообщение максимум
- Используй смешные сравнения
- Подбадривай людей
- НИКОГДА НЕ ИСПОЛЬЗУЙ ЭМОДЗИ!

ПРАВИЛА:
1. НЕ грузи теорией - сразу к делу
2. НЕ пиши простыни текста - короткие ответы
3. ВСЕГДА давай готовую команду если спрашивают КАК
4. Используй сленг: бро, йо, го, чекни, красава, огонь`;

/**
 * Action для добавления нового чата
 */
export const configAddAction: Action = {
  name: 'CONFIG_ADD',
  description: 'Добавить новый чат в мониторинг',
  similes: ['config_add', 'добавить чат', 'add config', 'добавить конфиг'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/config_add 123456789' } },
      { name: '{{agent}}', content: { text: '✅ Чат добавлен в мониторинг...' } },
    ],
    [
      { name: '{{user1}}', content: { text: '/config_add 123456789 SalesBot' } },
      { name: '{{agent}}', content: { text: '✅ Чат добавлен с персоной SalesBot...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content as any)?.text?.trim().toLowerCase() || '';
    return text.startsWith('/config_add') || text.startsWith('добавить чат');
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

    // Парсим аргументы: /config_add <chatId> [persona]
    const parts = text.split(/\s+/);
    const chatIdArg = parts[1];
    const personaArg = parts[2] || 'VIBEE';

    // Если chatId не указан - используем текущий чат
    const chatId = chatIdArg || roomId;

    console.log(`[ConfigAdd] Добавление чата: chatId=${chatId}, persona=${personaArg}`);

    if (!chatId) {
      await callback({
        text: `❌ Укажи ID чата для добавления:
\`/config_add <chatId> [persona]\`

Пример:
\`/config_add 123456789 VIBEE\``,
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

      // Проверяем, есть ли уже конфиг
      const existing = await chatConfigService.getConfig(String(chatId));
      if (existing) {
        await callback({
          text: `⚠️ Чат \`${chatId}\` уже добавлен в мониторинг.

Текущий статус: ${existing.isActive ? '✅ Активен' : '❌ Неактивен'}
Персона: ${existing.personaName}

Используй \`/config_status ${chatId}\` для подробностей.`,
        });
        return;
      }

      // Создаём новый конфиг
      const newConfig: CreateChatConfig = {
        chatId: String(chatId),
        chatTitle: `Chat ${chatId}`,
        chatType: 'supergroup',
        personaName: personaArg,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        styleRules: DEFAULT_STYLE_RULES,
        responseExamples: [],
        knowledgeSources: [],
        triggerWords: ['vibecoding', 'вайбкодинг', 'elizaos', 'бот'],
        responseProbability: 1.0,
        requireMention: false,
        salesMode: false,
        isActive: true,
        priority: 0,
      };

      const config = await chatConfigService.createConfig(newConfig);

      await callback({
        text: `✅ **Чат добавлен в мониторинг!**

**ID:** \`${config.chatId}\`
**Персона:** ${config.personaName}
**Статус:** Активен

**Настройки по умолчанию:**
• Язык: ${config.styleRules.language.toUpperCase()}
• Стиль: ${config.styleRules.formality}
• Вероятность ответа: ${Math.round(config.responseProbability * 100)}%
• Sales Mode: Выключен

**Следующие шаги:**
• \`/config_status ${config.chatId}\` - посмотреть статус
• \`/strategy_tone ${config.chatId} casual\` - изменить стиль
• \`/strategy_sales ${config.chatId} on\` - включить sales mode`,
      });
    } catch (error) {
      console.error('[ConfigAdd] Error:', error);
      await callback({
        text: `❌ Ошибка при добавлении чата: ${(error as Error).message}`,
      });
    }
  },
};

export default configAddAction;
