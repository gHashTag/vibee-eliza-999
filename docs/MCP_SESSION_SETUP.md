# Инструкция по созданию новой сессии через VIBEE MCP

## Текущая конфигурация

MCP сервер настроен в `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vibee": {
      "url": "https://vibee-mcp.fly.dev/sse"
    }
  }
}
```

## Аккаунт neuro_sage (продакшн)

- **Номер телефона:** `+79933420465`
- **Username:** `neuro_sage`
- **User ID:** `144022504`

## Шаги для создания новой сессии

### 1. Перезапустите Cursor

После создания `.cursor/mcp.json` необходимо перезапустить Cursor, чтобы MCP сервер подключился.

### 2. Проверьте подключение MCP

После перезапуска выполните в Cursor:

```
session_list
```

Если всё работает, вы увидите список сессий (или пустой список, если сессий ещё нет).

### 3. Создайте новую сессию для neuro_sage

```
session_create phone="+79933420465" set_active=true
```

Это создаст новую сессию и установит её как активную.

### 4. Авторизуйте сессию

Отправьте код на телефон:

```
auth_send_code phone="+79933420465"
```

Введите код из Telegram:

```
auth_verify_code code="12345" phone="+79933420465"
```

Замените `12345` на код, который пришёл в Telegram.

### 5. Проверьте подключение

```
telegram_get_me
```

Должна вернуться информация о вашем аккаунте neuro_sage.

## Альтернативный способ (если MCP не работает)

Если MCP не подключается, можно использовать существующий `TELEGRAM_SESSION_STRING` из `.env.force`:

```bash
# Текущий session string (тестовый аккаунт)
TELEGRAM_SESSION_STRING=1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=
```

Для создания нового session string для neuro_sage используйте скрипт:

```bash
cd /Users/playra/vibee-agent
bun run scripts/get-session.ts
```

## Полезные команды MCP

| Команда                                             | Описание                      |
| --------------------------------------------------- | ----------------------------- |
| `session_list`                                      | Список всех сессий            |
| `session_create phone="+7..."`                      | Создать новую сессию          |
| `session_set_active session_id="sess_..."`          | Переключить активную сессию   |
| `telegram_get_me`                                   | Информация о текущем аккаунте |
| `telegram_get_dialogs limit=20`                     | Список чатов                  |
| `telegram_send_message chat_id="123" text="Привет"` | Отправить сообщение           |

## Устранение неполадок

### MCP не подключается

1. Проверьте интернет-соединение
2. Убедитесь, что URL правильный: `https://vibee-mcp.fly.dev/sse`
3. Перезапустите Cursor

### "No active session"

Создайте и авторизуйте сессию (см. шаги выше).

### Код авторизации не приходит

1. Проверьте правильность номера телефона
2. Подождите 1-2 минуты
3. Попробуйте снова: `auth_send_code phone="+7..."`


