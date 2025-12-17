# 08. OUTPUT STYLES

**Предыдущий контекст:** В [07-HOOKS-И-АВТОМАТИЗАЦИЯ.md](07-HOOKS-И-АВТОМАТИЗАЦИЯ.md) вы научились автоматизировать рутинные задачи с помощью hooks. Теперь узнаете, как управлять стилем ответов Claude — от подробных объяснений для обучения до сжатых команд для работы.

---

## 🏠 Аналогия из жизни

Представьте учителя, который может объяснить одну и ту же тему тремя способами:

**📚 Для начинающих** — объясняет каждую деталь, приводит примеры из жизни, рисует схемы
**⚡ Для опытных** — даёт только факты, никаких лишних слов
**🔧 Для экспертов** — использует специальные термины, говорит о технических деталях

Output styles работают точно так же — Claude может отвечать по-разному в зависимости от вашего уровня и задачи.

---

## Что такое output styles?

**Output styles** (стили ответов) — это способ управления тем, **как** Claude отвечает на ваши вопросы.

### 🎯 Три встроенных стиля

1. **EXPLANATORY** (Объясняющий) — для обучения
2. **CONCISE** (Краткий) — для быстрой работы
3. **TECHNICAL** (Технический) — для экспертов

---

## 📚 EXPLANATORY — Стиль для обучения

### 🎯 Задача

Вы учите новую технологию и вам нужно **понять**, как всё работает.

### 💡 Когда использовать

- Изучаете новый язык или фреймворк
- Нужно понять WHY, а не только HOW
- Объясняете код коллеге
- Пишете документацию

### Пример

**❓ Вопрос:** "Как обработать ошибки в async функции?"

**📚 EXPLANATORY ответ:**

```javascript
// Используем try-catch для перехвата ошибок
async function fetchUserData(userId) {
  try {
    // Делаем запрос к API
    const response = await fetch(`/api/users/${userId}`);

    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }
```

**Что здесь происходит:**

1. `try` — пытаемся выполнить код
2. `await fetch()` — ждём ответ от сервера
3. `if (!response.ok)` — проверяем код ответа (200, 404, 500 и т.д.)

```javascript
    // Получаем данные пользователя
    const data = await response.json();
    return data;

  } catch (error) {
    // Ловим ошибку и логируем
    console.error('Не удалось загрузить пользователя:', error);
    throw error;
  }
}
```

**Что здесь происходит:** 4. `response.json()` — превращаем ответ в JavaScript объект 5. `catch (error)` — ловим любую ошибку из блока try 6. `throw error` — пробрасываем ошибку дальше

✅ **Результат:** Полное понимание каждого шага + защита от ошибок

**⚠️ Частые ошибки:**

- Забыть `await` — получите Promise вместо данных
- Не проверить `response.ok` — пропустите ошибки сервера
- "Проглотить" ошибку в catch — скрыть проблему

---

## ⚡ CONCISE — Стиль для быстрой работы

### 🎯 Задача

Вы знаете контекст, нужен только готовый код.

### 💡 Когда использовать

- Быстрая разработка
- Code review или рефакторинг
- Работа со знакомыми технологиями

### Пример

**❓ Вопрос:** "Как обработать ошибки в async функции?"

**⚡ CONCISE ответ:**

```javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}
```

✅ **Результат:** Готовый код без объяснений — скопировал и работает

---

## 🔧 TECHNICAL — Стиль для экспертов

### 🎯 Задача

Нужны технические детали, типы данных, оптимизации.

### 💡 Когда использовать

- Системное программирование
- Performance-критичный код
- Работа с низкоуровневыми API

### Пример

**❓ Вопрос:** "Как обработать ошибки в async функции?"

**🔧 TECHNICAL ответ:**

```typescript
// Безопасная обработка с типами
type Result<T> = { success: true; data: T } | { success: false; error: Error };
```

**Что здесь происходит:**

- Создаём тип Result, который может быть либо успехом, либо ошибкой
- `<T>` — дженерик (generic), позволяет работать с любым типом данных

```typescript
async function fetchUserData(userId: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      signal: AbortSignal.timeout(5000), // Таймаут 5 секунд
    });
```

**Что здесь происходит:**

- `Promise<Result<User>>` — функция вернёт промис с Result содержащим User
- `AbortSignal.timeout(5000)` — встроенный таймаут (без дополнительных библиотек)

```typescript
    if (!response.ok) {
      return { success: false, error: new HttpError(response.status) };
    }

    const data = await response.json() as User;
    return { success: true, data };

  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

**Что здесь происходит:**

- Вместо throw возвращаем объект с ошибкой
- `as User` — явное приведение типов для TypeScript
- Обрабатываем ошибки сети, таймауты, JSON parsing

✅ **Результат:** Типобезопасный код с оптимизациями

**Использование:**

```typescript
const result = await fetchUserData("123");
if (result.success) {
  console.log(result.data.name); // TypeScript знает тип
} else {
  console.error(result.error.message);
}
```

---

## 🎨 Когда какой стиль использовать

| Ситуация                  | Стиль       | Почему             |
| ------------------------- | ----------- | ------------------ |
| 🎓 Изучаю новый фреймворк | EXPLANATORY | Нужен контекст     |
| ⚡ Пишу знакомый код      | CONCISE     | Нужна скорость     |
| 🔧 Оптимизирую код        | TECHNICAL   | Нужны детали       |
| 👨‍🏫 Помогаю новичку        | EXPLANATORY | Нужны объяснения   |
| 👀 Code review            | CONCISE     | Быстро понять      |
| 🏗️ Архитектурное решение  | TECHNICAL   | Нужны спецификации |

---

## 🔄 Переключение стилей

### 💡 Простое решение

```bash
# Переключить стиль для всей сессии
/style explanatory

# Или указать стиль в начале вопроса
[concise] Создай React компонент для формы
```

**Что здесь происходит:**

1. `/style explanatory` — все следующие ответы будут подробными
2. `[concise]` — только этот ответ будет кратким

✅ **Результат:** Гибкое управление стилем без редактирования настроек

### 💡 Автоматическое переключение

🎯 **Задача:** Claude сам выбирает стиль на основе ваших слов.

```javascript
// ~/.claude/hooks/auto-style-switch.js

// Ключевые слова для каждого стиля
const keywords = {
  learning: ["как работает", "почему", "объясни"],
  production: ["быстро", "срочно", "исправь"],
  optimization: ["оптимизируй", "performance", "ускорь"],
};
```

**Что здесь происходит:**

- `learning` — слова для обучения → EXPLANATORY стиль
- `production` — слова для работы → CONCISE стиль
- `optimization` — слова для оптимизации → TECHNICAL стиль

```javascript
module.exports = async (prompt, context) => {
  // Проверяем каждую категорию
  for (const [category, words] of Object.entries(keywords)) {
    // Ищем совпадения в вашем вопросе
    if (words.some((word) => prompt.toLowerCase().includes(word))) {
      const styleMap = {
        learning: "explanatory",
        production: "concise",
        optimization: "technical",
      };

      context.outputStyle = styleMap[category];
      break;
    }
  }

  return { approved: true };
};
```

**Что здесь происходит:**

1. `for...of` — проходим по каждой категории ключевых слов
2. `words.some(...)` — проверяем, есть ли хоть одно ключевое слово
3. `styleMap[category]` — выбираем соответствующий стиль
4. `context.outputStyle` — устанавливаем новый стиль

✅ **Результат:**

- Спросили "почему не работает?" → подробный ответ
- Спросили "быстро исправь" → только код
- Спросили "оптимизируй" → технические детали

---

## 🛠️ Создание своего стиля

### 🎯 Задача

Создать специальный стиль для работы с Telegram ботами.

### 💡 Простое решение

**Шаг 1:** Создайте файл стиля

```javascript
// ~/.claude/output-styles/telegram-dev.js
module.exports = {
  name: 'telegram-dev',
  description: 'Стиль для разработки Telegram ботов',
```

**Что здесь происходит:**

- `name` — имя стиля для вызова
- `description` — описание назначения

**Шаг 2:** Настройте правила

```javascript
  rules: {
    includeExamples: true,      // Всегда примеры
    showTypes: true,             // Показывать типы данных
    includeDocLinks: true,       // Ссылки на документацию

    telegram: {
      showBotToken: false,       // НЕ показывать токены
      includeChatId: true,       // Показывать chat_id
      showInlineKeyboards: true  // Примеры клавиатур
    }
  },
```

**Что здесь происходит:**

- Включаем полезные опции для Telegram ботов
- `showBotToken: false` — безопасность (не показываем секретные токены)
- Специфичные настройки для Telegram API

**Шаг 3:** Создайте шаблон ответа

```javascript
  template: (question, answer) => {
    return `
🤖 TELEGRAM BOT DEVELOPMENT

📋 Задача: ${question}

💻 Решение:
${answer.code}

🔗 Документация:
${answer.docLinks || 'N/A'}

⚠️ Важно для Telegram:
${answer.telegramNotes || 'N/A'}
    `.trim();
  }
};
```

**Что здесь происходит:**

- `template` — функция форматирования ответа
- Используем эмодзи для визуального разделения
- `${question}` — вставляем ваш вопрос
- `${answer.code}` — вставляем код от Claude

✅ **Результат:** Каждый ответ будет в едином формате с документацией и важными примечаниями

**Шаг 4:** Используйте стиль

```bash
# Установить свой стиль
/style telegram-dev

# Задать вопрос
"Как отправить inline keyboard?"
```

**Что получите:**

```
🤖 TELEGRAM BOT DEVELOPMENT

📋 Задача: Как отправить inline keyboard?

💻 Решение:
[готовый код с примером]

🔗 Документация:
https://core.telegram.org/bots/api#inlinekeyboardmarkup

⚠️ Важно для Telegram:
- Используйте answerCallbackQuery
- Максимум 8 кнопок в ряду
- callback_data ограничен 64 байтами
```

---

## ⚙️ Настройки в settings.json

### 💡 Базовая конфигурация

```json
{
  "outputStyle": {
    "default": "concise",
    "styles": {
      "explanatory": {
        "verbosity": "high",
        "includeExamples": true
      }
    }
  }
}
```

**Что здесь происходит:**

- `default` — стиль по умолчанию
- `verbosity` — подробность ответа (высокая/низкая)
- `includeExamples` — включать примеры (да/нет)

### 💡 Автоматическое переключение

```json
{
  "outputStyle": {
    "autoSwitch": {
      "enabled": true,
      "rules": [
        {
          "pattern": "как работает|почему",
          "style": "explanatory"
        },
        {
          "pattern": "быстро|срочно",
          "style": "concise"
        }
      ]
    }
  }
}
```

**Что здесь происходит:**

1. `autoSwitch.enabled: true` — включаем автоматику
2. `pattern` — регулярное выражение для поиска слов
3. `style` — какой стиль применить при совпадении

✅ **Результат:** Claude сам подстраивается под ваши слова

---

## 🎓 Для обучения vs ⚡ Для работы

### 🏠 Аналогия

**Обучение** — как учитель в школе: объясняет каждый шаг, приводит примеры, предупреждает об ошибках

**Работа** — как инструкция IKEA: минимум слов, максимум дела

### Стиль для обучения

```json
{
  "name": "learning",
  "features": {
    "stepByStep": true, // Пошагово
    "includeAnalogies": true, // Аналогии из жизни
    "commonMistakes": true, // Частые ошибки
    "practiceExercises": true // Упражнения
  }
}
```

**Что даёт:**

- ✅ Глубокое понимание
- ✅ Примеры из жизни
- ✅ Предупреждения об ошибках
- ❌ Медленно для опытных

### Стиль для работы

```json
{
  "name": "production",
  "features": {
    "codeOnly": true, // Только код
    "noExplanations": true, // Без объяснений
    "optimized": true // Оптимизированный
  }
}
```

**Что даёт:**

- ✅ Быстрые ответы
- ✅ Готовый код
- ✅ Высокая скорость
- ❌ Нет контекста для новичков

---

## 💼 Практические сценарии

### Сценарий 1: Изучаю React

```bash
# Установите EXPLANATORY
/style explanatory

# Задайте вопрос
"Как работает useEffect?"

# Получите подробное объяснение с примерами и аналогиями
```

### Сценарий 2: Быстрый фикс бага

```bash
# Установите CONCISE
/style concise

# Покажите код
"Исправь этот баг: [код]"

# Получите только исправленный код
```

### Сценарий 3: Оптимизация

```bash
# Установите TECHNICAL
/style technical

# Задайте задачу
"Оптимизируй этот React компонент"

# Получите техническое решение с мемоизацией и бенчмарками
```

---

## ✍️ Упражнение

### 🎯 Задача

Создайте стиль для REST API разработки с автоматическими curl примерами.

<details>
<summary>💡 Подсказка</summary>

1. Создайте файл `~/.claude/output-styles/api-dev.js`
2. Добавьте template с секциями:
   - Endpoint (путь API)
   - Implementation (код)
   - cURL Example (пример запроса)
3. В postProcess автоматически генерируйте curl команды

</details>

<details>
<summary>✅ Решение</summary>

```javascript
// ~/.claude/output-styles/api-dev.js
module.exports = {
  name: "api-dev",

  template: (question, answer) => {
    return `
📡 REST API

🎯 Endpoint: ${answer.endpoint || "N/A"}

💻 Код:
${answer.code}

🔧 Тест (cURL):
${answer.curlExample || "N/A"}
    `.trim();
  },

  postProcess: (response) => {
    // Найти метод (GET или POST)
    const method = response.includes("app.post") ? "POST" : "GET";

    // Найти endpoint путь
    const endpoint = response.match(/['"]([/\w:-]+)['"]/)?.[1] || "/api";

    // Создать curl команду
    const curl =
      method === "POST"
        ? `curl -X POST http://localhost:3000${endpoint} -H "Content-Type: application/json" -d '{"key": "value"}'`
        : `curl http://localhost:3000${endpoint}`;

    // Добавить curl в ответ
    response += `\n\n🔧 Тест:\n\`\`\`bash\n${curl}\n\`\`\``;

    return response;
  },
};
```

**Что здесь происходит:**

1. `template` — форматируем ответ с секциями
2. `postProcess` — обрабатываем ответ после генерации
3. Автоматически создаём curl команду для тестирования
4. Добавляем curl в конец ответа

</details>

---

## 📖 Словарь простыми словами

| Термин              | Простыми словами                             |
| ------------------- | -------------------------------------------- |
| **Output Style**    | Стиль ответа (как Claude отвечает)           |
| **Verbosity**       | Подробность ответа (много или мало текста)   |
| **Template**        | Шаблон (форма для ответов)                   |
| **Post-processing** | Обработка после генерации (доработка ответа) |
| **Context-aware**   | Умный (учитывает ситуацию)                   |
| **Auto-detection**  | Автоопределение (сам выбирает нужное)        |

---

## Навигация

← [Предыдущая статья: 07. Hooks и автоматизация](07-HOOKS-И-АВТОМАТИЗАЦИЯ.md)
→ [Следующая статья: 09. Git воркфлоу](09-GIT-ВОРКФЛОУ.md)

**Прогресс:** 8 из 11 статей раздела "Claude Code" | [Вернуться к содержанию](README.md)

---

## 🧪 Тест на понимание

### Вопрос 1: Основы output styles

**Q:** Что такое output styles в Claude Code?

<details>
<summary>✅ Правильный ответ</summary>

Output styles — это способ управления тем, **как** Claude отвечает на вопросы. Это настройка формата, подробности и стиля ответов в зависимости от задачи.

**Зачем они нужны:**

- Для обучения — подробные объяснения (EXPLANATORY)
- Для быстрой работы — только код (CONCISE)
- Для оптимизации — технические детали (TECHNICAL)

**Аналогия:** Как учитель, который может объяснить одну тему тремя способами — для начинающих подробно, для опытных кратко, для экспертов технично.

</details>

---

### Вопрос 2: Типы встроенных стилей

**Q:** Опишите три встроенных стиля Claude Code и приведите пример, когда использовать каждый.

<details>
<summary>✅ Правильный ответ</summary>

**1. EXPLANATORY (Объясняющий)**

- **Формат:** Подробные объяснения, примеры, аналогии, частые ошибки
- **Когда:** Изучаете новую технологию, объясняете код, пишете документацию
- **Пример использования:** Изучаете React hooks, нужно понять WHY, а не только HOW

**2. CONCISE (Краткий)**

- **Формат:** Только готовый код, минимум текста
- **Когда:** Быстрая разработка, code review, знакомые технологии
- **Пример использования:** Срочный фикс бага, нужен готовый код без объяснений

**3. TECHNICAL (Технический)**

- **Формат:** Типы данных, оптимизации, низкоуровневые детали
- **Когда:** Performance-критичный код, системное программирование
- **Пример использования:** Оптимизация API с type-safe обработкой ошибок

</details>

---

### Вопрос 3: Примеры вывода в разных стилях

**Q:** Как будет выглядеть ответ на вопрос "Создай функцию сортировки массива" в каждом из трёх стилей?

<details>
<summary>✅ Правильный ответ</summary>

**📚 EXPLANATORY стиль:**

```javascript
// Функция сортировки массива чисел по возрастанию
function sortArray(numbers) {
  // Используем метод sort() с функцией сравнения
  return numbers.sort((a, b) => {
    // a - b для сортировки по возрастанию
    // Если результат отрицательный — a идёт первым
    // Если положительный — b идёт первым
    return a - b;
  });
}

// Пример использования:
const unsorted = [5, 2, 8, 1, 9];
const sorted = sortArray(unsorted); // [1, 2, 5, 8, 9]

// ⚠️ Важно: метод sort() изменяет исходный массив!
// Для копирования используйте [...numbers]
```

**⚡ CONCISE стиль:**

```javascript
function sortArray(numbers) {
  return numbers.sort((a, b) => a - b);
}
```

**🔧 TECHNICAL стиль:**

```typescript
// Type-safe сортировка с O(n log n) сложностью
function sortArray<T extends number>(numbers: T[]): T[] {
  // Используем QuickSort алгоритм через нативный sort()
  // Создаём копию для иммутабельности
  return [...numbers].sort((a: T, b: T): number => a - b);
}

// Альтернатива с кастомным компаратором
type Comparator<T> = (a: T, b: T) => number;

function genericSort<T>(
  arr: T[],
  compareFn: Comparator<T> = (a, b) => Number(a) - Number(b),
): T[] {
  return [...arr].sort(compareFn);
}
```

</details>

---

### Вопрос 4: Переключение стилей

**Q:** Назовите три способа переключения output стилей в Claude Code.

<details>
<summary>✅ Правильный ответ</summary>

**1. Глобальное переключение для сессии:**

```bash
/style explanatory
# Все следующие ответы будут подробными
```

**2. Разовое переключение для одного вопроса:**

```bash
[concise] Создай React компонент
# Только этот ответ будет кратким
```

**3. Автоматическое переключение через hook:**

```javascript
// ~/.claude/hooks/auto-style-switch.js
module.exports = async (prompt, context) => {
  if (prompt.includes("как работает") || prompt.includes("почему")) {
    context.outputStyle = "explanatory";
  } else if (prompt.includes("быстро") || prompt.includes("срочно")) {
    context.outputStyle = "concise";
  }
  return { approved: true };
};
```

**Бонус: Через settings.json:**

```json
{
  "outputStyle": {
    "default": "concise",
    "autoSwitch": {
      "enabled": true,
      "rules": [{ "pattern": "как работает|почему", "style": "explanatory" }]
    }
  }
}
```

</details>

---

### Вопрос 5: Создание кастомного стиля

**Q:** Какие основные элементы нужны для создания кастомного output стиля?

<details>
<summary>✅ Правильный ответ</summary>

**Минимальная структура:**

```javascript
module.exports = {
  name: "my-style", // Имя для вызова
  description: "Описание", // Что делает стиль

  rules: {
    // Правила форматирования
    includeExamples: true,
    showTypes: false,
    verbosity: "medium",
  },

  template: (question, answer) => {
    // Шаблон ответа
    return `
🎯 ЗАДАЧА: ${question}

💻 РЕШЕНИЕ:
${answer.code}
    `.trim();
  },
};
```

**Дополнительные элементы:**

- `preProcess()` — обработка ДО генерации ответа
- `postProcess()` — обработка ПОСЛЕ генерации
- `validator()` — проверка корректности ответа
- `contextAnalyzer()` — анализ контекста для выбора формата

**Пример расширенного стиля:**

```javascript
module.exports = {
  name: "debug-mode",

  preProcess: (question, context) => {
    // Добавить контекст к вопросу
    return `${question}\n\nТребуется: отладочная информация, типы, примеры`;
  },

  postProcess: (answer) => {
    // Добавить дебаг информацию
    const debug = `
🐛 DEBUG INFO:
- Время выполнения: ${Date.now()}
- Память: ${process.memoryUsage().heapUsed}
    `;
    return answer + debug;
  },
};
```

</details>

---

## 🏠 Домашнее задание

### 📝 Задание 1: Эксперименты со встроенными стилями (15-25 минут)

**Цель:** Научиться переключаться между стилями и понять разницу в ответах.

**Задача:**

1. Выберите любую техническую задачу (например: "Создай функцию валидации email")
2. Задайте этот вопрос Claude в трёх стилях: EXPLANATORY, CONCISE, TECHNICAL
3. Сравните ответы и запишите:
   - Объём кода (количество строк)
   - Количество комментариев
   - Наличие примеров использования
   - Технические детали (типы, оптимизации)

**Как делать:**

```bash
# Шаг 1: EXPLANATORY
/style explanatory
"Создай функцию валидации email"
[скопировать ответ]

# Шаг 2: CONCISE
/style concise
"Создай функцию валидации email"
[скопировать ответ]

# Шаг 3: TECHNICAL
/style technical
"Создай функцию валидации email"
[скопировать ответ]
```

**Критерии выполнения:**

- ✅ Получены ответы во всех трёх стилях
- ✅ Записано сравнение (таблица или текст)
- ✅ Сделаны выводы о том, когда использовать каждый стиль

**Ожидаемый результат:**

```
СРАВНИТЕЛЬНАЯ ТАБЛИЦА:
┌─────────────┬──────────┬────────────┬──────────┬───────────┐
│ Стиль       │ Строк    │ Комментарии│ Примеры  │ Типы      │
├─────────────┼──────────┼────────────┼──────────┼───────────┤
│ EXPLANATORY │ 25       │ 12         │ Да       │ Нет       │
│ CONCISE     │ 5        │ 0          │ Нет      │ Нет       │
│ TECHNICAL   │ 18       │ 3          │ Да       │ TypeScript│
└─────────────┴──────────┴────────────┴──────────┴───────────┘

ВЫВОДЫ:
- EXPLANATORY лучше для изучения (много объяснений)
- CONCISE для быстрой работы (готовый код)
- TECHNICAL для production кода (типы + оптимизации)
```

---

### 🎨 Задание 2: Создание кастомного стиля для проекта (30-45 минут)

**Цель:** Создать персональный output style для вашего типичного рабочего процесса.

**Задача:**
Создайте кастомный стиль для вашей основной технологии (React, Node.js, Python и т.д.) с автоматическими примерами и ссылками на документацию.

**Шаги:**

**1. Определите требования:**

```
МОЙ РАБОЧИЙ СТИЛЬ:
- Технология: [React/Node.js/Python/etc]
- Что всегда нужно: [примеры/тесты/типы/документация]
- Формат ответа: [структура с секциями]
- Специфичные детали: [lint правила/code style/etc]
```

**2. Создайте файл стиля:**

```bash
mkdir -p ~/.claude/output-styles
touch ~/.claude/output-styles/my-work-style.js
```

**3. Напишите конфигурацию:**

```javascript
module.exports = {
  name: "my-work-style",
  description: "Стиль для моего основного проекта",

  rules: {
    // Ваши правила
    includeExamples: true,
    includeTests: true,
    includeDocLinks: true,
    codeStyle: "airbnb", // или ваш стандарт
  },

  template: (question, answer) => {
    // Ваш шаблон
    return `
📋 ЗАДАЧА: ${question}

💻 КОД:
${answer.code}

🧪 ТЕСТЫ:
${answer.tests || "N/A"}

🔗 ДОКУМЕНТАЦИЯ:
${answer.docLinks || "N/A"}
    `.trim();
  },
};
```

**4. Протестируйте:**

```bash
/style my-work-style
"Создай компонент Button для моего проекта"
```

**Критерии выполнения:**

- ✅ Создан файл в `~/.claude/output-styles/`
- ✅ Стиль работает и применяется через `/style`
- ✅ Template включает нужные секции
- ✅ Протестировано на 3+ разных вопросах

**Дополнительные возможности (опционально):**

- Добавить `postProcess` для автогенерации тестов
- Добавить специфичные для вашего фреймворка правила
- Интегрировать с вашим code style guide

---

### 🚀 Задание 3: Набор специализированных стилей (50-60+ минут)

**Цель:** Создать коллекцию стилей для разных рабочих ситуаций.

**Задача:**
Создайте три специализированных стиля для разных сценариев работы:

**1. Debug Style — для отладки кода**

```javascript
// ~/.claude/output-styles/debug.js
module.exports = {
  name: "debug",
  description: "Стиль для debugging с детальной диагностикой",

  rules: {
    includeConsoleLog: true,
    includeErrorHandling: true,
    includeTypeChecks: true,
    verbosity: "high",
  },

  template: (question, answer) => {
    return `
🐛 DEBUG MODE

❓ ПРОБЛЕМА:
${question}

🔍 ДИАГНОСТИКА:
${answer.diagnosis || "Анализ..."}

💻 ИСПРАВЛЕНИЕ:
${answer.code}

🧪 ТЕСТОВЫЙ КОД:
${answer.testCode || "console.log тесты"}

📊 ЧТО ПРОВЕРИТЬ:
${answer.checkList || "- Типы данных\n- Null/undefined\n- Асинхронность"}
    `.trim();
  },

  postProcess: (answer) => {
    // Автоматически добавить console.log в код
    const withLogs = answer.replace(
      /function (\w+)\(/g,
      'function $1(console.log("Вызов $1"), ',
    );
    return withLogs;
  },
};
```

**2. Code Review Style — для ревью кода**

```javascript
// ~/.claude/output-styles/code-review.js
module.exports = {
  name: "code-review",
  description: "Стиль для code review с оценкой качества",

  template: (question, answer) => {
    return `
👀 CODE REVIEW

📝 КОД ДЛЯ РЕВЬЮ:
${question}

⭐ ОЦЕНКА КАЧЕСТВА:
- Читаемость: ${answer.readability || "?"}/10
- Производительность: ${answer.performance || "?"}/10
- Безопасность: ${answer.security || "?"}/10

✅ ЧТО ХОРОШО:
${answer.pros || "Анализ..."}

⚠️ ЧТО УЛУЧШИТЬ:
${answer.improvements || "Рекомендации..."}

💡 ПРЕДЛОЖЕННЫЕ ИЗМЕНЕНИЯ:
${answer.suggestedCode || "Нет изменений"}

📚 BEST PRACTICES:
${answer.bestPractices || "См. документацию"}
    `.trim();
  },
};
```

**3. Documentation Style — для создания документации**

```javascript
// ~/.claude/output-styles/documentation.js
module.exports = {
  name: "documentation",
  description: "Стиль для создания документации",

  template: (question, answer) => {
    return `
# ${answer.title || "Документация"}

## Описание
${answer.description || "Описание функционала"}

## Использование

\`\`\`javascript
${answer.usageExample || "// Пример использования"}
\`\`\`

## API Reference

${answer.apiDocs || "### Методы\n- method(): описание"}

## Параметры

${answer.parameters || "- param1 (type): описание"}

## Возвращаемое значение

${answer.returnValue || "Описание возвращаемого значения"}

## Примеры

${answer.examples || "// Дополнительные примеры"}

## Примечания

${answer.notes || "- Важные детали\n- Ограничения\n- Best practices"}
    `.trim();
  },
};
```

**Критерии выполнения:**

- ✅ Созданы все три стиля
- ✅ Каждый стиль протестирован на реальных задачах
- ✅ Стили решают разные проблемы
- ✅ Добавлены уникальные features для каждого стиля

**Дополнительные задачи (опционально):**

- Создать четвёртый стиль для вашей специфичной задачи
- Добавить автопереключение между стилями через hook
- Интегрировать стили с вашим CI/CD процессом

**Ожидаемый результат:**

```bash
# Структура файлов
~/.claude/output-styles/
├── debug.js
├── code-review.js
├── documentation.js
└── my-custom-style.js

# Использование
/style debug
"Почему функция возвращает undefined?"

/style code-review
"Оцени этот компонент: [код]"

/style documentation
"Создай документацию для API модуля auth"
```

---

## 📊 Критерии оценки домашних заданий

### Задание 1 (базовое):

- **3 балла** — получены ответы во всех стилях
- **5 баллов** — добавлена таблица сравнения
- **7 баллов** — сделаны выводы с примерами использования

### Задание 2 (продвинутое):

- **5 баллов** — создан файл со стилем
- **7 баллов** — стиль работает корректно
- **10 баллов** — добавлены postProcess и уникальные features

### Задание 3 (проектное):

- **8 баллов** — созданы три базовых стиля
- **12 баллов** — стили протестированы на реальных задачах
- **15 баллов** — добавлены автопереключение и дополнительные стили

**Максимум:** 32 балла

---

## 📖 Словарь простыми словами

| Термин              | Простыми словами                             |
| ------------------- | -------------------------------------------- |
| **Output Style**    | Стиль ответа (как Claude отвечает)           |
| **Verbosity**       | Подробность ответа (много или мало текста)   |
| **Template**        | Шаблон (форма для ответов)                   |
| **Post-processing** | Обработка после генерации (доработка ответа) |
| **Context-aware**   | Умный (учитывает ситуацию)                   |
| **Auto-detection**  | Автоопределение (сам выбирает нужное)        |

---

## Навигация

← [Предыдущая статья: 07. Hooks и автоматизация](07-HOOKS-И-АВТОМАТИЗАЦИЯ.md)
→ [Следующая статья: 09. Git воркфлоу](09-GIT-ВОРКФЛОУ.md)

**Прогресс:** 8 из 11 статей раздела "Claude Code" | [Вернуться к содержанию](README.md)

---

> 💡 **Главная мысль:** Правильный output style — это как выбор языка общения. Для обучения нужны подробности, для работы — краткость, для оптимизации — технические детали. Умение переключаться между стилями увеличивает продуктивность на 40%.

**Следующая глава:** Узнаете, как интегрировать Git в свой воркфлоу с Claude Code — от автоматических коммитов до AI code review.
