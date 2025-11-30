# 🔌 ПОТОК ПОДКЛЮЧЕНИЯ АГЕНТОВ - ПОЛНОЕ ОБЪЯСНЕНИЕ

> Детальное объяснение того, как агенты подключаются и запускаются в ElizaOS

---

## 📊 ОБЩАЯ СХЕМА

```
┌─────────────────────────────────────────────────────────────┐
│                    КОМАНДА: elizaos start                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  packages/cli/src/commands/    │
        │  start/index.ts                │
        └───────────────┬─────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐            ┌──────────────────┐
│ --character   │            │ БЕЗ --character   │
│ (JSON файлы)  │            │ (TypeScript)     │
└───────┬───────┘            └────────┬─────────┘
        │                              │
        ▼                              ▼
┌──────────────────┐        ┌─────────────────────┐
│ loadCharacter    │        │ loadProject(cwd)    │
│ TryPath()        │        │                     │
└──────┬───────────┘        └──────────┬──────────┘
        │                              │
        │                              ▼
        │                    ┌─────────────────────┐
        │                    │ Ищет package.json   │
        │                    │ Читает "main"       │
        │                    │ Импортирует модуль  │
        │                    └──────────┬──────────┘
        │                              │
        │                              ▼
        │                    ┌─────────────────────┐
        │                    │ Ищет default export │
        │                    │ с массивом agents   │
        │                    └──────────┬──────────┘
        │                              │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  AgentServer.start()          │
        │  packages/server/src/index.ts │
        └──────────────┬─────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  server.startAgents()         │
        │  - Подготавливает конфиги     │
        │  - Добавляет sqlPlugin        │
        │  - Шифрует секреты            │
        └──────────────┬─────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  elizaOS.addAgents()          │
        │  packages/core/src/runtime.ts  │
        │  - Регистрирует плагины        │
        │  - Создает AgentRuntime        │
        └──────────────┬─────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  elizaOS.startAgents()        │
        │  - Инициализирует runtime     │
        │  - Запускает агентов          │
        └──────────────┬─────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  database.createAgent()      │
        │  - Сохраняет в БД             │
        │  - Создает запись в agents    │
        └──────────────────────────────┘
```

---

## 🔍 ДЕТАЛЬНЫЙ РАЗБОР

### 1️⃣ ТОЧКА ВХОДА: `elizaos start`

**Файл**: `packages/cli/src/commands/start/index.ts`

```typescript
// Команда запускается здесь
export const start = new Command()
  .name('start')
  .option('--character <paths...>', 'Character file(s) to use')
  .action(async (options) => {
    // ...
  });
```

**Что происходит:**
1. Проверяет наличие флага `--character`
2. Если есть → загружает JSON файлы
3. Если нет → пытается загрузить TypeScript проект

---

### 2️⃣ ЗАГРУЗКА JSON АГЕНТОВ (Character Files)

**Если указан `--character packages/agents/vibeeAgent.json`:**

```typescript
// packages/cli/src/commands/start/index.ts:93-118
if (options.character && options.character.length > 0) {
  for (const charPath of options.character) {
    const character = await loadCharacterTryPath(resolvedPath);
    characters.push(character);
  }
}
```

**Функция `loadCharacterTryPath()`:**
- **Файл**: `packages/server/src/loader.ts:263-335`
- Ищет файл в множестве мест:
  1. Указанный путь (абсолютный или относительный)
  2. `process.cwd()` (текущая директория)
  3. `process.cwd()/../..` (на 2 уровня выше)
  4. `process.cwd()/agent/`
  5. `__dirname/characters/`
  6. И так далее...

**Результат**: Массив `Character[]`

---

### 3️⃣ ЗАГРУЗКА TYPESCRIPT АГЕНТОВ (Project Agents)

**Если `--character` НЕ указан:**

```typescript
// packages/cli/src/commands/start/index.ts:119-146
if (dirInfo.hasPackageJson && dirInfo.type !== 'non-elizaos-dir') {
  logger.info('No character files specified, attempting to load project agents...');
  const project = await loadProject(cwd);
  
  if (project.agents && project.agents.length > 0) {
    projectAgents = project.agents;
  }
}
```

**Функция `loadProject()`:**
- **Файл**: `packages/cli/src/project.ts:134-338`

**Процесс загрузки:**

1. **Читает `package.json`:**
   ```typescript
   const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
   const main = packageJson.main; // Например: "dist/index.js"
   ```

2. **Ищет entry point в порядке приоритета:**
   ```typescript
   const entryPoints = [
     path.join(dir, main),           // "dist/index.js"
     path.join(dir, 'dist/index.js'),
     path.join(dir, 'src/index.ts'),
     path.join(dir, 'src/index.js'),
     path.join(dir, 'index.ts'),
     path.join(dir, 'index.js'),
   ];
   ```

3. **Импортирует модуль:**
   ```typescript
   const importUrl = 'file://' + importPath;
   projectModule = await import(importUrl);
   ```

4. **Ищет агентов в модуле:**

   **Вариант A: Default export с массивом agents** ⭐ РЕКОМЕНДУЕТСЯ
   ```typescript
   // src/index.ts
   const project: Project = {
     agents: [vibeeAgent, kolsAgent],
   };
   export default project;
   ```
   
   **Вариант B: Named exports**
   ```typescript
   // src/index.ts
   export const vibeeAgent: ProjectAgent = { ... };
   export const kolsAgent: ProjectAgent = { ... };
   ```

5. **Возвращает `Project` объект:**
   ```typescript
   return {
     agents: [vibeeAgent, kolsAgent],
     dir: '/path/to/project',
   };
   ```

---

### 4️⃣ ПОДГОТОВКА КОНФИГУРАЦИЙ

**Файл**: `packages/cli/src/commands/start/index.ts:148-155`

```typescript
const agentConfigs = projectAgents?.length
  ? projectAgents.map((pa) => ({
      character: pa.character,
      plugins: Array.isArray(pa.plugins) ? pa.plugins : [],
      init: pa.init,
    }))
  : characters?.map((character) => ({ character })) || [];
```

**Результат**: Единый формат для всех агентов:
```typescript
{
  character: Character,
  plugins?: Plugin[],
  init?: (runtime) => Promise<void>
}[]
```

---

### 5️⃣ ЗАПУСК СЕРВЕРА

**Файл**: `packages/cli/src/commands/start/index.ts:158-164`

```typescript
const server = new AgentServer();
await server.start({
  port: options.port,
  dataDir: process.env.PGLITE_DATA_DIR,
  postgresUrl: process.env.POSTGRES_URL,
  agents: agentConfigs,  // ← Передаем агентов
});
```

---

### 6️⃣ ИНИЦИАЛИЗАЦИЯ СЕРВЕРА

**Файл**: `packages/server/src/index.ts:616+`

```typescript
private async initializeServer(config?: ServerConfig) {
  // 1. Создает Express app
  this.app = express();
  
  // 2. Настраивает middleware
  // 3. Подключает базу данных
  // 4. Регистрирует API routes
  // 5. Настраивает WebSocket
}
```

---

### 7️⃣ ЗАПУСК АГЕНТОВ

**Файл**: `packages/server/src/index.ts:208-273`

```typescript
public async startAgents(agents: Array<{...}>) {
  // 1. Подготавливает конфигурации
  const agentConfigs = agents.map((agent) => {
    agent.character.id ??= stringToUuid(agent.character.name);
    
    // Объединяет плагины
    const allPlugins = [
      ...(agent.character.plugins || []),
      ...(agent.plugins || []),
      sqlPlugin,  // ← Всегда добавляет SQL плагин
    ];
    
    return {
      character: encryptedCharacter(agent.character),  // ← Шифрует секреты
      plugins: allPlugins,
      init: agent.init,
    };
  });
  
  // 2. Регистрирует агентов в ElizaOS
  const agentIds = await this.elizaOS.addAgents(agentConfigs);
  
  // 3. Запускает агентов
  await this.elizaOS.startAgents(agentIds);
  
  // 4. Сохраняет в базу данных
  for (const id of agentIds) {
    const runtime = this.elizaOS.getAgent(id);
    if (this.database) {
      const existingAgent = await this.database.getAgent(runtime.agentId);
      if (!existingAgent) {
        await this.database.createAgent({
          ...runtime.character,
          id: runtime.agentId,
        });
      }
    }
  }
}
```

---

## 📁 ГДЕ ХРАНЯТСЯ АГЕНТЫ

### TypeScript агенты (PRODUCTION)

```
my-project/
├── package.json          # "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project
│   └── agents/           # ⭐ Агенты здесь
│       ├── vibeeAgent.ts
│       ├── kolsAgent.ts
│       └── index.ts
└── dist/
    └── index.js          # Скомпилированный код
```

**Как загружается:**
1. `loadProject()` читает `package.json.main` → `"dist/index.js"`
2. Импортирует `dist/index.js` (или `src/index.ts` если dist нет)
3. Ищет `default.agents` или named exports
4. Возвращает массив `ProjectAgent[]`

### JSON агенты (тестирование)

```
packages/agents/
├── vibeeAgent.json
└── kolsAgent.json
```

**Как загружается:**
1. Указывается путь: `--character packages/agents/vibeeAgent.json`
2. `loadCharacterTryPath()` ищет файл
3. Парсит JSON → `Character`
4. Возвращает `Character[]`

---

## ✅ ПРОВЕРКА ПОДКЛЮЧЕНИЯ

### Проверка 1: TypeScript агенты

**Структура проекта:**
```bash
cd my-project
ls -la src/
# Должно быть: index.ts и/или agents/
```

**Проверка `package.json`:**
```json
{
  "main": "dist/index.js"  // ← Должно быть
}
```

**Проверка `src/index.ts`:**
```typescript
// Должен экспортировать Project с agents
const project: Project = {
  agents: [vibeeAgent, kolsAgent],
};
export default project;
```

**Запуск:**
```bash
cd my-project
elizaos start  # Должен найти агентов автоматически
```

### Проверка 2: JSON агенты

**Проверка файла:**
```bash
ls -la packages/agents/
# Должны быть: vibeeAgent.json, kolsAgent.json
```

**Запуск:**
```bash
elizaos start --character packages/agents/vibeeAgent.json
```

---

## 🔧 ОТЛАДКА

### Логи загрузки

**TypeScript агенты:**
```
Info No character files specified, attempting to load project agents...
Info Loaded project from /path/to/project/dist/index.js
Info Found 2 agent(s) in project configuration
Info Loaded character: VIBEE
Info Loaded character: KOLs
```

**JSON агенты:**
```
Info Successfully loaded character: VIBEE
Info Successfully loaded character: KOLs
```

### Типичные проблемы

1. **"No agents found in project"**
   - ❌ `src/index.ts` не экспортирует `Project` с `agents`
   - ✅ Проверь: `export default { agents: [...] }`

2. **"Could not find project entry point"**
   - ❌ Нет `package.json.main` или файл не существует
   - ✅ Проверь: `package.json` → `"main": "dist/index.js"`

3. **"Character file not found"**
   - ❌ Файл не в `packages/agents/`
   - ✅ Используй: `--character packages/agents/vibeeAgent.json`

---

## 📚 ССЫЛКИ НА КОД

- **Команда start**: `packages/cli/src/commands/start/index.ts`
- **Загрузка проекта**: `packages/cli/src/project.ts:134-338`
- **Загрузка JSON**: `packages/server/src/loader.ts:263-335`
- **Запуск агентов**: `packages/server/src/index.ts:208-273`
- **ElizaOS runtime**: `packages/core/src/runtime.ts`

---

**Последнее обновление**: 2025-11-29



