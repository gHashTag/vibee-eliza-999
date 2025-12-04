# 📸 ПОШАГОВЫЙ АЛГОРИТМ ПУБЛИКАЦИИ В INSTAGRAM

> **Полное руководство по публикации постов в Instagram через Telegram бот VIBEE**
>
> **Версия:** 1.0.0 | **Дата:** 2025-11-22 | **Статус:** ✅ Production Ready

---

## 🎯 Содержание

1. [Обзор системы](#-обзор-системы)
2. [Архитектура плагина](#-архитектура-плагина)
3. [Пошаговый алгоритм публикации](#-пошаговый-алгоритм-публикации)
4. [Диаграмма вызовов](#-диаграмма-вызовов)
5. [Карта файлов и функций](#-карта-файлов-и-функций)
6. [Обработка данных](#-обработка-данных)
7. [API Instagram](#-api-instagram)
8. [Хранение файлов](#-хранение-файлов)
9. [Тестирование](#-тестирование)
10. [Troubleshooting](#-troubleshooting)
11. [Команды запуска](#-команды-запуска)

---

## 📋 Обзор системы

### Что это?

**Instagram Plugin** - это плагин для VIBEE (ElizaOS агент), который позволяет публиковать посты в Instagram прямо из Telegram бота через Meta Business API.

### Возможности

✅ **Публикация постов** - текст + изображение + хэштеги
✅ **Автоматическая обработка команд** - на русском языке
✅ **Поддержка вложений** - фотографии из Telegram
✅ **Облачное хранилище** - Supabase для временного хранения файлов
✅ **Автоматические токены** - long-lived токены (60 дней)
✅ **Валидация данных** - проверка форматов и размеров
✅ **Обработка ошибок** - подробные сообщения об ошибках

### Поток данных

```
Telegram → Character → Instagram Plugin → Meta API → Instagram
   ↓            ↓             ↓             ↓           ↓
  Команда   Определение   Парсинг +     Публикация   Пост
  + Фото    действия      Валидация     через API    готов
```

---

## 🏗️ Архитектура плагина

### Структура проекта

```
src/instagram-plugin/
├── 📂 actions/
│   └── instagramPostAction.ts      # Обработка команд
├── 📂 services/
│   ├── instagramService.ts         # Meta API интеграция
│   └── storageService.ts           # Облачное хранилище
├── 📂 types/
│   └── index.ts                    # TypeScript типы
├── 📂 __tests__/
│   ├── unit/                       # Unit тесты
│   ├── integration/                # Integration тесты
│   └── e2e/                        # E2E тесты
├── index.ts                        # Экспорт плагина
└── README.md                       # Документация
```

### Компоненты системы

| Компонент               | Назначение                                   | Файл                                  |
|-------------------------|----------------------------------------------|---------------------------------------|
| **instagramPostAction** | Обработка команд пользователя               | `actions/instagramPostAction.ts`      |
| **InstagramAPIService** | Интеграция с Meta Graph API                  | `services/instagramService.ts`        |
| **StorageService**      | Загрузка файлов в Supabase Storage           | `services/storageService.ts`          |
| **parseInstagramPost**  | Парсинг сообщений и извлечение данных        | `actions/instagramPostAction.ts`      |

---

## 🔄 Пошаговый алгоритм публикации

### ШАГ 1: Пользователь отправляет команду

**Где:** Telegram бот VIBEE

**Действие:**
Пользователь отправляет сообщение с командой и изображением

**Примеры команд:**

```text
/instagram пост https://example.com/photo.jpg с подписью Мой пост #тег
опубликуй в инстаграм с изображением https://... и подписью Тест #ai
пост в instagram https://img.jpg красивый вид #nature
```

**Где лежит:**
- `plugin-telegram-craft/src/services/mtproto.adapter.ts:45` - функция `handleUpdate()`
- `plugin-telegram-craft/src/services/telegram.service.ts:78` - функция `processMessage()`

**Что происходит:**

```typescript
// 1. handleUpdate() получает update от Telegram
async function handleUpdate(update: TelegramUpdate) {
  // 2. Передает в processMessage()
  await processMessage(update);
}

// 3. Парсит команду parseCommand()
function parseCommand(text: string) {
  // Определяет тип действия
  return parseInstagramCommand(text);
}
```

---

### ШАГ 2: Character обрабатывает сообщение

**Где:** `src/character.ts`

**Действие:**
Character (Eliza/VIBEE) анализирует сообщение и определяет action

**Где лежит:**
- `characters/instagram.ts:15-45` - настройка character
- `src/character.ts:120` - подключение плагинов
- `plugins: [...instagramPlugin]` - подключение Instagram плагина

**Что происходит:**

```typescript
// Character конфигурация
export const character: Character = {
  name: "VIBEE",
  plugins: [
    // ...
    instagramPlugin as any, // Instagram плагин подключен
  ],
  // ...
};

// 1. Character видит команду в сообщении
const message = {
  content: {
    text: "/instagram пост ...", // Команда обнаружена
  }
};

// 2. Определяет action: "INSTAGRAM_POST"
const actionName = determineAction(message.content.text); // => "INSTAGRAM_POST"

// 3. Передает в обработчик
await instagramPostAction.handler(runtime, message, state, options, callback);
```

---

### ШАГ 3: Запуск обработчика Instagram Post

**Где:** `src/instagram-plugin/actions/instagramPostAction.ts:21`

**Действие:**
`instagramPostAction.handler()` начинает обработку команды

**Где лежит:**
- `instagramPostAction.ts:25` - главная функция `handler()`

**Что происходит:**

```typescript
export const instagramPostAction: Action = {
  name: 'INSTAGRAM_POST',
  similes: ['POST_INSTAGRAM', 'INSTAGRAM', 'IG_POST'],
  description: 'Публикует пост в Instagram с изображением и подписью',

  validate: async (runtime, message) => {
    // Проверяет триггеры
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('instagram') ||
           text.includes('пост') ||
           text.includes('опубликовать') ||
           text.includes('/instagram');
  },

  handler: async (runtime, message, state, options, callback) => {
    console.log('🐝 [Instagram] Начало обработки команды публикации');

    try {
      // 1. Получаем сервисы
      const instagramService = runtime.getService('instagram-api');
      const storageService = runtime.getService<StorageService>('storage');

      // 2. Парсинг сообщения
      const postData = await parseInstagramPost(
        message.content.text,
        message.content.attachments,
        storageService
      );

      // 3. Валидация данных
      const validation = InstagramPostSchema.safeParse(postData);
      if (!validation.success) {
        throw new Error(`Ошибка валидации: ${validation.error.message}`);
      }

      // 4. Публикация
      const result = await instagramService.publishPost(validation.data);

      // 5. Ответ пользователю
      await callback({
        text: `✅ Пост опубликован в Instagram!\n\n📝 Подпись: ${validation.data.caption}\n🔗 ID поста: ${result.id}`,
        action: 'INSTAGRAM_POST',
      });

      return { success: true, data: result };
    } catch (error) {
      // Обработка ошибки
      await callback({
        text: `❌ Ошибка: ${error.message}`,
        error: true,
      });
      return { success: false, error };
    }
  },
};
```

---

### ШАГ 4: Парсинг сообщения и вложений

**Где:** `src/instagram-plugin/actions/instagramPostAction.ts:128`

**Действие:**
`parseInstagramPost()` извлекает структурированные данные из сообщения

**Где лежит:**
- `instagramPostAction.ts:67` - функция `parseInstagramPost()`
- `instagramPostAction.ts:134` - функция `processAttachments()`

**Что происходит:**

```typescript
export async function parseInstagramPost(
  text: string,
  attachments?: any[],
  storageService?: any
): Promise<any> {
  console.log('📝 [Instagram] Парсинг сообщения...');

  let imageUrl = '';
  let caption = '';
  let filesUploaded: any[] = [];

  // 1. Ищем URL в тексте сообщения
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    imageUrl = urlMatch[0];
    console.log('📝 [Instagram] Найден URL в тексте:', imageUrl);
  }

  // 2. Если нет URL в text, ищем в attachments
  if (!imageUrl && attachments && attachments.length > 0) {
    console.log('📝 [Instagram] Поиск изображений во вложениях...');

    // Ищем первое изображение
    const imageAttachment = attachments.find(att =>
      att.type === 'image' ||
      att.contentType?.startsWith('image/') ||
      att.url
    );

    if (imageAttachment?.url) {
      console.log('📝 [Instagram] Найдено изображение во вложениях:', imageAttachment.url);

      // 3. Если есть StorageService, загружаем в облако
      if (storageService) {
        console.log('📤 [Instagram] Загрузка файла в Supabase Storage...');
        try {
          const uploadResult = await storageService.uploadFile(
            imageAttachment.url,
            imageAttachment.name
          );
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
          console.warn('⚠️ [Instagram] Не удалось загрузить в облако:', error);
          imageUrl = imageAttachment.url;
        }
      } else {
        imageUrl = imageAttachment.url;
      }
    }
  }

  // 4. Если всё ещё нет URL - ошибка
  if (!imageUrl) {
    throw new Error('Прикрепите изображение как файл или укажите URL изображения');
  }

  // 5. Извлекаем caption (подпись)
  const captionMatch = text.match(
    /(?:и\s+подписью|с\s+подписью|подпись[:\s]+|подписи[:\s]+)\s*(.+?)$/i
  ) || text.match(/и\s+текстом\s*(.+?)$/i);

  if (captionMatch) {
    caption = captionMatch[1].trim();
  } else {
    // Удаляем команды и URL из текста
    let cleanText = text.replace(/https?:\/\/[^\s]+/, '').trim();
    cleanText = cleanText.replace(/^(?:\/)?(?:instagram|ig)\s*/i, '');
    cleanText = cleanText.replace(/^(?:опубликуй)\s*/i, '');
    cleanText = cleanText.replace(/^(?:пост)\b\s*/i, '');
    cleanText = cleanText.replace(/\b(?:с\s+(?:подписью|изображением|текстом|картинкой|фотографией|фото)\s*и\s*)?(?:подпись|подписи|подписью)\s*[:\-]?\s*/gi, '');
    caption = cleanText.trim().replace(/\s+/g, ' ');
  }

  // Если caption пустой - используем default
  if (!caption || caption.length < 3) {
    caption = 'Пост от VIBEE';
  }

  // 6. Извлекаем хэштеги
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
```

---

### ШАГ 5: Загрузка файлов в облачное хранилище

**Где:** `src/instagram-plugin/services/storageService.ts:102`

**Действие:**
`StorageService.uploadFile()` загружает файл в Supabase Storage

**Где лежит:**
- `storageService.ts:23` - функция `uploadFile()`
- `storageService.ts:89` - функция `scheduleCleanup()`

**Что происходит:**

```typescript
class StorageService extends Service {
  static serviceType = 'storage';

  private bucketName = 'instagram-uploads';

  async uploadFile(fileUrl: string, fileName?: string): Promise<{ url: string; path: string }> {
    try {
      console.log(`📤 [StorageService] Загрузка файла: ${fileUrl}`);

      // 1. Генерируем уникальное имя файла
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = fileName?.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}-${random}.${extension}`;

      // 2. Скачиваем файл по URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Не удалось скачать файл: ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      const fileUint8Array = new Uint8Array(fileBuffer);

      // 3. Определяем MIME тип
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // 4. Загружаем в Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, fileUint8Array, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Ошибка загрузки в Supabase: ${error.message}`);
      }

      // 5. Получаем публичный URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      console.log(`✅ [StorageService] Файл загружен: ${urlData.publicUrl}`);

      return {
        url: urlData.publicUrl,
        path: data.path
      };

    } catch (error) {
      console.error(`❌ [StorageService] Ошибка загрузки:`, error);
      throw error;
    }
  }

  /**
   * Автоочистка старых файлов (старше 24 часов)
   */
  private scheduleCleanup(): void {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 час
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 часа

    console.log(`⏰ [StorageService] Запуск автоочистки каждые ${CLEANUP_INTERVAL / 1000 / 60} минут`);

    setInterval(async () => {
      try {
        console.log('🧹 [StorageService] Проверка старых файлов...');

        const { data: files, error } = await this.supabase.storage
          .from(this.bucketName)
          .list();

        if (error) {
          console.error(`❌ [StorageService] Ошибка получения списка файлов:`, error);
          return;
        }

        if (!files || files.length === 0) {
          console.log('ℹ️ [StorageService] Файлов для очистки не найдено');
          return;
        }

        const now = Date.now();
        const oldFiles = files.filter(file => {
          const fileAge = now - (file.updated_at ? new Date(file.updated_at).getTime() : 0);
          return fileAge > MAX_AGE;
        });

        if (oldFiles.length > 0) {
          const pathsToDelete = oldFiles.map(file => file.name);
          await this.supabase.storage
            .from(this.bucketName)
            .remove(pathsToDelete);

          console.log(`✅ [StorageService] Удалено ${oldFiles.length} старых файлов`);
        } else {
          console.log('ℹ️ [StorageService] Старых файлов не найдено');
        }
      } catch (error) {
        console.error(`❌ [StorageService] Ошибка автоочистки:`, error);
      }
    }, CLEANUP_INTERVAL);
  }
}
```

**Fallback режим:**
Если Supabase не настроен, используется прямой URL без загрузки в облако:

```typescript
// В instagramService.ts
if (!storageService) {
  console.warn('⚠️ [Instagram] StorageService не найден, используем прямые URL');
  // Используем оригинальный URL изображения
}
```

---

### ШАГ 6: Публикация в Instagram

**Где:** `src/instagram-plugin/services/instagramService.ts:63`

**Действие:**
`InstagramAPIService.publishPost()` публикует пост через Meta Graph API

**Где лежит:**
- `instagramService.ts:34` - функция `publishPost()`
- `instagramService.ts:156` - функция `getAccountInfo()`

**Что происходит:**

```typescript
export class InstagramAPIService extends Service implements InstagramService {
  static serviceType = 'instagram-api';

  private accessToken: string = '';
  private instagramAccountId: string = '';
  private baseUrl = 'https://graph.facebook.com/v18.0';

  async publishPost(post: InstagramPost): Promise<any> {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API токены не настроены');
      }

      // 1. Формируем caption с хэштегами
      let caption = post.caption;
      if (post.hashtags && post.hashtags.length > 0) {
        const hashtagsText = post.hashtags.map(tag => `#${tag}`).join(' ');
        caption += `\n\n${hashtagsText}`;
      }

      // 2. Создаем медиа-контейнер
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
      console.log('✅ [Instagram] Медиа-контейнер создан:', mediaResult.id);

      // 3. Публикуем медиа
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
        console.error('❌ [Instagram] Ошибка публикации:', error);
        throw new Error(`Instagram publish error: ${response.status} - ${error}`);
      }

      const result = await publishResponse.json();
      console.log('✅ [Instagram] Пост опубликован! Результат:', JSON.stringify(result, null, 2));

      // 4. Получаем дополнительную информацию о посте
      try {
        console.log(`📋 [Instagram] Получение деталей поста ID: ${result.id}`);
        const mediaDetailsResponse = await fetch(
          `${this.baseUrl}/${result.id}?fields=id,permalink,caption,media_type,media_url,thumbnail_url,timestamp&access_token=${this.accessToken}`
        );

        if (mediaDetailsResponse.ok) {
          const mediaDetails = await mediaDetailsResponse.json();
          console.log('📋 [Instagram] Детали поста:', JSON.stringify(mediaDetails, null, 2));
          return {
            ...result,
            caption: mediaDetails.caption,
            permalink: mediaDetails.permalink,
            media_url: mediaDetails.media_url,
            timestamp: mediaDetails.timestamp,
          };
        } else {
          console.warn('⚠️ [Instagram] Не удалось получить детали поста');
        }
      } catch (detailError) {
        console.warn('⚠️ [Instagram] Ошибка получения деталей поста:', detailError);
      }

      return result;
    } catch (error) {
      console.error('❌ Ошибка публикации в Instagram:', error);
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
}
```

---

### ШАГ 7: Формирование ответа пользователю

**Где:** `src/instagram-plugin/actions/instagramPostAction.ts:59`

**Действие:**
`callback()` отправляет успешное сообщение пользователю в Telegram

**Что происходит:**

```typescript
// В handler()
const result = await instagramService.publishPost(validation.data);

// Формируем сообщение
const postId = result.id || 'Неизвестно';
const postUrl = result.permalink || `https://instagram.com/p/${postId}`;

// Отправляем пользователю
await callback({
  text: `✅ Пост опубликован в Instagram!

📝 Подпись: ${validation.data.caption}
🖼️ Изображение: ${validation.data.imageUrl || 'Нет'}

🔗 ID поста: ${postId}
🔗 Ссылка: ${postUrl}

📱 Telegram ID: ${message.content.userId || message.content.source || 'Неизвестно'}`,
  action: 'INSTAGRAM_POST',
  source: message.content.source,
});
```

---

### ШАГ 8: Сохранение в базу данных (опционально)

**Где:** `src/instagram-plugin/services/databaseService.ts:45`

**Действие:**
`savePost()` сохраняет информацию о посте в PostgreSQL

**Что происходит:**

```typescript
async function savePost(userId: string, result: PublishResult) {
  await db.insert(instagramPosts).values({
    userId,
    postId: result.postId,
    caption: result.caption,
    permalink: result.permalink,
    publishedAt: result.publishedAt,
    status: 'published'
  });
}
```

---

## 🔄 Диаграмма вызовов

```
1. user sends "/insta пост Тест" + photo
     ↓
2. mtproto.adapter.ts → handleUpdate()
     ↓
3. telegram.service.ts → processMessage()
     ↓
4. character.ts → matches action "INSTAGRAM_POST"
     ↓
5. instagramPostAction.ts → handler()
     ↓
6. parseInstagramPost() → extracts text & attachments
     ↓
7. StorageService.uploadFile() → uploads to Supabase (or fallback)
     ↓
8. InstagramAPIService.publishPost() → publishes to IG
     ↓
9. formatResponse() → formats message
     ↓
10. callback() → sends to Telegram user
```

---

## 📁 Карта файлов и функций

| Файл                                           | Функция              | Назначение                       |
|------------------------------------------------|----------------------|----------------------------------|
| `plugin-telegram-craft/src/services/mtproto.adapter.ts:45` | `handleUpdate()`     | Входная точка - получение update |
| `plugin-telegram-craft/src/services/telegram.service.ts:78` | `processMessage()`   | Обработка сообщения              |
| `src/instagram-plugin/actions/instagramPostAction.ts:25`   | `handler()`          | Главный обработчик               |
| `src/instagram-plugin/actions/instagramPostAction.ts:67`   | `parseInstagramPost()`| Парсинг сообщения                |
| `src/instagram-plugin/actions/instagramPostAction.ts:134`  | `processAttachments()`| Обработка вложений               |
| `src/instagram-plugin/services/storageService.ts:23`       | `uploadFile()`       | Загрузка в облако                |
| `src/instagram-plugin/services/storageService.ts:89`       | `scheduleCleanup()`  | Автоочистка                      |
| `src/instagram-plugin/services/instagramService.ts:34`     | `publishPost()`      | Публикация в IG                  |
| `src/instagram-plugin/services/instagramService.ts:156`    | `getAccountInfo()`   | Получение данных                 |
| `src/instagram-plugin/actions/instagramPostAction.ts:189`  | `formatResponse()`   | Формирование ответа              |

---

## ⚙️ Точки конфигурации

### Переменные из Infisical

| Переменная               | Назначение                          |
|--------------------------|-------------------------------------|
| `INSTAGRAM_ACCESS_TOKEN` | Токен доступа к Instagram API      |
| `INSTAGRAM_ACCOUNT_ID`   | ID Instagram бизнес аккаунта       |
| `SUPABASE_URL`           | URL проекта Supabase (опционально) |
| `SUPABASE_SERVICE_ROLE_KEY` | Ключ доступа к Supabase (опционально) |

### Получение токенов

#### 1. INSTAGRAM_ACCESS_TOKEN

```bash
# Получите через Meta Graph API Explorer
# https://developers.facebook.com/tools/explorer/

# Необходимые права:
# - instagram_basic
# - instagram_content_publish
# - pages_show_list
# - pages_read_engagement
```

#### 2. INSTAGRAM_ACCOUNT_ID

```bash
# Получается автоматически при конвертации токена
# Или вручную через API:
GET https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account
```

### Переменные из .env (опционально)

```bash
# Для работы без Supabase (fallback режим)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Без этих переменных - работает в fallback режиме (прямые URL)
```

---

## 🚨 Важные моменты

### 1. **Fallback режим**

Если Supabase не настроен, файлы НЕ загружаются в облако, а используются напрямую:

```typescript
// StorageService.start()
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Сервис будет работать в fallback режиме');
  // Используются прямые URL изображений
}
```

### 2. **Одно изображение**

Instagram API поддерживает только первое изображение как главное:

```typescript
// Из множественных вложений берем первое
const imageAttachment = attachments.find(att => att.type === 'image');
```

### 3. **Автоочистка**

Файлы в Supabase автоматически удаляются через 24 часа:

```typescript
private scheduleCleanup(): void {
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 часа
  setInterval(() => {
    // Удаляет файлы старше MAX_AGE
  }, CLEANUP_INTERVAL);
}
```

### 4. **Обработка ошибок**

Если Instagram API недоступен:

```typescript
try {
  const result = await instagramService.publishPost(postData);
} catch (error) {
  await callback({
    text: `❌ Не удалось опубликовать пост в Instagram.\n\nОшибка: ${error.message}`,
    error: true,
  });
}
```

### 5. **Валидация**

Проверяется:
- Наличие текста
- Формат изображений (JPG, PNG, WebP)
- Длина caption (максимум 2200 символов)
- Размер файла (максимум 8MB)

---

## ✅ Проверка работоспособности

### 1. Запуск агента

```bash
bun dev
```

### 2. В Telegram отправляем команду

```text
/instagram пост Мой тестовый пост https://picsum.photos/800/600
```

### 3. Ожидаемый ответ

```
✅ Пост опубликован в Instagram!

📝 Подпись: Мой тестовый пост
🖼️ Изображение: https://picsum.photos/800/600

🔗 ID поста: 1789XXXXXXXXX
🔗 Ссылка: https://www.instagram.com/p/1789XXXXXXXXX/

📱 Telegram ID: 123456789
```

---

## 🧪 Тестирование

### Unit тесты

```bash
# Тесты парсинга
npm test src/instagram-plugin/__tests__/unit/parseInstagramPost.test.ts

# Тесты валидации
npm test src/instagram-plugin/__tests__/unit/validation.test.ts
```

### Integration тесты

```bash
# Тесты сервисов
npm test src/instagram-plugin/__tests__/integration/instagramService.test.ts
```

### E2E тесты

```bash
# Полный цикл с реальным API
npm test src/instagram-plugin/__tests__/e2e/instagramPlugin.e2e.ts
```

### С покрытием

```bash
npm test -- --coverage
```

---

## 🔧 Troubleshooting

### Частые проблемы

#### 1. **Токен истёк**

```bash
❌ Ошибка: Instagram API токены не настроены
```

**Решение:**
```bash
# Получите новый токен в Meta Graph API Explorer
# https://developers.facebook.com/tools/explorer/

# Обновите в Infisical
```

#### 2. **Aspect ratio not supported**

```bash
❌ The aspect ratio is not supported
```

**Решение:**
Используйте поддерживаемые соотношения:
- ✅ Квадрат: 1:1 (рекомендуется)
- ✅ Портрет: 4:5
- ✅ Ландшефт: 1.91:1

#### 3. **Не удалось скачать медиафайл**

```bash
❌ Не удалось скачать медиафайл
```

**Решение:**
- Убедитесь, что URL публично доступен
- Используйте HTTPS
- Избегайте redirect URLs

#### 4. **Instagram Business аккаунт не найден**

```bash
❌ Instagram Business аккаунты не найдены
```

**Решение:**
1. Убедитесь, что Instagram профиль - Business аккаунт
2. Привяжите к Facebook Page
3. Выдайте права в Graph API Explorer

### Debug режим

```bash
# Включите подробное логирование
LOG_LEVEL=debug bun dev
```

---

## 🚀 Команды запуска

### ⚡ ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА

```bash
bun dev
```

**Почему только `bun dev`:**
- ✅ Автоматически настраивает все окружение
- ✅ Подключает Infisical секреты
- ✅ Запускает агента с правильной конфигурацией
- ✅ НИКАКИХ дополнительных команд не нужно!

### ❌ НИКОГДА НЕ ИСПОЛЬЗУЕМ

- `npm run dev`
- `npm run dev:hot`
- `bun run dev`
- `elizaos dev`

### Проверка установки

```bash
# Проверяем, что агент запустился
curl http://localhost:3000/health

# Ожидаемый ответ:
{
  "status": "ok",
  "plugins": ["instagram-plugin", ...]
}
```

---

## 📊 Параметры изображений

| Параметр      | Требование                           |
|---------------|--------------------------------------|
| Формат        | JPG, PNG, WebP                       |
| Размер файла  | < 8 MB                               |
| Разрешение    | Min: 320px, Max: 1080px              |
| Aspect Ratio  | 1:1, 4:5, 1.91:1                     |
| URL           | Публично доступный, HTTPS            |
| Content-Type  | image/jpeg, image/png, image/webp    |

---

## 🎯 Примеры использования

### 1. Публикация с URL

```text
/instagram пост Красивый закат https://picsum.photos/800/600 #sunset #beautiful
```

### 2. Публикация с вложением

```text
опубликуй в инстаграм с подписью Мое фото #vibe
[прикрепленное изображение]
```

### 3. Публикация с хэштегами

```text
/instagram https://img.jpg #ai #test #automation #vibee
```

### 4. Только текст (default caption)

```text
/instagram https://picsum.photos/500/500
```

---

## 📝 Файлы конфигурации

### .env.dev (Development)

```bash
# Infisical Cloud-First Configuration (ONLY these 5 variables!)
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev
NODE_ENV=development

# Instagram API (loaded from Infisical)
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...

# Supabase (optional - for file storage)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🎉 Заключение

**Пошаговый алгоритм публикации в Instagram** - это полностью автоматизированная система, которая:

1. ✅ Принимает команды из Telegram
2. ✅ Парсит сообщения и вложения
3. ✅ Загружает файлы в облако (опционально)
4. ✅ Публикует через Meta Business API
5. ✅ Формирует ответы пользователю
6. ✅ Обрабатывает ошибки

**Все работает автоматически** - пользователю нужно только отправить команду с изображением!

---

**Дата создания:** 2025-11-22
**Версия документа:** 1.0.0
**Статус:** ✅ Production Ready
**Автор:** VIBEE Development Team
