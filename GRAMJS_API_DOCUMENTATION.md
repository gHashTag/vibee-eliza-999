# 📚 GramJS TelegramClient API - Полная документация

## 🎯 Краткий обзор

GramJS - это полноценная JavaScript библиотека для работы с Telegram MTProto API. Позволяет:
- ✅ Подключаться как пользователь или бот
- ✅ Слушать все типы событий (сообщения, редактирование, удаление)
- ✅ Отправлять сообщения, медиа, файлы
- ✅ Работать с диалогами, группами, каналами
- ✅ Управлять участниками чатов

---

## 🔧 Инициализация клиента

### Конструктор
```typescript
new TelegramClient(session: string | Session, apiId: number, apiHash: string, clientParams: TelegramClientParams)
```

**Параметры:**
- `session` - сессия для сохранения ключей подключения
- `apiId` - ID приложения из https://my.telegram.org
- `apiHash` - хеш приложения из https://my.telegram.org
- `clientParams` - дополнительные настройки клиента

**Пример:**
```javascript
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const client = new TelegramClient(
    new StringSession(''),  // пустая сессия
    123456,                 // API ID
    "abcd1234",            // API Hash
    {}                      // параметры клиента
);
```

---

## 🔌 Подключение и авторизация

### 1. **start()** - Основной метод подключения
```typescript
await client.start(authParams: UserAuthParams | BotAuthParams): Promise<void>
```

**Для бота:**
```javascript
await client.start({
    botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
});
```

**Для пользователя:**
```javascript
await client.start({
    phoneNumber: async () => "+123456789",
    password: async () => "password",
    phoneCode: async () => "12345",
    onError: (err) => console.log(err)
});
```

**Возвращает:** `Promise<void>`

---

### 2. **checkAuthorization()** - Проверка авторизации
```typescript
await client.checkAuthorization(): Promise<boolean>
```

**Проверяет:**
- Подключен ли клиент к серверам Telegram
- Авторизован ли как пользователь или бот

**Возвращает:**
- `true` - авторизован
- `false` - подключен, но не авторизован

**Пример:**
```javascript
await client.connect();
if (await client.checkAuthorization()) {
    console.log("Авторизован!");
} else {
    console.log("Нужна авторизация");
}
```

---

### 3. **signInUser()** - Вход как пользователь
```typescript
await client.signInUser(apiCredentials: ApiCredentials, authParams: UserAuthParams): Promise<TypeUser>
```

**Параметры:**
```javascript
{
    apiId: number,
    apiHash: string
}
```

**Аналогичен `start()`, но без проверки авторизации.**

---

### 4. **signInUserWithQrCode()** - QR код авторизация
```typescript
await client.signInUserWithQrCode(apiCredentials: ApiCredentials, authParams: QrCodeAuthParams): Promise<TypeUser>
```

**Генерирует QR код для сканирования мобильным приложением.**

---

### 5. **sendCode()** - Отправка кода подтверждения
```typescript
await client.sendCode(apiCredentials: ApiCredentials, phoneNumber: string, forceSMS?: boolean): Promise<{ phoneCodeHash: string, isCodeViaApp: boolean }>
```

**Параметры:**
- `phoneNumber` - номер телефона в формате "+123456789"
- `forceSMS` - принудительно отправить SMS

**Возвращает:**
- `phoneCodeHash` - хеш для подтверждения кода
- `isCodeViaApp` - true если код через приложение, false если через SMS

---

### 6. **signInWithPassword()** - Вход с 2FA паролем
```typescript
await client.signInWithPassword(apiCredentials: ApiCredentials, authParams: UserPasswordAuthParams): Promise<TypeUser>
```

**Используется после ввода кода подтверждения, если включена двухфакторная аутентификация.**

---

### 7. **signInBot()** - Вход как бот
```typescript
await client.signInBot(apiCredentials: ApiCredentials, authParams: BotAuthParams): Promise<TypeUser>
```

**Параметры:**
```javascript
{
    botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
}
```

**⚠️ ВАЖНО:** GramJS НЕ ПОДДЕРЖИВАЕТ ботов! Этот метод не работает в текущей версии.

---

## 💬 Работа с сообщениями

### 8. **sendMessage()** - Отправка сообщения
```typescript
await client.sendMessage(entity: EntityLike, params?: SendMessageParams): Promise<Message>
```

**Параметры:**
```javascript
{
    message: string,           // текст сообщения
    parseMode?: "md"|"html",  // режим парсинга
    buttons?: ButtonLike,      // кнопки
    replyTo?: MessageIDLike,   // ID сообщения для ответа
    schedule?: number          // Unix timestamp для отложенной отправки
}
```

**Примеры:**
```javascript
// Простое сообщение
await client.sendMessage("me", { message: "Привет!" });

// С форматированием
await client.sendMessage("me", { message: "Жирный **текст**" });

// С HTML
client.setParseMode("html");
await client.sendMessage("me", { message: '<b>Жирный</b> текст' });

// С кнопками
import { Button } from "telegram/tl/custom/button";
await client.sendMessage("me", {
    message: "Нажми кнопку!",
    buttons: [Button.inline("Привет!")]
});

// Отложенное сообщение
await client.sendMessage("me", {
    message: "Отложенное сообщение",
    schedule: Math.floor(Date.now() / 1000) + 300 // через 5 минут
});
```

---

### 9. **iterMessages()** - Получение сообщений (итератор)
```typescript
await client.iterMessages(entity: EntityLike, params?: IterMessagesParams): _MessagesIter
```

**Параметры:**
```javascript
{
    limit?: number,        // количество сообщений (undefined = все)
    reverse?: boolean,     // обратный порядок (новые -> старые)
    search?: string,       // поиск по тексту
    filter?: Api.InputMessagesFilter, // фильтр по типу
    fromUser?: EntityLike, // от кого сообщения
    minId?: number,        // минимальный ID
    maxId?: number         // максимальный ID
}
```

**Примеры:**
```javascript
// Последние 10 сообщений
for await (const message of client.iterMessages("me", { limit: 10 })) {
    console.log(message.id, message.text);
}

// Все сообщения от пользователя
for await (const message of client.iterMessages("me", { fromUser: "username" })) {
    console.log(message.text);
}

// Поиск
for await (const message of client.iterMessages("me", { search: "привет" })) {
    console.log(message.text);
}

// Только фото
import { Api } from "telegram";
for await (const message of client.iterMessages("me", { filter: Api.InputMessagesFilterPhotos })) {
    console.log("Фото:", message.photo);
}
```

---

### 10. **getMessages()** - Получение сообщений (массив)
```typescript
await client.getMessages(entity: EntityLike, params?: IterMessagesParams): Promise<TotalList<Message>>
```

**Аналогичен `iterMessages()`, но возвращает массив с дополнительным полем `.total` (общее количество).**

---

### 11. **editMessage()** - Редактирование сообщения
```typescript
await client.editMessage(entity: EntityLike, params: EditMessageParams): Promise<Message>
```

**Параметры:**
```javascript
{
    message: Message | MessageIDLike,  // сообщение для редактирования
    text?: string,                     // новый текст
    media?: TypeMessageMedia,          // новое медиа
    buttons?: ButtonLike               // новые кнопки
}
```

**Пример:**
```javascript
const msg = await client.sendMessage("me", { message: "Старый текст" });
await client.editMessage("me", { message: msg, text: "Новый текст" });
```

**⚠️ Ограничения:**
- Можно редактировать только свои сообщения
- Нельзя редактировать сообщения старше 48 часов

---

### 12. **deleteMessages()** - Удаление сообщений
```typescript
await client.deleteMessages(entity: EntityLike, messageIds: MessageIDLike[], params?: { revoke?: boolean }): Promise<AffectedMessages[]>
```

**Параметры:**
- `revoke` - удалить для всех (true) или только для себя (false, по умолчанию)

**Примеры:**
```javascript
// Удалить одно сообщение
await client.deleteMessages("me", [12345]);

// Удалить несколько
await client.deleteMessages("me", [12345, 12346, 12347]);

// Удалить для всех
await client.deleteMessages("me", [12345], { revoke: true });
```

---

### 13. **forwardMessages()** - Пересылка сообщений
```typescript
await client.forwardMessages(entity: EntityLike, params: ForwardMessagesParams): Promise<Message[]>
```

**Параметры:**
```javascript
{
    messages: Message | MessageIDLike | (Message | MessageIDLike)[],
    fromPeer: EntityLike,
    dropAuthor?: boolean,  // убрать "переслано от"
    silent?: boolean       // без уведомления
}
```

**Пример:**
```javascript
const msg = await client.getMessages("me", { ids: 12345 });
await client.forwardMessages("username", { messages: msg, fromPeer: "me" });
```

---

### 14. **pinMessage()** - Закрепить сообщение
```typescript
await client.pinMessage(entity: EntityLike, message?: MessageIDLike, params?: UpdatePinMessageParams): Promise<Message>
```

**Пример:**
```javascript
const msg = await client.sendMessage("me", { message: "Закрепленное" });
await client.pinMessage("me", msg);
```

---

### 15. **unpinMessage()** - Открепить сообщение
```typescript
await client.unpinMessage(entity: EntityLike, message?: MessageIDLike): Promise<AffectedHistory>
```

**Пример:**
```javascript
// Открепить одно
await client.unpinMessage("me", msg);

// Открепить все
await client.unpinMessage("me");
```

---

### 16. **markAsRead()** - Отметить как прочитанное
```typescript
await client.markAsRead(entity: EntityLike, message?: MessageIDLike): Promise<boolean>
```

**Пример:**
```javascript
await client.markAsRead("me", 12345);
```

---

## 📁 Работа с файлами и медиа

### 17. **downloadMedia()** - Скачивание медиа
```typescript
await client.downloadMedia(messageOrMedia: Message | TypeMessageMedia, params?: DownloadMediaInterface): Promise<Buffer | string | undefined>
```

**Параметры:**
```javascript
{
    outputFile?: string,           // путь для сохранения
    progressCallback?: (progress) => void  // колбэк прогресса
}
```

**Примеры:**
```javascript
// Скачать фото в буфер
const buffer = await client.downloadMedia(message);
console.log(buffer);

// Скачать в файл
await client.downloadMedia(message, { outputFile: "photo.jpg" });

// С прогрессом
await client.downloadMedia(message, {
    progressCallback: (progress) => {
        console.log(`Загружено: ${progress}%`);
    }
});
```

---

### 18. **uploadFile()** - Загрузка файла
```typescript
await client.uploadFile(params: UploadFileParams): Promise<InputFile | InputFileBig>
```

**Пример:**
```javascript
import { CustomFile } from "telegram/client/uploads";

const file = new CustomFile("photo.jpg", fs.statSync("photo.jpg").size, "photo.jpg");
const uploaded = await client.uploadFile({ file });

// Использование в сообщении
await client.sendFile("me", { file: uploaded, caption: "Фото" });
```

---

### 19. **sendFile()** - Отправка файла
```typescript
await client.sendFile(entity: EntityLike, params: SendFileInterface): Promise<Message>
```

**Параметры:**
```javascript
{
    file: string | Buffer | CustomFile,  // файл
    caption?: string,                    // подпись
    forceDocument?: boolean,             // как документ
    voiceNote?: boolean,                 // голосовое
    videoNote?: boolean,                 // видео-сообщение
    buttons?: ButtonLike,                // кнопки
    thumb?: string                       // превью
}
```

**Примеры:**
```javascript
// Изображение
await client.sendFile("me", { file: "photo.jpg", caption: "Моё фото" });

// Документ
await client.sendFile("me", { file: "document.pdf", forceDocument: true });

// Голосовое
await client.sendFile("me", { file: "audio.mp3", voiceNote: true });
```

---

## 💬 Работа с диалогами

### 20. **iterDialogs()** - Итерация по диалогам
```typescript
await client.iterDialogs(params?: IterDialogsParams): _DialogsIter
```

**Параметры:**
```javascript
{
    limit?: number,
    archived?: boolean,    // только архивные
    folder?: number        // папка (0 = обычные, 1 = архив)
}
```

**Пример:**
```javascript
for await (const dialog of client.iterDialogs()) {
    console.log(`${dialog.id}: ${dialog.title}`);
    // Использование
    await client.sendMessage(dialog, { message: "Привет!" });
}
```

---

### 21. **getDialogs()** - Получение диалогов (массив)
```typescript
await client.getDialogs(params?: IterDialogsParams): Promise<TotalList<Dialog>>
```

**Аналогичен `iterDialogs()`, но возвращает массив.**

---

## 👥 Работа с участниками

### 22. **iterParticipants()** - Итерация по участникам
```typescript
await client.iterParticipants(entity: EntityLike, params?: IterParticipantsParams): _ParticipantsIter
```

**Параметры:**
```javascript
{
    search?: string,           // поиск по имени
    filter?: Api.ChannelParticipantsFilter, // фильтр
    limit?: number
}
```

**Примеры:**
```javascript
// Все участники
for await (const user of client.iterParticipants(chat)) {
    console.log(user.id, user.username);
}

// Поиск
for await (const user of client.iterParticipants(chat, { search: "Ivan" })) {
    console.log(user.firstName);
}

// Только админы
import { Api } from "telegram";
for await (const user of client.iterParticipants(chat, {
    filter: Api.ChannelParticipantsAdmins
})) {
    console.log(user.firstName, "админ");
}
```

---

### 23. **getParticipants()** - Получение участников (массив)
```typescript
await client.getParticipants(entity: EntityLike, params?: IterParticipantsParams): Promise<TotalList<User>>
```

**Аналогичен `iterParticipants()`, но возвращает массив.**

---

## 🎣 События (Event Handlers)

### 24. **addEventHandler()** - Добавление обработчика
```typescript
client.addEventHandler(callback: Function, event: EventBuilder): void
```

**Типы событий:**
- `NewMessage` - новые сообщения
- `EditedMessage` - редактирование
- `DeletedMessage` - удаление
- `CallbackQuery` - inline кнопки
- `Album` - альбомы
- `Raw` - сырые события

**Примеры:**
```javascript
import { NewMessage, EditedMessage, DeletedMessage, CallbackQuery, Album } from "telegram/events";

// Обработчик новых сообщений
client.addEventHandler(async (event) => {
    const message = event.message;
    const chat = await event.getChat();

    console.log("Сообщение в", chat.title || chat.id);
    console.log("От:", message.senderId);
    console.log("Текст:", message.text);

    // Определение типа чата
    console.log("isPrivate:", event.isPrivate);
    console.log("isGroup:", event.isGroup);
    console.log("isChannel:", event.isChannel);

    // Автоответ на команду
    if (message.text === "/ping") {
        await client.sendMessage(chat, { message: "PONG!" });
    }
}, new NewMessage({ incoming: true, outgoing: true }));

// Обработчик редактирования
client.addEventHandler(async (event) => {
    console.log("Сообщение отредактировано:", event.message.text);
}, new EditedMessage({}));

// Обработчик удаления
client.addEventHandler(async (event) => {
    console.log("Удалено сообщений:", event.messages.length);
}, new DeletedMessage({}));

// Обработчик inline кнопок
client.addEventHandler(async (event) => {
    const query = event.query;
    const sender = await event.getSender();
    console.log("Клик от:", sender.username);
    console.log("Data:", query.data);

    // Ответ на callback
    await event.answer("Кнопка нажата!");
}, new CallbackQuery({}));

// Обработчик альбомов
client.addEventHandler(async (event) => {
    console.log("Альбом из", event.album.length, "медиа");
}, new Album({}));

// Сырые события (все MTProto updates)
client.addEventHandler(async (event) => {
    console.log("Сырое событие:", event.constructor.name);
}, new Raw({}));
```

---

### 25. **removeEventHandler()** - Удаление обработчика
```typescript
client.removeEventHandler(callback: Function, event: EventBuilder): void
```

---

### 26. **listEventHandlers()** - Список обработчиков
```typescript
client.listEventHandlers(): [EventBuilder, Function][]
```

---

## 🤖 Работа с ботом (Bot API)

### 27. **inlineQuery()** - Inline запросы
```typescript
await client.inlineQuery(bot: EntityLike, query: string, entity?: InputPeerSelf, offset?: string): Promise<InlineResults>
```

**Эквивалент написания @bot в чате.**

**Пример:**
```javascript
const results = await client.inlineQuery("pic", "кот");
await results[0].click(); // кликнуть по первому результату
```

---

### 28. **buildReplyMarkup()** - Создание кнопок
```typescript
client.buildReplyMarkup(buttons: ButtonLike | ButtonLike[][], inlineOnly?: boolean): TypeReplyMarkup
```

**Пример:**
```javascript
import { Button } from "telegram/tl/custom/button";

// Inline кнопки
const markup = client.buildReplyMarkup([
    [Button.inline("Кнопка 1"), Button.inline("Кнопка 2")],
    [Button.inline("Кнопка 3")]
]);

await client.sendMessage("me", {
    message: "Выберите:",
    buttons: markup
});

// Reply клавиатура
const replyMarkup = client.buildReplyMarkup([
    [Button.text("Да", true), Button.text("Нет", false)]
]);

await client.sendMessage("me", {
    message: "Ответьте:",
    buttons: replyMarkup
});
```

---

## 📊 Информация о пользователе/боте

### 29. **getMe()** - Информация о себе
```typescript
await client.getMe(inputPeer?: boolean): Promise<User | InputPeerUser>
```

**Пример:**
```javascript
const me = await client.getMe();
console.log("ID:", me.id);
console.log("Имя:", me.firstName);
console.log("Фамилия:", me.lastName);
console.log("Username:", me.username);
console.log("Телефон:", me.phoneNumber);
console.log("Био:", me.bio);
```

---

### 30. **isBot()** - Проверка бота
```typescript
await client.isBot(): Promise<boolean | undefined>
```

**Возвращает:**
- `true` - бот
- `false` - пользователь
- `undefined` - не авторизован

---

### 31. **isUserAuthorized()** - Проверка авторизации
```typescript
await client.isUserAuthorized(): Promise<boolean>
```

---

## 🔍 Работа с сущностями

### 32. **getEntity()** - Получение сущности
```typescript
await client.getEntity(entity: EntityLike): Promise<Entity>
```

**Преобразует строку, ID, username в объект Entity.**

**Примеры:**
```javascript
// По username
const user = await client.getEntity("username");

// По ID
const chat = await client.getEntity(-123456789);

// По телефону
const contact = await client.getEntity("+123456789");

// По ссылке
const channel = await client.getEntity("https://t.me/channel");
```

---

### 33. **getInputEntity()** - Получение InputEntity
```typescript
await client.getInputEntity(entity: EntityLike): Promise<TypeInputPeer>
```

**Для частого использования одной сущности.**

**Пример:**
```javascript
// Получаем один раз
const user = await client.getInputEntity("username");

// Используем много раз
for await (const message of client.iterMessages(user)) {
    console.log(message.text);
}
```

---

### 34. **getPeerId()** - Получение ID
```typescript
await client.getPeerId(peer: EntityLike, addMark?: boolean): Promise<string>
```

**Получает ID сущности в виде строки.**

**Пример:**
```javascript
const peerId = await client.getPeerId("username");
console.log(peerId); // "123456789"
```

---

## 🔌 Управление подключением

### 35. **connect()** - Подключение
```typescript
await client.connect(): Promise<boolean>
```

**Пример:**
```javascript
await client.connect();
console.log("Подключен!");
```

---

### 36. **disconnect()** - Отключение
```typescript
await client.disconnect(): Promise<void>
```

---

### 37. **getDC()** - Получение DC
```typescript
await client.getDC(dcId: number, downloadDC?: boolean): Promise<{ id: number, ipAddress: string, port: number }>
```

**Получает информацию о дата-центре.**

---

### 38. **setLogLevel()** - Уровень логирования
```typescript
client.setLogLevel(level: LogLevel): void
```

**Уровни:**
- `LogLevel.NONE` - без логов
- `LogLevel.ERROR` - только ошибки
- `LogLevel.WARN` - предупреждения и ошибки
- `LogLevel.INFO` - информация, предупреждения, ошибки
- `LogLevel.DEBUG` - всё

---

## ⚙️ Настройки

### 39. **setParseMode()** - Установка режима парсинга
```typescript
client.setParseMode(mode: "md" | "html" | undefined): void
```

**Примеры:**
```javascript
// Markdown
client.setParseMode("md");
await client.sendMessage("me", { message: "Жирный **текст**" });

// HTML
client.setParseMode("html");
await client.sendMessage("me", { message: '<i>Курсив</i>' });

// Без парсинга
client.setParseMode(undefined);
await client.sendMessage("me", { message: "Обычный текст **без форматирования**" });
```

---

### 40. **invoke()** - Низкоуровневый вызов API
```typescript
await client.invoke(request: AnyRequest, dcId?: number): Promise<any>
```

**Прямой вызов любого метода Telegram API.**

**Пример:**
```javascript
import { Api } from "telegram";

const result = await client.invoke(new Api.account.CheckUsername({
    username: 'test'
}));

console.log(result);
```

---

## 📊 Свойства клиента

### 41. **connected** - Статус подключения
```typescript
client.connected: boolean | undefined
```

---

### 42. **parseMode** - Текущий режим парсинга
```typescript
client.parseMode: ParseInterface | undefined
```

---

### 43. **floodSleepThreshold** - Порог флуда
```typescript
client.floodSleepThreshold: number
```

**Автоматически спит при достижении лимитов API.**

---

### 44. **logger** - Логгер
```typescript
client.logger: Logger
```

---

## 🚫 НЕ РАБОТАЮЩИЕ МЕТОДЫ

### ❌ signInBot()
**Статус:** НЕ РАБОТАЕТ
**Причина:** GramJS не поддерживает ботов
**Альтернатива:** Использовать Bot API через HTTP

### ❌ Все Bot API методы
- `setBotCommands()`
- `getBotCommands()`
- `setBotMenuButton()`
- И другие бот-специфичные методы

**Причина:** GramJS предназначен для пользователей, не ботов.

---

## ✅ ПОДДЕРЖИВАЕМЫЕ МЕТОДЫ

### 🔌 Подключение (5/5)
- ✅ start
- ✅ checkAuthorization
- ✅ signInUser
- ✅ sendCode
- ✅ connect

### 📝 Сообщения (9/9)
- ✅ sendMessage
- ✅ iterMessages
- ✅ getMessages
- ✅ editMessage
- ✅ deleteMessages
- ✅ forwardMessages
- ✅ pinMessage
- ✅ unpinMessage
- ✅ markAsRead

### 📁 Файлы (3/3)
- ✅ downloadMedia
- ✅ uploadFile
- ✅ sendFile

### 💬 Диалоги (2/2)
- ✅ iterDialogs
- ✅ getDialogs

### 👥 Участники (2/2)
- ✅ iterParticipants
- ✅ getParticipants

### 🎣 События (4/4)
- ✅ addEventHandler
- ✅ removeEventHandler
- ✅ listEventHandlers
- ✅ on

### 🤖 Боты (2/5)
- ✅ inlineQuery (работает!)
- ✅ buildReplyMarkup
- ❌ signInBot (НЕ РАБОТАЕТ)
- ❌ setBotCommands (НЕ РАБОТАЕТ)
- ❌ getBotCommands (НЕ РАБОТАЕТ)

### 👤 Пользователи (3/3)
- ✅ getMe
- ✅ isBot
- ✅ isUserAuthorized

### 🔍 Сущности (3/3)
- ✅ getEntity
- ✅ getInputEntity
- ✅ getPeerId

### 🔌 Подключение (3/3)
- ✅ disconnect
- ✅ getDC
- ✅ setLogLevel

### ⚙️ Настройки (2/2)
- ✅ setParseMode
- ✅ invoke

---

## 🎯 ИТОГО

**Всего методов:** 44
**Работают:** 42 (95%)
**Не работают:** 2 (5%) (только signInBot и Bot API методы)

---

## 📚 Источники

- [Официальная документация GramJS](https://gram.js.org/)
- [GitHub репозиторий](https://github.com/whiskeysockets/GramJS)
- [Telegram API](https://core.telegram.org/api)

---

**Версия документации:** 1.0
**Дата:** 2025-01-05
**Статус:** Актуально для GramJS v2.x
