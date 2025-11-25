/**
 * Утилиты для тестирования Instagram плагина
 */

/**
 * Создает тестовое вложение-изображение
 */
export function createImageAttachment(url: string) {
  return {
    type: 'image',
    url: url,
    contentType: 'image/jpeg',
  };
}

/**
 * Создает мок Instagram API ответа
 */
export function createInstagramApiResponse() {
  return {
    id: 'ig_post_123456789',
    caption: 'Test post from VIBEE',
    media_url: 'https://example.com/image.jpg',
    media_type: 'IMAGE',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Проверяет, что объект содержит ожидаемые поля
 */
export function expectValidPostData(data: any) {
  expect(data).toHaveProperty('caption');
  expect(data).toHaveProperty('imageUrl');
  expect(data).toHaveProperty('mediaType');
  expect(typeof data.caption).toBe('string');
  expect(typeof data.imageUrl).toBe('string');
  expect(typeof data.mediaType).toBe('string');
}

/**
 * Асинхронный helper для тестов с timeout
 */
export async function waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
