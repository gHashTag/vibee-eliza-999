import { Service } from '@elizaos/core';
import { InstagramService, InstagramPost, InstagramStory, InstagramMetrics } from '../types';

/**
 * Сервис для работы с Instagram API
 * Требует Meta Business API токены в Infisical
 */
export class InstagramAPIService extends Service implements InstagramService {
  static serviceType = 'instagram-api';

  private accessToken: string = '';
  private instagramAccountId: string = '';
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    super();
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID || '';

    if (!this.accessToken) {
      console.warn('⚠️ INSTAGRAM_ACCESS_TOKEN не найден в Infisical. Плагин Instagram не будет работать.');
    }

    if (!this.instagramAccountId) {
      console.warn('⚠️ INSTAGRAM_ACCOUNT_ID не найден в Infisical. Плагин Instagram не будет работать.');
    }
  }

  capabilityDescription(): string {
    return 'Instagram API Service - для публикации постов в Instagram через Meta Business API';
  }

  static async start(runtime: any) {
    console.log('🐝 Запуск Instagram API сервиса');
    const service = new InstagramAPIService();

    // Загружаем токены из Infisical (переменные окружения)
    service.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    service.instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID || '';

    if (!service.accessToken) {
      console.warn('⚠️ INSTAGRAM_ACCESS_TOKEN не найден в Infisical. Плагин Instagram не будет работать.');
    }

    if (!service.instagramAccountId) {
      console.warn('⚠️ INSTAGRAM_ACCOUNT_ID не найден в Infisical. Плагин Instagram не будет работать.');
    }

    return service;
  }

  static async stop(runtime: any) {
    console.log('🐝 Остановка Instagram API сервиса');
    const service = runtime.getService(InstagramAPIService.serviceType);
    if (service) {
      service.stop();
    }
  }

  /**
   * Публикация поста в Instagram
   */
  async publishPost(post: InstagramPost): Promise<any> {
    try {
        if (!this.accessToken || !this.instagramAccountId) {
          throw new Error('Instagram API токены не настроены');
        }

        // Формируем caption с хэштегами
        let caption = post.caption;
        if (post.hashtags && post.hashtags.length > 0) {
          const hashtagsText = post.hashtags.map(tag => `#${tag}`).join(' ');
          caption += `\n\n${hashtagsText}`;
        }

        const response = await fetch(`${this.baseUrl}/${this.instagramAccountId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: post.imageUrl,
            caption: caption,
            access_token: this.accessToken,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Instagram API error: ${response.status} - ${error}`);
        }

        const mediaResult = await response.json();

        // Публикуем медиа
        const publishResponse = await fetch(`${this.baseUrl}/${this.instagramAccountId}/media_publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: mediaResult.id,
            access_token: this.accessToken,
          }),
        });

        if (!publishResponse.ok) {
          const error = await publishResponse.text();
          throw new Error(`Instagram publish error: ${publishResponse.status} - ${error}`);
        }

        const result = await publishResponse.json();
        console.log('✅ Пост опубликован в Instagram:', result);
        return result;
      } catch (error) {
        console.error('❌ Ошибка публикации в Instagram:', error);
        throw error;
      }
  }

  /**
   * Публикация истории
   */
  async publishStory(story: InstagramStory): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API токены не настроены');
      }

      const response = await fetch(`${this.baseUrl}/${this.instagramAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_url: story.mediaUrl,
          caption: story.caption || '',
          access_token: this.accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram story error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ История опубликована в Instagram:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка публикации истории:', error);
      throw error;
    }
  }

  /**
   * Получение метрик поста
   */
  async getMetrics(metrics: InstagramMetrics): Promise<any> {
    try {
      if (!this.accessToken) {
        throw new Error('Instagram API токен не настроен');
      }

      const response = await fetch(
        `${this.baseUrl}/${metrics.postId}/insights?metric=${metrics.metrics.join(',')}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram metrics error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения метрик:', error);
      throw error;
    }
  }

  /**
   * Получение информации об аккаунте
   */
  async getAccountInfo(): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API токены не настроены');
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}?fields=id,username,media_count,account_type&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram account error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения информации аккаунта:', error);
      throw error;
    }
  }

  /**
   * Получение медиатеки
   */
  async getMediaLibrary(limit: number = 10): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API токены не настроены');
      }

      const response = await fetch(
        `${this.baseUrl}/${this.instagramAccountId}/media?fields=id,media_url,thumbnail_url,caption,media_type,timestamp&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Instagram media error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения медиатеки:', error);
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
      console.error('❌ Ошибка подключения к Instagram:', error);
      return false;
    }
  }

  async stop() {
    console.log('🐝 Instagram API сервис остановлен');
  }
}
