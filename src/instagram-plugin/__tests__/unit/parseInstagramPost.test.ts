import { describe, it, expect } from 'bun:test';
import { createImageAttachment } from '../test-utils';
import { parseInstagramPost } from '../../actions/instagramPostAction';

/**
 * Unit тесты для parseInstagramPost
 * Тестирует функцию парсинга сообщений Instagram
 */

describe('parseInstagramPost - Парсинг сообщений Instagram', () => {
  it('должно извлекать URL изображения из текста', () => {
    const text = 'Опубликуй пост в Instagram с изображением https://example.com/image.jpg и подписью красивый закат';
    const result = parseInstagramPost(text);

    expect(result.imageUrl).toBe('https://example.com/image.jpg');
    expect(result.caption).toBe('красивый закат');
  });

  it('должно извлекать URL из вложения', () => {
    const text = 'Опубликуй это в Instagram';
    const attachments = [createImageAttachment('https://example.com/photo.jpg')];
    const result = parseInstagramPost(text, attachments);

    expect(result.imageUrl).toBe('https://example.com/photo.jpg');
    expect(result.caption).toBe('это в Instagram');
    expect(result.caption).not.toContain('опубликуй');
  });

  it('должно предпочитать URL из текста URL из вложения', () => {
    const text = 'Опубликуй пост https://text-url.com/image.jpg';
    const attachments = [createImageAttachment('https://attachment-url.com/photo.jpg')];
    const result = parseInstagramPost(text, attachments);

    expect(result.imageUrl).toBe('https://text-url.com/image.jpg');
  });

  it('должно извлекать хэштеги из текста', () => {
    const text = 'Опубликуй пост с #тег и #другим #хэштегом https://example.com/image.jpg';
    const result = parseInstagramPost(text);

    expect(result.hashtags).toContain('тег');
    expect(result.hashtags).toContain('другим');
    expect(result.hashtags).toContain('хэштегом');
  });

  it('должно использовать default caption если он пустой', () => {
    const text = 'https://example.com/image.jpg';
    const result = parseInstagramPost(text);

    expect(result.caption).toBe('Пост от VIBEE');
  });

  it('должно правильно парсить команду "опубликуй"', () => {
    const text = 'Опубликуй пост в Instagram с изображением https://example.com/image.jpg и подписью тестовая подпись';
    const result = parseInstagramPost(text);

    expect(result.imageUrl).toBe('https://example.com/image.jpg');
    expect(result.caption).toBe('тестовая подпись');
    expect(result.caption).not.toContain('опубликуй');
    expect(result.caption).not.toContain('instagram');
  });

  it('должно работать с командой "/instagram"', () => {
    const text = '/instagram пост с картинкой https://example.com/image.jpg и текстом привет мир';
    const result = parseInstagramPost(text);

    expect(result.imageUrl).toBe('https://example.com/image.jpg');
    expect(result.caption).toBe('привет мир');
  });

  it('должно обрабатывать несколько изображений в attachments (берет первое)', () => {
    const text = 'Опубликуй это в Instagram';
    const attachments = [
      createImageAttachment('https://example.com/first.jpg'),
      createImageAttachment('https://example.com/second.jpg'),
    ];
    const result = parseInstagramPost(text, attachments);

    expect(result.imageUrl).toBe('https://example.com/first.jpg');
  });

  it('должно бросать ошибку если нет изображения', () => {
    const text = 'Опубликуй пост в Instagram';

    expect(() => parseInstagramPost(text)).toThrow('Прикрепите изображение как файл или укажите URL изображения в тексте сообщения');
  });

  it('должно работать с различными форматами изображений', () => {
    const testCases = [
      'https://example.com/image.jpg',
      'https://example.com/image.png',
      'https://example.com/image.webp',
    ];

    testCases.forEach(url => {
      const text = `Опубликуй ${url}`;
      const result = parseInstagramPost(text);
      expect(result.imageUrl).toBe(url);
    });
  });

  it('должно корректно работать с attachment type "photo"', () => {
    const text = 'Опубликуй это в Instagram';
    const attachments = [
      {
        type: 'photo',
        url: 'https://example.com/photo.jpg',
        contentType: 'image/jpeg',
      },
    ];
    const result = parseInstagramPost(text, attachments);

    expect(result.imageUrl).toBe('https://example.com/photo.jpg');
  });

  it('должно обрабатывать длинные подписи', () => {
    const longCaption = 'Это очень длинная подпись для поста в Instagram'.repeat(10);
    const text = `Опубликуй пост https://example.com/image.jpg и подписью ${longCaption}`;
    const result = parseInstagramPost(text);

    expect(result.caption).toBe(longCaption);
    expect(result.caption.length).toBeGreaterThan(50);
  });

  it('должно очищать подпись от лишних пробелов', () => {
    const text = '  Опубликуй    пост   с подписью   тест   ';
    const result = parseInstagramPost(text, [createImageAttachment('https://example.com/img.jpg')]);

    expect(result.caption).toBe('тест');
    expect(result.caption).not.toMatch(/^\s+|\s+$/);
  });
});
