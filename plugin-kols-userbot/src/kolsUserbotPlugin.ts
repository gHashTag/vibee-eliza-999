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

// Webhook handler для обработки событий Telegram
async function telegramWebhookHandler(req: any, res: any, runtime: any): Promise<void> {
  try {
    console.log('📱 KOLS WEBHOOK: Получен запрос от Telegram');
    const update = req.body || {};
    console.log('📱 KOLS WEBHOOK: Данные получены', JSON.stringify(update, null, 2));

    // Обрабатываем только групповые сообщения
    if (update.message && update.message.chat) {
      const chatId = update.message.chat.id;
      const messageId = update.message.message_id;
      const text = update.message.text || '';
      const sender = update.message.from;

      console.log(`📱 KOLS WEBHOOK: Сообщение в чате ${chatId}, от ${sender?.first_name || 'Unknown'}`);
      console.log(`📱 KOLS WEBHOOK: Текст: ${text.substring(0, 100)}...`);

      // Проверяем, что это одна из целевых групп
      const targetGroups = [2643951085, 2298297094, -1002643951085];
      const normalizedChatId = chatId < -1000000000 ? Math.abs(chatId) - 100000000000 : chatId;

      if (targetGroups.includes(Math.abs(chatId)) || targetGroups.includes(normalizedChatId)) {
        console.log(`✅ KOLS WEBHOOK: Целевая группа ${chatId} - обрабатываем сообщение`);

        // Здесь можно добавить логику обработки входящих сообщений
        // Например, отправка в MTProto для анализа

      } else {
        console.log(`⏭️  KOLS WEBHOOK: Группа ${chatId} не в целевом списке - пропускаем`);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ KOLS WEBHOOK: Ошибка обработки:', error);
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
