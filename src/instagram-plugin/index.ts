import { Plugin } from "@elizaos/core";
import { InstagramAPIService } from "./services/instagramService";
import { StorageService } from "./services/storageService";
import { instagramPostAction } from "./actions/instagramPostAction";

/**
 * Instagram Plugin для VIBEE
 * Позволяет публиковать посты в Instagram через Meta Business API
 */
export const instagramPlugin: Plugin = {
  name: "instagram-plugin",
  description:
    "Плагин для публикации постов в Instagram через Meta Business API",

  services: [InstagramAPIService, StorageService],

  actions: [instagramPostAction],

  async init(config: Record<string, string>) {
    console.log("🐝 Инициализация Instagram плагина...");

    // Проверяем, что токены настроены в Infisical
    const requiredVars = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_ACCOUNT_ID"];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(
        "⚠️ Не настроены переменные для Instagram:",
        missingVars.join(", "),
      );
      console.log("💡 Добавьте их в Infisical:");
      console.log(
        "   - INSTAGRAM_ACCESS_TOKEN - токен доступа к Instagram API",
      );
      console.log("   - INSTAGRAM_ACCOUNT_ID - ID Instagram бизнес аккаунта");
    } else {
      console.log("✅ Instagram токены настроены");
    }

    // Проверяем настройки Supabase для хранения файлов
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(
        "✅ Supabase настройки обнаружены - файлы будут загружаться в облако",
      );
    } else {
      console.log("⚠️ Supabase не настроен - используются прямые URL файлов");
    }
  },

  priority: 10, // Приоритет загрузки плагина
};

export default instagramPlugin;

// Экспортируем типы для использования в других модулях
export { InstagramAPIService } from "./services/instagramService";
export { StorageService } from "./services/storageService";
export * from "./types";
