import { Service } from "@elizaos/core";
import {
  InstagramService,
  InstagramPost,
  InstagramStory,
  InstagramMetrics,
} from "../types";

/**
 * Сервис для работы с Instagram API
 * Требует Meta Business API токены в Infisical
 */
export class InstagramAPIService extends Service implements InstagramService {
  static serviceType = "instagram-api";

  private accessToken: string = "";
  private instagramAccountId: string = "";
  private baseUrl = "https://graph.facebook.com/v18.0";
  private appId: string = "";
  private appSecret: string = "";

  constructor() {
    super();
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || "";
    this.instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID || "";
    this.appId = process.env.INSTAGRAM_APP_ID || "";
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || "";

    if (!this.accessToken) {
      console.warn(
        "⚠️ INSTAGRAM_ACCESS_TOKEN не найден в Infisical. Плагин Instagram не будет работать.",
      );
    }

    if (!this.instagramAccountId) {
      console.warn(
        "⚠️ INSTAGRAM_ACCOUNT_ID не найден в Infisical. Плагин Instagram не будет работать.",
      );
    }
  }

  capabilityDescription =
    "Instagram API Service - для публикации постов в Instagram через Meta Business API";

  static async start(runtime: any) {
    console.log("🐝 Запуск Instagram API сервиса");
    const service = new InstagramAPIService();

    // Загружаем токены из Infisical (переменные окружения)
    service.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || "";
    service.instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID || "";
    service.appId = process.env.INSTAGRAM_APP_ID || "";
    service.appSecret = process.env.INSTAGRAM_APP_SECRET || "";

    if (!service.accessToken) {
      console.warn(
        "⚠️ INSTAGRAM_ACCESS_TOKEN не найден в Infisical. Плагин Instagram не будет работать.",
      );
    }

    if (!service.instagramAccountId) {
      console.warn(
        "⚠️ INSTAGRAM_ACCOUNT_ID не найден в Infisical. Плагин Instagram не будет работать.",
      );
    }

    if (!service.appId) {
      console.warn(
        "⚠️ INSTAGRAM_APP_ID не найден в Infisical. Автообновление токенов недоступно.",
      );
    }

    if (!service.appSecret) {
      console.warn(
        "⚠️ INSTAGRAM_APP_SECRET не найден в Infisical. Автообновление токенов недоступно.",
      );
    }

    // Проверяем валидность токена при старте
    if (service.accessToken && service.instagramAccountId) {
      console.log("🔐 Проверка валидности Instagram токена...");
      const validation = await service.validateToken();

      if (validation.valid) {
        console.log("✅ Instagram токен валиден:", validation.expiresAt);
      } else {
        console.error("❌ Instagram токен невалиден:", validation.error);
        console.error("⚠️ Необходимо обновить Instagram токены в Infisical!");
      }
    }

    return service;
  }

  static async stop(runtime: any) {
    console.log("🐝 Остановка Instagram API сервиса");
    const service = runtime.getService(InstagramAPIService.serviceType);
    if (service) {
      service.stop();
    }
  }

  /**
   * Проверка валидности токена Instagram API
   */
  async validateToken(): Promise<{
    valid: boolean;
    error?: string;
    expiresAt?: string;
    refreshed?: boolean;
  }> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        return {
          valid: false,
          error:
            "INSTAGRAM_ACCESS_TOKEN или INSTAGRAM_ACCOUNT_ID не найдены в Infisical",
        };
      }

      // Проверяем токен через Instagram API
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,username,account_type&access_token=${this.accessToken}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || "Неизвестная ошибка";

        // Проверяем, истёк ли токен
        if (
          errorMessage.includes("expired") ||
          errorMessage.includes("Session has expired")
        ) {
          console.log("🔄 Токен истёк, пытаюсь обновить...");

          // Автоматически обновляем токен
          const refreshResult = await this.refreshToken();

          if (refreshResult.success) {
            console.log("✅ Токен обновлён успешно!");

            // Проверяем новый токен
            const retryResponse = await fetch(
              `${this.baseUrl}/me?fields=id,username,account_type&access_token=${this.accessToken}`,
            );

            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return {
                valid: true,
                expiresAt: `Account: ${data.username} (${data.account_type})`,
                refreshed: true,
              };
            }
          }

          return {
            valid: false,
            error: `❌ Токен истёк: ${errorMessage}`,
          };
        }

        return {
          valid: false,
          error: `❌ Ошибка валидации токена: ${errorMessage}`,
        };
      }

      const data = await response.json();
      return {
        valid: true,
        expiresAt: `Account: ${data.username} (${data.account_type})`,
      };
    } catch (error) {
      return {
        valid: false,
        error: `❌ Ошибка проверки токена: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Автоматическое обновление Instagram токена
   */
  async refreshToken(): Promise<{
    success: boolean;
    newToken?: string;
    error?: string;
  }> {
    try {
      if (!this.appId || !this.appSecret) {
        return {
          success: false,
          error: "Instagram APP ID или APP SECRET не найдены в Infisical",
        };
      }

      if (!this.accessToken) {
        return {
          success: false,
          error: "Текущий токен не найден для обновления",
        };
      }

      console.log("🔄 Обновление Instagram токена через App Secret...");

      // Получаем long-lived token из short-lived
      const response = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${this.appSecret}&access_token=${this.accessToken}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `❌ Ошибка обновления токена: ${errorData.error?.message || "Неизвестная ошибка"}`,
        };
      }

      const data = await response.json();

      console.log("✅ Instagram токен успешно обновлён!");
      console.log("📊 Новый токен действует:", data.expires_in, "секунд");

      this.accessToken = data.access_token;

      return {
        success: true,
        newToken: data.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: `❌ Ошибка обновления токена: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Публикация поста в Instagram
   */
  async publishPost(post: InstagramPost): Promise<any> {
    try {
      // Сначала проверяем токен
      const tokenValidation = await this.validateToken();
      if (!tokenValidation.valid) {
        throw new Error(`Instagram токен невалиден: ${tokenValidation.error}`);
      }

      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error("Instagram API токены не настроены");
      }

      // Формируем caption с хэштегами
      let caption = post.caption;
      if (post.hashtags && post.hashtags.length > 0) {
        const hashtagsText = post.hashtags.map((tag) => `#${tag}`).join(" ");
        caption += `\n\n${hashtagsText}`;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: post.imageUrl,
            caption: caption,
            access_token: this.accessToken,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram API error: ${response.status} - ${error}`);
      }

      const mediaResult = await response.json();

      // Публикуем медиа
      const publishResponse = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creation_id: mediaResult.id,
            access_token: this.accessToken,
          }),
        },
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.text();
        console.error("❌ [Instagram] Ошибка публикации:", error);
        throw new Error(
          `Instagram publish error: ${publishResponse.status} - ${error}`,
        );
      }

      const result = await publishResponse.json();
      console.log(
        "✅ [Instagram] Пост опубликован! Результат:",
        JSON.stringify(result, null, 2),
      );

      // Дополнительно получаем permalink для ссылки на пост
      try {
        console.log(`📋 [Instagram] Получение деталей поста ID: ${result.id}`);
        const mediaDetailsResponse = await fetch(
          `${this.baseUrl}/${result.id}?fields=id,permalink,caption,media_type,media_url,thumbnail_url,timestamp&access_token=${this.accessToken}`,
        );

        if (mediaDetailsResponse.ok) {
          const mediaDetails = await mediaDetailsResponse.json();
          console.log(
            "📋 [Instagram] Детали поста:",
            JSON.stringify(mediaDetails, null, 2),
          );
          return {
            ...result,
            caption: mediaDetails.caption,
            permalink: mediaDetails.permalink,
            media_url: mediaDetails.media_url,
            timestamp: mediaDetails.timestamp,
          };
        } else {
          console.warn(
            "⚠️ [Instagram] Не удалось получить детали поста:",
            await mediaDetailsResponse.text(),
          );
        }
      } catch (detailError) {
        console.warn(
          "⚠️ [Instagram] Ошибка получения деталей поста:",
          detailError,
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Ошибка публикации в Instagram:", error);
      throw error;
    }
  }

  /**
   * Публикация истории
   */
  async publishStory(story: InstagramStory): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error("Instagram API токены не настроены");
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            media_url: story.mediaUrl,
            caption: story.caption || "",
            access_token: this.accessToken,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram story error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log("✅ История опубликована в Instagram:", result);
      return result;
    } catch (error) {
      console.error("❌ Ошибка публикации истории:", error);
      throw error;
    }
  }

  /**
   * Получение метрик поста
   */
  async getMetrics(metrics: InstagramMetrics): Promise<any> {
    try {
      if (!this.accessToken) {
        throw new Error("Instagram API токен не настроен");
      }

      const response = await fetch(
        `${this.baseUrl}/${metrics.postId}/insights?metric=${metrics.metrics.join(",")}&access_token=${this.accessToken}`,
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Instagram metrics error: ${response.status} - ${error}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Ошибка получения метрик:", error);
      throw error;
    }
  }

  /**
   * Получение информации об аккаунте
   */
  async getAccountInfo(): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error("Instagram API токены не настроены");
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}?fields=id,username,media_count,account_type&access_token=${this.accessToken}`,
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Instagram account error: ${response.status} - ${error}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Ошибка получения информации аккаунта:", error);
      throw error;
    }
  }

  /**
   * Получение медиатеки
   */
  async getMediaLibrary(limit: number = 10): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error("Instagram API токены не настроены");
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media?fields=id,media_url,thumbnail_url,caption,media_type,timestamp&limit=${limit}&access_token=${this.accessToken}`,
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram media error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Ошибка получения медиатеки:", error);
      throw error;
    }
  }

  /**
   * Проверка подключения к Instagram API
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch (error) {
      console.error("❌ Ошибка подключения к Instagram:", error);
      return false;
    }
  }

  async stop() {
    console.log("🐝 Instagram API сервис остановлен");
  }
}
