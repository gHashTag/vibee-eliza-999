import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { IAgentRuntime, Memory, ActionResult } from '@elizaos/core';
import { createMockRuntime, createTelegramMessage } from '../mocks/runtime';
import { instagramPostAction } from '../../actions/instagramPostAction';
import { instagramPlugin } from '../../index';

/**
 * E2E тесты для Instagram плагина
 * Тестируют полный поток от получения сообщения до публикации
 */

// Глобальный runtime для e2e тестов
let runtime: IAgentRuntime;

beforeAll(async () => {
  // Инициализируем runtime с Instagram плагином
  runtime = createMockRuntime();

  // Подключаем Instagram плагин
  const plugin = instagramPlugin;

  // Инициализируем сервисы плагина
  if (plugin.services && plugin.services.length > 0) {
    for (const ServiceClass of plugin.services) {
      const service = new ServiceClass();
      if (service.initialize) {
        await service.initialize(runtime);
      }
    }
  }
});

describe('Instagram Plugin - E2E Тесты', () => {
  describe('Полный поток публикации поста', () => {
    it('должно публиковать пост с URL в тексте', async () => {
      const message = createTelegramMessage(
        'Опубликуй пост в Instagram с изображением https://picsum.photos/800/600 и подписью "Красивый закат на море"'
      );

      let callbackCalled = false;
      let callbackMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          callbackMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(callbackMessage).toContain('✅ Пост опубликован в Instagram');
      expect(callbackMessage).toContain('Красивый закат на море');
      expect(result.success).toBe(true);
    });

    it('должно публиковать пост с вложением-изображением', async () => {
      const message = createTelegramMessage(
        'Опубликуй этот пост в Instagram с подписью "Мое первое фото"',
        [
          {
            type: 'image',
            url: 'https://example.com/my-photo.jpg',
            contentType: 'image/jpeg',
          },
        ]
      );

      let callbackCalled = false;
      let callbackMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          callbackMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(callbackMessage).toContain('✅ Пост опубликован в Instagram');
      expect(callbackMessage).toContain('Мое первое фото');
      expect(result.success).toBe(true);
    });

    it('должно работать с командой /instagram', async () => {
      const message = createTelegramMessage(
        '/instagram красивый вид на горы https://picsum.photos/1200/800'
      );

      let callbackCalled = false;
      let callbackMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          callbackMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(callbackMessage).toContain('✅ Пост опубликован в Instagram');
      expect(result.success).toBe(true);
    });

    it('должно обрабатывать хэштеги', async () => {
      const message = createTelegramMessage(
        'Пост с #хэштегами и #тегами https://picsum.photos/600/400'
      );

      let callbackCalled = false;
      let callbackMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          callbackMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    it('должно отклонять запрос без изображения', async () => {
      const message = createTelegramMessage('Опубликуй пост в Instagram');

      let callbackCalled = false;
      let errorMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          errorMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(errorMessage).toContain('❌ Не удалось опубликовать пост');
      expect(errorMessage).toContain('Прикрепите изображение');
      expect(result.success).toBe(false);
    });

    it('должно использовать default caption если подпись не указана', async () => {
      const message = createTelegramMessage(
        'Опубликуй https://picsum.photos/500/500'
      );

      let callbackCalled = false;
      let callbackMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackCalled = true;
          callbackMessage = response.text || '';
        }
      );

      expect(callbackCalled).toBe(true);
      expect(callbackMessage).toContain('Пост от VIBEE');
      expect(result.success).toBe(true);
    });
  });

  describe('Валидация действий', () => {
    it('должно активироваться на слово "instagram"', async () => {
      const message = createTelegramMessage('Хочу опубликовать в instagram');

      const isValid = await instagramPostAction.validate(runtime, message);

      expect(isValid).toBe(true);
    });

    it('должно активироваться на слово "пост"', async () => {
      const message = createTelegramMessage('Хочу создать пост');

      const isValid = await instagramPostAction.validate(runtime, message);

      expect(isValid).toBe(true);
    });

    it('должно активироваться на команду "/instagram"', async () => {
      const message = createTelegramMessage('/instagram тест');

      const isValid = await instagramPostAction.validate(runtime, message);

      expect(isValid).toBe(true);
    });

    it('должно активироваться на слово "опубликовать"', async () => {
      const message = createTelegramMessage('Опубликуй это');

      const isValid = await instagramPostAction.validate(runtime, message);

      expect(isValid).toBe(true);
    });

    it('НЕ должно активироваться на обычные сообщения', async () => {
      const message = createTelegramMessage('Привет, как дела?');

      const isValid = await instagramPostAction.validate(runtime, message);

      expect(isValid).toBe(false);
    });
  });

  describe('Обработка ошибок', () => {
    it('должно отклонять запрос без изображения (не файл, не URL)', async () => {
      const message = createTelegramMessage('Опубликуй без изображения');

      let errorMessage = '';

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          errorMessage = response.text || '';
        }
      );

      expect(errorMessage).toContain('❌ Не удалось опубликовать пост');
      expect(result.success).toBe(false);
    });

    it('должно логировать ошибки в runtime', async () => {
      const message = createTelegramMessage('Опубликуй без изображения');

      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      runtime.logger = mockLogger;

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async () => {}
      );

      // Проверяем, что ошибка была залогирована
      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });

  describe('Производительность', () => {
    it('должно обрабатывать запросы в течение разумного времени', async () => {
      const message = createTelegramMessage(
        'Опубликуй быстро https://picsum.photos/300/300 с подписью тест'
      );

      const startTime = Date.now();

      const result = await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async () => {}
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Не более 5 секунд
      expect(result.success).toBe(true);
    });

    it('должно обрабатывать множественные вложения (берет первое)', async () => {
      const message = createTelegramMessage(
        'Опубликуй с подписью мультимедиа',
        [
          { type: 'image', url: 'https://example.com/first.jpg' },
          { type: 'image', url: 'https://example.com/second.jpg' },
          { type: 'image', url: 'https://example.com/third.jpg' },
        ]
      );

      let callbackMessage = '';

      await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async (response) => {
          callbackMessage = response.text || '';
        }
      );

      expect(callbackMessage).toContain('✅ Пост опубликован в Instagram');
      expect(callbackMessage).toContain('https://example.com/first.jpg');
    });
  });

  describe('Интеграция с базой данных', () => {
    it('должно сохранять результат операции в память', async () => {
      const message = createTelegramMessage(
        'Опубликуй пост в базу https://picsum.photos/400/400'
      );

      await instagramPostAction.handler(
        runtime,
        message,
        { message: message.content.text, currentContext: [] },
        {},
        async () => {}
      );

      // Проверяем, что память была добавлена
      expect(runtime.addMemory).toHaveBeenCalled();
    });
  });
});

/**
 * Проверяет, что плагин корректно регистрируется
 */
describe('Плагин регистрация', () => {
  it('должно иметь все необходимые компоненты', () => {
    expect(instagramPlugin).toBeDefined();
    expect(instagramPlugin.name).toBe('instagram');
    expect(instagramPlugin.actions).toBeDefined();
    expect(instagramPlugin.actions.length).toBeGreaterThan(0);
    expect(instagramPlugin.services).toBeDefined();
  });

  it('должно экспортировать instagramPostAction', () => {
    expect(instagramPostAction).toBeDefined();
    expect(instagramPostAction.name).toBe('INSTAGRAM_POST');
  });
});
