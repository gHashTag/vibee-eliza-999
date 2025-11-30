# 📐 СТРУКТУРА АГЕНТОВ - БЫСТРАЯ СПРАВКА

> Краткое руководство по организации агентов в проекте

---

## 🎯 ОСНОВНОЕ ПРАВИЛО

**TypeScript агенты = Production**  
**JSON агенты = Тестирование/Прототипирование**

---

## 📁 СТРУКТУРА ДЛЯ PRODUCTION (TypeScript)

### ⭐ Вариант 1: VIBEE Agents (РЕАЛЬНЫЙ ПРИМЕР)

```
packages/vibee-agents/
├── package.json          # "main": "dist/src/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project с 4 агентами
│   └── agents/           # ⭐ Все агенты
│       ├── vibeeAgent.ts
│       ├── kolsAgent.ts
│       ├── neuroPhotoAgent.ts
│       ├── instagramExpertAgent.ts
│       └── index.ts
└── dist/
    └── src/
        └── index.js
```

**Запуск:**

```bash
cd packages/vibee-agents
elizaos start  # Запустит всех 4 агентов
```

### Вариант 2: Один агент

```
my-project/
├── package.json          # "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project
│   ├── character.ts     # Character definition
│   └── plugin.ts         # Custom plugins (optional)
└── dist/
    └── index.js
```

**src/index.ts:**

```typescript
import { type Project, type ProjectAgent } from '@elizaos/core';
import { character } from './character.ts';

const projectAgent: ProjectAgent = {
  character,
  init: async (runtime) => {
    /* ... */
  },
};

const project: Project = {
  agents: [projectAgent],
};

export default project;
```

### Вариант 3: Несколько агентов в обычном проекте

```
my-project/
├── package.json          # "main": "dist/index.js"
├── src/
│   ├── index.ts          # ⭐ Экспортирует Project
│   ├── agents/           # ⭐ ЕДИНОЕ МЕСТО для агентов
│   │   ├── agent1.ts
│   │   ├── agent2.ts
│   │   └── index.ts      # Экспортирует всех
│   └── characters/       # Опционально: отдельные файлы
│       ├── character1.ts
│       └── character2.ts
└── dist/
    └── index.js
```

**src/agents/vibeeAgent.ts:**

```typescript
import { type ProjectAgent } from '@elizaos/core';
import { vibeeCharacter } from '../characters/vibeeCharacter.ts';

export const vibeeAgent: ProjectAgent = {
  character: vibeeCharacter,
  init: async (runtime) => {
    /* ... */
  },
};
```

**src/agents/index.ts:**

```typescript
export { vibeeAgent } from './vibeeAgent.ts';
export { kolsAgent } from './kolsAgent.ts';
```

**src/index.ts:**

```typescript
import { type Project } from '@elizaos/core';
import { vibeeAgent, kolsAgent } from './agents/index.ts';

const project: Project = {
  agents: [vibeeAgent, kolsAgent],
};

export default project;
```

---

## 📁 СТРУКТУРА ДЛЯ ТЕСТИРОВАНИЯ (JSON)

```
packages/agents/          # ⭐ ЕДИНОЕ МЕСТО для JSON агентов
├── vibeeAgent.json
├── kolsAgent.json
└── README.md
```

---

## 🚀 ЗАПУСК

### TypeScript агенты:

```bash
cd my-project
elizaos start  # Автоматически загрузит всех агентов
```

### JSON агенты:

```bash
elizaos start --character packages/agents/vibeeAgent.json
```

---

## ✅ ЧЕКЛИСТ

**TypeScript агент:**

- [ ] Файл в `src/agents/{name}Agent.ts`
- [ ] Экспортирован через `src/agents/index.ts`
- [ ] Добавлен в `src/index.ts` в массив `agents`
- [ ] Типы проверены: `bun exec tsc --noEmit`

**JSON агент:**

- [ ] Файл в `packages/agents/{name}Agent.json`
- [ ] Имя в camelCase
- [ ] Не дублируется в других местах

---

**Подробная документация**: [`AGENTS_CENTRALIZED.md`](../AGENTS_CENTRALIZED.md)
