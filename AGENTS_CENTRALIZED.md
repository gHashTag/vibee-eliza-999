# 🤖 АГЕНТЫ ELIZAOS - ЦЕНТРАЛИЗОВАННАЯ ДОКУМЕНТАЦИЯ

> **Единый источник правды** о том, где хранятся агенты, как они загружаются и как с ними работать.

> 📌 **Быстрая справка**: [`AGENTS_STRUCTURE.md`](./AGENTS_STRUCTURE.md)

---

## 📋 СОДЕРЖАНИЕ

1. [Типы агентов](#типы-агентов)
2. [Места хранения](#места-хранения)
3. [Структура данных](#структура-данных)
4. [Загрузка агентов](#загрузка-агентов)
5. [Создание агентов](#создание-агентов)
6. [Запуск агентов](#запуск-агентов)
7. [База данных](#база-данных)
8. [Примеры](#примеры)

---

## 🎯 ТИПЫ АГЕНТОВ

В ElizaOS существует **3 способа** определения агентов, но **TypeScript агенты - это основной production способ**:

### 1. **Project Agents (TypeScript)** ⭐ ОСНОВНОЙ СПОСОБ

- **Формат**: TypeScript модули в проектах
- **Использование**: **Production агенты, сложная логика, кастомные плагины**
- **Загрузка**: Через `loadProject()` из `src/index.ts`
- **Хранение**: `src/agents/` или `src/index.ts` в проектах
- **Преимущества**: Типобезопасность, IDE поддержка, рефакторинг, тестирование

### 2. **Character Files (.json)**

- **Формат**: JSON файлы с определением `Character`
- **Использование**: Быстрое создание, тестирование, standalone агенты, прототипирование
- **Загрузка**: Через `loadCharacterTryPath()` или CLI флаг `--character`
- **Хранение**: `packages/agents/` (для монорепо) или локально в проектах

### 3. **Database Agents**

- **Формат**: Записи в таблице `agents` в PostgreSQL/PGLite
- **Использование**: Персистентное хранение, управление через API, динамическое создание
- **Загрузка**: Через `IDatabaseAdapter.getAgents()`
- **Создание**: Автоматически при запуске TypeScript/JSON агентов или через API

---

## 📁 МЕСТА ХРАНЕНИЯ

### ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО: ЕДИНОЕ МЕСТО ДЛЯ КАЖДОГО ТИПА

**TypeScript агенты (PRODUCTION) - основной способ:**

**Пример 1: VIBEE Agents Project (все агенты VIBEE):**

```
packages/vibee-agents/    # ⭐ Проект со всеми VIBEE агентами
├── package.json          # "main": "dist/src/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project с 4 агентами
│   └── agents/           # ⭐ ЕДИНОЕ МЕСТО для всех агентов
│       ├── vibeeAgent.ts
│       ├── kolsAgent.ts
│       ├── neuroPhotoAgent.ts
│       ├── instagramExpertAgent.ts
│       └── index.ts      # Экспортирует всех агентов
└── dist/
    └── src/
        └── index.js      # Скомпилированный код
```

**Пример 2: Обычный проект:**

```
my-project/               # Проект с агентами
├── package.json          # Должен содержать "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Точка входа - экспортирует Project с agents
│   ├── character.ts      # Определение Character (опционально)
│   └── agents/           # ⭐ ЕДИНОЕ МЕСТО для TypeScript агентов
│       ├── agent1.ts
│       ├── agent2.ts
│       └── index.ts      # Экспортирует всех агентов
└── dist/
    └── index.js          # Скомпилированный код
```

**Character Files (.json) - для тестирования и прототипов:**

```
packages/agents/          # ⭐ ЕДИНОЕ МЕСТО для JSON агентов (монорепо)
├── vibeeAgent.json
├── kolsAgent.json
├── neuroPhoto.json
└── README.md
```

**❌ ЗАПРЕЩЕНО:**

- ❌ Хранить TypeScript агентов в случайных местах
- ❌ Хранить JSON агенты в `agents-json/` (устаревшая папка)
- ❌ Хранить агенты в корне проекта (`vibee.character.json`)
- ❌ Дублировать агентов в разных местах

**✅ ОБЯЗАТЕЛЬНО:**

- ✅ **TypeScript агенты** → `src/agents/` или `src/index.ts` в проектах
- ✅ **JSON агенты** → `packages/agents/` (для монорепо) или локально в проектах
- ✅ **Database агенты** → Автоматически создаются при запуске TypeScript/JSON агентов

### Character Files (.json)

#### ✅ ЕДИНОЕ МЕСТО:

```
packages/agents/          # ⭐ ВСЕ JSON АГЕНТЫ ЗДЕСЬ
├── vibeeAgent.json
├── kolsAgent.json
├── neuroPhoto.json
└── README.md
```

#### 🔍 Пути поиска (автоматически):

Система ищет character файлы в следующем порядке:

1. Указанный путь (абсолютный или относительный)
2. `process.cwd()` (текущая директория)
3. `process.cwd()/../..` (на 2 уровня выше)
4. `process.cwd()/../../..` (на 3 уровня выше)
5. `process.cwd()/agent/` (папка agent в текущей директории)
6. `__dirname/characters/` (папка characters рядом с кодом)
7. `__dirname/../characters/` (папка characters на уровень выше)
8. И так далее...

**Файл**: `packages/server/src/loader.ts:282-308`

### Project Agents (TypeScript) ⭐ ОСНОВНОЙ СПОСОБ

#### ✅ Рекомендуемая структура проекта:

**Вариант 1: Один агент в `src/index.ts`**

```
my-project/
├── package.json          # "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project с одним агентом
│   ├── character.ts      # Определение Character
│   └── plugin.ts         # Кастомные плагины (опционально)
└── dist/
    └── index.js
```

**Вариант 2: Несколько агентов в `src/agents/`** ⭐ РЕКОМЕНДУЕТСЯ

```
my-project/
├── package.json          # "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project с массивом agents
│   └── agents/           # ⭐ ЕДИНОЕ МЕСТО для всех TypeScript агентов
│       ├── vibeeAgent.ts
│       ├── kolsAgent.ts
│       ├── neuroPhotoAgent.ts
│       └── index.ts      # Экспортирует всех агентов
└── dist/
    └── index.js
```

#### 📝 Пример `src/index.ts` (один агент):

```typescript
import { type Project, type ProjectAgent } from '@elizaos/core';
import { character } from './character.ts';

const projectAgent: ProjectAgent = {
  character,
  init: async (runtime) => {
    // Инициализация агента
  },
  plugins: [], // Опционально
};

const project: Project = {
  agents: [projectAgent],
};

export default project;
```

#### 📝 Пример `src/index.ts` (несколько агентов):

```typescript
import { type Project } from '@elizaos/core';
import { vibeeAgent, kolsAgent, neuroPhotoAgent } from './agents/index.ts';

const project: Project = {
  agents: [vibeeAgent, kolsAgent, neuroPhotoAgent],
};

export default project;
```

#### 📝 Пример `src/agents/vibeeAgent.ts`:

```typescript
import { type ProjectAgent } from '@elizaos/core';
import { vibeeCharacter } from '../characters/vibeeCharacter.ts';

export const vibeeAgent: ProjectAgent = {
  character: vibeeCharacter,
  init: async (runtime) => {
    // Инициализация VIBEE агента
    console.log('VIBEE agent initialized');
  },
  plugins: [], // Опционально
};
```

#### 📝 Пример `src/agents/index.ts`:

```typescript
export { vibeeAgent } from './vibeeAgent.ts';
export { kolsAgent } from './kolsAgent.ts';
export { neuroPhotoAgent } from './neuroPhotoAgent.ts';
```

**Файл**: `packages/cli/src/project.ts:134-338`

### Database Agents

#### ✅ Таблица в БД:

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  owner_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  -- Character fields
  name TEXT NOT NULL,
  username TEXT,
  system TEXT DEFAULT '',
  bio JSONB DEFAULT '[]',
  message_examples JSONB DEFAULT '[]',
  post_examples JSONB DEFAULT '[]',
  topics JSONB DEFAULT '[]',
  adjectives JSONB DEFAULT '[]',
  knowledge JSONB DEFAULT '[]',
  plugins JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  style JSONB DEFAULT '{}'
);
```

**Файл**: `packages/plugin-sql/src/schema/agent.ts`

---

## 📊 СТРУКТУРА ДАННЫХ

### Character Interface

```typescript
interface Character {
  id?: UUID; // Опциональный UUID
  name: string; // Имя агента (обязательно)
  username?: string; // Username
  system?: string; // System prompt
  templates?: {
    // Шаблоны промптов
    [key: string]: TemplateType;
  };
  bio: string | string[]; // Биография
  messageExamples?: MessageExample[][]; // Примеры сообщений
  postExamples?: string[]; // Примеры постов
  topics?: string[]; // Темы знаний
  adjectives?: string[]; // Характеристики
  knowledge?: (string | { path: string; shared?: boolean })[]; // База знаний
  plugins?: string[]; // Список плагинов
  settings?: {
    // Настройки
    [key: string]: string | boolean | number | Record<string, any>;
  };
  secrets?: {
    // Секреты
    [key: string]: string | boolean | number;
  };
  style?: {
    // Стиль письма
    all?: string[];
    chat?: string[];
    post?: string[];
  };
}
```

**Файл**: `packages/core/src/types/agent.ts:36-91`

### ProjectAgent Interface

```typescript
interface ProjectAgent {
  character: Character; // Определение персонажа
  init?: (runtime: IAgentRuntime) => Promise<void>; // Функция инициализации
  plugins?: Plugin[]; // Кастомные плагины
  tests?: TestSuite | TestSuite[]; // Тесты
}
```

**Файл**: `packages/core/src/types/plugin.ts:69-74`

### Agent Interface (Database)

```typescript
interface Agent extends Character {
  enabled?: boolean; // Включен ли агент
  status?: AgentStatus; // Статус (ACTIVE/INACTIVE)
  createdAt: number; // Дата создания
  updatedAt: number; // Дата обновления
}
```

**Файл**: `packages/core/src/types/agent.ts:107-112`

---

## 🔄 ЗАГРУЗКА АГЕНТОВ

### Процесс загрузки при `elizaos start`:

```
1. Проверка флага --character
   ├─ Если указан → loadCharacterTryPath() для каждого файла
   └─ Если НЕ указан → переход к шагу 2

2. Попытка загрузки project agents
   ├─ Проверка наличия package.json
   ├─ Вызов loadProject(cwd)
   │   ├─ Поиск entry point (main из package.json)
   │   ├─ Загрузка модуля
   │   └─ Извлечение agents из default export или named exports
   └─ Если не найдено → fallback к default Eliza character

3. Подготовка agentConfigs
   ├─ Из projectAgents: { character, plugins, init }
   └─ Из characters: { character }

4. Запуск AgentServer
   └─ server.start({ agents: agentConfigs })
```

**Файл**: `packages/cli/src/commands/start/index.ts:29-172`

### Функции загрузки:

#### `loadCharacterTryPath(characterPath: string)`

- Загружает character из JSON файла или URL
- Пробует множество путей автоматически
- **Файл**: `packages/server/src/loader.ts:263-335`

#### `loadProject(dir: string)`

- Загружает проект из директории
- Ищет entry point в `package.json.main`
- Извлекает agents из модуля
- **Файл**: `packages/cli/src/project.ts:134-338`

---

## 🛠️ СОЗДАНИЕ АГЕНТОВ

### ⭐ Способ 1: Project Agent (TypeScript) - РЕКОМЕНДУЕТСЯ

**Для production агентов используйте TypeScript:**

```bash
# Создать новый проект с TypeScript агентами
elizaos create --type project my-project

# Структура будет:
my-project/
├── src/
│   ├── index.ts      # ⭐ Экспортирует Project с agents
│   ├── character.ts  # Определение Character
│   └── agents/       # ⭐ Создайте эту папку для нескольких агентов
│       └── index.ts  # Экспортирует всех агентов
```

**Создание нового агента в существующем проекте:**

```typescript
// 1. Создайте файл src/agents/myAgent.ts
import { type ProjectAgent } from '@elizaos/core';

export const myAgent: ProjectAgent = {
  character: {
    name: 'My Agent',
    bio: 'Описание агента',
    system: 'Ты полезный ассистент',
    plugins: ['@elizaos/plugin-sql', 'telegram'],
    topics: ['AI', 'programming'],
    adjectives: ['helpful', 'friendly'],
  },
  init: async (runtime) => {
    // Инициализация
  },
};

// 2. Добавьте в src/agents/index.ts
export { myAgent } from './myAgent.ts';

// 3. Импортируйте в src/index.ts
import { myAgent } from './agents/index.ts';

const project: Project = {
  agents: [myAgent],
};
```

### Способ 2: Character File (.json) - для тестирования

```bash
# Создать новый character файл
elizaos create --type agent

# Или с именем
elizaos create my-agent --type agent

# ⚠️ ВАЖНО: Переместите в packages/agents/
mv my-agent.json packages/agents/myAgent.json
```

### Способ 3: Вручную (JSON)

Создайте файл `packages/agents/myAgent.json`:

```json
{
  "name": "My Agent",
  "bio": "Описание агента",
  "system": "Ты полезный ассистент",
  "plugins": ["@elizaos/plugin-sql", "telegram"],
  "topics": ["AI", "programming"],
  "adjectives": ["helpful", "friendly"]
}
```

---

## 🚀 ЗАПУСК АГЕНТОВ

### ⭐ Запуск Project Agents (TypeScript) - ОСНОВНОЙ СПОСОБ

**Для production используйте TypeScript агенты:**

```bash
# В директории проекта
cd my-project

# Запустить все агенты из проекта
elizaos start

# Система автоматически:
# 1. Найдет package.json
# 2. Загрузит src/index.ts (или dist/index.js)
# 3. Извлечет agents из default export
# 4. Сохранит агентов в БД (если подключена)
```

**Преимущества:**

- ✅ Типобезопасность
- ✅ IDE поддержка (автодополнение, рефакторинг)
- ✅ Легко тестировать
- ✅ Версионирование через Git
- ✅ Автоматическая компиляция

### Запуск Character File (.json) - для тестирования

```bash
# Указать путь к файлу
elizaos start --character packages/agents/vibeeAgent.json

# Несколько агентов
elizaos start --character packages/agents/agent1.json packages/agents/agent2.json

# Из URL
elizaos start --character https://example.com/agent.json
```

**Когда использовать:**

- Быстрое тестирование
- Прототипирование
- Standalone агенты без проекта

### Запуск через AgentServer API

```typescript
import { AgentServer } from '@elizaos/server';

const server = new AgentServer();
await server.start({
  port: 3000,
  agents: [
    {
      character: myCharacter,
      plugins: [],
      init: async (runtime) => {
        /* ... */
      },
    },
  ],
});
```

---

## 💾 БАЗА ДАННЫХ

### Хранение агентов в БД

Агенты автоматически сохраняются в таблицу `agents` при:

- Создании через `IDatabaseAdapter.createAgent()`
- Обновлении через `IDatabaseAdapter.updateAgent()`

### Схема таблицы

**Файл**: `packages/plugin-sql/src/schema/agent.ts:10-68`

```typescript
export const agentTable = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  enabled: boolean('enabled').default(true).notNull(),
  owner_id: uuid('owner_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),

  // Character fields
  name: text('name').notNull(),
  username: text('username'),
  system: text('system').default(''),
  bio: jsonb('bio').$type<string | string[]>().default(sql`'[]'::jsonb`),
  messageExamples: jsonb('message_examples').$type<MessageExample[][]>().default(sql`'[]'::jsonb`).notNull(),
  postExamples: jsonb('post_examples').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  topics: jsonb('topics').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  adjectives: jsonb('adjectives').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  knowledge: jsonb('knowledge').$type<(string | { path: string; shared?: boolean })[]>().default(sql`'[]'::jsonb`).notNull(),
  plugins: jsonb('plugins').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  settings: jsonb('settings').$type<{...}>().default(sql`'{}'::jsonb`).notNull(),
  style: jsonb('style').$type<{...}>().default(sql`'{}'::jsonb`).notNull(),
});
```

---

## 📝 ПРИМЕРЫ

### ⭐ Пример 1: VIBEE Agents Project (РЕАЛЬНЫЙ ПРИМЕР)

**Структура проекта:**

```
packages/vibee-agents/
├── package.json          # "main": "dist/src/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project с 4 агентами
│   └── agents/           # ⭐ Все TypeScript агенты
│       ├── vibeeAgent.ts
│       ├── kolsAgent.ts
│       ├── neuroPhotoAgent.ts
│       ├── instagramExpertAgent.ts
│       └── index.ts      # Экспортирует всех
└── dist/
    └── src/
        └── index.js      # Скомпилированный код
```

**Файл**: `packages/vibee-agents/src/agents/vibeeAgent.ts`

```typescript
import { type Character } from '@elizaos/core';

export const vibeeCharacter: Character = {
  name: 'VIBEE',
  username: 'vibee',
  bio: 'Главный AI-агент проекта VIBEE',
  system: 'Ты VIBEE - умный AI-ассистент',
  plugins: ['@elizaos/plugin-sql', 'telegram'],
  topics: ['AI', 'automation', 'telegram'],
  adjectives: ['helpful', 'intelligent', 'friendly'],
};
```

```typescript
import { type ProjectAgent, type IAgentRuntime, logger } from '@elizaos/core';

export const vibeeAgent: ProjectAgent = {
  character: {
    name: 'VIBEE',
    username: 'vibee_agent',
    bio: ['Главный AI-агент проекта VIBEE', ...],
    system: 'Ты VIBEE - главный AI-агент...',
    plugins: ['@elizaos/plugin-sql', '@elizaos/plugin-bootstrap', ...],
    // ... остальные поля
  },
  init: async (runtime: IAgentRuntime) => {
    logger.info('VIBEE agent initialized');
  },
};
```

**Файл**: `packages/vibee-agents/src/agents/index.ts`

```typescript
export { vibeeAgent } from './vibeeAgent.ts';
export { kolsAgent } from './kolsAgent.ts';
export { neuroPhotoAgent } from './neuroPhotoAgent.ts';
export { instagramExpertAgent } from './instagramExpertAgent.ts';
```

**Файл**: `packages/vibee-agents/src/index.ts`

```typescript
import { type Project } from '@elizaos/core';
import { vibeeAgent, kolsAgent, neuroPhotoAgent, instagramExpertAgent } from './agents/index.ts';

const project: Project = {
  agents: [vibeeAgent, kolsAgent, neuroPhotoAgent, instagramExpertAgent],
};

export default project;
```

**Запуск**:

```bash
cd packages/vibee-agents
elizaos start  # Запустит всех 4 агентов автоматически
```

### Пример 2: Обычный проект с несколькими агентами

**Файл**: `my-project/src/index.ts`

```typescript
import { type Project } from '@elizaos/core';
import { agent1, agent2, agent3 } from './agents/index.ts';

const project: Project = {
  agents: [agent1, agent2, agent3],
};

export default project;
```

### Пример 3: Character File (.json) - для тестирования

**Файл**: `packages/agents/vibeeAgent.json`

```json
{
  "name": "VIBEE",
  "username": "vibee",
  "bio": "Главный AI-агент проекта VIBEE",
  "system": "Ты VIBEE - умный AI-ассистент",
  "plugins": ["@elizaos/plugin-sql", "telegram"],
  "topics": ["AI", "automation", "telegram"],
  "adjectives": ["helpful", "intelligent", "friendly"]
}
```

**Запуск**:

```bash
elizaos start --character packages/agents/vibeeAgent.json
```

---

## 🔍 ПОИСК АГЕНТОВ

### Где искать существующие агенты:

1. **Character Files**:

   ```bash
   find . -name "*.character.json" -o -name "*Agent.json" -o -name "*agent.json"
   ```

2. **TypeScript Project Agents**:

   ```bash
   find . -path "*/src/agents/*.ts" -o -path "*/src/index.ts" -o -path "*/src/character.ts"
   ```

3. **В коде**:
   ```bash
   grep -r "export.*ProjectAgent\|export.*Character" packages/
   ```

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ И ПРАВИЛА

### 🚨 КРИТИЧЕСКИЕ ПРАВИЛА ХРАНЕНИЯ

1. **ЕДИНОЕ МЕСТО ДЛЯ КАЖДОГО ТИПА**:

   - ✅ **TypeScript агенты** → `src/agents/` или `src/index.ts` в проектах (PRODUCTION)
   - ✅ **JSON агенты** → `packages/agents/` (для тестирования)
   - ❌ **НИКОГДА** не храните в `agents-json/`, корне проекта или других местах
   - ✅ При создании production агента используйте TypeScript в `src/agents/`
   - ✅ При создании тестового агента используйте: `elizaos create --type agent` (создаст в `packages/agents/`)

2. **Приоритет загрузки**:

   - Если указан `--character`, используется только он
   - Иначе система пытается загрузить project agents
   - Если ничего не найдено → default Eliza character

3. **Пути поиска**:

   - Character files ищутся в множестве мест автоматически (для обратной совместимости)
   - **НО**: новые агенты создавайте ТОЛЬКО в `packages/agents/`
   - Project agents загружаются только из `package.json.main`

4. **База данных**:

   - Агенты в БД - это отдельная сущность
   - Они не заменяют character files или project agents
   - Используются для персистентного хранения и API

5. **Монорепо**:
   - **TypeScript агенты** → в проектах `packages/project-*/src/agents/`
   - **JSON агенты** → `packages/agents/` (для тестирования)
   - Project agents в отдельных пакетах `packages/project-*/`

### 📋 ЧЕКЛИСТ ПЕРЕД СОЗДАНИЕМ АГЕНТА

**Для TypeScript агентов (PRODUCTION):**

- [ ] Определил, в каком проекте создаю агента
- [ ] Создаю файл в `src/agents/{agentName}Agent.ts`
- [ ] Экспортирую через `src/agents/index.ts`
- [ ] Добавил в `src/index.ts` в массив `agents`
- [ ] Проверил типы: `bun exec tsc --noEmit`
- [ ] Написал тесты (опционально)

**Для JSON агентов (тестирование):**

- [ ] Проверил, что агента нет в `packages/agents/`
- [ ] Создаю файл в `packages/agents/`
- [ ] Имя файла: `{agentName}Agent.json` (camelCase)
- [ ] Не создаю дубликаты в других местах
- [ ] Обновил `packages/agents/README.md` (если есть)

---

## 📚 ССЫЛКИ НА КОД

- **Character Interface**: `packages/core/src/types/agent.ts:36-91`
- **ProjectAgent Interface**: `packages/core/src/types/plugin.ts:69-74`
- **Agent Schema**: `packages/plugin-sql/src/schema/agent.ts:10-68`
- **loadCharacterTryPath**: `packages/server/src/loader.ts:263-335`
- **loadProject**: `packages/cli/src/project.ts:134-338`
- **start command**: `packages/cli/src/commands/start/index.ts:29-172`

---

## 📌 БЫСТРАЯ СПРАВКА

### Где хранить агентов?

**TypeScript агенты (PRODUCTION):**

```
my-project/src/agents/    # ⭐ ЕДИНОЕ МЕСТО для TypeScript агентов
├── vibeeAgent.ts
├── kolsAgent.ts
└── index.ts
```

**JSON агенты (тестирование):**

```
packages/agents/          # ⭐ ЕДИНОЕ МЕСТО для JSON агентов
├── vibeeAgent.json
└── kolsAgent.json
```

### Как создать агента?

**TypeScript (РЕКОМЕНДУЕТСЯ):**

```bash
# 1. Создать проект
elizaos create --type project my-project

# 2. Создать агента в src/agents/
# Создайте файл src/agents/myAgent.ts вручную
```

**JSON (для тестирования):**

```bash
elizaos create --type agent
# Затем переместить в packages/agents/
mv my-agent.json packages/agents/myAgent.json
```

### Как запустить агента?

**TypeScript (РЕКОМЕНДУЕТСЯ):**

```bash
cd my-project
elizaos start  # Автоматически загрузит всех агентов из src/index.ts
```

**JSON:**

```bash
elizaos start --character packages/agents/vibeeAgent.json
```

### Где правила?

- 📄 Этот файл: `AGENTS_CENTRALIZED.md`
- 📄 Быстрая справка: `AGENTS_STRUCTURE.md`
- 📄 Правила CLI: `.cursor/rules/elizaos/elizaos_cli_agents.mdc`
- 📄 README агентов: `packages/agents/README.md`
- 📄 Основные правила: `.cursor/rules/cursor_rules.mdc`

---

**Последнее обновление**: 2025-11-29
**Версия**: 1.0.0
