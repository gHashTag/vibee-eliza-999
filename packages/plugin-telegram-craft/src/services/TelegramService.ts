import { Service } from "@elizaos/core";

export class TelegramService extends Service {
  static serviceType = "telegram-craft";

  async initialize(runtime: any): Promise<void> {
    console.log("🔌 Telegram Craft Plugin initialized");
  }

  async sendMessage(chatId: string, text: string): Promise<any> {
    return { success: false, error: "Telegram service not implemented" };
  }

  async getDialogs(): Promise<any[]> {
    return [];
  }

  async readHistory(chatId: string, limit?: number): Promise<any[]> {
    return [];
  }
}

export default TelegramService;
