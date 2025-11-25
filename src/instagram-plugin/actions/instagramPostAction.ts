import { Action } from '@elizaos/core';
import { InstagramPostSchema } from '../types';

/**
 * Действие для публикации поста в Instagram
 */
export const instagramPostAction: Action = {
  name: 'INSTAGRAM_POST',
  similes: ['POST_INSTAGRAM', 'INSTAGRAM', 'IG_POST'],
  description: 'Публикует пост в Instagram с изображением и подписью',

  validate: async (runtime, message) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('instagram') ||
           text.includes('пост') ||
           text.includes('опубликовать') ||
           text.includes('/instagram');
  },

  handler: async (runtime, message, state, options, callback) => {
    try {
      const instagramService = runtime.getService('instagram-api');

      if (!instagramService) {
        throw new Error('Instagram API сервис не найден');
      }

      // Парсим сообщение для получения данных поста (включая attachments)
      const postData = parseInstagramPost(message.content.text, message.content.attachments);

      // Валидируем данные
      const validation = InstagramPostSchema.safeParse(postData);
      if (!validation.success) {
        throw new Error(`Ошибка валидации: ${validation.error.message}`);
      }

      // Публикуем пост
      const result = await instagramService.publishPost(validation.data);

      // Отправляем успешное сообщение пользователю
      await callback({
        text: `✅ Пост опубликован в Instagram!\n\n📝 Подпись: ${validation.data.caption}\n🖼️ Изображение: ${validation.data.imageUrl || 'Нет'}\n\n🔗 Ссылка: https://instagram.com`,
        action: 'INSTAGRAM_POST',
        source: message.content.source,
      });

      return {
        text: 'Пост успешно опубликован в Instagram',
        values: {
          success: true,
          postData: validation.data,
          result: result,
        },
        data: {
          actionName: 'INSTAGRAM_POST',
          timestamp: Date.now(),
        },
        success: true,
      };

    } catch (error) {
      console.error('❌ Ошибка INSTAGRAM_POST:', error);

      // Отправляем ошибку пользователю
      await callback({
        text: `❌ Не удалось опубликовать пост в Instagram.\n\nОшибка: ${error instanceof Error ? error.message : String(error)}\n\nПроверьте:\n- Токены Instagram API в Infisical\n- Правильность URL изображения\n- Наличие разрешений для публикации`,
        error: true,
        action: 'INSTAGRAM_POST_ERROR',
      });

      return {
        text: 'Ошибка публикации в Instagram',
        values: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        data: {
          actionName: 'INSTAGRAM_POST',
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Опубликуй пост в Instagram с фотографией кота и подписью "Милый кот 🐱"',
        },
      },
      {
        name: 'Instagram Bot',
        content: {
          text: '✅ Пост опубликован в Instagram!\n\n📝 Подпись: Милый кот 🐱\n🖼️ Изображение: [URL]',
          action: 'INSTAGRAM_POST',
        },
      },
    ],
  ],
};

/**
 * Парсинг сообщения для извлечения данных поста
 * Улучшенная версия с поддержкой attachments (файлов из Telegram)
 */
export function parseInstagramPost(text: string, attachments?: any[]): any {
  let imageUrl = '';
  let caption = '';

  // 1. Сначала ищем URL в text
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    imageUrl = urlMatch[0];
  }

  // 2. Если нет URL в text, ищем в attachments
  if (!imageUrl && attachments && attachments.length > 0) {
    // Ищем первое изображение в attachments
    const imageAttachment = attachments.find(att =>
      att.type === 'image' ||
      att.contentType?.startsWith('image/') ||
      att.url
    );

    if (imageAttachment?.url) {
      imageUrl = imageAttachment.url;
    }
  }

  // 3. Если всё ещё нет URL, бросаем ошибку
  if (!imageUrl) {
    throw new Error('Прикрепите изображение как файл или укажите URL изображения в тексте сообщения');
  }

  // 4. Извлекаем caption (позитивный подход - ищем то, что нужно оставить)
  // Ищем подпись после ключевых слов: "и подписью", "с подписью", "подпись"
  const captionMatch = text.match(/(?:и\s+подписью|с\s+подписью|подпись[:\s]+|подписи[:\s]+)\s*(.+?)$/i) ||
                       text.match(/и\s+текстом\s*(.+?)$/i);

  if (captionMatch) {
    // Если нашли подпись через ключевые слова
    caption = captionMatch[1].trim();
  } else {
    // Если нет явного указания подписи, берем весь текст и удаляем команды
    let cleanText = text.replace(/https?:\/\/[^\s]+/, '').trim();

    // Удаляем команды в начале
    cleanText = cleanText.replace(/^(?:\/)?(?:instagram|ig)\s*/i, '');
    cleanText = cleanText.replace(/^(?:опубликуй)\s*/i, '');
    cleanText = cleanText.replace(/^(?:пост)\b\s*/i, '');

    // Удаляем слова-маркеры (только целые слова, не части слов) - объединенный regex
    cleanText = cleanText.replace(/\b(?:с\s+(?:подписью|изображением|текстом|картинкой|фотографией|фото)\s*и\s*)?(?:подпись|подписи|подписью)\s*[:\-]?\s*/gi, '');

    // Удаляем лишние пробелы
    caption = cleanText.trim().replace(/\s+/g, ' ');
  }

  // Если caption пустой или очень короткий, используем default
  if (!caption || caption.length < 3) {
    caption = 'Пост от VIBEE';
  }

  // Извлекаем хэштеги из исходного текста (поддержка русских букв)
  const hashtagMatches = text.match(/#[а-яё\w]+/gi);
  const hashtags = hashtagMatches ? hashtagMatches.map(tag => tag.substring(1).toLowerCase()) : [];

  return {
    caption,
    imageUrl,
    mediaType: 'IMAGE',
    hashtags,
  };
}
