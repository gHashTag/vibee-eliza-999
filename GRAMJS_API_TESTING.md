# GramJS API - Список тестирования функциональности

## 🎯 Цель
Проверить работу всех возможностей GramJS (Telegram MTProto) API согласно документации.

---

## 📋 ToDoList - Проверка функциональности

### 1. ПОДКЛЮЧЕНИЕ
- [ ] **Подключение как БОТ** (через токен)
  - [ ] Установка соединения
  - [ ] Аутентификация
  - [ ] Получение информации о боте
  - [ ] Обработка ошибок аутентификации

- [ ] **Подключение как ПОЛЬЗОВАТЕЛЬ** (через API_ID, API_HASH, телефон)
  - [ ] Ввод кода подтверждения
  - [ ] Получение пароля 2FA (если есть)
  - [ ] Сохранение сессии
  - [ ] Получение информации о пользователе

- [ ] **Подключение с СЕССИЕЙ** (через session string)
  - [ ] Восстановление сессии
  - [ ] Проверка валидности сессии
  - [ ] Обновление сессии

---

### 2. СОБЫТИЯ (Events) - СЛУШАНИЕ

#### ✅ NewMessage - Новые сообщения
- [ ] **Входящие сообщения**
  - [ ] Приватные чаты (DM)
  - [ ] Групповые чаты
  - [ ] Каналы
  - [ ] Супергруппы

- [ ] **Исходящие сообщения**
  - [ ] Отправленные ботом
  - [ ] Редактированные ботом

- [ ] **Фильтры**
  - [ ] По типу чата (isPrivate, isGroup, isChannel)
  - [ ] По отправителю (fromUsers)
  - [ ] По тексту (pattern)
  - [ ] По чатам (chats, blacklistChats)
  - [ ] Кастомная функция (func)

- [ ] **Свойства события**
  - [ ] event.isPrivate
  - [ ] event.isGroup
  - [ ] event.isChannel
  - [ ] event.message
  - [ ] event.chatId
  - [ ] event.getChat()
  - [ ] event.getSender()

#### ✅ EditedMessage - Редактирование
- [ ] Отслеживание изменений текста
- [ ] Получение даты редактирования (editDate)
- [ ] Получение оригинального текста
- [ ] Определение чата и отправителя

#### ✅ DeletedMessage - Удаление
- [ ] Отслеживание удаленных сообщений
- [ ] Получение списка удаленных сообщений
- [ ] Получение информации о чате
- [ ] Определение причины удаления (если возможно)

#### ✅ CallbackQuery - Inline кнопки
- [ ] Получение data из кнопки
- [ ] Получение sender
- [ ] Получение message
- [ ] Ответ на callback query
- [ ] Отображение уведомления

#### ✅ Album - Медиа-альбомы
- [ ] Отслеживание альбомов
- [ ] Получение списка сообщений в альбоме
- [ ] Определение типа медиа
- [ ] Обработка смешанных альбомов (фото + видео)

#### ✅ Raw Events - Сырые MTProto updates
- [ ] UpdateNewMessage
- [ ] UpdateShortMessage
- [ ] UpdateUserStatus
- [ ] UpdateUserTyping
- [ ] UpdateMessageID
- [ ] UpdateReadMessages
- [ ] UpdateReadMessagesContents
- [ ] UpdateWebPage
- [ ] UpdateBotCallbackQuery
- [ ] UpdateInlineBotCallbackQuery
- [ ] UpdateEditMessage
- [ ] UpdateDeleteMessages
- [ ] UpdateUserTyping
- [ ] UpdateChatUserTyping
- [ ] UpdateChannelUserTyping
- [ ] UpdateEncryption
- [ ] UpdateNewEncryptedMessage
- [ ] UpdateEncryptedMessagesRead
- [ ] UpdateChatParticipantAdd
- [ ] UpdateChatParticipantDelete
- [ ] UpdateDcOptions
- [ ] UpdateNotifySettings
- [ ] UpdateOtherData
- [ ] UpdateServiceNotification
- [ ] UpdatePrivacy
- [ ] UpdatePhoneCall
- [ ] UpdateChannel
- [ ] UpdateChannelGroup
- [ ] UpdateReadChannelInbox
- [ ] UpdateReadChannelOutbox
- [ ] UpdateChannelReadMessagesContents
- [ ] UpdateDialogPinned
- [ ] UpdatePinnedDialogs
- [ ] UpdateBotWebhookQuery
- [ ] UpdateBotSendMessage
- [ ] UpdateBotInlineQuery
- [ ] UpdateBotInlineSend
- [ ] UpdateEditChannelMessage
- [ ] UpdateChannelPinnedMessage
- [ ] UpdateBotCallbackQuery

---

### 3. ОПЕРАЦИИ С СООБЩЕНИЯМИ

#### ✅ Отправка
- [ ] **sendMessage()**
  - [ ] Обычное текстовое сообщение
  - [ ] Сообщение с форматированием (HTML, Markdown)
  - [ ] Сообщение с кнопками (InlineKeyboard)
  - [ ] Сообщение в приватный чат
  - [ ] Сообщение в группу
  - [ ] Сообщение в канал
  - [ ] Ответ на сообщение (reply_to)
  - [ ] Пересылка сообщения

- [ ] **sendFile() / sendMedia()**
  - [ ] Изображение
  - [ ] Видео
  - [ ] Аудио
  - [ ] Документ
  - [ ] Голосовое сообщение
  - [ ] Стикер
  - [ ] GIF
  - [ ] Альбом (группа медиа)

#### ✅ Редактирование
- [ ] **editMessage()**
  - [ ] Изменение текста
  - [ ] Замена медиа
  - [ ] Удаление кнопок
  - [ ] Добавление кнопок

#### ✅ Удаление
- [ ] **deleteMessages()**
  - [ ] Удаление одного сообщения
  - [ ] Удаление нескольких сообщений
  - [ ] Удаление для всех (revoke)
  - [ ] Удаление только для себя

#### ✅ Дополнительные операции
- [ ] **forwardMessages()**
- [ ] **pinMessage() / unpinMessage()**
- [ ] **markAsRead()**
- [ ] **getMessage()**

---

### 4. ОПЕРАЦИИ С ДИАЛОГАМИ

#### ✅ Получение диалогов
- [ ] **getDialogs()**
  - [ ] Все диалоги
  - [ ] С пагинацией
  - [ ] С фильтрами
  - [ ] По дате

- [ ] **iterDialogs()**
  - [ ] Итерация по всем диалогам
  - [ ] Преждевременное прерывание
  - [ ] С фильтрами

#### ✅ Информация о диалоге
- [ ] Получение заголовка
- [ ] Получение типа (приват/группа/канал)
- [ ] Получение участников
- [ ] Получение последнего сообщения
- [ ] Получение количества непрочитанных
- [ ] Получение закрепленных сообщений

---

### 5. ОПЕРАЦИИ С ПОЛЬЗОВАТЕЛЯМИ

#### ✅ Текущий пользователь
- [ ] **getMe()**
  - [ ] ID
  - [ ] Username
  - [ ] First name
  - [ ] Last name
  - [ ] Phone number
  - [ ] Bio
  - [ ] Фото профиля

#### ✅ Получение пользователей
- [ ] **getEntity()**
  - [ ] По username
  - [ ] По ID
  - [ ] По номеру телефона
  - [ ] Из ссылки

- [ ] **getUsers()**
  - [ ] Получение списка пользователей
  - [ ] Получение дополнительной информации

#### ✅ Работа с контактами
- [ ] **getContacts()**
- [ ] **addContact()**
- [ ] **deleteContact()**
- [ ] **blockUser()**
- [ ] **unblockUser()**
- [ ] **getBlocked()**

---

### 6. ОПЕРАЦИИ С ЧАТАМИ

#### ✅ Группы и каналы
- [ ] **getParticipants()**
  - [ ] Все участники
  - [ ] Администраторы
  - [ ] Забаненные
  - [ ] С пагинацией
  - [ ] С фильтрами

#### ✅ Управление участниками
- [ ] **kickParticipant()**
- [ ] **inviteParticipant()**
- [ ] **setParticipantPermission()**
- [ ] **setParticipantAdmin()**

#### ✅ Настройки чата
- [ ] **setTitle()**
- [ ] **setDescription()**
- [ ] **setPhoto()**
- [ ] **setUsername()**
- [ ] **setInviteLink()**
- [ ] **exportInviteLink()**

---

### 7. ОПЕРАЦИИ С ФАЙЛАМИ

#### ✅ Загрузка (download)
- [ ] **downloadMedia()**
  - [ ] Изображения
  - [ ] Видео
  - [ ] Аудио
  - [ ] Документы
  - [ ] С прогресс-баром
  - [ ] С проверкой целостности

#### ✅ Отправка (upload)
- [ ] **uploadFile()**
  - [ ] Из файла
  - [ ] Из потока (stream)
  - [ ] Из буфера (buffer)
  - [ ] С прогресс-баром

---

### 8. СПЕЦИАЛЬНЫЕ ВОЗМОЖНОСТИ

#### ✅ Bot API
- [ ] **setBotCommands()** - установка команд бота
- [ ] **getBotCommands()** - получение команд бота
- [ ] **setBotMenuButton()** - настройка меню бота
- [ ] **getBotMenuButton()** - получение настроек меню

#### ✅ Inline режим
- [ ] **startBot()** - запуск бота
- [ ] **setInlineBot()** - настройка inline режима
- [ ] **getInlineBotResults()** - получение результатов inline

#### ✅ Стикеры
- [ ] **getStickerSet()** - получение набора стикеров
- [ ] **getAllStickers()** - все стикеры
- [ ] **uploadSticker()** - загрузка стикера
- [ ] **createStickerSet()** - создание набора

---

### 9. БЕЗОПАСНОСТЬ И ПРОИЗВОДИТЕЛЬНОСТЬ

#### ✅ Обработка ошибок
- [ ] **FloodWait** - обработка ограничений API
- [ ] **TimeoutError** - таймауты соединения
- [ ] **ServerError** - ошибки сервера
- [ ] **AuthKeyError** - ошибки аутентификации
- [ ] **Сетевые ошибки** - переподключение

#### ✅ Настройки производительности
- [ ] **connectionRetries** - количество попыток подключения
- [ ] **retryDelay** - задержка между попытками
- [ ] **timeout** - таймаут запросов
- [ ] **autoReconnect** - автоматическое переподключение

#### ✅ Логирование
- [ ] **verbose logging** - подробное логирование
- [ ] **error logging** - логирование ошибок
- [ ] **event logging** - логирование событий
- [ ] **custom logger** - свой логгер

---

### 10. СОВМЕСТИМОСТЬ

#### ✅ Telegram API версии
- [ ] API Layer 152 (MTProto 1.0)
- [ ] API Layer 153 (MTProto 2.0)
- [ ] API Layer 154+
- [ ] Автоматическое обновление

#### ✅ MTProto версии
- [ ] MTProto 1.0 (Telegram Desktop)
- [ ] MTProto 2.0 (новые клиенты)
- [ ] Автоматическое переключение

---

## 📊 Скрипт тестирования

**Файл:** `/Users/playra/vibee-agent/test-gramjs-api.js`

**Запуск:**
```bash
# Установить зависимости
npm install telegram string-session

# Настроить переменные окружения
export TELEGRAM_BOT_TOKEN=your_bot_token
# или
export TELEGRAM_API_ID=your_api_id
export TELEGRAM_API_HASH=your_api_hash
export TELEGRAM_PHONE=your_phone
export TELEGRAM_SESSION_STRING=your_session_string

# Запустить тест
node test-gramjs-api.js
```

**Выходные файлы:**
- `gramjs-test-log.txt` - полный лог всех событий
- Консольный вывод счетчиков каждые 30 секунд
- Статистика по типам событий

---

## 🎯 Критерии успеха

### ✅ КРИТИЧЕСКИ ВАЖНО (Должно работать):
1. Подключение к Telegram API
2. Получение событий NewMessage
3. Определение типа чата (isPrivate, isGroup, isChannel)
4. Отправка сообщений
5. Обработка базовых ошибок

### ⚡ ЖЕЛАТЕЛЬНО (Хорошо бы работало):
1. Все типы событий
2. Операции с файлами
3. Inline кнопки
4. Работа с группами и каналами
5. Работа с медиа

### 💡 ДОПОЛНИТЕЛЬНО (Если останется время):
1. Все Raw события
2. Bot API функции
3. Управление чатами
4. Продвинутые возможности

---

## 📝 Инструкция по тестированию

1. **Запустить скрипт** с настроенными переменными окружения
2. **Отправлять сообщения** боту/аккаунту
3. **Проверять логи** в `gramjs-test-log.txt`
4. **Отмечать в чек-листе** что работает, а что нет
5. **Проверить счетчики** каждые 30 секунд
6. **Сообщить результаты** - что функционирует согласно документации

**На тестирование уйдет примерно 10-15 минут активного общения с ботом/аккаунтом.**

---

## ⚠️ Известные проблемы

- **GramJS работает ТОЛЬКО с личными аккаунтами, не с ботами** (bot token не поддерживается)
- Нужны API_ID и API_HASH от https://my.telegram.org
- Нужен номер телефона для подтверждения
- После первого входа генерируется session string для последующих подключений

---

## 📚 Полезные ссылки

- [GramJS GitHub](https://github.com/whiskeysockets/GramJS)
- [GramJS Documentation](https://gram.js.org/)
- [Telegram API](https://core.telegram.org/api)
- [Получение API_ID и API_HASH](https://my.telegram.org)

---

## 🚀 План тестирования

1. **Шаг 1:** Настроить подключение (получить API_ID, API_HASH, session string)
2. **Шаг 2:** Запустить скрипт и начать отправлять сообщения
3. **Шаг 3:** Проверить логи и счетчики
4. **Шаг 4:** Отметить работающие функции в чек-листе
5. **Шаг 5:** Сообщить результаты для финального отчета

**Готово к тестированию! 🎉**
