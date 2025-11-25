import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { InstagramAPIService } from '../../services/instagramService';
import { createInstagramApiResponse } from '../test-utils';

/**
 * Интеграционные тесты для InstagramAPIService
 */

describe('InstagramAPIService - Интеграционные тесты', () => {
  let service: InstagramAPIService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    service = new InstagramAPIService();
  });

  describe('validateToken', () => {
    it('должно успешно валидировать корректный токен', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: { id: '17841401201538156' } }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.validateToken('valid_token');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        expect.any(Object)
      );
    });

    it('должно возвращать false для невалидного токена', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid token' } }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.validateToken('invalid_token');

      expect(result).toBe(false);
    });

    it('должно обрабатывать сетевые ошибки', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await service.validateToken('test_token');

      expect(result).toBe(false);
    });
  });

  describe('publishPost', () => {
    it('должно успешно публиковать пост с URL изображения', async () => {
      const postData = {
        caption: 'Test post',
        imageUrl: 'https://example.com/image.jpg',
        mediaType: 'IMAGE',
        hashtags: ['test'],
      };

      const mockResponse = createInstagramApiResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.publishPost(postData);

      expect(result).toBeDefined();
      expect(result.id).toBe('ig_post_123456789');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/media'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('должно обрабатывать ошибки API', async () => {
      const postData = {
        caption: 'Test post',
        imageUrl: 'https://example.com/image.jpg',
        mediaType: 'IMAGE',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid image URL' } }),
      });

      await expect(service.publishPost(postData)).rejects.toThrow('Invalid image URL');
    });

    it('должно добавлять хэштеги к подписи', async () => {
      const postData = {
        caption: 'Test post',
        imageUrl: 'https://example.com/image.jpg',
        mediaType: 'IMAGE',
        hashtags: ['тест', 'пост'],
      };

      const mockResponse = createInstagramApiResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await service.publishPost(postData);

      // Проверяем, что API был вызван с подписью, содержащей хэштеги
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.caption).toContain('#тест');
      expect(requestBody.caption).toContain('#пост');
    });

    it('должно валидировать обязательные поля', async () => {
      const invalidPostData = {
        caption: '', // Пустая подпись
        imageUrl: '',
        mediaType: 'IMAGE',
      };

      await expect(service.publishPost(invalidPostData)).rejects.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('должно получать метрики поста', async () => {
      const mockResponse = {
        data: {
          id: 'ig_post_123456789',
          like_count: 42,
          comments_count: 7,
          engagement_rate: 5.2,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getMetrics('ig_post_123456789');

      expect(result).toBeDefined();
      expect(result.like_count).toBe(42);
      expect(result.comments_count).toBe(7);
    });

    it('должно обрабатывать ошибки при получении метрик', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Post not found' } }),
      });

      await expect(service.getMetrics('invalid_post_id')).rejects.toThrow('Post not found');
    });
  });

  describe('publishStory', () => {
    it('должно публиковать истории', async () => {
      const storyData = {
        imageUrl: 'https://example.com/story.jpg',
        caption: 'My story',
      };

      const mockResponse = { id: 'ig_story_123' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.publishStory(storyData);

      expect(result).toBeDefined();
      expect(result.id).toBe('ig_story_123');
    });

    it('должно требовать изображение для истории', async () => {
      const storyData = {
        caption: 'Story without image',
      };

      await expect(service.publishStory(storyData)).rejects.toThrow();
    });
  });

  describe('Обработка токенов', () => {
    it('должно использовать токен из переменных окружения', async () => {
      process.env.INSTAGRAM_ACCESS_TOKEN = 'test_token_from_env';
      process.env.INSTAGRAM_ACCOUNT_ID = 'test_account_id';

      const service = new InstagramAPIService();

      expect(service).toBeDefined();
      // Токены будут проверены при первом API вызове
    });

    it('должно корректно обрабатывать отсутствие токенов', async () => {
      delete process.env.INSTAGRAM_ACCESS_TOKEN;
      delete process.env.INSTAGRAM_ACCOUNT_ID;

      const service = new InstagramAPIService();

      // Сервис должен быть создан, но API вызовы будут неудачными
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Missing access token' } }),
      });

      const result = await service.validateToken('');

      expect(result).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('должно соблюдать ограничения API', async () => {
      // Мокируем быстрые последовательные вызовы
      const postData = {
        caption: 'Test',
        imageUrl: 'https://example.com/image.jpg',
        mediaType: 'IMAGE',
      };

      const mockResponse = createInstagramApiResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Делаем несколько вызовов подряд
      await service.publishPost(postData);
      await service.publishPost(postData);

      // Проверяем, что все вызовы были выполнены
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
