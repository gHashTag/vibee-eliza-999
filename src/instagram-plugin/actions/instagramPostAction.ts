import { Action } from '@elizaos/core';
import { InstagramPostSchema } from '../types';
import { StorageService } from '../services/storageService';

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
      console.log('🐝 [Instagram] ===== НАЧАЛО ОБРАБОТКИ КОМАНды =====');
      console.log('🐝 [Instagram] Агент:', runtime.character?.name || 'Unknown');
      console.log('🐝 [Instagram] Сообщение от:', message.content?.userId || message.content?.source || 'Unknown');
      console.log('🐝 [Instagram] Текст сообщения:', message.content?.text?.substring(0, 100));
      console.log('🐝 [Instagram] Вложения:', JSON.stringify(message.content?.attachments || [], null, 2));
      console.log('🐝 [Instagram] Начало обработки команды публикации');

      const instagramService = runtime.getService('instagram-api') as any;
      const storageService = runtime.getService<StorageService>('storage');

      if (!instagramService) {
        throw new Error('Instagram API сервис не найден');
      }

      if (!storageService) {
        console.warn('⚠️ [Instagram] StorageService не найден, используем прямые URL');
      }

      // Парсим сообщение для получения данных поста (включая attachments)
      const postData = await parseInstagramPost(
        message.content.text || '',
        message.content.attachments,
        storageService
      );

      // Валидируем данные
      const validation = InstagramPostSchema.safeParse(postData);
      if (!validation.success) {
        throw new Error(`Ошибка валидации: ${validation.error.message}`);
      }

      // Публикуем пост
      console.log('📤 [Instagram] Публикация поста в Instagram...');
      const result = await instagramService.publishPost(validation.data);
      console.log('✅ [Instagram] Результат публикации:', JSON.stringify(result, null, 2));

      // Получаем ID поста и формируем ссылку
      const postId = result.id || 'Неизвестно';
      const postUrl = result.permalink || `https://instagram.com/p/${postId}`;

      // Отправляем успешное сообщение пользователю с деталями
      await callback?.({
        text: `✅ Пост опубликован в Instagram!\n\n📝 Подпись: ${validation.data.caption}\n🖼️ Изображение: ${validation.data.imageUrl || 'Нет'}\n\n🔗 ID поста: ${postId}\n🔗 Ссылка: ${postUrl}\n\n📱 Telegram ID: ${message.content.userId || message.content.source || 'Неизвестно'}`,
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
      await callback?.({
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
 * Улучшенная версия с поддержкой attachments и автоматической загрузкой в облако
 */
export async function parseInstagramPost(
  text: string,
  attachments?: any[],
  storageService?: any
): Promise<any> {
  // Обратная совместимость - если передали только text
  if (typeof text !== 'string') {
    throw new Error('Текст сообщения обязателен');
  }
  console.log('📝 [Instagram] Парсинг сообщения...');
  console.log('📝 [Instagram] Найдено вложений:', attachments?.length || 0);

  let imageUrl = '';
  let caption = '';
  let filesUploaded: any[] = [];

  // 1. Сначала ищем URL в text
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    imageUrl = urlMatch[0];
    console.log('📝 [Instagram] Найден URL в тексте:', imageUrl);
  }

  // 2. Если нет URL в text, ищем в attachments
  if (!imageUrl && attachments && attachments.length > 0) {
    console.log('📝 [Instagram] Поиск изображений во вложениях...');

    // Ищем первое изображение в attachments
    const imageAttachment = attachments.find(att =>
      att.type === 'image' ||
      att.contentType?.startsWith('image/') ||
      att.url
    );

    if (imageAttachment?.url) {
      console.log('📝 [Instagram] Найдено изображение во вложениях:', imageAttachment.url);

      // Если есть StorageService, загружаем файл в облако
      if (storageService) {
        console.log('📤 [Instagram] Загрузка файла в Supabase Storage...');
        try {
          const uploadResult = await storageService.uploadFile(imageAttachment.url, imageAttachment.name);
          imageUrl = uploadResult.url;
          filesUploaded.push({
            originalUrl: imageAttachment.url,
            uploadedUrl: uploadResult.url,
            filePath: uploadResult.path,
            fileName: imageAttachment.name || 'image.jpg',
            timestamp: Date.now()
          });
          console.log('✅ [Instagram] Файл загружен в облако:', uploadResult.url);
        } catch (error) {
          console.warn('⚠️ [Instagram] Не удалось загрузить в облако, используем оригинальный URL:', error);
          imageUrl = imageAttachment.url;
        }
      } else {
        imageUrl = imageAttachment.url;
      }
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
    filesUploaded,
  };
}
