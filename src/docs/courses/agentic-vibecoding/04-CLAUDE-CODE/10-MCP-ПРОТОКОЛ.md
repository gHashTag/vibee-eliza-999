# 10. MCP ПРОТОКОЛ

**Предыдущий контекст:** В [09-GIT-ВОРКФЛОУ.md](09-GIT-ВОРКФЛОУ.md) вы научились автоматизировать работу с Git через Claude Code. Теперь узнаете, как MCP позволяет подключать реальные данные к вашему AI ассистенту.

---

## 🏠 Что такое MCP простыми словами

### Аналогия из жизни

Представьте Claude как вашего личного помощника в офисе:

**Без MCP** — помощник сидит в пустой комнате:

- Вы: "Проверь данные пользователя 123"
- Помощник: "Принеси мне файл с данными"
- Вы: _идёте в архив, ищете, копируете, приносите_
- Помощник: "Теперь принеси его баланс"
- Вы: _снова идёте..._

**С MCP** — помощник имеет пропуск во все комнаты:

- Вы: "Проверь данные пользователя 123"
- Помощник: _сам идёт в архив, берёт данные, проверяет баланс, возвращается_
- Помощник: "Готово! Пользователь найден, баланс 15,000"

### 🎯 Простое определение

**MCP** = способ дать Claude **прямой доступ** к вашим данным (базы, файлы, API)

Без MCP вы — курьер между Claude и данными.
С MCP Claude сам берёт что нужно.

---

## 💡 Зачем это вайбкодеру

### 🚨 Реальная проблема

Вы делаете Telegram бота. Пользователь пишет: "У меня не работает подписка!"

**Без MCP** (10 минут работы):

```
1. Скопировать Telegram ID
2. Подключиться к серверу по SSH
3. Выполнить SELECT запрос
4. Скопировать результат
5. Отправить Claude
6. Claude говорит: "Проверь баланс"
7. Снова SSH, снова запрос...
8. Копировать результат
9. Отправить Claude
10. Наконец получить ответ
```

**С MCP** (10 секунд):

```
Вы: Проверь пользователя 5439920152

Claude:
✅ Найден в базе
💰 Баланс: 15,000 звёзд
📅 Подписка истекла 3 дня назад
💡 У него достаточно баланса для продления

Хочешь продлить автоматически?
```

**Экономия:** ~50x по времени!

---

## 🔧 Как работает MCP

### 🏗️ Архитектура

```
┌─────────────┐
│ Claude Code │ ← Вы общаетесь здесь
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ MCP Server  │ ← Посредник (библиотекарь)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Ваши данные │ ← База, API, файлы
└─────────────┘
```

### 🎯 Задача MCP

Превратить Claude из "советчика" в "исполнителя"

**Было:**

- Claude: "Выполни эту команду: `SELECT * FROM users`"
- Вы: _копируете, выполняете, возвращаете_

**Стало:**

- Claude: _сам выполняет `SELECT _ FROM users`\*
- Claude: "Вот результаты!"

---

## 🚀 Популярные MCP для вайбкодеров

### 1️⃣ Supabase MCP (ГЛАВНЫЙ для Telegram ботов!)

🎯 **Задача:** Прямой доступ к базе данных Telegram бота

💡 **Как это работает:** Claude подключается к Supabase и выполняет SQL запросы сам

#### Установка:

```bash
npm install -g @modelcontextprotocol/server-supabase
claude mcp add supabase npx @modelcontextprotocol/server-supabase
```

**Что здесь происходит:**

1. `npm install` — скачивает MCP сервер для Supabase
2. `claude mcp add` — подключает его к Claude Code
3. Теперь Claude может работать с вашей базой!

✅ **Результат:** Claude получил доступ к базе данных

#### Настройка:

```json
// ~/.claude/mcp-servers.json
{
  "supabase": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-supabase"],
    "env": {
      "SUPABASE_URL": "https://ваш-проект.supabase.co",
      "SUPABASE_KEY": "ваш-ключ"
    }
  }
}
```

**Что здесь происходит:**

1. Указываем адрес вашей базы Supabase
2. Даём ключ доступа
3. Claude теперь может читать/писать в базу

✅ **Результат:** Полный доступ к данным Telegram бота

#### Пример использования:

```markdown
Вы: Проверь пользователя 5439920152

Claude: [подключается к Supabase]
[выполняет SELECT * FROM users WHERE telegram_id = '5439920152']

        📊 Данные пользователя:
        - Username: @john_doe
        - Email: john@example.com
        - Баланс: 15,000 звёзд ⭐
        - Подписка: истекла 3 дня назад
        - Бот: neurotesters_bot

        💡 Рекомендация:
        У пользователя достаточно баланса для NEUROTESTER подписки.
        Хочешь предоставить доступ?
```

**Что произошло:**

1. Claude сам подключился к базе
2. Нашёл пользователя по ID
3. Проверил баланс и подписку
4. Предложил решение

✅ **Результат:** Вся информация за 3 секунды вместо 10 минут ручной работы

---

### 2️⃣ Filesystem MCP

🎯 **Задача:** Работа с файлами проекта

💡 **Как это работает:** Claude видит все файлы и может их читать/изменять

#### Быстрая установка:

```bash
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem /path/to/project
```

**Что здесь происходит:**

1. Подключаем Filesystem MCP
2. Указываем путь к проекту
3. Claude получает доступ к файлам

✅ **Результат:** Claude может работать с файлами сам

#### Пример:

```markdown
Вы: Найди все TODO в проекте

Claude: [сканирует файлы через Filesystem MCP]

        📝 Найдено 23 TODO:

        src/bot.js:45
          // TODO: Добавить обработку ошибок

        src/handlers/payment.js:112
          // TODO: Добавить логирование
```

**Что произошло:**

1. Claude сам прошёлся по всем файлам
2. Нашёл комментарии TODO
3. Показал где они находятся

✅ **Результат:** Автоматический аудит кода

---

### 3️⃣ Google Drive MCP

🎯 **Задача:** Работа с документами в облаке

💡 **Как это работает:** Claude читает Google Docs, Sheets как обычные файлы

```bash
npm install -g @modelcontextprotocol/server-gdrive
claude mcp add gdrive npx @modelcontextprotocol/server-gdrive --auth
```

**Что здесь происходит:**

1. Устанавливаем Google Drive MCP
2. Авторизуемся в Google аккаунте
3. Claude получает доступ к документам

✅ **Результат:** Claude работает с Google Docs

#### Пример:

```markdown
Вы: Создай отчёт в Google Docs

Claude: [создаёт документ через Google Drive MCP]

        ✅ Документ создан:
        "Отчёт по проекту - 2025-01-08"

        📎 Ссылка: https://docs.google.com/document/d/...
```

---

### 4️⃣ Slack MCP

🎯 **Задача:** Интеграция с командным чатом

```bash
npm install -g @modelcontextprotocol/server-slack
claude mcp add slack npx @modelcontextprotocol/server-slack --token=$SLACK_TOKEN
```

#### Пример:

```markdown
Вы: Отправь в #dev-team что фича готова

Claude: [использует Slack MCP]

        ✅ Отправлено в #dev-team:

        "✨ Фича завершена: Авторизация
        - JWT токены работают
        - Тесты: 95% покрытие
        - Готово к ревью"
```

---

## 💼 Для вайбкодеров: Полный рабочий пример

### 🎯 Задача

Проверить пользователя Telegram бота и дать подписку если нужно.

### 💡 Как это работает с MCP

**Вы просто говорите Claude:**

```
Проверь пользователя 5439920152 и дай NEUROTESTER если баланс > 10000
```

**Claude САМ делает всё:**

```markdown
Claude:
Шаг 1: Подключаюсь к Supabase через MCP...
Шаг 2: Проверяю пользователя...

Результат:

- Username: @john_doe
- Баланс: 15,000 звёзд ⭐
- Подписка: нет

Шаг 3: Баланс достаточный (15,000 > 10,000)
Шаг 4: Даю NEUROTESTER подписку...

✅ Готово! Подписка предоставлена.
```

**Что произошло:**

1. Claude подключился к вашей базе через Supabase MCP
2. Нашёл пользователя
3. Проверил баланс
4. САМ принял решение
5. Дал подписку
6. Всё за 3 секунды!

✅ **Результат:** Вы просто сказали ЧТО нужно, Claude сделал КАК

---

## 📊 MCP vs Обычный API

### 🤔 Когда использовать MCP?

**✅ Используйте MCP:**

- Частые операции (проверка пользователей каждый день)
- Нужна автоматизация (Claude решает сам)
- Сложная логика (цепочки запросов)
- Работа с Claude Code

**❌ Используйте обычный API:**

- Одноразовая задача
- Простой запрос
- Не нужна автоматизация

### Сравнение:

**Обычный API (вручную):**

```javascript
// Вы пишете код сами
const response = await fetch("https://api.example.com/users/123");
const data = await response.json();
console.log(data);
```

**MCP (автоматически):**

```markdown
Вы: Проверь пользователя 123

Claude: [сам пишет и выполняет код]
Готово! Пользователь найден.
```

---

## 🎓 Практическое задание

### Задание: Подключите Supabase MCP

**Что нужно сделать:**

1. Установите Supabase MCP (одна команда)
2. Попросите Claude проверить пользователя
3. Всё!

**Команда установки:**

```bash
claude mcp add supabase npx @modelcontextprotocol/server-supabase
```

**Проверка:**

```
Вы: Проверь есть ли пользователь 123 в базе

Claude: [использует Supabase MCP]
        Пользователь найден! ...
```

✅ **Результат:** Вы подключили MCP и теперь Claude работает с базой сам!

---

## 📚 Словарь простыми словами

- **MCP** — способ связи Claude с вашими данными
- **MCP Server** — программа-посредник между Claude и данными
- **Tool** — команда которую может выполнить Claude (например "проверить пользователя")
- **Resource** — данные доступные через MCP (база, файлы, API)

---

## 🎯 Главное из главы

### Что такое MCP?

Способ дать Claude прямой доступ к данным (без ручного копирования)

### Зачем это нужно?

Экономия времени в 50x на рутинных операциях

### Как использовать?

1. Установить MCP сервер
2. Подключить к Claude Code
3. Просто сказать что нужно

### Для вайбкодеров:

**Supabase MCP** — главный инструмент для работы с Telegram ботами!

---

## 🔍 Проверь себя

**До MCP:**

- Копировал данные вручную ❌
- Тратил 10 минут на проверку пользователя ⏱️
- Claude давал советы, я исполнял 🤷

**После MCP:**

- Claude берёт данные сам ✅
- Всё за 3 секунды ⚡
- Claude исполняет, я контролирую 🎯

---

## ✅ Тест: Проверь свои знания по MCP

### Вопрос 1: Что такое MCP?

**a)** Протокол для копирования файлов
**b)** Способ связи Claude с внешними данными и сервисами
**c)** Модуль для программирования на C++
**d)** Инструмент для отладки кода

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** Способ связи Claude с внешними данными и сервисами

**Объяснение:** MCP (Model Context Protocol) — это протокол, который позволяет Claude Code подключаться к различным источникам данных (базы данных, файловые системы, API) и работать с ними напрямую, без ручного копирования данных.

</details>

---

### Вопрос 2: Зачем нужны MCP серверы?

**a)** Для ускорения работы компьютера
**b)** Чтобы Claude мог выполнять операции с данными автоматически
**c)** Для создания веб-сайтов
**d)** Для установки программ

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** Чтобы Claude мог выполнять операции с данными автоматически

**Объяснение:** MCP серверы выступают посредниками между Claude Code и вашими данными. Они превращают Claude из "советчика" (который говорит что делать) в "исполнителя" (который делает сам). Это экономит до 50x времени на рутинных операциях.

</details>

---

### Вопрос 3: Какая команда устанавливает Supabase MCP?

**a)** `npm install supabase`
**b)** `claude mcp install supabase`
**c)** `claude mcp add supabase npx @modelcontextprotocol/server-supabase`
**d)** `git clone supabase-mcp`

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: c)** `claude mcp add supabase npx @modelcontextprotocol/server-supabase`

**Объяснение:** Команда `claude mcp add` регистрирует новый MCP сервер в Claude Code. Формат: `claude mcp add <название> <команда-запуска>`. В данном случае `npx @modelcontextprotocol/server-supabase` запускает Supabase MCP сервер.

</details>

---

### Вопрос 4: Что происходит БЕЗ MCP при проверке пользователя бота?

**a)** Claude автоматически проверяет базу данных
**b)** Вы вручную копируете Telegram ID, подключаетесь по SSH, выполняете запросы, копируете результаты
**c)** Всё работает через Google Docs
**d)** Бот проверяет сам себя

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** Вы вручную копируете Telegram ID, подключаетесь по SSH, выполняете запросы, копируете результаты

**Объяснение:** Без MCP вы становитесь "курьером" между Claude и данными. Приходится вручную подключаться к серверу, выполнять SQL запросы, копировать результаты и отправлять их Claude. Это занимает ~10 минут вместо 3 секунд с MCP.

</details>

---

### Вопрос 5: Какой MCP главный для работы с Telegram ботами?

**a)** Filesystem MCP
**b)** Google Drive MCP
**c)** Supabase MCP
**d)** Slack MCP

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: c)** Supabase MCP

**Объяснение:** Supabase MCP даёт прямой доступ к базе данных Telegram бота. Claude может сам выполнять SQL запросы, проверять пользователей, анализировать баланс и подписки — всё автоматически без вашего участия.

</details>

---

### Вопрос 6: Что делает Filesystem MCP?

**a)** Удаляет все файлы в проекте
**b)** Даёт Claude доступ к чтению и изменению файлов проекта
**c)** Создаёт новую файловую систему
**d)** Архивирует проект

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** Даёт Claude доступ к чтению и изменению файлов проекта

**Объяснение:** Filesystem MCP позволяет Claude работать с файлами проекта напрямую: читать код, находить TODO комментарии, изменять файлы, создавать новые. Всё это без необходимости вручную копировать содержимое файлов.

</details>

---

### Вопрос 7: Где хранится конфигурация MCP серверов?

**a)** `/etc/mcp/config.json`
**b)** `~/.claude/mcp-servers.json`
**c)** `/var/log/mcp.conf`
**d)** `~/Documents/mcp-settings.txt`

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** `~/.claude/mcp-servers.json`

**Объяснение:** Файл `~/.claude/mcp-servers.json` содержит настройки всех подключенных MCP серверов: команды запуска, переменные окружения (API ключи, URL баз данных) и другие параметры конфигурации.

</details>

---

### Вопрос 8: Что нужно указать в конфигурации Supabase MCP?

**a)** Только название проекта
**b)** SUPABASE_URL и SUPABASE_KEY
**c)** Пароль от компьютера
**d)** IP адрес сервера

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** SUPABASE_URL и SUPABASE_KEY

**Объяснение:** Для подключения к Supabase нужны два параметра:

- `SUPABASE_URL` — адрес вашего проекта (https://ваш-проект.supabase.co)
- `SUPABASE_KEY` — API ключ для доступа к базе данных

Эти данные указываются в разделе `env` конфигурации MCP сервера.

</details>

---

### Вопрос 9: В чём главное отличие MCP от обычного API?

**a)** MCP работает быстрее
**b)** MCP позволяет Claude самостоятельно принимать решения и выполнять операции
**c)** MCP бесплатный
**d)** MCP не требует интернета

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: b)** MCP позволяет Claude самостоятельно принимать решения и выполнять операции

**Объяснение:** С обычным API вы сами пишете код и контролируете каждый запрос. С MCP вы говорите Claude ЧТО нужно сделать, а он САМ решает КАК это сделать и выполняет все необходимые операции автоматически.

</details>

---

### Вопрос 10: Что произойдёт если попросить Claude "проверить пользователя 123" с подключенным Supabase MCP?

**a)** Claude попросит вас выполнить SQL запрос
**b)** Ничего не произойдёт
**c)** Claude сам подключится к базе, выполнит запрос и покажет результаты
**d)** Появится ошибка

<details>
<summary>👉 Показать ответ</summary>

**Правильный ответ: c)** Claude сам подключится к базе, выполнит запрос и покажет результаты

**Объяснение:** С подключенным MCP Claude становится полностью автономным. Он:

1. Подключается к Supabase
2. Выполняет SQL запрос (`SELECT * FROM users WHERE telegram_id = '123'`)
3. Анализирует результаты
4. Показывает вам структурированный отчёт

Всё это занимает 3 секунды вместо 10 минут ручной работы.

</details>

---

## 📝 Домашние задания

### 🟢 Базовое задание (15-25 минут)

**"Первый MCP сервер"**

**Цель:** Подключить Filesystem MCP и научить Claude работать с файлами проекта.

**Задание:**

1. Установите Filesystem MCP для вашего проекта
2. Попросите Claude найти все TODO комментарии в коде
3. Попросите Claude создать отчёт по структуре проекта

**Шаги выполнения:**

```bash
# Шаг 1: Установка Filesystem MCP
cd ~/your-project
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem $(pwd)

# Шаг 2: Проверка установки
claude mcp list
```

**Проверочные команды для Claude:**

```
1. "Найди все TODO комментарии в проекте"
2. "Покажи структуру директорий проекта"
3. "Какие файлы изменялись сегодня?"
```

**Критерии успеха:**

- ✅ Filesystem MCP успешно установлен
- ✅ Claude находит и показывает TODO комментарии
- ✅ Claude отображает структуру проекта
- ✅ Claude может читать содержимое файлов по запросу

**Бонус задание (+5 минут):**
Попросите Claude создать файл `PROJECT-TODOS.md` со всеми найденными TODO.

---

### 🟡 Продвинутое задание (30-45 минут)

**"MCP экосистема для Telegram бота"**

**Цель:** Настроить полноценную MCP инфраструктуру для работы с Telegram ботом.

**Задание:**
Подключите 3-5 MCP серверов и автоматизируйте рабочий процесс.

**Обязательные MCP:**

1. **Supabase MCP** — работа с базой данных
2. **Filesystem MCP** — работа с кодом проекта
3. **Slack MCP** (или альтернатива) — уведомления команды

**Дополнительные (на выбор):** 4. Google Drive MCP — отчёты и документация 5. GitHub MCP — автоматизация pull requests

**Шаги выполнения:**

**1. Supabase MCP**

```bash
# Установка
npm install -g @modelcontextprotocol/server-supabase
claude mcp add supabase npx @modelcontextprotocol/server-supabase

# Конфигурация (~/.claude/mcp-servers.json)
{
  "supabase": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-supabase"],
    "env": {
      "SUPABASE_URL": "https://ваш-проект.supabase.co",
      "SUPABASE_KEY": "ваш-service-role-ключ"
    }
  }
}
```

**2. Filesystem MCP**

```bash
cd ~/999-agents-telegraf
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem $(pwd)
```

**3. Slack MCP**

```bash
npm install -g @modelcontextprotocol/server-slack
claude mcp add slack npx @modelcontextprotocol/server-slack

# Добавить в конфиг:
{
  "slack": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-slack"],
    "env": {
      "SLACK_TOKEN": "xoxb-your-bot-token"
    }
  }
}
```

**Проверочные сценарии:**

**Сценарий 1: Проверка пользователя**

```
Вы: "Проверь пользователя 5439920152 в базе и покажи его баланс"

Ожидаемый результат:
- Claude подключается к Supabase
- Находит пользователя
- Показывает баланс, подписку, последнюю активность
```

**Сценарий 2: Аудит кода**

```
Вы: "Найди в проекте все файлы обработчиков (handlers) и покажи где нет обработки ошибок"

Ожидаемый результат:
- Claude использует Filesystem MCP
- Находит все файлы handlers/*.js
- Анализирует код на наличие try-catch
- Показывает проблемные места
```

**Сценарий 3: Командная работа**

```
Вы: "Когда найдёшь критическую проблему в коде — отправь уведомление в #dev-alerts в Slack"

Ожидаемый результат:
- Claude анализирует код
- Находит проблему
- Автоматически отправляет сообщение в Slack
```

**Критерии успеха:**

- ✅ Все 3-5 MCP серверов подключены и работают
- ✅ Claude может одновременно работать с базой, файлами и Slack
- ✅ Автоматические сценарии выполняются без ошибок
- ✅ Настроена конфигурация с правильными API ключами

**Бонус задание (+10 минут):**
Создайте автоматический воркфлоу:

1. Claude проверяет пользователей с балансом > 50,000 без подписки
2. Даёт им NEUROTESTER автоматически
3. Отправляет отчёт в Slack с количеством обработанных пользователей

---

### 🔴 Проектное задание (50-60+ минут)

**"Создание собственного MCP сервера"**

**Цель:** Разработать кастомный MCP сервер для специфичных нужд проекта.

**Задание:**
Создать MCP сервер, который интегрирует Claude с API вашего Telegram бота для автоматизации работы с пользователями.

**Функционал MCP сервера:**

1. Проверка статуса пользователей
2. Управление подписками
3. Анализ баланса звёзд
4. Автоматическое предоставление доступа
5. Генерация отчётов

**Структура проекта:**

```
custom-telegram-bot-mcp/
├── package.json
├── index.js              # Точка входа MCP сервера
├── lib/
│   ├── server.js         # MCP Server класс
│   ├── tools/
│   │   ├── check-user.js      # Инструмент проверки пользователя
│   │   ├── grant-access.js    # Предоставление доступа
│   │   └── generate-report.js # Генерация отчёта
│   └── resources/
│       └── users.js      # Ресурсы пользователей
└── README.md
```

**Шаг 1: Базовая структура (15 минут)**

**package.json:**

```json
{
  "name": "telegram-bot-mcp",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "dotenv": "^16.0.0"
  },
  "bin": {
    "telegram-bot-mcp": "./index.js"
  }
}
```

**index.js:**

```javascript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Создание MCP сервера
const server = new Server(
  {
    name: "telegram-bot-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// Регистрация инструментов
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "check_user",
      description: "Проверить статус пользователя Telegram бота",
      inputSchema: {
        type: "object",
        properties: {
          telegram_id: {
            type: "string",
            description: "Telegram ID пользователя",
          },
        },
        required: ["telegram_id"],
      },
    },
    {
      name: "grant_access",
      description: "Предоставить NEUROTESTER подписку",
      inputSchema: {
        type: "object",
        properties: {
          telegram_id: {
            type: "string",
            description: "Telegram ID пользователя",
          },
        },
        required: ["telegram_id"],
      },
    },
  ],
}));

// Обработчик инструмента check_user
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "check_user") {
    const { telegram_id } = request.params.arguments;

    // Запрос к базе данных
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegram_id)
      .single();

    if (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Ошибка: ${error.message}`,
          },
        ],
      };
    }

    // Проверка баланса
    const { data: balance } = await supabase.rpc("getUserBalance", {
      user_telegram_id: telegram_id,
    });

    return {
      content: [
        {
          type: "text",
          text: `
📊 Данные пользователя ${telegram_id}:
- Username: @${user.username || "нет"}
- Email: ${user.email || "нет"}
- Баланс: ${balance || 0} звёзд ⭐
- Подписка: ${user.subscription || "нет"}
- Регистрация: ${user.created_at}
        `.trim(),
        },
      ],
    };
  }

  if (request.params.name === "grant_access") {
    const { telegram_id } = request.params.arguments;

    // Предоставление подписки
    const { error } = await supabase.from("payments_v2").insert({
      telegram_id,
      amount: 0,
      stars: 0,
      status: "COMPLETED",
      subscription_type: "NEUROTESTER",
      payment_method: "Manual",
      description: "Manual NEUROTESTER grant via MCP",
      payment_date: new Date().toISOString(),
    });

    if (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Ошибка: ${error.message}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ NEUROTESTER подписка успешно предоставлена пользователю ${telegram_id}`,
        },
      ],
    };
  }
});

// Запуск сервера
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Telegram Bot MCP Server запущен");
}

main().catch(console.error);
```

**Шаг 2: Установка и тестирование (10 минут)**

```bash
# Установка зависимостей
cd custom-telegram-bot-mcp
npm install

# Создание .env файла
cat > .env << 'EOF'
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_KEY=ваш-service-role-ключ
EOF

# Установка глобально
npm link

# Подключение к Claude Code
claude mcp add telegram-bot telegram-bot-mcp
```

**Шаг 3: Проверка работы (10 минут)**

**Тест 1: Проверка пользователя**

```
Вы: "Используй telegram-bot MCP чтобы проверить пользователя 5439920152"

Ожидаемый результат:
📊 Данные пользователя 5439920152:
- Username: @john_doe
- Email: john@example.com
- Баланс: 15,000 звёзд ⭐
- Подписка: NEUROTESTER
- Регистрация: 2025-01-01
```

**Тест 2: Предоставление доступа**

```
Вы: "Дай NEUROTESTER подписку пользователю 123456789"

Ожидаемый результат:
✅ NEUROTESTER подписка успешно предоставлена пользователю 123456789
```

**Шаг 4: Расширение функционала (15-20 минут)**

Добавьте новые инструменты:

**1. Массовая обработка пользователей:**

```javascript
{
  name: 'process_high_balance_users',
  description: 'Найти пользователей с балансом > N без подписки',
  inputSchema: {
    type: 'object',
    properties: {
      min_balance: {
        type: 'number',
        description: 'Минимальный баланс',
        default: 10000
      }
    }
  }
}
```

**2. Генерация отчётов:**

```javascript
{
  name: 'generate_daily_report',
  description: 'Сгенерировать ежедневный отчёт по пользователям',
  inputSchema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Дата в формате YYYY-MM-DD'
      }
    }
  }
}
```

**3. Поиск проблемных пользователей:**

```javascript
{
  name: 'find_stuck_users',
  description: 'Найти пользователей с истёкшей подпиской и высоким балансом',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}
```

**Критерии успеха:**

- ✅ MCP сервер успешно создан и запускается
- ✅ Claude может использовать кастомные инструменты
- ✅ Работа с Supabase через MCP функционирует корректно
- ✅ Все 3+ инструмента работают без ошибок
- ✅ Созданы юнит-тесты для основных функций
- ✅ Написана документация по использованию

**Бонус задание (+15 минут):**

1. Добавьте логирование всех операций в отдельную таблицу `mcp_operations_log`
2. Реализуйте rate limiting (не более 100 запросов в минуту)
3. Создайте GitHub репозиторий с вашим MCP сервером
4. Опубликуйте в npm как `@yourusername/telegram-bot-mcp`

**Дополнительные ресурсы:**

- [MCP SDK Документация](https://modelcontextprotocol.io/docs)
- [Примеры MCP серверов](https://github.com/modelcontextprotocol/servers)
- [Официальный туториал](https://modelcontextprotocol.io/tutorials/building-mcp-with-llm)

---

## Навигация

← [Предыдущая статья: 09. Git воркфлоу](09-GIT-ВОРКФЛОУ.md)
→ [Следующая статья: 11. Продвинутые техники](11-ПРОДВИНУТЫЕ-ТЕХНИКИ.md)

**Прогресс:** 10 из 11 статей раздела "Claude Code" | [Вернуться к содержанию](README.md)

---

> 💡 **Главный инсайт:** MCP превращает Claude из "советчика" в "исполнителя". Вместо "посоветуй что делать" → "сделай это сам". Ваша производительность растёт не в 2 раза, а в 50 раз!

**Следующая глава:** Финальные продвинутые техники — headless режим, параллельные субагенты, работа с огромными проектами и best practices для production.
