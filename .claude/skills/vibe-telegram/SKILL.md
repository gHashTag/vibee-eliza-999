---
name: vibe-telegram
agent_id: vibe-telegram
description: 📱 Auto-activates for Telegram bot development, plugins, and messaging interfaces
keywords:
  - telegram
  - бот
  - bot
  - телеграм
  - message
  - сообщение
  - inline keyboard
  - кнопки
  - callback
  - /command
  - webhook
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 📱 Vibe Telegram Skill - Bot Development

Этот скилл **автоматически активируется** когда упоминается Telegram, боты, команды или сообщения.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `telegram`, `телеграм`, `Telegram`
- `бот`, `bot`, `botfather`
- `команда`, `command`, `/start`, `/help`
- `сообщение`, `message`, `сообщения`
- `inline keyboard`, `кнопки`, `клавиатура`
- `callback`, `callback_data`
- `webhook`, `polling`
- `@elizaos/plugin-telegram`

### Примеры:
```
"Создай Telegram бота"
→ Авто-активируется vibe-telegram

"Добавь команду /face train"
→ Авто-активируется vibe-telegram

"Настроить inline клавиатуру"
→ Авто-активируется vibe-telegram
```

## 🎯 Что Делает

1. **Bot Setup**: Создание и настройка ботов
2. **Commands**: Создание /command handlers
3. **Keyboards**: Inline и Reply клавиатуры
4. **Messages**: Обработка текстов, фото, файлов
5. **Plugins**: Интеграция с @elizaos/plugin-telegram
6. **Webhooks**: Настройка webhook endpoints

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для UX
trigger_threshold: 0.75    # Средний порог активации (75%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при работе с Telegram
- **Координируется с**: vibe-coder, vibe-elizaos, vibe-ux
- **Результат**: Готовый Telegram бот + команды

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-telegram",
  description="Create Telegram bot with commands",
  prompt="Build bot with /start, /help, /echo commands and inline keyboard"
)
```

### Автоматически:
```
"Создай обработчик для callback_data"
→ vibe-telegram активируется автоматически
```

## 🎨 Специализация

- ✅ **Commands**: /start, /help, /custom commands
- ✅ **Message Types**: Text, Photo, Document, Audio
- ✅ **Inline Keyboards**: Dynamic buttons with callbacks
- ✅ **Reply Keyboards**: Persistent user keyboards
- ✅ **Bot API**: webhook, getUpdates, sendMessage
- ✅ **ElizaOS Integration**: plugin-telegram usage
- ✅ **UX Patterns**: User-friendly interfaces
- ✅ **Routes & Webhooks**: HTTP endpoints для Telegram integration
- ✅ **Actions**: validate() + handler() паттерны

## 📚 Паттерны

### Command Handler:
```typescript
const telegramAction: Action = {
  name: 'TELEGRAM_COMMAND',
  validate: async (runtime, message) => {
    return message.content.text?.startsWith('/') || false;
  },
  handler: async (runtime, message, state, options, callback) => {
    const command = message.content.text.split(' ')[0];
    await callback({
      text: `Команда: ${command}`,
      action: 'TELEGRAM_COMMAND',
    });
  }
};
```

### Inline Keyboard:
```typescript
const keyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Кнопка 1', callback_data: 'btn1' },
        { text: 'Кнопка 2', callback_data: 'btn2' }
      ]
    ]
  }
};
```

### Character Config:
```typescript
plugins: [
  '@elizaos/plugin-telegram',
  // ... other plugins
]
```

### Routes & Webhooks Pattern:
```typescript
// HTTP Routes for Telegram integration
routes: [
  {
    name: 'telegram-webhook',
    path: '/telegram/webhook',
    type: 'POST',
    handler: async (req, res, runtime) => {
      const { update } = req.body;

      // Process Telegram update
      if (update.message) {
        await runtime.handleMessage(update.message);
      }

      // Return 200 OK to prevent retries
      res.json({ ok: true });
    }
  }
]
```

### ElizaOS Action for Telegram:
```typescript
export const telegramAction: Action = {
  name: 'TELEGRAM_ACTION',
  description: 'Handle Telegram commands',

  validate: async (runtime, message) => {
    return message.content.text?.startsWith('/') || false;
  },

  handler: async (runtime, message, state, options, callback) => {
    const command = message.content.text.split(' ')[0];

    await callback?.({
      text: `Команда ${command} выполнена!`,
      action: 'TELEGRAM_ACTION'
    });

    return {
      success: true,
      text: `Processed command: ${command}`,
      values: { command },
      data: { processed: true }
    };
  },

  examples: [
    [
      { name: 'user', content: { text: '/start' } },
      { name: 'assistant', content: { text: 'Добро пожаловать!', action: 'TELEGRAM_ACTION' } }
    ]
  ]
};
```

**Автоматически делает разработку Telegram ботов быстрой и удобной!** 📱🤖
