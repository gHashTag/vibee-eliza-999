/**
 * GramJS Event Monitor
 * Мониторит ВСЕ события Telegram API для анализа
 */

import { TelegramClient } from 'telegram';
import {
  EditedMessage,
  DeletedMessage,
  Album,
  Raw
} from 'telegram/events';
import type { EditedMessageEvent } from 'telegram/events/EditedMessage';
import type { DeletedMessageEvent } from 'telegram/events/DeletedMessage';
import type { AlbumEvent } from 'telegram/events/Album';
import { Api } from 'telegram/tl';
import { KolsLogger } from '../utils/logger';

export class GramJSEventMonitor {
  private client: TelegramClient;
  private isEnabled: boolean = true;

  constructor(client: TelegramClient) {
    this.client = client;
  }

  /**
   * Подписывается на ВСЕ события GramJS для мониторинга
   */
  setupAllEventMonitoring(): void {
    KolsLogger.separator('GRAMJS EVENT MONITORING');
    KolsLogger.info('Подписываюсь на ВСЕ события GramJS...');

    this.setupEditedMessageMonitoring();
    this.setupDeletedMessageMonitoring();
    this.setupAlbumMonitoring();
    this.setupRawEventMonitoring();

    KolsLogger.success('Все обработчики событий зарегистрированы');
    this.listAllHandlers();
  }

  // ==================== EDITED MESSAGE ====================
  private setupEditedMessageMonitoring(): void {
    this.client.addEventHandler(
      async (event: EditedMessageEvent) => {
        if (!this.isEnabled) return;

        const message = event.message as Api.Message;
        KolsLogger.eventEdited({
          messageId: message.id,
          chatId: String(message.chatId || ''),
          newText: message.text || '',
          editDate: message.editDate
        });
      },
      new EditedMessage({})
    );
    KolsLogger.debug('Подписка на EditedMessage');
  }

  // ==================== DELETED MESSAGE ====================
  private setupDeletedMessageMonitoring(): void {
    this.client.addEventHandler(
      async (event: DeletedMessageEvent) => {
        if (!this.isEnabled) return;

        for (const deletedId of event.deletedIds) {
          KolsLogger.eventDeleted({
            messageId: deletedId,
            chatId: String(event.peer || 'unknown')
          });
        }
      },
      new DeletedMessage({})
    );
    KolsLogger.debug('Подписка на DeletedMessage');
  }

  // ==================== ALBUM ====================
  private setupAlbumMonitoring(): void {
    this.client.addEventHandler(
      async (event: AlbumEvent) => {
        if (!this.isEnabled) return;

        KolsLogger.eventAlbum({
          messagesCount: event.messages.length,
          chatId: String(event.messages[0]?.chatId || ''),
          messageIds: event.messages.map(m => m.id)
        });
      },
      new Album({})
    );
    KolsLogger.debug('Подписка на Album');
  }

  // ==================== RAW EVENTS ====================
  private setupRawEventMonitoring(): void {
    // Типы событий для мониторинга
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
