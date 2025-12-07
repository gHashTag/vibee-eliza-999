/**
 * GramJS Event Monitor
 * Мониторит события Telegram API для анализа
 */

import { TelegramClient } from 'telegram';
import { Raw } from 'telegram/events';
import { Api } from 'telegram/tl';
import { KolsLogger } from '../utils/logger';

export class GramJSEventMonitor {
  private client: TelegramClient;
  private isEnabled: boolean = true;

  constructor(client: TelegramClient) {
    this.client = client;
  }

  /**
   * Подписывается на события GramJS для мониторинга
   */
  setupAllEventMonitoring(): void {
    KolsLogger.separator('GRAMJS EVENT MONITORING');
    KolsLogger.info('Подписываюсь на события GramJS...');

    this.setupRawEventMonitoring();

    KolsLogger.success('Обработчики событий зарегистрированы');
    this.listAllHandlers();
  }

  // ==================== RAW EVENTS ====================
  private setupRawEventMonitoring(): void {
    const monitoredTypes = [
      Api.UpdateUserTyping,
      Api.UpdateChatUserTyping,
      Api.UpdateUserStatus,
      Api.UpdateChatParticipantAdd,
      Api.UpdateChatParticipantDelete,
      Api.UpdateChannel,
      Api.UpdateReadHistoryInbox,
      Api.UpdateReadHistoryOutbox,
    ];

    this.client.addEventHandler(
      async (update: Api.TypeUpdate) => {
        if (!this.isEnabled) return;

        KolsLogger.eventRaw({
          type: update.className,
          data: JSON.stringify(update).substring(0, 200)
        });
      },
      new Raw({ types: monitoredTypes })
    );
    KolsLogger.debug('Подписка на Raw события');
  }

  /**
   * Выводит список всех зарегистрированных обработчиков
   */
  listAllHandlers(): void {
    const handlers = this.client.listEventHandlers();
    KolsLogger.info(`Зарегистрировано обработчиков: ${handlers.length}`);
    handlers.forEach(([eventBuilder], index) => {
      KolsLogger.debug(`  ${index + 1}. ${eventBuilder.constructor.name}`);
    });
  }

  /**
   * Включает/выключает мониторинг
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    KolsLogger.info(`Мониторинг событий: ${enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
  }
}
