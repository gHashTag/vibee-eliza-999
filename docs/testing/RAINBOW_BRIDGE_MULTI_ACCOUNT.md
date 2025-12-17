# Rainbow Bridge: Multi-Account Testing System

> Автономное E2E тестирование VIBEE через два Telegram аккаунта с использованием MCP инструментов.

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    RAINBOW BRIDGE                           │
│              Автономное E2E тестирование                    │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────┐
│   TESTER ACCOUNT    │           │   BOT ACCOUNT       │
│   @neuro_sage       │    ───►   │   @vibee_agent      │
│   sess_deubhyi0p828 │  команды  │   sess_deukljn4q4mo │
│   +79933420465      │   ◄───    │   +66624014170      │
│                     │  ответы   │                     │
│   Отправляет:       │           │   Обрабатывает:     │
│   - /start          │           │   - Команды         │
│   - /neurophoto     │           │   - Нейрофункции    │
│   - /face train     │           │   - LoRA генерация  │
└─────────────────────┘           └─────────────────────┘
           │                                 │
           └────────────────┬────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │   MCP VIBEE SERVER  │
                 │   (Gleam + Go)      │
                 │                     │
                 │   Port 8080: MCP    │
                 │   Port 8081: Bridge │
                 └─────────────────────┘
```

---

## Подключённые аккаунты

| Role | Session ID | Phone | Username | User ID | Назначение |
|------|------------|-------|----------|---------|------------|
| **Tester** | `sess_deubhyi0p828` | +79933420465 | @neuro_sage | 144022504 | Тестирует бота, отправляет команды |
| **Bot** | `sess_deukljn4q4mo` | +66624014170 | @vibee_agent | 6579515876 | Юзербот с нейрофункциями |

### Общая группа для тестирования
- **VIBEE AGENT**: `chat_id: -1002737186844`

---

## Правила тестирования

### Золотые правила

1. **Tester ВСЕГДА отправляет команды** - используй `sess_deubhyi0p828`
2. **Bot ВСЕГДА отвечает** - `sess_deukljn4q4mo` принимает и обрабатывает
3. **Проверка через Tester session** - `telegram_get_history` с `sess_deubhyi0p828`
4. **Ожидание между командами** - минимум 2-3 секунды для обработки

### Workflow тестирования

```
1. Отправить команду (Tester → Bot)
   ↓
2. Подождать обработку (2-5 сек)
   ↓
3. Получить историю (Tester session)
   ↓
4. Проверить ответ (pattern matching)
   ↓
5. Записать результат (JSON + MD)
```

---

## MCP Команды

### Session Management

```bash
# Список всех сессий
mcp__vibee__session_list

# Переключить активную сессию
mcp__vibee__session_set_active session_id="sess_deubhyi0p828"

# Проверить текущего пользователя
mcp__vibee__telegram_get_me session_id="sess_deubhyi0p828"
```

### Отправка сообщений

```bash
# Отправить команду боту (от Tester к Bot)
mcp__vibee__telegram_send_message \
  session_id="sess_deubhyi0p828" \
  chat_id="6579515876" \
  text="/start"

# Отправить в общую группу
mcp__vibee__telegram_send_message \
  session_id="sess_deubhyi0p828" \
  chat_id="-1002737186844" \
  text="Тестовое сообщение"
```

### Получение истории

```bash
# История с ботом
mcp__vibee__telegram_get_history \
  session_id="sess_deubhyi0p828" \
  chat_id="6579515876" \
  limit=10

# История группы
mcp__vibee__telegram_get_history \
  session_id="sess_deubhyi0p828" \
  chat_id="-1002737186844" \
  limit=20
```

### Bot Analysis

```bash
# Полный анализ бота
mcp__vibee__bot_analyze \
  bot_username="vibee_agent" \
  session_id="sess_deubhyi0p828" \
  depth="deep" \
  message_history=100

# Извлечь команды
mcp__vibee__bot_extract_commands \
  bot_username="vibee_agent" \
  session_id="sess_deubhyi0p828" \
  test_commands=true

# Тест взаимодействий
mcp__vibee__bot_test_interaction \
  bot_username="vibee_agent" \
  session_id="sess_deubhyi0p828" \
  interactions='[{"type":"command","value":"/start"},{"type":"text","value":"привет"}]' \
  wait_between_ms=2000
```

---

## Тестовые сценарии

### 1. Basic Commands (Критичный)

```bash
# Шаг 1: Отправить /start
mcp__vibee__telegram_send_message session_id="sess_deubhyi0p828" chat_id="6579515876" text="/start"

# Шаг 2: Подождать 3 сек, получить историю
mcp__vibee__telegram_get_history session_id="sess_deubhyi0p828" chat_id="6579515876" limit=5

# Ожидаемо: ответ содержит "ВАЙБИ" или "привет"
```

### 2. NeuroPhoto Flow (Критичный)

```bash
# Шаг 1: Запросить генерацию
mcp__vibee__telegram_send_message session_id="sess_deubhyi0p828" chat_id="6579515876" text="/neurophoto красивый закат на пляже"

# Шаг 2: Подождать 30 сек (генерация)
# Шаг 3: Проверить ответ - должно быть изображение или сообщение об ошибке

mcp__vibee__telegram_get_history session_id="sess_deubhyi0p828" chat_id="6579515876" limit=5
```

### 3. Face Training (Критичный)

```bash
# Шаг 1: Запросить статус моделей
mcp__vibee__telegram_send_message session_id="sess_deubhyi0p828" chat_id="6579515876" text="/models"

# Шаг 2: Проверить список моделей
mcp__vibee__telegram_get_history session_id="sess_deubhyi0p828" chat_id="6579515876" limit=5
```

### 4. Error Handling

```bash
# Шаг 1: Отправить несуществующую команду
mcp__vibee__telegram_send_message session_id="sess_deubhyi0p828" chat_id="6579515876" text="/несуществующая_команда"

# Шаг 2: Проверить graceful handling
mcp__vibee__telegram_get_history session_id="sess_deubhyi0p828" chat_id="6579515876" limit=3
```

---

## Подключение нового аккаунта

### Шаг 1: Создать сессию

```bash
mcp__vibee__session_create phone="+79991234567" set_active=false
# Вернёт: session_id="sess_xxxxx"
```

### Шаг 2: Отправить код авторизации

```bash
mcp__vibee__auth_send_code phone="+79991234567" session_id="sess_xxxxx"
# Код придёт в Telegram
```

### Шаг 3: Подтвердить код

```bash
mcp__vibee__auth_verify_code \
  phone="+79991234567" \
  code="12345" \
  phone_code_hash="xxxxx" \
  session_id="sess_xxxxx"
```

### Шаг 4: Проверить авторизацию

```bash
mcp__vibee__telegram_get_me session_id="sess_xxxxx"
# Должен вернуть данные пользователя
```

### Шаг 5: (Опционально) Установить как активную

```bash
mcp__vibee__session_set_active session_id="sess_xxxxx"
```

---

## Формат отчётов

### JSON (для автоматизации)

```json
{
  "test_run": {
    "timestamp": "2025-12-10T20:30:00Z",
    "scenarios_total": 6,
    "scenarios_passed": 5,
    "scenarios_failed": 1
  },
  "results": [
    {
      "scenario": "basic_commands",
      "status": "passed",
      "duration_ms": 3500,
      "steps": [...]
    }
  ]
}
```

### Markdown (для чтения)

```markdown
# Rainbow Bridge Test Report

**Date:** 2025-12-10
**Status:** 5/6 PASSED

## Results

| Scenario | Status | Duration |
|----------|--------|----------|
| basic_commands | PASSED | 3.5s |
| neurophoto_flow | PASSED | 35s |
| face_training | FAILED | 5s |
```

---

## Troubleshooting

### Session не авторизована

```bash
# Проверить статус
mcp__vibee__auth_status session_id="sess_xxxxx"

# Если unauthorized - повторить авторизацию
mcp__vibee__auth_send_code phone="+7..." session_id="sess_xxxxx"
```

### Bridge не отвечает

```bash
# Проверить порты
curl http://localhost:8081/api/v1/me

# Перезапустить bridge
cd /Users/playra/vibee-eliza-999/vibee/telegram-bridge
./telegram-bridge &
```

### Сообщение не доставлено

- Проверить `chat_id` (должен быть строкой или числом)
- Проверить что бот не заблокирован
- Подождать больше времени между командами

---

## Конфигурация

Все настройки хранятся в:
- **Sessions:** `config/rainbow-bridge-sessions.json`
- **Scenarios:** `tests/rainbow-bridge-scenarios.json`
- **Skill:** `.claude/skills/vibe-rainbow-bridge/SKILL.md`
