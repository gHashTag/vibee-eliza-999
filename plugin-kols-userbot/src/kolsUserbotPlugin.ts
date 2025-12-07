/**
 * KOLS Userbot Plugin - ЕДИНЫЙ ПЛАГИН
 *
 * Объединяет ВСЕ функции KOLS USERBOT в одном месте:
 * - MTProto подключение (telegram-craft)
 * - Проактивное обучение (vibe-learning)
 * - Мониторинг групп
 * - Библия вайб-кодера
 *
 * Создан для упрощения архитектуры - все в одном плагине!
 */
import { Plugin, Route } from '@elizaos/core';
import { KolsTelegramService } from './services/KolsTelegramService';
import { KolsLearningService } from './services/KolsLearningService';
import { proactiveLearningAction } from './actions/ProactiveLearningAction';
import { startGroupMonitoringAction } from './actions/StartGroupMonitoringAction';
import { addGroupToMonitorAction } from './actions/AddGroupToMonitorAction';
import { kolsLearningProvider } from './providers/KolsLearningProvider';
import { KolsLogger } from './utils/logger';

// Webhook handler для обработки событий Telegram
async function telegramWebhookHandler(req: any, res: any, runtime: any): Promise<void> {
  try {
    KolsLogger.info('WEBHOOK: Получен запрос от Telegram');
    const update = req.body || {};

    // Обрабатываем только групповые сообщения
    if (update.message && update.message.chat) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      const sender = update.message.from;

      KolsLogger.debug(`WEBHOOK: Сообщение в чате ${chatId}, от ${sender?.first_name || 'Unknown'}`);

      // Проверяем, что это одна из целевых групп
      const targetGroups = [2643951085, 2298297094, -1002643951085];
      const normalizedChatId = chatId < -1000000000 ? Math.abs(chatId) - 100000000000 : chatId;

      if (targetGroups.includes(Math.abs(chatId)) || targetGroups.includes(normalizedChatId)) {
        KolsLogger.success(`WEBHOOK: Целевая группа ${chatId} - обрабатываем`);
      } else {
        KolsLogger.debug(`WEBHOOK: Группа ${chatId} не в целевом списке - пропускаем`);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    KolsLogger.error('WEBHOOK: Ошибка обработки', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export const kolsUserbotPlugin: Plugin = {
  name: 'kols-userbot',
  description: 'KOLS USERBOT - единый плагин для MTProto подключения и проактивного обучения студентов VibeCoding',

  // Приоритет плагина (выполняется раньше других)
  priority: 100,

  // Сервисы (фоновые процессы)
  services: [
    KolsTelegramService,
    KolsLearningService
  ],

  // Actions (команды)
  actions: [
    proactiveLearningAction,        // Проактивное обучение
    startGroupMonitoringAction,     // Запуск мониторинга
    addGroupToMonitorAction         // Добавление групп
  ],

  // Providers (контекстные данные)
  providers: [
    kolsLearningProvider            // Знания для LLM
  ],

  // Routes для webhook'ов от Telegram
  routes: [
    {
      name: 'telegram-webhook',
      path: '/telegram/webhook',
      type: 'POST',
      handler: telegramWebhookHandler,
    }
  ]
};

export default kolsUserbotPlugin;
