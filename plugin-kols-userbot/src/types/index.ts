/**
 * Типы для KOLS USERBOT Plugin
 */

export interface IKolsLearningTip {
  title: string;
  content: string;
  why: string;
  practicalTip: string;
  topic: string;
}

export interface IKolsMonitoringStats {
  totalGroups: number;
  activeGroups: number;
  totalMessages: number;
  uptime: number;
}

export interface IKolsMessage {
  chatId: string;
  chatTitle: string;
  fromUserId: string;
  fromFirstName: string;
  messageText: string;
  messageId: number;
  timestamp: number;
}

export interface IKolsGroup {
  id: string;
  title: string;
  isActive: boolean;
  addedAt: number;
}

export interface IKolsUserbotConfig {
  telegramApiId?: string;
  telegramApiHash?: string;
  loadDocsOnStartup?: boolean;
  knowledgePath?: string;
}
