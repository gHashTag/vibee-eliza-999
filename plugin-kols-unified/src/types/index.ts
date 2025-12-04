/**
 * Общие типы для плагина KOLS Unified
 * Все типы в одном месте для переиспользования
 */

export interface KolsMessage {
  chatId: string;
  chatTitle: string;
  fromUserId: string;
  fromFirstName: string;
  messageText: string;
  messageId: number;
  timestamp: number;
}

export interface KolsGroup {
  id: string;
  title: string;
  isActive: boolean;
  addedAt: number;
}

export interface KolsMonitoringStats {
  totalGroups: number;
  activeGroups: number;
  totalMessages: number;
  uptime: number;
}

export interface KolsConfig {
  targetChatIds: string[];
  autoReplyEnabled: boolean;
  proactiveEnabled: boolean;
  proactiveIntervalMin: number; // минуты
  proactiveIntervalMax: number; // минуты
  autoReplyTriggers: string[];
  llmModelType: string;
  llmMaxTokens: number;
  llmTemperature: number;
  systemPrompts: {
    autoReply: string;
    proactive: string[];
  };
}

export interface ProactiveMessageConfig {
  type: 'educational' | 'question' | 'poll' | 'tip' | 'challenge' | 'welcome' | 'motivation';
  systemPrompt: string;
  minDelay: number;
  maxDelay: number;
}
