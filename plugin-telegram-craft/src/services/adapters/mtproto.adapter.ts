// @ts-nocheck
/**
 * MTProto Adapter
 *
 * Реализация ITelegramAdapter через GramJS (MTProto)
 */
import { TelegramClient, Api, Logger } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";
import {
  ITelegramAdapter,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
  ITelegramMedia,
} from "../../types/telegram.types";

// 🛡️ ГЛОБАЛЬНЫЙ обработчик TIMEOUT ошибок - устанавливается ОДИН РАЗ при загрузке модуля
// Это критически важно для подавления шумных TIMEOUT ошибок от GramJS
if (!(global as any).__telegramTimeoutHandlerInstalled) {
  const timeoutErrorHandler = (reason: any, promise: Promise<any>) => {
    try {
      // Проверяем все возможные варианты TIMEOUT ошибок
      const errorMessage = String(reason?.message || reason || "");
      const errorStack = String(reason?.stack || "");
      const errorName = String(reason?.name || "");

      // Подавляем ВСЕ ошибки TIMEOUT от GramJS - это нормальное поведение для long-polling
      const isTimeoutError =
        errorMessage.includes("TIMEOUT") ||
        errorMessage.includes("timeout") ||
        errorStack.includes("updates.js") ||
        errorStack.includes("TIMEOUT") ||
        errorName.includes("TIMEOUT") ||
        (reason?.constructor?.name === "Error" &&
          errorMessage.includes("TIMEOUT"));

      if (isTimeoutError) {
        // Полностью подавляем - не логируем и не обрабатываем
        // Это нормальное поведение GramJS для long-polling соединений
        return;
      }

      // Логируем только реальные ошибки (не из GramJS updates)
      if (
        errorStack &&
        !errorStack.includes("telegram/client/updates.js") &&
        !errorStack.includes("telegram/client/TelegramClient")
      ) {
        // Пропускаем дальше для обработки другими обработчиками
        // Но не логируем здесь, чтобы избежать дублирования
      }
    } catch (handlerError) {
      // Если сам обработчик упал - игнорируем, чтобы не создавать бесконечный цикл
    }
  };

  // Устанавливаем обработчик ПЕРВЫМ (prependListener) чтобы он срабатывал раньше других
  process.prependListener("unhandledRejection", timeoutErrorHandler);
  (global as any).__telegramTimeoutHandlerInstalled = true;
  console.log(
    "[MTProtoAdapter] ✅ Глобальный обработчик TIMEOUT ошибок установлен (prependListener)"
  );
}

interface MTProtoConfig {
  apiId: number;
  apiHash: string;
  session?: string;
}

// 🔒 ГЛОБАЛЬНЫЙ SINGLETON: Один MTProtoAdapter на весь процесс
// Решает проблему тройного создания при множественной инициализации ElizaOS
let globalMTProtoInstance: MTProtoAdapter | null = null;

// 🔒 ГЛОБАЛЬНЫЙ ФЛАГ: Event handler зарегистрирован только один раз
let globalEventHandlerRegistered = false;

// 🔒 ДЕДУПЛИКАЦИЯ: Кэш обработанных message ID (GramJS может дублировать события)
const processedMessageIds = new Set<string>();
const MAX_PROCESSED_CACHE_SIZE = 1000; // Ограничиваем размер кэша

export class MTProtoAdapter implements ITelegramAdapter {
  private client: TelegramClient | null = null;
  private messageHandler: ((message: ITelegramMessage) => void) | null = null;
  private eventHandler: ((event: Api.TypeUpdate) => Promise<void>) | null =
    null; // 🔒 Сохраняем ссылку на обработчик
  private connected = false;
  private apiId: number;
  private apiHash: string;
  private sessionString?: string;

  /**
   * 🔒 SINGLETON FACTORY: Возвращает существующий instance или создаёт новый
   * Предотвращает создание множественных GramJS клиентов
   */
  static getInstance(config: MTProtoConfig): MTProtoAdapter {
    if (globalMTProtoInstance) {
      console.log("[MTProtoAdapter] 🔒 Возвращаем существующий singleton instance");
      return globalMTProtoInstance;
    }
    console.log("[MTProtoAdapter] 🆕 Создаём новый singleton instance");
    globalMTProtoInstance = new MTProtoAdapter(config);
    return globalMTProtoInstance;
  }

  constructor(config: MTProtoConfig) {
    // Проверяем не создан ли уже instance
    if (globalMTProtoInstance && globalMTProtoInstance !== this) {
      console.warn("[MTProtoAdapter] ⚠️ Попытка создать второй instance! Используйте MTProtoAdapter.getInstance()");
    }
    this.apiId = config.apiId;
    this.apiHash = config.apiHash;
    this.sessionString = config.session;
  }

  /**
   * Извлечение медиа из сообщения GramJS
   * Скачивает фото и конвертирует в base64 data URL
   */
  private async extractMedia(
    msg: Api.Message
  ): Promise<ITelegramMedia[] | undefined> {
    console.log(
      `🔍 [MTProto] extractMedia called, hasMedia: ${!!msg.media}, mediaType: ${msg.media?.className || "none"}`
    );

    if (!msg.media || !this.client) return undefined;

    const media: ITelegramMedia[] = [];

    try {
      // Обработка фото
      if (msg.media instanceof Api.MessageMediaPhoto) {
        const photo = msg.media.photo;
        if (photo instanceof Api.Photo) {
          console.log(`📷 [MTProto] Скачиваю фото id=${photo.id}...`);

          // Скачиваем фото в буфер
          const buffer = await this.client.downloadMedia(msg.media, {});
          if (buffer) {
            // Конвертируем в base64 data URL
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = "image/jpeg"; // Telegram обычно отдаёт JPEG

            media.push({
              type: "photo",
              url: `data:${mimeType};base64,${base64}`,
              fileId: photo.id.toString(),
              mimeType,
              // Берём размеры из самого большого варианта фото
              width: photo.sizes?.reduce(
                (max: any, size: any) =>
                  (size.w || 0) > (max.w || 0) ? size : max,
                { w: 0, h: 0 }
              )?.w,
              height: photo.sizes?.reduce(
                (max: any, size: any) =>
                  (size.h || 0) > (max.h || 0) ? size : max,
                { w: 0, h: 0 }
              )?.h,
            });

            console.log(
              `✅ [MTProto] Фото скачано, размер base64: ${base64.length} символов`
            );
          }
        }
      }

      // Обработка документов (включая GIF, видео как документы)
      if (msg.media instanceof Api.MessageMediaDocument) {
        const doc = msg.media.document;
        if (doc instanceof Api.Document) {
          const mimeType = doc.mimeType || "application/octet-stream";

          // Определяем тип по MIME
          let type: ITelegramMedia["type"] = "document";
          if (mimeType.startsWith("image/")) type = "photo";
          if (mimeType.startsWith("video/")) type = "video";
          if (mimeType.startsWith("audio/")) type = "audio";
          if (mimeType === "image/webp") type = "sticker";

          // Для изображений — скачиваем
          if (type === "photo" || mimeType.startsWith("image/")) {
            console.log(
              `📄 [MTProto] Скачиваю документ-изображение id=${doc.id}...`
            );

            const buffer = await this.client.downloadMedia(msg.media, {});
            if (buffer) {
              const base64 = Buffer.from(buffer).toString("base64");
              media.push({
                type: "photo",
                url: `data:${mimeType};base64,${base64}`,
                fileId: doc.id.toString(),
                mimeType,
                fileSize: Number(doc.size),
              });
              console.log(`✅ [MTProto] Документ скачан`);
            }
          } else {
            // Для остальных — только метаданные (без скачивания)
            media.push({
              type,
              fileId: doc.id.toString(),
              mimeType,
              fileSize: Number(doc.size),
              fileName: doc.attributes?.find((a: any) => a.fileName)?.fileName,
            });
          }
        }
      }
    } catch (error) {
      console.error("[MTProto] Ошибка извлечения медиа:", error);
    }

    return media.length > 0 ? media : undefined;
  }

  /**
   * Извлечение медиа из reply сообщения
   */
  private async extractReplyMedia(
    msg: Api.Message
  ): Promise<ITelegramMedia[] | undefined> {
    if (!msg.replyTo || !this.client) return undefined;

    try {
      const replyToMsgId = msg.replyTo.replyToMsgId;
      if (!replyToMsgId) return undefined;

      // Получаем оригинальное сообщение
      const peerId = msg.peerId;
      const messages = await this.client.getMessages(peerId, {
        ids: [replyToMsgId],
      });

      if (
        messages &&
        messages.length > 0 &&
        messages[0] instanceof Api.Message
      ) {
        return this.extractMedia(messages[0]);
      }
    } catch (error) {
      console.error("[MTProto] Ошибка извлечения reply медиа:", error);
    }

    return undefined;
  }

  async connect(): Promise<boolean> {
    try {
      const session = new StringSession(this.sessionString || "");

      // 🛡️ Используем Logger с уровнем 'error' для подавления warning/debug логов
      // TIMEOUT ошибки будут подавлены через unhandledRejection handler
      this.client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
        requestRetries: 3,
        timeout: 10000, // 10 секунд таймаут для запросов
        retryDelay: 1000, // 1 секунда задержка между повторами
        logger: new Logger("error"), // Только error логи, без warning/debug
      });

      // Обработчик уже установлен при загрузке модуля (см. начало файла)

      await this.client.connect();
      this.connected = true;

      // 🔒 Если обработчик уже установлен (onMessage вызван до connect), регистрируем его
      if (this.messageHandler && this.eventHandler) {
        this.client.addEventHandler(this.eventHandler);
        console.log(
          "[MTProtoAdapter] Event handler registered after connection"
        );
      }

      return true;
    } catch (error) {
      console.error("[MTProtoAdapter] Connection failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // 🔒 Удаляем обработчик перед отключением
      if (this.eventHandler) {
        try {
          this.client.removeEventHandler(this.eventHandler);
          console.log(
            "[MTProtoAdapter] Event handler removed before disconnect"
          );
        } catch (error) {
          console.warn("[MTProtoAdapter] Failed to remove handler:", error);
        }
        this.eventHandler = null;
      }
      await this.client.disconnect();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && !!this.client?.connected;
  }
  /**
   * 🔍 Универсальный помощник для разрешения Peer (User/Chat/Channel)
   * Пытается найти сущность через кэш, сеть или создать вручную для обычных групп
   */
  private async resolvePeer(chatId: string | number): Promise<Api.TypeInputPeer | null> {
      if (!this.client) return null;
      
      const chatIdStr = String(chatId);
      const chatIdNum = typeof chatId === "string" ? parseInt(chatId, 10) : chatId;
      const channelFullId = BigInt(`-100${chatIdStr.replace("-100", "")}`);

      // 1. Проверяем кэш и сеть через getEntity
      const idsToTry = [chatIdNum, channelFullId];
      if (typeof chatId === 'string') idsToTry.push(chatId);
      
      for (const id of idsToTry) {
          try {
              const entity = await this.client.getEntity(id);
              if (entity) {
                  // Конвертируем entity в InputPeer (это делается автоматически GramJS обычно, но явное лучше)
                  return entity;
              }
          } catch (e) { /* ignore */ }
      }

      // 2. Если это похоже на ID обычной группы (положительное число, не супергруппа), пробуем InputPeerChat
      // В GramJS ID пользователей и групп пересекаются, но если getEntity не нашел юзера, может это группа?
      if (typeof chatIdNum === 'number' && chatIdNum > 0) {
          try {
             console.log(`⚠️ [MTProtoAdapter] Trying explicit InputPeerChat for ${chatIdNum}...`);
             return new Api.InputPeerChat({ chatId: BigInt(chatIdNum) });
          } catch (e) { /* ignore */ }
      }

      return null;
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    replyTo?: number
  ): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: "Not connected" };
    }

    try {
      const chatIdStr = String(chatId);
      const chatIdNum =
        typeof chatId === "string" ? parseInt(chatId, 10) : chatId;

      console.log(
        `📤 [MTProtoAdapter] sendMessage to chatId: ${chatIdStr} (num: ${chatIdNum})`
      );

      // 🛠️ Используем resolvePeer для поиска сущности (включая fallback для обычных групп)
      const inputPeer = await this.resolvePeer(chatId);
      
      if (inputPeer) {
          try {
              const result = await this.client.sendMessage(inputPeer, {
                message: text,
                replyTo: replyTo,
              });
              console.log(
                `✅ [MTProtoAdapter] Message sent successfully (via resolved peer)`
              );
              return { success: true, messageId: result.id };
          } catch (sendError) {
             console.error(`❌ [MTProtoAdapter] sendMessage via resolved peer failed:`, sendError);
             // Если не получилось - пробуем старые методы как fallback
          }
      }

      // Стратегия 1: Пробуем использовать getInputEntity для получения правильного peer
      try {
        // GramJS может резолвить ID автоматически если чат есть в кэше
        const result = await this.client.sendMessage(chatIdNum, {
          message: text,
          replyTo: replyTo,
        });
        console.log(
          `✅ [MTProtoAdapter] Message sent successfully (direct ID)`
        );
        return { success: true, messageId: result.id };
      } catch (firstError) {
        console.log(
          `⚠️ [MTProtoAdapter] Direct ID failed, trying -100 prefix...`
        );

        // Стратегия 2: Для channels/supergroups формат -100XXXXXXXXXX
        // Правильная формула: -1001144640997 = -(1001144640997)
        const channelFullId = BigInt(`-100${chatIdStr}`);
        console.log(
          `📤 [MTProtoAdapter] Trying channel format: -100${chatIdStr} = ${channelFullId}`
        );

        try {
          const result = await this.client.sendMessage(channelFullId, {
            message: text,
            replyTo: replyTo,
          });
          console.log(
            `✅ [MTProtoAdapter] Message sent successfully (channel format)`
          );
          return { success: true, messageId: result.id };
        } catch (secondError) {
          console.log(
            `⚠️ [MTProtoAdapter] Channel format failed, trying getEntity lookup...`
          );

          // Стратегия 3: Пробуем разрешить сущность через getEntity (сетевой запрос)
          try {
             // Пробуем разные варианты ID для getEntity
             const entitiesToTry = [chatIdNum, channelFullId];
             if (typeof chatId === 'string') entitiesToTry.push(chatId);
             
             let entity = null;
             for (const idToTry of entitiesToTry) {
                 try {
                     entity = await this.client.getEntity(idToTry);
                     if (entity) break;
                 } catch (e) {
                      console.log(`⚠️ [MTProtoAdapter] getEntity(${idToTry}) failed: ${e.message}`);
                 }
             }

             if (entity) {
                 console.log(`✅ [MTProtoAdapter] Entity found via network lookup`);
                 const result = await this.client.sendMessage(entity, {
                    message: text,
                    replyTo: replyTo,
                  });
                  return { success: true, messageId: result.id };
             }

             // Стратегия 3.5: Если это обычная группа (не супергруппа), ей не нужен accessHash
             // Пробуем сконструировать PeerChat напрямую
             try {
                console.log(`⚠️ [MTProtoAdapter] Entity lookup failed. Trying direct InputPeerChat construction for ${chatIdNum}...`);
                const peer = new Api.InputPeerChat({ chatId: BigInt(chatIdNum) });
                const result = await this.client.sendMessage(peer, {
                    message: text,
                    replyTo: replyTo,
                });
                console.log(`✅ [MTProtoAdapter] Message sent successfully (via InputPeerChat)`);
                return { success: true, messageId: result.id };
             } catch (peerError) {
                console.log(`⚠️ [MTProtoAdapter] InputPeerChat failed: ${peerError.message}`);
             }

             throw new Error("Entity resolution failed");
          } catch (entityError) {
             console.log(`⚠️ [MTProtoAdapter] Entity lookup failed, trying getDialogs fallback...`);

              // Стратегия 4 (Last Resort): Ищем чат в диалогах
              try {
                const dialogs = await this.client.getDialogs({ limit: 100 });
                for (const dialog of dialogs) {
                  const dialogId = dialog.id?.toString();
                  if (dialogId === chatIdStr || dialogId === `-100${chatIdStr}`) {
                    console.log(
                      `📤 [MTProtoAdapter] Found dialog: ${dialog.title} (${dialogId})`
                    );
                    const result = await this.client.sendMessage(dialog.entity, {
                      message: text,
                      replyTo: replyTo,
                    });
                    console.log(
                      `✅ [MTProtoAdapter] Message sent successfully (via dialog entity)`
                    );
                    return { success: true, messageId: result.id };
                  }
                }
                throw new Error(`Chat ${chatIdStr} not found in dialogs`);
              } catch (thirdError: any) {
                // Проверяем тип ошибки для более понятного сообщения
                const errorMessage = String(thirdError);
                if (
                  errorMessage.includes("CHAT_WRITE_FORBIDDEN") ||
                  errorMessage.includes("403")
                ) {
                  console.warn(
                    `⚠️ [MTProtoAdapter] Нет прав на отправку сообщений в чат ${chatIdStr}. ` +
                      `Убедитесь, что юзер-бот имеет права администратора или участника группы.`
                  );
                  return {
                    success: false,
                    error: `CHAT_WRITE_FORBIDDEN: Нет прав на отправку сообщений в чат ${chatIdStr}`,
                  };
                }
                console.error(
                  `❌ [MTProtoAdapter] All strategies failed:`,
                  thirdError
                );
                return { success: false, error: String(thirdError) };
              }
          }
        }
      }
    } catch (error: any) {
      // Проверяем тип ошибки для более понятного сообщения
      const errorMessage = String(error);
      if (
        errorMessage.includes("CHAT_WRITE_FORBIDDEN") ||
        errorMessage.includes("403")
      ) {
        console.warn(
          `⚠️ [MTProtoAdapter] Нет прав на отправку сообщений. ` +
            `Убедитесь, что юзер-бот имеет права администратора или участника группы.`
        );
        return {
          success: false,
          error: `CHAT_WRITE_FORBIDDEN: Нет прав на отправку сообщений`,
        };
      }
      console.error(`❌ [MTProtoAdapter] sendMessage error:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Пересылка сообщения в другой чат
   */
  async forwardMessage(
    fromChatId: string | number,
    toChatId: string | number,
    messageId: number
  ): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: "Not connected" };
    }

    try {
      const fromChatNum =
        typeof fromChatId === "string" ? parseInt(fromChatId, 10) : fromChatId;
      const toChatNum =
        typeof toChatId === "string" ? parseInt(toChatId, 10) : toChatId;

      console.log(
        `📤 [MTProtoAdapter] forwardMessage: ${messageId} from ${fromChatNum} to ${toChatNum}`
      );

      return this.forwardMessages(fromChatId, toChatId, [messageId]);
    } catch (error) {
      console.error(`❌ [MTProtoAdapter] forwardMessage error:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Пересылка нескольких сообщений в другой чат
   */
  async forwardMessages(
    fromChatId: string | number,
    toChatId: string | number,
    messageIds: number[]
  ): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: "Not connected" };
    }

    try {
      const fromChatNum =
        typeof fromChatId === "string" ? parseInt(fromChatId, 10) : fromChatId;
      const toChatNum =
        typeof toChatId === "string" ? parseInt(toChatId, 10) : toChatId;

      console.log(
        `📤 [MTProtoAdapter] forwardMessages: [${messageIds.join(', ')}] from ${fromChatNum} to ${toChatNum}`
      );

      // 🛠️ Используем resolvePeer для получения правильного peer (критично для новых групп!)
      let toPeer: any = toChatNum;
      try {
           const resolved = await this.resolvePeer(toChatId);
           if (resolved) {
              toPeer = resolved;
              console.log(`✅ [MTProtoAdapter] Target peer resolved for forwarding:`, resolved.className);
           }
      } catch (e) {
           console.warn(`⚠️ [MTProtoAdapter] Failed to resolve target peer for forwarding, using direct ID:`, e);
      }

      const result = await this.client.forwardMessages(toPeer, {
        messages: messageIds,
        fromPeer: fromChatNum,
      });

      const forwardedIds = Array.isArray(result)
        ? result.map((r: any) => r?.id).filter(Boolean)
        : [result?.id];

      console.log(`✅ [MTProtoAdapter] Messages forwarded, ids: [${forwardedIds.join(', ')}]`);

      return { success: true, messageId: forwardedIds[0] };
    } catch (error) {
      console.error(`❌ [MTProtoAdapter] forwardMessages error:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Отправка сообщения с inline-кнопками (callback)
   */
  async sendMessageWithButtons(
    chatId: string | number,
    text: string,
    buttons: Array<{ text: string; data: string }[]>
  ): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: "Not connected" };
    }

    try {
      const chatIdNum =
        typeof chatId === "string" ? parseInt(chatId, 10) : chatId;

      // Создаём inline keyboard
      const inlineButtons = buttons.map((row) =>
        row.map(
          (btn) =>
            new Api.KeyboardButtonCallback({
              text: btn.text,
              data: Buffer.from(btn.data),
            })
        )
      );

      const replyMarkup = new Api.ReplyInlineMarkup({
        rows: inlineButtons.map(
          (row) => new Api.KeyboardButtonRow({ buttons: row })
        ),
      });

      console.log(
        `📤 [MTProtoAdapter] sendMessageWithButtons to chatId: ${chatIdNum}`
      );

      const result = await this.client.sendMessage(chatIdNum, {
        message: text,
        buttons: replyMarkup,
      });

      console.log(`✅ [MTProtoAdapter] Message with buttons sent successfully`);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error(`❌ [MTProtoAdapter] sendMessageWithButtons error:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Отправка сообщения с URL-кнопками (для оплаты и внешних ссылок)
   */
  async sendMessageWithUrlButtons(
    chatId: string | number,
    text: string,
    buttons: Array<{ text: string; url: string }[]>
  ): Promise<ISendMessageResult> {
    if (!this.client) {
      return { success: false, error: "Not connected" };
    }

    try {
      const chatIdNum =
        typeof chatId === "string" ? parseInt(chatId, 10) : chatId;

      // Создаём inline keyboard с URL кнопками
      const inlineButtons = buttons.map((row) =>
        row.map(
          (btn) =>
            new Api.KeyboardButtonUrl({
              text: btn.text,
              url: btn.url,
            })
        )
      );

      const replyMarkup = new Api.ReplyInlineMarkup({
        rows: inlineButtons.map(
          (row) => new Api.KeyboardButtonRow({ buttons: row })
        ),
      });

      console.log(
        `📤 [MTProtoAdapter] sendMessageWithUrlButtons to chatId: ${chatIdNum}, buttons: ${JSON.stringify(buttons)}`
      );

      const result = await this.client.sendMessage(chatIdNum, {
        message: text,
        buttons: replyMarkup,
      });

      console.log(
        `✅ [MTProtoAdapter] Message with URL buttons sent successfully`
      );
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error(
        `❌ [MTProtoAdapter] sendMessageWithUrlButtons error:`,
        error
      );
      return { success: false, error: String(error) };
    }
  }

  async getDialogs(limit = 20): Promise<ITelegramDialog[]> {
    if (!this.client) return [];

    try {
      const dialogs = await this.client.getDialogs({ limit });
      return dialogs.map((d: Api.Dialog) => ({
        id: d.id?.toString() || "",
        title: d.title || "",
        type: this.getDialogType(d),
        unreadCount: d.unreadCount || 0,
      }));
    } catch {
      return [];
    }
  }

  private getDialogType(
    dialog: Api.Dialog
  ): "user" | "group" | "supergroup" | "channel" {
    if (dialog.isUser) return "user";
    if (dialog.isChannel) return "channel";
    if (dialog.isGroup) return "group";
    return "group";
  }

  onMessage(handler: (message: ITelegramMessage) => void): void {
    this.messageHandler = handler;

    // 🔒 ГЛОБАЛЬНАЯ ЗАЩИТА: Если handler уже зарегистрирован глобально - пропускаем
    if (globalEventHandlerRegistered) {
      console.log("[MTProtoAdapter] 🔒 Event handler already registered globally (skipping duplicate)");
      return;
    }

    // 🔒 ЗАЩИТА ОТ ДУБЛИРОВАНИЯ: Удаляем старый обработчик перед добавлением нового
    if (this.eventHandler && this.client) {
      try {
        this.client.removeEventHandler(this.eventHandler);
        console.log("[MTProtoAdapter] Removed old event handler");
      } catch (error) {
        console.warn("[MTProtoAdapter] Failed to remove old handler:", error);
      }
      this.eventHandler = null;
    }

    // Если клиент уже подключен, регистрируем handler сразу
    if (this.client && this.connected) {
      console.log(
        "[MTProtoAdapter] Registering message handler (client already connected)"
      );
      this.eventHandler = async (event: Api.TypeUpdate) => {
        try {
          // Логируем ВСЕ события для отладки
          const eventName = event.className || "unknown";
          const skipEvents = [
            "UpdateUserStatus",
            "UpdateUserTyping",
            "UpdateReadHistoryInbox",
            "UpdateReadHistoryOutbox",
            "UpdateReadChannelInbox",
            "UpdateReadChannelOutbox",
            "UpdateWebPage",
            "UpdateMessagePoll",
            "UpdateDeleteChannelMessages",
            "UpdateEditChannelMessage",
            "unknown", // События без className (системные)
          ];

          // DEBUG: Логируем ВСЁ кроме skipEvents
          if (!skipEvents.includes(eventName)) {
            console.log(`[MTProtoAdapter] 📨 Event: ${eventName}`);
          }

          if (!eventName || skipEvents.includes(eventName)) {
            return;
          }

          // Обрабатываем UpdateNewMessage (личные чаты, обычные группы)
          if (event instanceof Api.UpdateNewMessage) {
            const msg = event.message;
            if (msg instanceof Api.Message) {
              // 🔒 ДЕДУПЛИКАЦИЯ: Пропускаем уже обработанные сообщения
              const messageKey = `msg_${msg.id}_${msg.date}`;
              if (processedMessageIds.has(messageKey)) {
                console.log(`🔒 [MTProtoAdapter] ДУБЛЬ ПРОПУЩЕН (UpdateNewMessage): ${messageKey}`);
                return; // Уже обработано - пропускаем дубль
              }
              console.log(`✅ [MTProtoAdapter] Новое сообщение (UpdateNewMessage): ${messageKey}`);
              processedMessageIds.add(messageKey);
              // Очищаем кэш если он слишком большой
              if (processedMessageIds.size > MAX_PROCESSED_CACHE_SIZE) {
                const oldestKeys = Array.from(processedMessageIds).slice(0, 500);
                oldestKeys.forEach(k => processedMessageIds.delete(k));
              }

              // peerId может быть PeerChannel, PeerChat, PeerUser - извлекаем ID
              const peerId = msg.peerId;
              let chatId = "";
              if (peerId instanceof Api.PeerChannel) {
                chatId = peerId.channelId.toString();
              } else if (peerId instanceof Api.PeerChat) {
                chatId = peerId.chatId.toString();
              } else if (peerId instanceof Api.PeerUser) {
                chatId = peerId.userId.toString();
              }

              // fromId тоже может быть объектом
              let fromId = "";
              if (msg.fromId instanceof Api.PeerUser) {
                fromId = msg.fromId.userId.toString();
              } else if (msg.fromId instanceof Api.PeerChannel) {
                fromId = msg.fromId.channelId.toString();
              }

              // Извлекаем медиа и reply медиа
              const media = await this.extractMedia(msg);
              const replyToMedia = await this.extractReplyMedia(msg);
              const replyToMsgId = msg.replyTo?.replyToMsgId;

              const hasMedia = media && media.length > 0;
              console.log(
                `📩 [Личный/Группа] chatId=${chatId} от ${fromId}: "${msg.message?.substring(0, 60) || "..."}"${hasMedia ? ` [+${media.length} медиа]` : ""}`
              );

              this.messageHandler?.({
                id: msg.id,
                chatId,
                text: msg.message || "",
                date: new Date(msg.date * 1000),
                fromId,
                replyToMsgId,
                media,
                replyToMedia,
              });
            }
          }

          // Обрабатываем UpdateNewChannelMessage (супергруппы и каналы)
          if (event instanceof Api.UpdateNewChannelMessage) {
            const msg = event.message;
            if (msg instanceof Api.Message) {
              // 🔒 ДЕДУПЛИКАЦИЯ: Пропускаем уже обработанные сообщения
              const messageKey = `ch_${msg.id}_${msg.date}`;
              if (processedMessageIds.has(messageKey)) {
                console.log(`🔒 [MTProtoAdapter] ДУБЛЬ ПРОПУЩЕН: ${messageKey} (cache size: ${processedMessageIds.size})`);
                return; // Уже обработано - пропускаем дубль
              }
              console.log(`✅ [MTProtoAdapter] Новое сообщение: ${messageKey} (cache size: ${processedMessageIds.size})`);
              processedMessageIds.add(messageKey);
              // Очищаем кэш если он слишком большой
              if (processedMessageIds.size > MAX_PROCESSED_CACHE_SIZE) {
                const oldestKeys = Array.from(processedMessageIds).slice(0, 500);
                oldestKeys.forEach(k => processedMessageIds.delete(k));
              }

              // peerId может быть PeerChannel, PeerChat, PeerUser - извлекаем ID
              const peerId = msg.peerId;
              let chatId = "";
              let tgChatTitle = "";
              if (peerId instanceof Api.PeerChannel) {
                chatId = peerId.channelId.toString();
                // Получаем название чата
                try {
                  const chat = await this.client?.getEntity(peerId);
                  if (chat && "title" in chat) {
                    tgChatTitle = (chat as any).title || "";
                  }
                } catch {
                  /* ignore */
                }
              } else if (peerId instanceof Api.PeerChat) {
                chatId = peerId.chatId.toString();
              } else if (peerId instanceof Api.PeerUser) {
                chatId = peerId.userId.toString();
              }

              // fromId тоже может быть объектом - получаем информацию о пользователе
              let fromId = "";
              let fromFirstName = "";
              let fromLastName = "";
              let fromUsername = "";
              if (msg.fromId instanceof Api.PeerUser) {
                fromId = msg.fromId.userId.toString();
                // Получаем информацию о пользователе
                try {
                  const user = await this.client?.getEntity(msg.fromId);
                  if (user && user instanceof Api.User) {
                    fromFirstName = user.firstName || "";
                    fromLastName = user.lastName || "";
                    fromUsername = user.username || "";
                  }
                } catch {
                  /* ignore */
                }
              } else if (msg.fromId instanceof Api.PeerChannel) {
                fromId = msg.fromId.channelId.toString();
              }

              // Извлекаем медиа и reply медиа
              const media = await this.extractMedia(msg);
              const replyToMedia = await this.extractReplyMedia(msg);
              const replyToMsgId = msg.replyTo?.replyToMsgId;

              const displayName = fromFirstName || fromUsername || fromId;
              const hasMedia = media && media.length > 0;
              console.log(
                `📩 [Канал/Супергруппа] chatId=${chatId} от ${displayName}: "${msg.message?.substring(0, 60) || "..."}"${hasMedia ? ` [+${media.length} медиа]` : ""}`
              );
              this.messageHandler?.({
                id: msg.id,
                chatId,
                tgChatTitle,
                text: msg.message || "",
                date: new Date(msg.date * 1000),
                fromId,
                fromFirstName,
                fromLastName,
                fromUsername,
                replyToMsgId,
                media,
                replyToMedia,
              });
            }
          }

          // Обрабатываем UpdateShortMessage (личные сообщения в компактном формате)
          if (event instanceof Api.UpdateShortMessage) {
            // 🔒 ДЕДУПЛИКАЦИЯ: Пропускаем уже обработанные сообщения
            const messageKey = `short_${event.id}_${event.date}`;
            if (processedMessageIds.has(messageKey)) {
              console.log(`🔒 [MTProtoAdapter] ДУБЛЬ ПРОПУЩЕН (UpdateShortMessage): ${messageKey}`);
              return;
            }
            console.log(`✅ [MTProtoAdapter] Новое сообщение (UpdateShortMessage): ${messageKey}`);
            processedMessageIds.add(messageKey);

            console.log(
              `📩 [Личное] userId=${event.userId}: "${event.message?.substring(0, 60) || "..."}"`
            );
            this.messageHandler?.({
              id: event.id,
              chatId: event.userId.toString(),
              text: event.message || "",
              date: new Date(event.date * 1000),
              fromId: event.out ? undefined : event.userId.toString(),
            });
          }

          // Обрабатываем UpdateShortChatMessage (групповые сообщения в компактном формате)
          if (event instanceof Api.UpdateShortChatMessage) {
            // 🔒 ДЕДУПЛИКАЦИЯ: Пропускаем уже обработанные сообщения
            const messageKey = `shortchat_${event.id}_${event.date}`;
            if (processedMessageIds.has(messageKey)) {
              console.log(`🔒 [MTProtoAdapter] ДУБЛЬ ПРОПУЩЕН (UpdateShortChatMessage): ${messageKey}`);
              return;
            }
            console.log(`✅ [MTProtoAdapter] Новое сообщение (UpdateShortChatMessage): ${messageKey}`);
            processedMessageIds.add(messageKey);

            console.log(
              `📩 [Группа] chatId=${event.chatId} от ${event.fromId}: "${event.message?.substring(0, 60) || "..."}"`
            );
            this.messageHandler?.({
              id: event.id,
              chatId: event.chatId.toString(),
              text: event.message || "",
              date: new Date(event.date * 1000),
              fromId: event.fromId.toString(),
            });
          }
        } catch (error: any) {
          // Игнорируем ошибки TIMEOUT и "Not connected" - это нормальное поведение GramJS
          const errorMessage = String(error?.message || error || "");
          const errorStack = String(error?.stack || "");

          if (
            errorMessage.includes("TIMEOUT") ||
            errorMessage.includes("timeout") ||
            errorMessage.includes("Not connected") ||
            errorMessage.includes("Connection closed") ||
            errorStack.includes("updates.js") ||
            errorStack.includes("TIMEOUT")
          ) {
            // Эти ошибки нормальны для long-polling, не логируем их
            return;
          }
          // Логируем только реальные ошибки (не TIMEOUT)
          console.error(
            "[MTProtoAdapter] Error in event handler:",
            error?.message || error
          );
        }
      };

      // Регистрируем обработчик raw updates
      this.client.addEventHandler(this.eventHandler);
      globalEventHandlerRegistered = true; // 🔒 Отмечаем что handler зарегистрирован глобально
      console.log("[MTProtoAdapter] Event handler registered successfully (ONCE GLOBALLY)");

      // 🔥 ДОПОЛНИТЕЛЬНО: Регистрируем NewMessage handler для личных чатов
      // GramJS лучше обрабатывает личные сообщения через NewMessage event
      this.client.addEventHandler(
        async (event: NewMessageEvent) => {
          try {
            const msg = event.message;
            if (!msg || !msg.peerId) return;

            // Проверяем что это личный чат (PeerUser)
            const isPrivateChat = msg.peerId instanceof Api.PeerUser;
            if (!isPrivateChat) return; // Группы и каналы обрабатываются через raw updates

            // 🔒 ДЕДУПЛИКАЦИЯ
            const messageKey = `nm_${msg.id}_${msg.date}`;
            if (processedMessageIds.has(messageKey)) {
              console.log(`🔒 [MTProtoAdapter] ДУБЛЬ ПРОПУЩЕН (NewMessage DM): ${messageKey}`);
              return;
            }
            console.log(`✅ [MTProtoAdapter] Новое ЛИЧНОЕ сообщение (NewMessage): ${messageKey}`);
            processedMessageIds.add(messageKey);

            // Извлекаем chatId и fromId
            const chatId = (msg.peerId as Api.PeerUser).userId.toString();
            let fromId = chatId; // В личном чате fromId = собеседник
            if (msg.fromId instanceof Api.PeerUser) {
              fromId = msg.fromId.userId.toString();
            }

            // Извлекаем медиа
            const media = await this.extractMedia(msg);
            const replyToMedia = await this.extractReplyMedia(msg);
            const replyToMsgId = msg.replyTo?.replyToMsgId;

            const hasMedia = media && media.length > 0;
            console.log(
              `📩 [NewMessage ЛИЧНЫЙ] chatId=${chatId} от ${fromId}: "${msg.message?.substring(0, 60) || "..."}"${hasMedia ? ` [+${media.length} медиа]` : ""}`
            );

            this.messageHandler?.({
              id: msg.id,
              chatId,
              text: msg.message || "",
              date: new Date(msg.date * 1000),
              fromId,
              replyToMsgId,
              media,
              replyToMedia,
            });
          } catch (error) {
            console.error("[MTProtoAdapter] Error in NewMessage handler:", error);
          }
        },
        new NewMessage({})
      );
      console.log("[MTProtoAdapter] ✅ NewMessage handler for DMs registered");
    }
  }

  /**
   * Get messages from a chat
   * @param chatId - ID чата
   * @param limit - максимальное количество сообщений (default: 100)
   * @returns список сообщений
   */
  async getMessages(
    chatId: string,
    limit: number = 100
  ): Promise<ITelegramMessage[]> {
    if (!this.client) {
      console.error("[MTProtoAdapter] getMessages: Not connected");
      return [];
    }

    try {
      console.log(
        `📜 [MTProtoAdapter] Getting messages for chat: ${chatId}, limit: ${limit}`
      );

      // Ищем чат в диалогах по ID
      const dialogs = await this.client.getDialogs({ limit: 100 });
      let foundEntity: Api.TypeEntity | null = null;

      for (const dialog of dialogs) {
        let dialogId = "";
        if (dialog.entity instanceof Api.Chat) {
          dialogId = dialog.entity.id.toString();
        } else if (dialog.entity instanceof Api.Channel) {
          dialogId = dialog.entity.id.toString();
        } else if (dialog.entity instanceof Api.User) {
          dialogId = dialog.entity.id.toString();
        }

        if (dialogId === chatId) {
          foundEntity = dialog.entity;
          console.log(
            `✅ [MTProtoAdapter] Found chat: ${dialog.title} (ID: ${dialogId})`
          );
          break;
        }
      }

      if (!foundEntity) {
        console.error(`[MTProtoAdapter] Chat ${chatId} not found in dialogs`);
        return [];
      }

      // Получаем сообщения через GramJS
      const messages = await this.client.getMessages(foundEntity, {
        limit,
      });

      console.log(
        `✅ [MTProtoAdapter] Retrieved ${messages.length} messages from chat ${chatId}`
      );

      // Конвертируем в ITelegramMessage
      const result: ITelegramMessage[] = [];
      for (const msg of messages) {
        if (msg instanceof Api.Message && msg.message) {
          // Извлекаем chatId из peerId
          let msgChatId = chatId;
          const peerId = msg.peerId;
          if (peerId instanceof Api.PeerChannel) {
            msgChatId = peerId.channelId.toString();
          } else if (peerId instanceof Api.PeerChat) {
            msgChatId = peerId.chatId.toString();
          } else if (peerId instanceof Api.PeerUser) {
            msgChatId = peerId.userId.toString();
          }

          // Извлекаем fromId
          let fromId = "";
          let fromFirstName = "";
          let fromLastName = "";
          let fromUsername = "";
          if (msg.fromId instanceof Api.PeerUser) {
            fromId = msg.fromId.userId.toString();
            // Пробуем получить информацию о пользователе
            try {
              const user = await this.client?.getEntity(msg.fromId);
              if (user && user instanceof Api.User) {
                fromFirstName = user.firstName || "";
                fromLastName = user.lastName || "";
                fromUsername = user.username || "";
              }
            } catch {
              /* ignore */
            }
          } else if (msg.fromId instanceof Api.PeerChannel) {
            fromId = msg.fromId.channelId.toString();
          }

          result.push({
            id: msg.id,
            chatId: msgChatId,
            text: msg.message,
            date: new Date(msg.date * 1000),
            fromId,
            fromFirstName: fromFirstName || undefined,
            fromLastName: fromLastName || undefined,
            fromUsername: fromUsername || undefined,
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`[MTProtoAdapter] getMessages error:`, error);
      return [];
    }
  }

  async getMe(): Promise<ITelegramUser | null> {
    if (!this.client) return null;

    try {
      const me = await this.client.getMe();
      if (me instanceof Api.User) {
        return {
          id: me.id.toString(),
          firstName: me.firstName,
          lastName: me.lastName || undefined,
          username: me.username || undefined,
          phone: me.phone || undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get the GramJS client instance for advanced operations
   */
  getClient(): TelegramClient | null {
    return this.client;
  }

  /**
   * Get members of a group/supergroup/channel
   * @param groupId - ID группы
   * @param limit - максимальное количество участников (default: 50)
   * @returns список пользователей
   */
  async getGroupMembers(
    groupId: string,
    limit: number = 50
  ): Promise<ITelegramUser[]> {
    if (!this.client) {
      console.error("[MTProtoAdapter] getGroupMembers: Not connected");
      return [];
    }

    try {
      console.log(`📋 [MTProtoAdapter] Getting members for group: ${groupId}`);

      // ГЛАВНАЯ СТРАТЕГИЯ: Ищем группу в диалогах по ID
      // Это работает для всех типов: group, supergroup, channel
      const dialogs = await this.client.getDialogs({ limit: 100 });
      let foundEntity: Api.TypeEntity | null = null;
      let foundType = "";

      console.log(
        `🔍 [MTProtoAdapter] Searching for groupId=${groupId} in ${dialogs.length} dialogs`
      );

      for (const dialog of dialogs) {
        // Извлекаем ID в зависимости от типа entity
        // ВАЖНО: Для Channel/Supergroup добавляем -100 префикс для совместимости с Bot API форматом
        let dialogId = "";
        if (dialog.entity instanceof Api.Chat) {
          // Обычные группы имеют негативный ID
          dialogId = `-${dialog.entity.id.toString()}`;
        } else if (dialog.entity instanceof Api.Channel) {
          // Каналы и супергруппы имеют -100 префикс в Bot API
          dialogId = `-100${dialog.entity.id.toString()}`;
        } else if (dialog.entity instanceof Api.User) {
          dialogId = dialog.entity.id.toString();
        }

        // Сравниваем ID напрямую
        if (dialogId === groupId) {
          foundEntity = dialog.entity;
          if (dialog.entity instanceof Api.Chat) {
            foundType = "group";
          } else if (dialog.entity instanceof Api.Channel) {
            foundType = dialog.entity.megagroup ? "supergroup" : "channel";
          }
          console.log(
            `✅ [MTProtoAdapter] Found ${foundType}: ${dialog.title} (ID: ${dialogId})`
          );
          break;
        }
      }

      if (!foundEntity) {
        console.error(
          `[MTProtoAdapter] Group ${groupId} not found in dialogs (searched ${dialogs.length} dialogs)`
        );
        return [];
      }

      // Получаем участников - метод работает и для group, и для supergroup
      const participants = await this.client.getParticipants(foundEntity, {
        limit,
      });

      console.log(
        `✅ [MTProtoAdapter] Found ${participants.length} members in ${foundType} ${groupId}`
      );

      // Конвертируем в ITelegramUser
      return participants
        .filter((p): p is Api.User => p instanceof Api.User && !p.bot) // Исключаем ботов
        .map((user) => ({
          id: user.id.toString(),
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          username: user.username || undefined,
          phone: user.phone || undefined,
        }));
    } catch (error) {
      console.error(`[MTProtoAdapter] getGroupMembers error:`, error);
      return [];
    }
  }

  /**
   * Download user's profile photo
   * @param userId - ID пользователя
   * @returns Buffer with photo data or null if no photo
   */
  async downloadProfilePhoto(userId: string): Promise<Buffer | null> {
    if (!this.client) {
      console.error("[MTProtoAdapter] downloadProfilePhoto: Not connected");
      return null;
    }

    try {
      const userIdNum = parseInt(userId, 10);
      console.log(
        `📸 [MTProtoAdapter] Downloading profile photo for user: ${userId}`
      );

      // Получаем entity пользователя
      const user = await this.client.getEntity(userIdNum);

      if (!(user instanceof Api.User)) {
        console.log(`[MTProtoAdapter] Entity ${userId} is not a user`);
        return null;
      }

      // Скачиваем фото профиля
      const photoBuffer = await this.client.downloadProfilePhoto(user, {
        isBig: false, // Маленькая версия для превью
      });

      if (!photoBuffer) {
        console.log(`[MTProtoAdapter] User ${userId} has no profile photo`);
        return null;
      }

      // GramJS может вернуть string (path) или Buffer
      if (typeof photoBuffer === "string") {
        console.log(`[MTProtoAdapter] Photo saved to path, reading...`);
        // Если вернулся path, читаем файл
        const fs = await import("fs");
        return fs.readFileSync(photoBuffer);
      }

      console.log(
        `✅ [MTProtoAdapter] Downloaded profile photo for user ${userId} (${photoBuffer.length} bytes)`
      );
      return photoBuffer;
    } catch (error) {
      console.error(`[MTProtoAdapter] downloadProfilePhoto error:`, error);
      return null;
    }
  }
}
