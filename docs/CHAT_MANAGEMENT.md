# 📋 Централизованное управление чатами

Единая система управления целевыми чатами и проактивной рассылкой.

## 🎯 Основные принципы

1. **Единственный источник истины**: `plugin-telegram-craft/src/config/agents.config.ts`
2. **Централизованное управление**: через `ChatManager` и скрипт `manage-chats.ts`
3. **Никакого дублирования**: настройки только в `agents.config.ts`, не в `*.json` файлах

## 🚀 Быстрый старт

### Показать статус всех чатов

```bash
bun scripts/manage-chats.ts status
```

### Список чатов агента

```bash
bun scripts/manage-chats.ts list sales
```

### Включить/отключить чат

```bash
# Отключить
bun scripts/manage-chats.ts disable sales -4832231272

# Включить
bun scripts/manage-chats.ts enable sales -4832231272
```

### Изменить интервал рассылки

```bash
bun scripts/manage-chats.ts interval sales 180  # 3 часа
```

### Управление проактивным режимом

```bash
# Включить
bun scripts/manage-chats.ts proactive-on sales

# Отключить
bun scripts/manage-chats.ts proactive-off sales
```

## 📖 API (программное управление)

```typescript
import { ChatManager } from "./plugin-telegram-craft/src/config/chat-management";

// Получить статус чата
const status = ChatManager.getChatStatus("sales", "-4832231272");
console.log(status?.isActive); // true/false

// Включить чат
ChatManager.enableChat("sales", "-4832231272");

// Отключить чат
ChatManager.disableChat("sales", "-4832231272");

// Установить интервал (минуты)
ChatManager.setProactiveInterval("sales", 180);

// Получить статус агента
const agentStatus = ChatManager.getAgentStatus("sales");
console.log(agentStatus?.activeChatsCount);

// Получить отчёт
const report = ChatManager.getStatusReport();
console.log(report);
```

## 🔧 Структура конфигурации

Все настройки в `agents.config.ts`:

```typescript
sales: {
  targetChats: [
    {
      chatId: "-4832231272",
      chatName: "Название группы",
      type: "group" | "supergroup" | "channel" | "private",
      isActive: true,  // ← Управляется через ChatManager
      responseProbability: 1.0,
      customTriggers: [...]
    }
  ],
  behavior: {
    proactiveEnabled: true,  // ← Управляется через ChatManager
    proactiveIntervalMinutes: 180,  // ← Управляется через ChatManager
  }
}
```

## ⚠️ Важно

1. **После изменений перезапустите агентов**: `bun dev`
2. **Не редактируйте `salesAgent.json`** - настройки проактивной рассылки там игнорируются
3. **Все изменения в `agents.config.ts`** - это TypeScript файл, изменения применяются при перезапуске

## 🐛 Troubleshooting

### Чат не отключается

1. Проверьте, что изменения сохранены в `agents.config.ts`
2. Перезапустите агентов: `bun dev`
3. Проверьте логи на наличие ошибок

### Интервал не меняется

1. Убедитесь, что указан правильный `agentId` (sales, vibee, kols и т.д.)
2. Проверьте статус: `bun scripts/manage-chats.ts list sales`
3. Перезапустите агентов

### Сообщения всё ещё идут

1. Проверьте, что чат действительно отключён: `bun scripts/manage-chats.ts list sales`
2. Убедитесь, что перезапустили агентов
3. Проверьте, не идут ли сообщения как ответы на триггеры (не проактивная рассылка)

