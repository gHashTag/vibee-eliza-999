# Skill: Добавление команд в VIBEE

## Обзор
Правила добавления новых команд (Actions) в систему VIBEE на ElizaOS.

## Критическое знание: ElizaOS Action Routing

ElizaOS использует LLM для выбора actions - НЕ ВСЕ actions имеют вызов `validate()`.
Чтобы гарантировать вызов `validate()`, action должен быть в списке `adminActions`.

## Шаги добавления новой команды

### 1. Создать Action файл

```typescript
// plugin-telegram-craft/src/actions/myCommand.action.ts
// @ts-nocheck

import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core'

export const myCommandAction: Action = {
  name: 'MY_COMMAND',  // Уникальное имя в UPPER_SNAKE_CASE
  description: 'Описание команды',
  similes: ['MY_COMMAND', 'my_command', 'моя команда'],
  examples: [
    [
      { name: '{{user1}}', content: { text: '/my_command' } },
      { name: '{{agent}}', content: { text: 'Ответ агента...' } },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.trim().toLowerCase() || ''
    console.log('[MyCommand] validate() called with:', text.substring(0, 50))

    const isCommand = text.startsWith('/my_command')
    if (isCommand) {
      console.log('[MyCommand] ✅ validate() returning TRUE')
    }
    return isCommand
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback: HandlerCallback
  ): Promise<void> => {
    // Логика обработки
    await callback({ text: 'Ответ на команду' })
  },
}

export const myCommandActions = [myCommandAction]
```

### 2. Добавить в plugin.ts

```typescript
// plugin-telegram-craft/src/plugin.ts

// Добавить импорт
import { myCommandActions } from "./actions/myCommand.action";

// Добавить в массив actions
actions: [
  // ... существующие
  ...myCommandActions,
],
```

### 3. Добавить в index.ts (экспорты)

```typescript
// plugin-telegram-craft/src/index.ts

export { myCommandActions, myCommandAction } from './actions/myCommand.action'
```

### 4. КРИТИЧНО: Добавить в adminActions

**Файл:** `plugin-telegram-craft/src/services/telegram.service.ts`
**Строка:** ~1620

```typescript
const adminActions = [
  // ... существующие
  "MY_COMMAND",  // <-- ДОБАВИТЬ ЗДЕСЬ!
];
```

**Без этого шага команда НЕ БУДЕТ работать!**
ElizaOS вызовет LLM для выбора action, и он может не выбрать вашу команду.

### 5. Переустановить зависимости

```bash
cd /Users/playra/vibee-agent
bun install
```

### 6. Перезапустить бота

```bash
pkill -f elizaos && bun dev
```

## Проверка работы

В логах должны появиться:
```
[MyCommand] validate() called with: /my_command
[MyCommand] ✅ validate() returning TRUE
🎯 Admin Action "MY_COMMAND" прошёл validate для "/my_command"
✅ Action "MY_COMMAND" выполнен успешно
```

## Типичные ошибки

| Проблема | Причина | Решение |
|----------|---------|---------|
| Команда не отвечает | Не в adminActions | Добавить в adminActions |
| validate() не вызывается | LLM не выбрал action | Добавить в adminActions |
| "Plugin not found" | Не установлен | `bun install` |
| Старый код | node_modules не обновился | `rm -rf node_modules/plugin-* && bun install` |

## Структура файлов

```
plugin-telegram-craft/
├── src/
│   ├── actions/
│   │   ├── myCommand.action.ts     # Action файл
│   │   └── ...
│   ├── services/
│   │   └── telegram.service.ts     # adminActions array (строка ~1620)
│   ├── plugin.ts                   # Импорт и регистрация
│   └── index.ts                    # Экспорты
```

## Ключевые файлы для редактирования

1. **Создать:** `plugin-telegram-craft/src/actions/<name>.action.ts`
2. **Изменить:** `plugin-telegram-craft/src/plugin.ts` (импорт + actions array)
3. **Изменить:** `plugin-telegram-craft/src/index.ts` (экспорт)
4. **Изменить:** `plugin-telegram-craft/src/services/telegram.service.ts` (adminActions)

## Связанные skills

- `vibe-telegram` - работа с Telegram API
- `vibe-elizaos` - архитектура ElizaOS
