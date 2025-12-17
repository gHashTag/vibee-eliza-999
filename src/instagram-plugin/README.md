# 📸 Instagram Plugin для VIBEE

> Плагин для автоматической публикации постов в Instagram через Meta Business API с автоматизацией токенов (60 дней)

## 🎯 Возможности

- ✅ Публикация постов в Instagram через Telegram бот
- ✅ Поддержка изображений и подписей
- ✅ Автоматическая обработка команд на русском языке
- ✅ Извлечение хэштегов и URL из текста
- ✅ Автоматическая проверка токенов при запуске
- ✅ Long-lived токены (60 дней) - больше НЕ нужно обновлять каждые 2 часа!

---

## 📋 Содержание

1. [Быстрый старт](#-быстрый-старт)
2. [Архитектура](#-архитектура)
3. [Настройка токенов](#-настройка-токенов)
4. [Использование](#-использование)
5. [API](#-api)
6. [Тестирование](#-тестирование)
7. [Автоматизация](#-автоматизация)
8. [Troubleshooting](#-troubleshooting)

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

```bash
# Создайте файл .env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_ACCOUNT_ID=your_account_id
```

### 3. Получение токенов

```bash
# Получите свежий User Access Token из Graph API Explorer
# https://developers.facebook.com/tools/explorer/

# Затем запустите автоматизацию
./refresh-instagram-tokens.sh
```

### 4. Запуск агента

```bash
npm run dev
```

---

## 🏗️ Архитектура

### Структура плагина

```
src/instagram-plugin/
├── actions/
│   └── instagramPostAction.ts     # Обработка команд постов
├── services/
│   └── instagramService.ts        # API интеграция
├── providers/
│   └── instagramProvider.ts       # Контекстная информация
├── __tests__/
│   ├── unit/                      # Unit тесты
│   ├── integration/               # Integration тесты
│   └── e2e/                       # E2E тесты
└── README.md                      # Эта документация
```

### Компоненты

#### 1. **InstagramPostAction**

Обрабатывает команды для публикации постов.

**Триггеры:**

- `/instagram пост`
- `опубликуй в инстаграм`
- `пост в instagram`

**Пример:**

```
/instagram пост с изображением https://example.com/image.jpg и подписью Тестовая публикация #vibee
```

#### 2. **InstagramService**

Взаимодействие с Meta Graph API.

**Методы:**

- `createMediaContainer(imageUrl, caption)` - Создание медиа-контейнера
- `publishMedia(creationId)` - Публикация контента
- `checkTokenValidity()` - Проверка токена

#### 3. **parseInstagramPost()**

Извлекает структурированные данные из текста.

**Входные данные:**

```typescript
text: string
attachments?: any[]
```

**Выходные данные:**

```typescript
{
  imageUrl: string;
  caption: string;
  hashtags: string[];
}
```

**Примеры парсинга:**

```javascript
// 1. С URL в тексте
parseInstagramPost(
  "/instagram https://example.com/photo.jpg с подписью Привет",
);
// => { imageUrl: "https://...", caption: "Привет", hashtags: [] }

// 2. С вложениями
parseInstagramPost("опубликуй с подписью Тест #vibee", [
  { url: "https://..." },
]);
// => { imageUrl: "https://...", caption: "Тест #vibee", hashtags: ["vibee"] }

// 3. С хэштегами
parseInstagramPost("пост в инстаграм https://img.jpg текст #ai #test");
// => { imageUrl: "https://...", caption: "текст #ai #test", hashtags: ["ai", "test"] }
```

---

## 🔐 Настройка токенов

### Типы токенов

| Тип токена  | Срок жизни | Автообновление | Рекомендация       |
| ----------- | ---------- | -------------- | ------------------ |
| Short-lived | ~2 часа    | ❌ Нет         | ❌ Не использовать |
| Long-lived  | 60 дней    | ✅ Есть        | ✅ Рекомендуется   |

### Получение токенов (пошагово)

#### Шаг 1: Создание Facebook App

1. Зайдите на https://developers.facebook.com
2. Создайте приложение (App Type: Business)
3. Добавьте продукт **Instagram Basic Display**

#### Шаг 2: Получение App Secret

1. Settings > Basic
2. Скопируйте **App ID** и **App Secret**
3. Добавьте в `.env`:
   ```bash
   INSTAGRAM_APP_ID=your_app_id
   INSTAGRAM_APP_SECRET=your_app_secret
   ```

#### Шаг 3: Получение User Access Token

1. Откройте https://developers.facebook.com/tools/explorer/
2. Выберите ваше приложение
3. Добавьте права:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. Нажмите **"Generate Access Token"**
5. Скопируйте токен

#### Шаг 4: Конвертация в Long-lived токен

```bash
# Запустите автоматизацию
./refresh-instagram-tokens.sh
```

Скрипт автоматически:

- ✅ Конвертирует токен в long-lived (60 дней)
- ✅ Найдёт Instagram Account ID
- ✅ Обновит `.env` файл
- ✅ Протестирует токен

---

## 💡 Использование

### Команды бота

#### 1. Публикация с URL

```
/instagram пост https://example.com/image.jpg с подписью Привет из VIBEE! #ai #automation
```

#### 2. Публикация с вложением

Отправьте изображение с подписью:

```
опубликуй в инстаграм с подписью Тестовый пост
```

#### 3. Только хэштеги

```
/instagram https://img.jpg #vibee #test #ai
```

### Программное использование

```typescript
import { instagramPostAction } from "./actions/instagramPostAction";

// В вашем коде
const result = await instagramPostAction.handler(
  runtime,
  message,
  state,
  options,
  callback,
);

if (result.success) {
  console.log("Пост опубликован!", result.data);
}
```

---

## 📡 API

### Meta Graph API v18.0

#### 1. Создание медиа-контейнера

```http
POST https://graph.facebook.com/v18.0/{account_id}/media
Content-Type: application/json

{
  "image_url": "https://example.com/image.jpg",
  "caption": "Текст подписи #hashtag",
  "access_token": "..."
}
```

**Ответ:**

```json
{
  "id": "18548069389040052"
}
```

#### 2. Публикация медиа

```http
POST https://graph.facebook.com/v18.0/{account_id}/media_publish
Content-Type: application/json

{
  "creation_id": "18548069389040052",
  "access_token": "..."
}
```

**Ответ:**

```json
{
  "id": "18110822722608572"
}
```

### Требования к изображениям

| Параметр     | Требование                |
| ------------ | ------------------------- |
| Формат       | JPG, PNG                  |
| Размер файла | < 8 MB                    |
| Разрешение   | Min 320px, Max 1080px     |
| Aspect Ratio | 1:1, 4:5, 1.91:1          |
| URL          | Публично доступный, HTTPS |

---

## 🧪 Тестирование

### Unit тесты

```bash
# Запуск unit тестов
npm test src/instagram-plugin/__tests__/unit

# С покрытием
npm test -- --coverage
```

**Тесты parseInstagramPost:**

- ✅ Извлечение URL из текста
- ✅ Извлечение URL из вложений
- ✅ Парсинг команды "опубликуй"
- ✅ Обработка команды "/instagram"
- ✅ Извлечение хэштегов
- ✅ Default caption для пустых постов
- ✅ Обработка длинных подписей
- ✅ Очистка лишних пробелов

### Integration тесты

```bash
# Запуск integration тестов
npm test src/instagram-plugin/__tests__/integration
```

**Тесты сервиса:**

- ✅ Создание медиа-контейнера
- ✅ Публикация медиа
- ✅ Проверка токена

### E2E тесты

```bash
# Тест с реальным API (требуется токен)
node test-instagram-e2e.js

# Финальный тест с правильным изображением
node test-instagram-final.js
```

**Ожидаемый результат:**

```
🎉 УСПЕХ! ПОСТ ОПУБЛИКОВАН!
📍 Post ID: 18110822722608572
🔗 Смотреть: https://www.instagram.com/p/18110822722608572/
```

---

## 🔄 Автоматизация

### Автоматическая проверка токенов

При каждом запуске агента:

```bash
npm run dev
```

Автоматически запускается `check-instagram-token.js`:

```
🔍 Проверяем валидность Instagram токена...

✅ Токен действителен!
   Аккаунт: VIBEE (@vibee_official)
   ID: 17841401201538156

⏰ Токен истекает через: 55 дней

🎉 Instagram токен в порядке!
```

### Обновление токенов (раз в 60 дней)

```bash
./refresh-instagram-tokens.sh
```

Скрипт автоматически:

1. ✅ Проверит текущий токен
2. ✅ Получит long-lived токен (60 дней)
3. ✅ Найдёт Instagram Account ID
4. ✅ Обновит `.env` файл
5. ✅ Протестирует новый токен

### График обновления

```
День 0   → Получение long-lived токена
         ↓
День 1-55 → Агент работает автоматически ✅
         ↓
День 55  → Предупреждение об истечении ⚠️
         ↓
День 60  → Токен истекает ❌
         ↓
День 61  → ./refresh-instagram-tokens.sh
         ↓
День 62+ → Работает ещё 60 дней ✅
```

---

## 🔧 Troubleshooting

### Частые проблемы

#### 1. Токен истёк

**Симптомы:**

```
❌ Токен истек или недействителен!
   Ошибка: Session has expired
```

**Решение:**

```bash
# 1. Получите свежий токен из Graph API Explorer
# 2. Запустите обновление
./refresh-instagram-tokens.sh
```

#### 2. Aspect ratio not supported

**Симптомы:**

```
❌ The aspect ratio is not supported.
```

**Решение:**
Используйте изображения с поддерживаемыми соотношениями:

- Квадрат: 1:1 (рекомендуется)
- Портрет: 4:5
- Ландшефт: 1.91:1

#### 3. Не удалось скачать медиафайл

**Симптомы:**

```
❌ Не удалось скачать медиафайл. Его URI не соответствует нашим требованиям.
```

**Решение:**

- Убедитесь, что URL публично доступен
- Используйте HTTPS (не HTTP)
- Избегайте redirect URLs (picsum.photos и подобные)
- Используйте прямые ссылки на изображения

#### 4. Instagram Business аккаунт не найден

**Симптомы:**

```
❌ Instagram Business аккаунты не найдены
```

**Решение:**

1. Убедитесь, что ваш Instagram профиль переключён на **Business** аккаунт
2. Привяжите Instagram к Facebook Page
3. Выдайте необходимые права в Graph API Explorer:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`

### Debug режим

```bash
# Включите подробное логирование
LOG_LEVEL=debug npm run dev

# Проверка токена вручную
node check-instagram-token.js

# Тест публикации
node test-instagram-final.js
```

---

## 📚 Дополнительные ресурсы

### Документация

- [INSTAGRAM_TOKENS_AUTOMATION.md](../../INSTAGRAM_TOKENS_AUTOMATION.md) - Полная автоматизация токенов
- [QUICKSTART_INSTAGRAM.md](../../QUICKSTART_INSTAGRAM.md) - Быстрый старт
- [GET_FRESH_TOKEN.md](../../GET_FRESH_TOKEN.md) - Получение токенов

### Скрипты

- `check-instagram-token.js` - Проверка токенов
- `instagram-token-manager.js` - Управление токенами
- `refresh-instagram-tokens.sh` - Скрипт обновления
- `test-instagram-e2e.js` - E2E тест
- `test-instagram-final.js` - Финальный тест

### Внешние ресурсы

- [Meta Graph API Documentation](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api)
- [Facebook Developers Console](https://developers.facebook.com)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'feat: Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

### Code Style

- TypeScript со строгой типизацией
- Отступы: 2 пробела
- Точка с запятой обязательна
- Одинарные кавычки для строк
- Функциональный стиль предпочтительнее

---

## 📄 Лицензия

MIT License - see LICENSE file for details

---

## 🙋 Поддержка

Если возникли вопросы:

1. Проверьте [Troubleshooting](#-troubleshooting)
2. Прочитайте [документацию](#-дополнительные-ресурсы)
3. Создайте [Issue](https://github.com/your-repo/issues)

---

**Дата последнего обновления:** 2025-11-21
**Версия:** 1.0.0
**Статус:** ✅ Production Ready
