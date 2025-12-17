/**
 * Централизованное управление целевыми чатами и проактивной рассылкой
 *
 * Этот файл - ЕДИНСТВЕННОЕ место для управления:
 * - Включение/отключение чатов
 * - Изменение интервалов рассылки
 * - Управление триггерами
 *
 * Использование:
 * import { ChatManager } from './chat-management';
 *
 * // Отключить чат
 * ChatManager.disableChat('sales', '-4832231272');
 *
 * // Включить чат
 * ChatManager.enableChat('sales', '-4832231272');
 *
 * // Изменить интервал
 * ChatManager.setProactiveInterval('sales', 180);
 *
 * // Получить статус
 * const status = ChatManager.getChatStatus('sales', '-4832231272');
 */

import {
  AGENTS_CONFIG,
  getAgentConfig,
  type AgentConfig,
  type ChatTarget,
} from "./agents.config";

export interface ChatStatus {
  chatId: string;
  chatName: string;
  isActive: boolean;
  agentId: string;
  proactiveEnabled: boolean;
  proactiveIntervalMinutes: number;
  responseProbability: number;
}

export interface AgentProactiveStatus {
  agentId: string;
  agentName: string;
  proactiveEnabled: boolean;
  proactiveIntervalMinutes: number;
  activeChatsCount: number;
  totalChatsCount: number;
  chats: ChatStatus[];
}

/**
 * Централизованный менеджер для управления чатами
 */
export class ChatManager {
  /**
   * Получить статус конкретного чата
   */
  static getChatStatus(agentId: string, chatId: string): ChatStatus | null {
    const config = getAgentConfig(agentId);
    if (!config) return null;

    const chat = config.targetChats.find(
      (c) =>
        c.chatId === chatId ||
        c.chatId === `-${chatId}` ||
        c.chatId === chatId.replace(/^-/, "")
    );
    if (!chat) return null;

    return {
      chatId: chat.chatId,
      chatName: chat.chatName,
      isActive: chat.isActive,
      agentId,
      proactiveEnabled: config.behavior.proactiveEnabled,
      proactiveIntervalMinutes: config.behavior.proactiveIntervalMinutes,
      responseProbability:
        chat.responseProbability ?? config.triggers.responseProbability,
    };
  }

  /**
   * Получить статус всех чатов агента
   */
  static getAgentStatus(agentId: string): AgentProactiveStatus | null {
    const config = getAgentConfig(agentId);
    if (!config) return null;

    const activeChats = config.targetChats.filter((c) => c.isActive);
    const chats: ChatStatus[] = config.targetChats.map((chat) => ({
      chatId: chat.chatId,
      chatName: chat.chatName,
      isActive: chat.isActive,
      agentId,
      proactiveEnabled: config.behavior.proactiveEnabled,
      proactiveIntervalMinutes: config.behavior.proactiveIntervalMinutes,
      responseProbability:
        chat.responseProbability ?? config.triggers.responseProbability,
    }));

    return {
      agentId,
      agentName: config.name,
      proactiveEnabled: config.behavior.proactiveEnabled,
      proactiveIntervalMinutes: config.behavior.proactiveIntervalMinutes,
      activeChatsCount: activeChats.length,
      totalChatsCount: config.targetChats.length,
      chats,
    };
  }

  /**
   * Включить чат
   */
  static enableChat(agentId: string, chatId: string): boolean {
    const config = getAgentConfig(agentId);
    if (!config) {
      console.error(`[ChatManager] Agent ${agentId} not found`);
      return false;
    }

    const chat = config.targetChats.find(
      (c) =>
        c.chatId === chatId ||
        c.chatId === `-${chatId}` ||
        c.chatId === chatId.replace(/^-/, "")
    );

    if (!chat) {
      console.error(
        `[ChatManager] Chat ${chatId} not found in agent ${agentId}`
      );
      return false;
    }

    chat.isActive = true;
    console.log(
      `[ChatManager] ✅ Chat ${chat.chatName} (${chat.chatId}) enabled for agent ${agentId}`
    );
    return true;
  }

  /**
   * Отключить чат
   */
  static disableChat(agentId: string, chatId: string): boolean {
    const config = getAgentConfig(agentId);
    if (!config) {
      console.error(`[ChatManager] Agent ${agentId} not found`);
      return false;
    }

    const chat = config.targetChats.find(
      (c) =>
        c.chatId === chatId ||
        c.chatId === `-${chatId}` ||
        c.chatId === chatId.replace(/^-/, "")
    );

    if (!chat) {
      console.error(
        `[ChatManager] Chat ${chatId} not found in agent ${agentId}`
      );
      return false;
    }

    chat.isActive = false;
    console.log(
      `[ChatManager] ❌ Chat ${chat.chatName} (${chat.chatId}) disabled for agent ${agentId}`
    );
    return true;
  }

  /**
   * Установить интервал проактивной рассылки (в минутах)
   */
  static setProactiveInterval(
    agentId: string,
    intervalMinutes: number
  ): boolean {
    const config = getAgentConfig(agentId);
    if (!config) {
      console.error(`[ChatManager] Agent ${agentId} not found`);
      return false;
    }

    if (intervalMinutes < 1) {
      console.error(`[ChatManager] Interval must be at least 1 minute`);
      return false;
    }

    config.behavior.proactiveIntervalMinutes = intervalMinutes;
    console.log(
      `[ChatManager] ⏰ Proactive interval set to ${intervalMinutes} minutes for agent ${agentId}`
    );
    return true;
  }

  /**
   * Включить проактивный режим
   */
  static enableProactive(agentId: string): boolean {
    const config = getAgentConfig(agentId);
    if (!config) {
      console.error(`[ChatManager] Agent ${agentId} not found`);
      return false;
    }

    config.behavior.proactiveEnabled = true;
    console.log(`[ChatManager] ✅ Proactive mode enabled for agent ${agentId}`);
    return true;
  }

  /**
   * Отключить проактивный режим
   */
  static disableProactive(agentId: string): boolean {
    const config = getAgentConfig(agentId);
    if (!config) {
      console.error(`[ChatManager] Agent ${agentId} not found`);
      return false;
    }

    config.behavior.proactiveEnabled = false;
    console.log(
      `[ChatManager] ❌ Proactive mode disabled for agent ${agentId}`
    );
    return true;
  }

  /**
   * Получить список всех агентов с их статусом
   */
  static getAllAgentsStatus(): AgentProactiveStatus[] {
    return Object.keys(AGENTS_CONFIG)
      .map((agentId) => {
        const status = this.getAgentStatus(agentId);
        return status!;
      })
      .filter(Boolean) as AgentProactiveStatus[];
  }

  /**
   * Найти чат по ID во всех агентах
   */
  static findChat(
    chatId: string
  ): { agentId: string; chat: ChatTarget } | null {
    for (const [agentId, config] of Object.entries(AGENTS_CONFIG)) {
      const chat = config.targetChats.find(
        (c) =>
          c.chatId === chatId ||
          c.chatId === `-${chatId}` ||
          c.chatId === chatId.replace(/^-/, "")
      );
      if (chat) {
        return { agentId, chat };
      }
    }
    return null;
  }

  /**
   * Получить красивый отчёт о статусе
   */
  static getStatusReport(): string {
    const agents = this.getAllAgentsStatus();
    let report = "📊 Статус проактивной рассылки:\n\n";

    for (const agent of agents) {
      if (!agent.proactiveEnabled) continue;

      report += `🤖 ${agent.agentName} (${agent.agentId})\n`;
      report += `   ⏰ Интервал: ${agent.proactiveIntervalMinutes} минут\n`;
      report += `   📊 Активных чатов: ${agent.activeChatsCount}/${agent.totalChatsCount}\n\n`;

      for (const chat of agent.chats) {
        const status = chat.isActive ? "✅" : "❌";
        report += `   ${status} ${chat.chatName} (${chat.chatId})\n`;
      }
      report += "\n";
    }

    return report;
  }
}

