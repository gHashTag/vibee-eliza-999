/**
 * KOLS Unified Plugin
 * Единый переиспользуемый плагин для KOLS (Knowledge Oriented Learning System)
 *
 * Функции:
 * - Telegram MTProto интеграция
 * - Автоматические ответы на сообщения
 * - Инициативные сообщения с LLM генерацией
 * - Мониторинг групп
 * - Управление через настройки
 */

import { Plugin } from '@elizaos/core';
import { KolsUnifiedService } from './services/KolsUnifiedService';
import { kolsProvider } from './providers/kolsProvider';

// Экспортируем все типы и утилиты
export * from './types';
export * from './utils/logger';
export * from './services/KolsUnifiedService';
export * from './providers/kolsProvider';

export const kolsUnifiedPlugin: Plugin = {
  name: 'kols-unified',
  description: 'KOLS Unified Plugin - Knowledge Oriented Learning System с Telegram MTProto, автоответами и проактивными сообщениями',

  // Приоритет плагина (высокий приоритет для ранней инициализации)
  priority: 10,

  // Экспортируем сервисы
  services: [KolsUnifiedService],

  // Экспортируем провайдеры
  providers: [kolsProvider],

  // Настройки по умолчанию
  settings: {
    // Telegram настройки
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID || '94892',
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH || 'cacf9ad137d228611b49b2ecc6d68d43',
    TELEGRAM_SESSION_STRING: process.env.TELEGRAM_SESSION_STRING || '',

    // KOLS настройки
    KOLS_TARGET_CHAT_IDS: process.env.KOLS_TARGET_CHAT_IDS || '-1002643951085,2298297094',
    KOLS_AUTO_REPLY_ENABLED: process.env.KOLS_AUTO_REPLY_ENABLED || 'true',
    KOLS_PROACTIVE_ENABLED: process.env.KOLS_PROACTIVE_ENABLED || 'true',

    // Интервалы проактивности (в минутах)
    KOLS_PROACTIVE_INTERVAL_MIN: process.env.KOLS_PROACTIVE_INTERVAL_MIN || '60',
    KOLS_PROACTIVE_INTERVAL_MAX: process.env.KOLS_PROACTIVE_INTERVAL_MAX || '90',

    // LLM настройки
    KOLS_LLM_MODEL_TYPE: process.env.KOLS_LLM_MODEL_TYPE || 'TEXT_SMALL',
    KOLS_LLM_MAX_TOKENS: process.env.KOLS_LLM_MAX_TOKENS || '300',
    KOLS_LLM_TEMPERATURE: process.env.KOLS_LLM_TEMPERATURE || '0.8',
  },

  // Метаданные плагина
  metadata: {
    version: '1.0.0',
    author: 'KOLS Team',
    keywords: [
      'kols',
      'telegram',
      'mtproto',
      'learning',
      'education',
      'ai-agent',
      'openrouter',
      'proactive-messaging'
    ],
    repository: {
      type: 'git',
      url: 'https://github.com/vibee/kols-unified'
    }
  }
};

export default kolsUnifiedPlugin;
