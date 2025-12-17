// @ts-nocheck
/**
 * DialogForwardService
 *
 * Сервис для пересылки диалогов (user + agent) в отдельную группу
 * когда срабатывают триггеры определённых категорий
 */

import { Service, IAgentRuntime } from "@elizaos/core";
import { TelegramService } from "./telegram.service";
import { findTriggersByCategory, TRIGGER_CATEGORIES } from "../config/triggers";

/**
 * Метаданные диалога для пересылки
 */
export interface DialogMetadata {
  /** ID исходного чата */
  sourceChatId: string;
  sourceChatIdInt: number; // For link generation
  /** Название исходного чата */
  sourceTgChatTitle: string;
  /** Имя пользователя */
  userName: string;
  /** Username пользователя */
  userUsername?: string;
  /** ID пользователя */
  userId: string;
  /** ID сообщения (для ссылки) */
  messageId: number;
  /** Текст сообщения пользователя */
  userText: string;
  /** Текст ответа агента */
  agentText: string;
  /** Найденные триггеры */
  triggers: string[];
  /** Категории найденных триггеров */
  triggerCategories: string[];
  /** Время сообщения */
  timestamp: Date;
}

/**
 * Сервис пересылки диалогов
 */
export class DialogForwardService extends Service {
  static serviceType = "DialogForwardService";

  private runtime: IAgentRuntime | null = null;
  private telegramService: TelegramService | null = null;

  constructor() {
    super();
  }

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;

    // Получаем TelegramService из runtime
    this.telegramService = runtime.getService("TelegramService") as TelegramService;

    if (!this.telegramService) {
      console.warn("[DialogForward] TelegramService not found - forwarding disabled");
    }

    console.log("[DialogForward] Service initialized");
  }

  /**
   * Устанавливает TelegramService для пересылки
   */
  setTelegramService(service: TelegramService): void {
    this.telegramService = service;
    console.log("[DialogForward] TelegramService set");
  }

  /**
   * Пересылает диалог в целевую группу
   *
   * @param userMessageId - ID сообщения пользователя
   * @param agentMessageId - ID ответа агента
   * @param targetChatId - ID чата для пересылки
   * @param metadata - Метаданные диалога
   * @param adapter - Опциональный адаптер для пересылки
   */
  async forwardDialog(
    userMessageId: number,
    agentMessageId: number,
    targetChatId: string,
    metadata: DialogMetadata,
    adapter?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `[DialogForward] Forwarding dialog to ${targetChatId}:`,
        `user=${userMessageId}, agent=${agentMessageId}`
      );

      // Получаем адаптер из TelegramService если не передан
      const actualAdapter = adapter || (this.telegramService as any)?.adapter;

      // 1. Пересылаем оригинальные сообщения (если адаптер поддерживает)
      if (actualAdapter?.forwardMessages) {
        const messageIds = [userMessageId];
        if (agentMessageId > 0) {
          messageIds.push(agentMessageId);
        }

        await actualAdapter.forwardMessages(
          metadata.sourceChatId,
          targetChatId,
          messageIds
        );
        console.log(`[DialogForward] Messages forwarded successfully`);
      } else {
        console.warn("[DialogForward] Adapter does not support forwardMessages, sending summary only");
      }

      // 2. Отправляем текстовый саммари для поиска
      const summary = this.formatDialogSummary(metadata);

      if (actualAdapter?.sendMessage) {
        await actualAdapter.sendMessage(targetChatId, summary);
      } else if (this.telegramService) {
        await this.telegramService.sendMessage(targetChatId, summary);
      } else {
        console.error("[DialogForward] No way to send summary - neither adapter nor TelegramService available");
        return { success: false, error: "No adapter or service available" };
      }

      console.log(`[DialogForward] Summary sent to ${targetChatId}`);
      return { success: true };
    } catch (error) {
      console.error(`[DialogForward] Error forwarding dialog:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Форматирует текстовый саммари диалога
   */
  formatDialogSummary(metadata: DialogMetadata): string {
    const userDisplay = metadata.userUsername
      ? `${metadata.userName} (@${metadata.userUsername})`
      : metadata.userName;

    const timestamp = metadata.timestamp.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const link = `https://t.me/c/${metadata.sourceChatIdInt.toString().replace("-100", "")}/${metadata.messageId}`;

    return `📩 **Новый лид из "${metadata.sourceTgChatTitle}"**

👤 **${userDisplay}** (ID: \`${metadata.userId}\`)
🔗 [Ссылка на сообщение](${link})

💬 **Сообщение:**
${metadata.userText}

🤖 **Ответ агента:**
${metadata.agentText}

🏷️ **Триггеры:** ${metadata.triggers.join(", ")}
📅 ${timestamp}`;
  }

  /**
   * Проверяет нужно ли пересылать диалог на основе триггеров
   *
   * @param text - Текст сообщения
   * @param allowedCategories - Разрешённые категории для пересылки
   * @returns Найденные триггеры и их категории
   */
  checkForwardTriggers(
    text: string,
    allowedCategories?: string[]
  ): { triggers: string[]; categories: string[] } {
    const triggers: string[] = [];
    const categories: string[] = [];

    // Если категории не указаны - проверяем P2P_EXCHANGE по умолчанию
    const categoriesToCheck = allowedCategories || ["P2P_EXCHANGE"];

    for (const category of categoriesToCheck) {
      if (category in TRIGGER_CATEGORIES) {
        const found = findTriggersByCategory(
          text,
          category as keyof typeof TRIGGER_CATEGORIES
        );
        if (found.length > 0) {
          triggers.push(...found);
          categories.push(category);
        }
      }
    }

    return { triggers, categories };
  }

  /**
   * Статический getter для типа сервиса
   */
  static get serviceType(): string {
    return "DialogForwardService";
  }
}

// Экспорт singleton instance
export const dialogForwardService = new DialogForwardService();
