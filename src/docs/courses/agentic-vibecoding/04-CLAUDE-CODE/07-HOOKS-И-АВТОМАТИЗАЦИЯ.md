# 07. HOOKS И АВТОМАТИЗАЦИЯ

**Предыдущий контекст:** В [06-SLASH-КОМАНДЫ.md](06-SLASH-КОМАНДЫ.md) вы научились создавать собственные команды для Claude Code. Теперь мы пойдем дальше — научимся автоматически выполнять действия до, во время и после работы Claude, создавая настоящую автоматизацию разработки.

---

## Что такое hooks в Claude Code?

### 🎯 Простыми словами

**Hooks** (хуки) — это автоматические помощники, которые запускаются в определенные моменты. Вы настраиваете их один раз, и они работают сами.

### 🏠 Аналогия из жизни

Представьте **умный дом**:

- **Перед уходом** → автоматически выключается свет, закрываются окна (Pre-operation hooks)
- **Когда вы дома** → регулируется температура, включается музыка (Post-operation hooks)
- **При входе/выходе** → система приветствует вас или прощается (Session hooks)

То же самое с Claude Code:

- **Перед действием** → проверяем безопасность, готовим файлы
- **После действия** → форматируем код, создаём тесты
- **Начало/конец работы** → сохраняем прогресс, показываем статистику

---

## 🎬 Как работают hooks: пример на пальцах

### Проблема

Claude сохраняет файл с плохим форматированием:

```javascript
function hello() {
  console.log("world");
}
```

### Решение

Создаём hook, который **автоматически** исправляет форматирование после сохранения.

### 💡 Самый простой hook

**Что мы хотим:** После каждого сохранения файла показывать сообщение.

```javascript
// .claude/hooks/post-tool-use.js

module.exports = async (toolName, params) => {
  // Если Claude только что сохранил файл
  if (toolName === "Write") {
    console.log(`✅ Файл сохранён: ${params.file_path}`);
  }

  return { success: true };
};
```

**Что здесь происходит:**

1. `module.exports` — делаем функцию доступной для Claude
2. `toolName` — название действия Claude (Write, Edit, Bash и т.д.)
3. `params.file_path` — путь к файлу, который сохранили
4. `return { success: true }` — говорим, что всё хорошо

✅ **Результат:** Теперь после каждого сохранения вы видите сообщение!

---

## 📚 Три типа hooks

### 1️⃣ Pre-operation hooks — "ДО" действия

**Зачем нужны:** Проверить безопасность, подготовить файлы.

🎯 **Пример задачи:** Не дать Claude удалить важные файлы.

```javascript
// .claude/hooks/pre-tool-use.js

module.exports = async (toolName, params) => {
  // Проверяем только команды Bash
  if (toolName === "Bash") {
    const command = params.command;

    // Опасные команды
    if (command.includes("rm -rf")) {
      console.error("⛔ СТОП! Это опасная команда!");

      return {
        approved: false, // НЕ разрешаем выполнение
        reason: "Опасная команда заблокирована",
      };
    }
  }

  return { approved: true }; // Разрешаем
};
```

**Что здесь происходит:**

1. Проверяем, что это Bash команда
2. Ищем опасную команду `rm -rf` (удаление всех файлов)
3. Если нашли — блокируем (`approved: false`)
4. Если нет — разрешаем (`approved: true`)

✅ **Результат:** Claude не сможет случайно удалить ваши файлы!

---

### 2️⃣ Post-operation hooks — "ПОСЛЕ" действия

**Зачем нужны:** Автоматически улучшить результат работы Claude.

🎯 **Пример задачи:** Автоматически форматировать код после сохранения.

**Шаг 1: Понимаем проблему**
Когда Claude сохраняет код, он может быть неаккуратно отформатирован. Нужно автоматически исправлять.

**Шаг 2: Простое решение**

```javascript
// .claude/hooks/post-tool-use.js

const { exec } = require("child_process");

module.exports = async (toolName, params) => {
  // Работаем только после сохранения или редактирования
  if (toolName !== "Write" && toolName !== "Edit") {
    return { success: true };
  }

  const filePath = params.file_path;

  // Проверяем, что это JavaScript файл
  if (filePath.endsWith(".js")) {
    console.log(`✨ Форматирую файл: ${filePath}`);

    // Запускаем prettier для форматирования
    exec(`npx prettier --write "${filePath}"`, (error) => {
      if (error) {
        console.log("⚠️ Prettier не установлен");
      } else {
        console.log("✅ Файл отформатирован!");
      }
    });
  }

  return { success: true };
};
```

**Что здесь происходит:**

1. `if (toolName !== 'Write' && toolName !== 'Edit')` — работаем только при сохранении
2. `filePath.endsWith('.js')` — проверяем, что это JavaScript
3. `exec(...)` — запускаем программу Prettier
4. Prettier автоматически исправляет форматирование

**Было:**

```javascript
function hello() {
  console.log("world");
}
```

**Стало автоматически:**

```javascript
function hello() {
  console.log("world");
}
```

✅ **Результат:** Код всегда красиво отформатирован!

---

### 3️⃣ Session hooks — "НАЧАЛО и КОНЕЦ работы"

**Зачем нужны:** Сохранять прогресс, показывать статистику.

🎯 **Пример задачи:** Показывать, сколько файлов изменили за сессию.

**Простой счётчик файлов:**

```javascript
// .claude/hooks/session-start.js

// Глобальный счётчик (общий для всех функций)
let filesChanged = 0;

module.exports = async (context) => {
  console.log("🚀 Начинаем работу!");
  filesChanged = 0; // Обнуляем счётчик

  return { success: true };
};
```

```javascript
// .claude/hooks/post-tool-use.js

module.exports = async (toolName, params) => {
  if (toolName === "Edit" || toolName === "Write") {
    filesChanged++; // Увеличиваем счётчик
    console.log(`📝 Изменено файлов: ${filesChanged}`);
  }

  return { success: true };
};
```

```javascript
// .claude/hooks/session-end.js

module.exports = async (context) => {
  console.log("👋 Сессия завершена!");
  console.log(`📊 Итого изменено файлов: ${filesChanged}`);

  return { success: true };
};
```

**Что здесь происходит:**

1. **При старте** — обнуляем счётчик
2. **При каждом изменении** — увеличиваем счётчик на 1
3. **При завершении** — показываем итоговую статистику

✅ **Результат:** Вы всегда знаете, сколько работы проделано!

---

## 🛠️ Создание первого hook: пошагово

### Задача

Создать hook, который показывает размер файла после сохранения.

### Шаг 1: Создаём папку для hooks

```bash
mkdir -p ~/.claude/hooks
```

**Что это:** Создаём специальную папку, где будут лежать наши hooks.

### Шаг 2: Создаём файл hook

```bash
cd ~/.claude/hooks
touch file-size-logger.js
```

**Что это:** Создаём пустой JavaScript файл для нашего hook.

### Шаг 3: Пишем простой код

```javascript
// ~/.claude/hooks/file-size-logger.js

const fs = require("fs");

module.exports = async (toolName, params) => {
  // Проверяем, что это сохранение файла
  if (toolName !== "Write") {
    return { success: true };
  }

  const filePath = params.file_path;

  // Читаем информацию о файле
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`📏 Размер файла: ${sizeKB} KB`);

  return { success: true };
};
```

**Что здесь происходит:**

1. `const fs = require('fs')` — подключаем модуль для работы с файлами
2. `if (toolName !== 'Write')` — работаем только при сохранении
3. `fs.statSync(filePath)` — получаем информацию о файле
4. `stats.size / 1024` — переводим байты в килобайты
5. `toFixed(2)` — округляем до 2 знаков после запятой

### Шаг 4: Регистрируем hook

```json
// ~/.claude/settings.json
{
  "hooks": {
    "postToolUse": "~/.claude/hooks/file-size-logger.js"
  }
}
```

**Что это:** Говорим Claude использовать наш hook после каждого действия.

### ✅ Готово!

Теперь после каждого сохранения вы видите:

```
✅ Файл сохранён: /path/to/file.js
📏 Размер файла: 2.34 KB
```

---

## 🔐 Безопасность hooks: защита от опасных действий

### Проблема

Claude может случайно выполнить опасную команду, которая удалит файлы или повредит систему.

### Решение

Создаём "белый список" безопасных команд.

### 💡 Простой guard (охранник)

```javascript
// ~/.claude/hooks/security-guard.js

// Список разрешённых команд
const SAFE_COMMANDS = [
  "npm test",
  "npm run build",
  "git status",
  "git diff",
  "ls",
  "pwd",
];

module.exports = async (toolName, params) => {
  // Проверяем только Bash команды
  if (toolName !== "Bash") {
    return { approved: true };
  }

  const command = params.command;

  // Проверяем, начинается ли команда с безопасной
  const isSafe = SAFE_COMMANDS.some((safe) => command.startsWith(safe));

  if (!isSafe) {
    console.error("⛔ Команда не в списке разрешённых!");
    console.log("📋 Безопасные команды:", SAFE_COMMANDS);

    return {
      approved: false,
      reason: "Команда не разрешена",
    };
  }

  return { approved: true };
};
```

**Что здесь происходит:**

1. `SAFE_COMMANDS` — список команд, которые можно выполнять
2. `command.startsWith(safe)` — проверяем начало команды
3. `some()` — проверяем, есть ли хотя бы одно совпадение
4. Если команды нет в списке — блокируем

**Когда использовать:**

- Работаете с продакшн сервером
- Хотите защититься от случайных ошибок
- Нужен контроль над действиями Claude

✅ **Результат:** Claude не сможет выполнить опасные команды!

---

## 🎨 Практические примеры для начинающих

### Пример 1: Автоматическое создание backup файлов

🎯 **Задача:** Перед изменением важного файла создавать его копию.

```javascript
// ~/.claude/hooks/auto-backup.js

const fs = require("fs");
const path = require("path");

// Файлы, для которых нужен backup
const IMPORTANT_FILES = [".env", "package.json", "config.js"];

module.exports = async (toolName, params) => {
  // Работаем только при редактировании
  if (toolName !== "Edit") {
    return { approved: true };
  }

  const filePath = params.file_path;
  const fileName = path.basename(filePath);

  // Проверяем, важный ли это файл
  const isImportant = IMPORTANT_FILES.some((name) => fileName.includes(name));

  if (!isImportant) {
    return { approved: true };
  }

  // Создаём backup
  const timestamp = Date.now();
  const backupPath = `${filePath}.backup.${timestamp}`;

  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Создан backup: ${backupPath}`);
  } catch (error) {
    console.error("❌ Ошибка создания backup:", error.message);
  }

  return { approved: true };
};
```

**Что здесь происходит:**

1. Определяем список важных файлов
2. При редактировании проверяем, важный ли файл
3. `Date.now()` — получаем текущее время (уникальное имя)
4. `fs.copyFileSync()` — копируем файл
5. Backup получает имя типа: `config.js.backup.1704067200000`

**Было:**

```
config.js
```

**Стало:**

```
config.js
config.js.backup.1704067200000  ← автоматический backup!
```

✅ **Результат:** Всегда можете вернуться к старой версии!

---

### Пример 2: Счётчик строк кода

🎯 **Задача:** Показывать, сколько строк кода добавили или удалили.

```javascript
// ~/.claude/hooks/lines-counter.js

module.exports = async (filePath, oldContent, newContent, context) => {
  // Считаем строки в старом и новом содержимом
  const oldLines = oldContent.split("\n").length;
  const newLines = newContent.split("\n").length;

  // Вычисляем разницу
  const diff = newLines - oldLines;

  // Форматируем вывод
  const sign = diff > 0 ? "+" : "";
  const emoji = diff > 0 ? "📈" : "📉";

  console.log(`${emoji} Строк: ${oldLines} → ${newLines} (${sign}${diff})`);

  return { success: true };
};
```

**Что здесь происходит:**

1. `split('\n')` — разбиваем текст на строки
2. `.length` — считаем количество строк
3. `newLines - oldLines` — вычисляем разницу
4. `sign = diff > 0 ? '+' : ''` — добавляем знак + для положительных чисел
5. Показываем красивую статистику с эмодзи

**Пример вывода:**

```
📈 Строк: 45 → 67 (+22)  ← добавили код
📉 Строк: 120 → 98 (-22)  ← удалили код
```

✅ **Результат:** Видите прогресс работы в реальном времени!

---

### Пример 3: Напоминание о тестах

🎯 **Задача:** Если изменили код, напомнить написать тесты.

```javascript
// ~/.claude/hooks/test-reminder.js

const path = require("path");

module.exports = async (toolName, params) => {
  // Работаем только при изменении файлов в src/
  if (toolName !== "Edit" && toolName !== "Write") {
    return { success: true };
  }

  const filePath = params.file_path;

  // Проверяем, что файл в папке src
  if (!filePath.includes("/src/")) {
    return { success: true };
  }

  // Получаем имя файла
  const fileName = path.basename(filePath);

  console.log("");
  console.log("⚠️  НАПОМИНАНИЕ:");
  console.log(`📝 Вы изменили: ${fileName}`);
  console.log("✅ Не забудьте обновить тесты!");
  console.log("");

  return { success: true };
};
```

**Что здесь происходит:**

1. Проверяем, что изменили файл в папке `src/`
2. `path.basename()` — получаем только имя файла (без пути)
3. Показываем красивое напоминание

**Пример вывода:**

```
⚠️  НАПОМИНАНИЕ:
📝 Вы изменили: UserService.js
✅ Не забудьте обновить тесты!
```

✅ **Результат:** Никогда не забудете про тесты!

---

## 📊 Статистика: зачем нужны hooks

### Экономия времени

**Без hooks (вручную):**

- Форматирование кода: ~2 минуты
- Проверка безопасности: ~3 минуты
- Создание backup: ~1 минута
- Написание тестов: ~5 минут

**Итого:** ~11 минут на каждый файл

**С hooks (автоматически):**

- Всё происходит автоматически: ~0 минут

**Экономия:** 11 минут × 20 файлов в день = **220 минут (3.5 часа) в день**!

---

## 🎓 Упражнения для практики

### Упражнение 1: Простой логгер (Лёгкое)

**Задача:** Создайте hook, который записывает в файл `log.txt` все действия Claude.

**Подсказка:**

```javascript
const fs = require("fs");

module.exports = async (toolName, params) => {
  const logMessage = `${new Date()} - ${toolName}\n`;
  fs.appendFileSync("log.txt", logMessage);
  return { success: true };
};
```

**Что добавить:**

- Красивое форматирование даты
- Имя файла, если это Edit/Write
- Разделители между записями

---

### Упражнение 2: Детектор TODO (Среднее)

**Задача:** Создайте hook, который находит все TODO комментарии в коде и показывает их количество.

**Подсказка:**

```javascript
module.exports = async (toolName, params) => {
  if (toolName !== "Write") return { success: true };

  const content = params.content;
  // Найти все // TODO в коде
  // Показать их количество

  return { success: true };
};
```

**Что добавить:**

- Поиск разных видов TODO (`// TODO`, `/* TODO */`, `# TODO`)
- Показать строки, где найдены TODO
- Статистика по файлам

---

### Упражнение 3: Автосоздание тестов (Сложное)

**Задача:** Когда Claude создаёт новый файл в `src/`, автоматически создавать пустой файл теста в `tests/`.

**Подсказка:**

```javascript
const fs = require("fs");
const path = require("path");

module.exports = async (toolName, params) => {
  if (toolName !== "Write") return { success: true };

  const filePath = params.file_path;
  if (!filePath.includes("/src/")) return { success: true };

  // 1. Получить имя файла
  // 2. Создать путь к тесту: src/file.js → tests/file.test.js
  // 3. Создать базовый шаблон теста
  // 4. Сохранить файл

  return { success: true };
};
```

---

## 📖 Словарь простыми словами

- **Hook (хук)** = автоматический помощник, который срабатывает в определённый момент
- **Pre-operation** = "до действия" (подготовка, проверка)
- **Post-operation** = "после действия" (улучшение результата)
- **Session** = "рабочая сессия" (от начала до конца работы)
- **Approved** = "разрешено" (можно выполнять)
- **Timeout** = "таймаут" (максимальное время ожидания)
- **Whitelist** = "белый список" (что разрешено)
- **Blacklist** = "чёрный список" (что запрещено)

---

## ✅ Чек-лист: что вы теперь умеете

- [ ] Понимаете, что такое hooks и зачем они нужны
- [ ] Можете создать простой hook для логирования
- [ ] Умеете блокировать опасные команды
- [ ] Можете автоматически форматировать код
- [ ] Создаёте автоматические backup файлов
- [ ] Считаете статистику работы
- [ ] Понимаете безопасность hooks

---

## 🎯 Главные выводы

1. **Hooks = автоматизация** → Настроили один раз, работает всегда
2. **Pre-hooks = защита** → Блокируют опасные действия
3. **Post-hooks = улучшение** → Автоматически улучшают результат
4. **Экономия времени** → До 3-4 часов в день на рутине

---

---

## 🎯 Тест на понимание

### Блок 1: Основы hooks (4 вопроса)

**Вопрос 1:** Что такое hooks в Claude Code?

- A) Специальные команды для работы с Git
- B) Автоматические скрипты, которые срабатывают в определенные моменты работы
- C) Плагины для расширения функционала
- D) Инструменты для отладки кода

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:** Hooks — это автоматические помощники (скрипты), которые запускаются в определенные моменты: до действия (pre-operation), после действия (post-operation) или при начале/завершении сессии (session hooks). Настраиваются один раз и работают автоматически.

</details>

---

**Вопрос 2:** Какой тип hook нужен для блокировки опасной команды `rm -rf`?

- A) Post-operation hook
- B) Session-end hook
- C) Pre-operation hook
- D) Mid-operation hook

<details>
<summary>Показать ответ</summary>

**Правильный ответ: C**

**Объяснение:** Pre-operation hooks срабатывают **ДО** выполнения действия. Они могут вернуть `{ approved: false }` и заблокировать опасную команду до её выполнения. Post-operation hooks работают уже после выполнения, когда блокировать поздно.

</details>

---

**Вопрос 3:** Что вернёт hook для разрешения выполнения действия?

```javascript
module.exports = async (toolName, params) => {
  return { ??? };
};
```

- A) `{ success: true }`
- B) `{ approved: true }`
- C) `{ allowed: true }`
- D) Зависит от типа hook

<details>
<summary>Показать ответ</summary>

**Правильный ответ: D**

**Объяснение:**

- **Pre-operation hooks** возвращают `{ approved: true }` или `{ approved: false, reason: "..." }`
- **Post-operation hooks** возвращают `{ success: true }` или `{ success: false, error: "..." }`
- **Session hooks** возвращают `{ success: true }`

</details>

---

**Вопрос 4:** В какой папке по умолчанию хранятся hooks?

- A) `~/.claude/hooks/`
- B) `./hooks/`
- C) `./.claude/hooks/`
- D) `~/claude-code/hooks/`

<details>
<summary>Показать ответ</summary>

**Правильный ответ: A**

**Объяснение:** Hooks хранятся в глобальной директории пользователя: `~/.claude/hooks/`. Можно также использовать локальные hooks в `.claude/hooks/` внутри проекта, но глобальные работают для всех проектов.

</details>

---

### Блок 2: События жизненного цикла (3 вопроса)

**Вопрос 5:** В какой последовательности срабатывают hooks при сохранении файла?

- A) post-tool-use → pre-tool-use → session-end
- B) pre-tool-use → Write → post-tool-use
- C) session-start → Write → session-end
- D) Write → post-tool-use → session-end

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:**

1. **Pre-tool-use** — проверка перед действием (можно заблокировать)
2. **Write** — само действие (сохранение файла)
3. **Post-tool-use** — действия после сохранения (форматирование, логирование)

Session hooks (session-start, session-end) срабатывают только при начале/завершении всей сессии работы.

</details>

---

**Вопрос 6:** Какой параметр содержит путь к файлу в post-tool-use hook?

```javascript
module.exports = async (toolName, params) => {
  const filePath = params.???;
};
```

- A) `params.path`
- B) `params.file_path`
- C) `params.filepath`
- D) `params.file`

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:** Объект `params` содержит параметры операции. Для операций с файлами (Write, Edit) путь находится в `params.file_path`. Для команд Bash команда в `params.command`.

</details>

---

**Вопрос 7:** Что произойдёт, если pre-tool-use hook вернёт `{ approved: false }`?

- A) Действие выполнится с предупреждением
- B) Действие будет заблокировано
- C) Hook будет пропущен
- D) Возникнет ошибка

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:** Когда pre-operation hook возвращает `{ approved: false }`, действие полностью блокируется и не выполняется. Можно также добавить `reason: "причина блокировки"` для объяснения.

</details>

---

### Блок 3: Настройка и конфигурация (3 вопроса)

**Вопрос 8:** Как зарегистрировать hook для автоматического запуска?

- A) Создать файл в `~/.claude/hooks/` с любым именем
- B) Добавить путь в `~/.claude/settings.json` в секцию `hooks`
- C) Запустить команду `claude hooks register`
- D) Указать в `.env` файле

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:** Hook нужно зарегистрировать в `~/.claude/settings.json`:

```json
{
  "hooks": {
    "preToolUse": "~/.claude/hooks/security-guard.js",
    "postToolUse": "~/.claude/hooks/auto-format.js",
    "sessionStart": "~/.claude/hooks/session-start.js"
  }
}
```

</details>

---

**Вопрос 9:** Какой hook сработает для автоматического форматирования кода после сохранения?

- A) `pre-tool-use`
- B) `post-tool-use`
- C) `session-start`
- D) `mid-tool-use`

<details>
<summary>Показать ответ</summary>

**Правильный ответ: B**

**Объяснение:** Форматирование должно происходить **ПОСЛЕ** сохранения файла, поэтому используется post-tool-use hook. Пример:

```javascript
module.exports = async (toolName, params) => {
  if (toolName === "Write" && params.file_path.endsWith(".js")) {
    exec(`npx prettier --write "${params.file_path}"`);
  }
  return { success: true };
};
```

</details>

---

**Вопрос 10:** Как передать контекст между разными hooks (например, счётчик файлов)?

- A) Использовать глобальную переменную в модуле
- B) Сохранить в файл и читать из него
- C) Использовать базу данных
- D) Передать через параметры функции

<details>
<summary>Показать ответ</summary>

**Правильный ответ: A**

**Объяснение:** Глобальные переменные в модуле сохраняются между вызовами:

```javascript
let filesChanged = 0; // Глобальная переменная

module.exports = async (toolName, params) => {
  if (toolName === "Write") {
    filesChanged++; // Увеличивается при каждом вызове
  }
  return { success: true };
};
```

</details>

---

### Оценка результатов

- **9-10 правильных ответов:** 🏆 Отлично! Вы полностью освоили hooks
- **7-8 правильных ответов:** ✅ Хорошо! Небольшие пробелы легко закрыть
- **5-6 правильных ответов:** 📚 Неплохо, но нужно повторить материал
- **Менее 5 правильных ответов:** 🔄 Перечитайте статью и попробуйте снова

---

## 💻 Практические задания

### Задание 1: Автоматический линтер (Базовое)

**Время:** 15-25 минут
**Цель:** Научиться создавать post-operation hooks для автоматического улучшения кода

**Задача:**
Создайте hook, который автоматически запускает ESLint после каждого сохранения JavaScript файла и показывает найденные ошибки.

**Требования:**

1. Hook должен срабатывать только для `.js` файлов
2. Запускать ESLint с автоисправлением (`--fix`)
3. Показывать количество исправленных ошибок
4. Логировать результат в консоль

**Шаги выполнения:**

1. Установите ESLint в проект:

```bash
npm install --save-dev eslint
npx eslint --init
```

2. Создайте hook файл:

```bash
mkdir -p ~/.claude/hooks
touch ~/.claude/hooks/auto-lint.js
```

3. Реализуйте базовую логику:

```javascript
// ~/.claude/hooks/auto-lint.js
const { exec } = require("child_process");
const path = require("path");

module.exports = async (toolName, params) => {
  // TODO: Проверить, что это Write или Edit
  // TODO: Проверить расширение файла (.js)
  // TODO: Запустить eslint --fix
  // TODO: Показать результат

  return { success: true };
};
```

4. Зарегистрируйте hook в `~/.claude/settings.json`

**Подсказки:**

- Используйте `exec()` для запуска команд
- Проверяйте расширение через `filePath.endsWith('.js')`
- ESLint возвращает количество ошибок в stderr

**Критерии успеха:**

- ✅ Hook автоматически запускается при сохранении .js файлов
- ✅ ESLint исправляет найденные ошибки
- ✅ Выводится сообщение с количеством исправлений
- ✅ Не срабатывает для других типов файлов

**Пример вывода:**

```
✅ Файл сохранён: /app/src/utils.js
🔍 Запуск ESLint...
✨ ESLint исправил 3 ошибки
```

<details>
<summary>Показать решение</summary>

```javascript
// ~/.claude/hooks/auto-lint.js
const { exec } = require("child_process");
const path = require("path");

module.exports = async (toolName, params) => {
  // Проверяем тип операции
  if (toolName !== "Write" && toolName !== "Edit") {
    return { success: true };
  }

  const filePath = params.file_path;

  // Проверяем расширение файла
  if (!filePath.endsWith(".js")) {
    return { success: true };
  }

  console.log(`🔍 Запуск ESLint для: ${path.basename(filePath)}`);

  // Запускаем ESLint с автоисправлением
  exec(`npx eslint --fix "${filePath}"`, (error, stdout, stderr) => {
    if (error && error.code !== 1) {
      // code 1 = найдены ошибки (это нормально)
      console.error("❌ Ошибка ESLint:", error.message);
      return;
    }

    // Подсчитываем исправления из вывода
    const fixedCount = (stdout.match(/fixed/g) || []).length;

    if (fixedCount > 0) {
      console.log(`✨ ESLint исправил ${fixedCount} ошибок`);
    } else {
      console.log("✅ Ошибок не найдено");
    }
  });

  return { success: true };
};
```

**Регистрация:**

```json
// ~/.claude/settings.json
{
  "hooks": {
    "postToolUse": "~/.claude/hooks/auto-lint.js"
  }
}
```

</details>

---

### Задание 2: CI/CD Workflow Hook (Продвинутое)

**Время:** 30-45 минут
**Цель:** Создать цепочку hooks для автоматического workflow при коммите

**Задача:**
Реализуйте систему из 3 hooks, которые автоматически:

1. **Pre-commit:** Проверяют, что все тесты проходят
2. **Post-commit:** Создают changelog из commit message
3. **Session-end:** Показывают статистику изменений

**Требования:**

**Hook 1: Pre-commit проверка**

- Запускать `npm test` перед git commit
- Блокировать коммит, если тесты не прошли
- Показывать количество пройденных/упавших тестов

**Hook 2: Auto-changelog**

- После успешного коммита добавлять запись в CHANGELOG.md
- Формат: `[YYYY-MM-DD HH:mm] - commit message`
- Группировать по датам

**Hook 3: Session статистика**

- Считать количество файлов, коммитов, строк кода
- Показывать при завершении сессии
- Сохранять историю в JSON файл

**Шаги выполнения:**

1. Создайте структуру:

```bash
mkdir -p ~/.claude/hooks
touch ~/.claude/hooks/pre-commit-test.js
touch ~/.claude/hooks/post-commit-changelog.js
touch ~/.claude/hooks/session-stats.js
```

2. Реализуйте Pre-commit hook:

```javascript
// ~/.claude/hooks/pre-commit-test.js
module.exports = async (toolName, params) => {
  // TODO: Проверить, что это git commit команда
  // TODO: Запустить npm test
  // TODO: Если тесты упали - блокировать (approved: false)
  // TODO: Если прошли - разрешить (approved: true)
};
```

3. Реализуйте Post-commit hook:

```javascript
// ~/.claude/hooks/post-commit-changelog.js
module.exports = async (toolName, params) => {
  // TODO: Извлечь commit message из команды
  // TODO: Добавить запись в CHANGELOG.md
  // TODO: Форматировать с датой и временем
};
```

4. Реализуйте Session stats hook:

```javascript
// ~/.claude/hooks/session-stats.js
let stats = {
  files: 0,
  commits: 0,
  lines: 0,
};

// session-start.js
module.exports = async () => {
  // TODO: Обнулить счётчики
};

// post-tool-use.js
module.exports = async (toolName, params) => {
  // TODO: Увеличивать счётчики
};

// session-end.js
module.exports = async () => {
  // TODO: Показать статистику
  // TODO: Сохранить в history.json
};
```

**Критерии успеха:**

- ✅ Коммит блокируется при падении тестов
- ✅ CHANGELOG.md автоматически обновляется
- ✅ Статистика корректно собирается и сохраняется
- ✅ Все hooks работают в цепочке без ошибок

**Пример вывода:**

```
🔍 Pre-commit: запуск тестов...
✅ Тесты пройдены: 15/15
✅ Коммит разрешён

📝 Post-commit: обновление CHANGELOG...
✅ Добавлена запись: [2025-01-15 14:30] feat: добавлен новый компонент

👋 Сессия завершена!
📊 Статистика:
   - Файлов изменено: 8
   - Коммитов: 3
   - Строк кода: +247
💾 Сохранено в ~/.claude/history.json
```

<details>
<summary>Показать решение</summary>

**Pre-commit hook:**

```javascript
// ~/.claude/hooks/pre-commit-test.js
const { execSync } = require("child_process");

module.exports = async (toolName, params) => {
  if (toolName !== "Bash") return { approved: true };

  const command = params.command;
  if (!command.includes("git commit")) return { approved: true };

  console.log("🔍 Pre-commit: запуск тестов...");

  try {
    const output = execSync("npm test", { encoding: "utf-8" });
    const passedTests = (output.match(/✓/g) || []).length;

    console.log(`✅ Тесты пройдены: ${passedTests}/${passedTests}`);
    console.log("✅ Коммит разрешён\n");

    return { approved: true };
  } catch (error) {
    console.error("❌ Тесты не прошли!");
    console.error(error.stdout);

    return {
      approved: false,
      reason: "Тесты не прошли. Исправьте ошибки перед коммитом.",
    };
  }
};
```

**Post-commit hook:**

```javascript
// ~/.claude/hooks/post-commit-changelog.js
const fs = require("fs");
const path = require("path");

module.exports = async (toolName, params) => {
  if (toolName !== "Bash") return { success: true };

  const command = params.command;
  if (!command.includes("git commit")) return { success: true };

  // Извлекаем commit message
  const messageMatch = command.match(/git commit -m ["'](.+)["']/);
  if (!messageMatch) return { success: true };

  const commitMessage = messageMatch[1];
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);

  // Путь к CHANGELOG
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const entry = `[${timestamp}] - ${commitMessage}\n`;

  // Добавляем запись
  try {
    let content = "";
    if (fs.existsSync(changelogPath)) {
      content = fs.readFileSync(changelogPath, "utf-8");
    } else {
      content = "# Changelog\n\n";
    }

    // Вставляем новую запись после заголовка
    const lines = content.split("\n");
    lines.splice(2, 0, entry);

    fs.writeFileSync(changelogPath, lines.join("\n"));

    console.log(`📝 Post-commit: обновление CHANGELOG...`);
    console.log(`✅ Добавлена запись: ${entry}`);
  } catch (error) {
    console.error("❌ Ошибка обновления CHANGELOG:", error.message);
  }

  return { success: true };
};
```

**Session stats hooks:**

```javascript
// ~/.claude/hooks/session-stats.js
const fs = require("fs");
const path = require("path");

// Глобальная статистика
let stats = {
  files: 0,
  commits: 0,
  linesAdded: 0,
  linesRemoved: 0,
  startTime: null,
  endTime: null,
};

// Экспортируем 3 функции для разных типов hooks
module.exports = {
  // Session start
  onStart: async () => {
    stats = {
      files: 0,
      commits: 0,
      linesAdded: 0,
      linesRemoved: 0,
      startTime: new Date(),
      endTime: null,
    };
    console.log("🚀 Новая сессия начата!");
    return { success: true };
  },

  // Post tool use
  onToolUse: async (toolName, params) => {
    if (toolName === "Write" || toolName === "Edit") {
      stats.files++;

      // Подсчёт строк
      if (params.content) {
        const lines = params.content.split("\n").length;
        stats.linesAdded += lines;
      }
    }

    if (toolName === "Bash" && params.command.includes("git commit")) {
      stats.commits++;
    }

    return { success: true };
  },

  // Session end
  onEnd: async () => {
    stats.endTime = new Date();
    const duration = Math.round((stats.endTime - stats.startTime) / 1000 / 60);

    console.log("\n👋 Сессия завершена!");
    console.log("📊 Статистика:");
    console.log(`   - Файлов изменено: ${stats.files}`);
    console.log(`   - Коммитов: ${stats.commits}`);
    console.log(`   - Строк кода: +${stats.linesAdded}`);
    console.log(`   - Длительность: ${duration} мин`);

    // Сохраняем историю
    const historyPath = path.join(process.env.HOME, ".claude", "history.json");
    let history = [];

    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    }

    history.push({
      ...stats,
      startTime: stats.startTime.toISOString(),
      endTime: stats.endTime.toISOString(),
    });

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`💾 Сохранено в ${historyPath}\n`);

    return { success: true };
  },
};
```

**Регистрация всех hooks:**

```json
// ~/.claude/settings.json
{
  "hooks": {
    "preToolUse": "~/.claude/hooks/pre-commit-test.js",
    "postToolUse": [
      "~/.claude/hooks/post-commit-changelog.js",
      "~/.claude/hooks/session-stats.js::onToolUse"
    ],
    "sessionStart": "~/.claude/hooks/session-stats.js::onStart",
    "sessionEnd": "~/.claude/hooks/session-stats.js::onEnd"
  }
}
```

</details>

---

### Задание 3: Полная автоматизация Development процесса (Проектное)

**Время:** 50-60+ минут
**Цель:** Создать комплексную систему hooks для автоматизации всего workflow

**Задача:**
Разработайте полноценную систему автоматизации, которая включает:

1. **Code Quality Automation**

   - Автоформатирование (Prettier)
   - Линтинг (ESLint)
   - Type checking (TypeScript)
   - Import sorting

2. **Testing Automation**

   - Автозапуск тестов при изменении кода
   - Генерация coverage отчётов
   - Создание snapshot тестов для новых компонентов

3. **Documentation Automation**

   - Автогенерация JSDoc комментариев
   - Обновление API документации
   - Создание примеров использования

4. **Git Workflow Automation**

   - Валидация commit messages (conventional commits)
   - Автоматическое версионирование
   - Генерация release notes

5. **Performance Monitoring**
   - Отслеживание размера bundle
   - Проверка производительности сборки
   - Алерты при деградации метрик

**Требования:**

**Архитектура:**

```
~/.claude/hooks/
├── core/
│   ├── hook-manager.js        # Центральный менеджер hooks
│   ├── logger.js              # Система логирования
│   └── config.js              # Конфигурация
├── quality/
│   ├── auto-format.js         # Prettier + ESLint
│   ├── type-check.js          # TypeScript проверка
│   └── import-sort.js         # Сортировка импортов
├── testing/
│   ├── auto-test.js           # Запуск тестов
│   ├── coverage.js            # Coverage отчёты
│   └── snapshot-gen.js        # Генерация snapshots
├── docs/
│   ├── jsdoc-gen.js           # JSDoc генерация
│   ├── api-docs.js            # API документация
│   └── examples-gen.js        # Примеры кода
├── git/
│   ├── commit-lint.js         # Валидация коммитов
│   ├── versioning.js          # Автоверсионирование
│   └── release-notes.js       # Release notes
└── monitoring/
    ├── bundle-size.js         # Размер bundle
    ├── build-perf.js          # Производительность
    └── metrics.js             # Сбор метрик
```

**Функционал:**

1. **Smart Hook Manager** - центральная система управления:

```javascript
// ~/.claude/hooks/core/hook-manager.js
class HookManager {
  constructor() {
    this.hooks = new Map();
    this.metrics = {
      totalRuns: 0,
      errors: 0,
      avgDuration: 0,
    };
  }

  async register(name, hook, options = {}) {
    // TODO: Регистрация hook с опциями
  }

  async execute(type, context) {
    // TODO: Выполнение всех hooks данного типа
    // TODO: Обработка ошибок
    // TODO: Сбор метрик
  }

  getMetrics() {
    // TODO: Возврат статистики
  }
}
```

2. **Conditional Execution** - умное выполнение:

```javascript
// Пример: запускать тесты только для определённых файлов
{
  name: 'auto-test',
  enabled: true,
  condition: (context) => {
    return context.filePath.includes('/src/') &&
           !context.filePath.includes('.test.');
  },
  timeout: 30000
}
```

3. **Parallel Execution** - параллельный запуск:

```javascript
// Запускать независимые hooks параллельно
await Promise.all([runFormatter(), runLinter(), runTypeCheck()]);
```

4. **Error Recovery** - восстановление после ошибок:

```javascript
// Retry механизм для нестабильных операций
async function withRetry(fn, maxRetries = 3) {
  // TODO: Реализация retry логики
}
```

5. **Rich Logging** - детальное логирование:

```javascript
// ~/.claude/hooks/core/logger.js
class Logger {
  info(message, meta) {
    /* ... */
  }
  warn(message, meta) {
    /* ... */
  }
  error(message, meta) {
    /* ... */
  }
  metrics(data) {
    /* ... */
  }
}
```

**Критерии успеха:**

- ✅ Все 15+ hooks работают корректно
- ✅ Система обрабатывает ошибки без падения
- ✅ Параллельное выполнение ускоряет процесс
- ✅ Метрики собираются и отображаются
- ✅ Conditional execution экономит время
- ✅ Документация генерируется автоматически

**Бонусные задачи:**

- 🎯 Добавить webhook уведомления в Slack/Discord
- 🎯 Интеграция с CI/CD (GitHub Actions)
- 🎯 Dashboard для визуализации метрик
- 🎯 AI-powered code review hook

**Пример финального вывода:**

```
🚀 Claude Code Session Started

📝 File changed: src/components/Button.tsx
  ✨ Auto-format: Applied Prettier
  🔍 ESLint: 0 errors
  📘 TypeScript: No errors
  📚 JSDoc: Generated docs
  🧪 Tests: 12/12 passed
  📊 Coverage: 87% (+2%)

📝 File changed: src/utils/helpers.js
  ✨ Auto-format: Applied Prettier
  🔍 ESLint: Fixed 2 errors
  🧪 Tests: 8/8 passed

💾 Commit: feat: add Button component
  ✅ Commit message valid (conventional)
  📝 CHANGELOG updated
  🏷️  Version bumped: 1.2.3 → 1.3.0
  📄 Release notes generated

👋 Session Ended
📊 Session Statistics:
   - Duration: 45 min
   - Files changed: 8
   - Lines added: +347 -89
   - Commits: 3
   - Tests run: 156 (100% passed)
   - Code coverage: 89% (+5%)
   - Bundle size: 245 KB (-12 KB)
   - Build time: 12.3s (-2.1s)

✨ Quality Score: 9.4/10
💾 Metrics saved to ~/.claude/metrics/2025-01-15.json
```

<details>
<summary>Показать примерную структуру решения</summary>

**1. Hook Manager:**

```javascript
// ~/.claude/hooks/core/hook-manager.js
const fs = require("fs");
const path = require("path");

class HookManager {
  constructor() {
    this.hooks = new Map();
    this.logger = require("./logger");
    this.config = require("./config");
    this.metrics = {
      totalRuns: 0,
      successRuns: 0,
      errors: 0,
      totalDuration: 0,
    };
  }

  register(name, hookFn, options = {}) {
    this.hooks.set(name, {
      fn: hookFn,
      enabled: options.enabled ?? true,
      condition: options.condition ?? (() => true),
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 0,
      parallel: options.parallel ?? false,
    });
  }

  async execute(type, context) {
    const startTime = Date.now();
    this.metrics.totalRuns++;

    const hooksToRun = Array.from(this.hooks.entries()).filter(
      ([_, hook]) => hook.enabled && hook.condition(context),
    );

    if (hooksToRun.length === 0) {
      return { success: true, results: [] };
    }

    try {
      // Разделяем на параллельные и последовательные
      const parallelHooks = hooksToRun.filter(([_, h]) => h.parallel);
      const sequentialHooks = hooksToRun.filter(([_, h]) => !h.parallel);

      const results = [];

      // Параллельное выполнение
      if (parallelHooks.length > 0) {
        const parallelResults = await Promise.all(
          parallelHooks.map(([name, hook]) =>
            this._runHook(name, hook, context),
          ),
        );
        results.push(...parallelResults);
      }

      // Последовательное выполнение
      for (const [name, hook] of sequentialHooks) {
        const result = await this._runHook(name, hook, context);
        results.push(result);
      }

      this.metrics.successRuns++;
      this.metrics.totalDuration += Date.now() - startTime;

      return { success: true, results };
    } catch (error) {
      this.metrics.errors++;
      this.logger.error("Hook execution failed", { error, type });
      return { success: false, error: error.message };
    }
  }

  async _runHook(name, hook, context) {
    const startTime = Date.now();
    this.logger.info(`Running hook: ${name}`);

    try {
      const result = await this._withTimeout(hook.fn(context), hook.timeout);

      const duration = Date.now() - startTime;
      this.logger.info(`Hook completed: ${name}`, { duration });

      return { name, success: true, duration, result };
    } catch (error) {
      if (hook.retries > 0) {
        return await this._retryHook(name, hook, context, hook.retries);
      }

      this.logger.error(`Hook failed: ${name}`, { error });
      return { name, success: false, error: error.message };
    }
  }

  async _retryHook(name, hook, context, retriesLeft) {
    this.logger.warn(`Retrying hook: ${name} (${retriesLeft} left)`);
    await new Promise((r) => setTimeout(r, 1000)); // Задержка перед retry

    try {
      const result = await hook.fn(context);
      this.logger.info(`Hook retry succeeded: ${name}`);
      return { name, success: true, result };
    } catch (error) {
      if (retriesLeft > 1) {
        return await this._retryHook(name, hook, context, retriesLeft - 1);
      }
      throw error;
    }
  }

  async _withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Hook timeout")), timeout),
      ),
    ]);
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgDuration:
        this.metrics.totalRuns > 0
          ? Math.round(this.metrics.totalDuration / this.metrics.totalRuns)
          : 0,
      successRate:
        this.metrics.totalRuns > 0
          ? Math.round(
              (this.metrics.successRuns / this.metrics.totalRuns) * 100,
            )
          : 0,
    };
  }

  saveMetrics() {
    const metricsPath = path.join(
      process.env.HOME,
      ".claude",
      "metrics",
      `${new Date().toISOString().split("T")[0]}.json`,
    );

    const metricsDir = path.dirname(metricsPath);
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    fs.writeFileSync(metricsPath, JSON.stringify(this.getMetrics(), null, 2));
  }
}

module.exports = new HookManager();
```

**2. Пример Quality Hook:**

```javascript
// ~/.claude/hooks/quality/auto-format.js
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

module.exports = async (context) => {
  const { filePath } = context;

  if (!filePath.match(/\.(js|ts|jsx|tsx)$/)) {
    return { skipped: true, reason: "Not a JS/TS file" };
  }

  try {
    // Prettier
    await execAsync(`npx prettier --write "${filePath}"`);

    // ESLint
    const { stdout } = await execAsync(`npx eslint --fix "${filePath}"`).catch(
      (e) => ({ stdout: e.stdout }),
    );

    const fixedCount = (stdout.match(/fixed/g) || []).length;

    return {
      success: true,
      formatted: true,
      lintFixed: fixedCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
```

**3. Main Hook Entry:**

```javascript
// ~/.claude/hooks/index.js
const HookManager = require("./core/hook-manager");

// Quality hooks
HookManager.register("auto-format", require("./quality/auto-format"), {
  parallel: true,
});
HookManager.register("type-check", require("./quality/type-check"), {
  parallel: true,
});

// Testing hooks
HookManager.register("auto-test", require("./testing/auto-test"), {
  condition: (ctx) => ctx.filePath.includes("/src/"),
});

// Git hooks
HookManager.register("commit-lint", require("./git/commit-lint"));

// Export unified hooks
module.exports = {
  preToolUse: async (toolName, params) => {
    return await HookManager.execute("pre", { toolName, params });
  },

  postToolUse: async (toolName, params) => {
    const result = await HookManager.execute("post", { toolName, params });
    return result.success ? { success: true } : { success: false };
  },

  sessionEnd: async () => {
    const metrics = HookManager.getMetrics();
    console.log("\n📊 Session Metrics:");
    console.log(`   - Total hooks run: ${metrics.totalRuns}`);
    console.log(`   - Success rate: ${metrics.successRate}%`);
    console.log(`   - Avg duration: ${metrics.avgDuration}ms`);

    HookManager.saveMetrics();
    return { success: true };
  },
};
```

</details>

---

## Навигация

← [Предыдущая статья: 06. Субагенты](06-СУБАГЕНТЫ.md)
→ [Следующая статья: 08. Output styles](08-OUTPUT-STYLES.md)

**Прогресс:** 7 из 11 статей раздела "Claude Code" | [Вернуться к содержанию](README.md)

---

> 💡 **Ключевой инсайт главы:** Hooks превращают Claude Code в умного ассистента, который не просто выполняет команды, а автоматически делает вашу работу лучше, быстрее и безопаснее. Это как перейти от обычной машины к машине с автопилотом.

**Следующая глава:** Узнаете, как управлять стилем вывода Claude для разных ситуаций — от подробных объяснений для новичков до сжатых технических ответов для production.
