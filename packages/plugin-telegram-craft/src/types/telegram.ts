import { IAgentRuntime } from "@elizaos/core";

export interface ITelegramConfig {
    apiId: number;
    apiHash: string;
    sessionString?: string;
    botToken?: string;
}

export interface ITelegramAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(chatId: string | number, text: string, options?: any): Promise<any>;
    getDialogs(limit?: number): Promise<any[]>;
    getMessages(chatId: string | number, limit?: number): Promise<any[]>;
}

export type TelegramStrategy = "mtproto" | "bot-api" | "mcp";
