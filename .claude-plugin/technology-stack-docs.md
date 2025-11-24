# 📚 Technology Stack Documentation - Vibee Project

Полная документация по технологическому стеку проекта Vibee (ElizaOS-based AI agent).

## 🎯 Основные библиотеки проекта

### 🔥 Core Framework
**ElizaOS** - AI агент фреймворк
- **Purpose:** Framework for building autonomous AI agents
- **Usage:** Core runtime, types, agents, and database
- **Package:** `@elizaos/core` v1.6.5-alpha.10
- **Documentation ID:** `/elizaos/docs` (1318 code snippets)

**Основные возможности:**
- Actions (определяют возможности агента)
- Providers (контекстная информация)
- Evaluators (пост-обработка взаимодействий)
- Services (внешние интеграции)
- Plugins (модульные расширения)

---

### 🏗️ Build & Runtime Tools

#### **Bun** - JavaScript Runtime
- **Purpose:** Fast all-in-one toolkit (runtime, bundler, test runner, package manager)
- **Version:** ^1.2.21
- **Documentation ID:** `/oven-sh/bun` (2896 code snippets)
- **Benchmark Score:** 87.4

**Основные команды:**
```bash
bun run start                    # Запуск приложения
bun test                         # Запуск тестов
bun install                      # Установка зависимостей
bun run build                    # Сборка проекта
bunx create-vite@latest          # Создание нового Vite проекта
```

#### **Turborepo** - Monorepo Build System
- **Purpose:** High-performance build system for JavaScript/TypeScript
- **Documentation ID:** `/vercel/turborepo` (541 code snippets)
- **Benchmark Score:** 78.4

**Конфигурация в `turbo.json`:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

#### **Vite** - Frontend Build Tool
- **Purpose:** Next-generation frontend tooling with instant HMR
- **Version:** ^7.1.7
- **Documentation ID:** `/vitejs/vite` (480 code snippets)

**Основные команды:**
```bash
bun create vite my-app              # Создание проекта
bunx vite                           # Запуск dev сервера
bun run build                       # Production сборка
bun run preview                     # Preview сборки
```

---

### 🎨 Frontend Stack

#### **React** - UI Library
- **Version:** ^19.1.0
- **Documentation ID:** `/websites/react_dev` (1926 code snippets)
- **Benchmark Score:** 89

**Основные компоненты (Client):**
- React Router (routing)
- Radix UI (компоненты)
- Tailwind CSS (стили)
- TanStack Query (состояние)
- Socket.io Client (real-time)

---

### 🔐 Security & Secrets

#### **Infisical** - Secret Management
- **Purpose:** Open-source secret management platform
- **Documentation ID:** `/infisical/infisical` (1578 code snippets)
- **Package:** `@infisical/sdk` v4.0.6

**Основное использование:**
```typescript
import { InfisicalSDK } from '@infisical/sdk'

const client = new InfisicalSDK({
  siteUrl: "your-infisical-instance.com"
});

await client.auth().universalAuth.login({
  clientId: "<client-id>",
  clientSecret: "<client-secret>"
});

const secrets = await client.secrets().listSecrets({
  environment: "dev",
  projectId: "<project-id>"
});
```

#### **Helmet** - Security Headers
- **Purpose:** Secure Express.js apps by setting HTTP headers
- **Documentation ID:** `/helmetjs/helmet` (65 code snippets)

**Basic setup:**
```javascript
import helmet from "helmet";
const app = express();
app.use(helmet());
```

---

### 📋 Validation & Schema

#### **Zod** - Schema Validation
- **Purpose:** TypeScript-first schema declaration and validation
- **Documentation ID:** `/websites/zod_dev` (36763 code snippets)
- **Benchmark Score:** 81.5

**Пример использования:**
```typescript
import { z } from 'zod';

const User = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof User>;
const user = User.parse(data);
```

---

### 🤖 AI & LLM Integration

#### **LangChain** - LLM Framework
- **Purpose:** Framework for developing LLM-powered applications
- **Documentation ID:** `/websites/langchain_oss_javascript` (2215 code snippets)
- **Package:** `@langchain/core` v1.0.0

**Core packages:**
- `@langchain/core` - Base abstractions
- `@langchain/textsplitters` - Text splitting utilities
- LangGraph - State management for agents

---

### 📝 Data Processing

#### **js-yaml** - YAML Parser
- **Purpose:** Fast YAML 1.2 parser and writer
- **Documentation ID:** `/nodeca/js-yaml` (41 code snippets)

**Usage:**
```javascript
import yaml from 'js-yaml';

const data = yaml.load(yamlString);
const yamlOutput = yaml.dump(data);
```

#### **Handlebars** - Templating
- **Purpose:** Minimal templating on steroids
- **Documentation ID:** `/websites/handlebarsjs` (523 code snippets)

**Usage:**
```javascript
import Handlebars from "handlebars";
const template = Handlebars.compile("Name: {{name}}");
console.log(template({ name: "Nils" }));
```

---

### 🖥️ CLI Tools

#### **Commander.js** - Command Line Interface
- **Purpose:** Node.js command-line interfaces made easy
- **Documentation ID:** `/tj/commander.js` (132 code snippets)
- **Benchmark Score:** 88.7

**Usage:**
```javascript
import { program } from 'commander';

program
  .option('-d, --debug', 'output extra debugging')
  .option('-s, --small', 'small pizza size')
  .parse();
```

#### **Chalk** - Terminal Styling
- **Purpose:** Add color and style to terminal strings
- **Documentation ID:** `/chalk/chalk` (13 code snippets)

**Usage:**
```javascript
import chalk from 'chalk';

console.log(chalk.blue('Hello world!'));
console.log(chalk.red.bold('This is red and bold.'));
```

#### **Chokidar** - File Watching
- **Purpose:** Minimal and efficient cross-platform file watching
- **Documentation ID:** `/paulmillr/chokidar` (11 code snippets)

**Usage:**
```javascript
import chokidar from 'chokidar';

chokidar.watch('.').on('all', (event, path) => {
  console.log(event, path);
});
```

#### **Ora** - Spinners
- **Purpose:** Elegant terminal spinner
- **Documentation ID:** `/sindresorhus/ora` (22 code snippets)
- **Benchmark Score:** 85

**Usage:**
```javascript
import ora from 'ora';

const spinner = ora('Loading unicorns').start();
setTimeout(() => {
  spinner.succeed('Unicorns loaded!');
}, 2000);
```

---

## 📦 Package Structure

```
packages/
├── core/                    # @elizaos/core - Foundation
├── cli/                     # @elizaos/cli - Command line interface
├── client/                  # React web interface
├── server/                  # Server components
├── api-client/             # Type-safe API client
├── plugin-*/               # Various plugins (SQL, OpenAI, etc.)
└── app/                    # Tauri desktop/mobile app
```

---

## 🚀 Quick Start Commands

```bash
# Development
npm run dev:hot              # Hot reload development (10-20x faster!)
npm run dev                  # Regular development mode

# Build & Test
npm run build                # Build all packages
npm test                     # Run all tests
npm run type-check           # TypeScript type checking

# Package-specific
npm run build:cli           # Build CLI only
npm run build:core          # Build core only
npm run build:client        # Build client only

# Quality
npm run lint                # Lint and format code
npm run format              # Format code with prettier

# Docker
npm run docker:build        # Build Docker image
npm run docker:run          # Run Docker container
npm run docker:bash         # Access container shell
```

---

## 🔌 MCP (Model Context Protocol) - Complete Setup

### Установленные MCP серверы

#### 1. **Context7** - Документация библиотек
- **Пакет:** `@upstash/context7-mcp`
- **Назначение:** Получение актуальной документации и примеров кода
- **Решает проблему:** Устаревшая информация в LLM

**Без Context7:**
> "Code examples are outdated and based on year-old training data"

**С Context7:**
> "Pulls up-to-date, version-specific documentation straight from the source"

**Примеры использования:**
```typescript
// Получить ID библиотеки
await mcp__context7__resolve-library-id({ libraryName: "react" })

// Получить документацию
await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/facebook/react",
  topic: "hooks"
})
```

**Лучшие практики Context7:**
- Всегда добавляйте "use context7" в промпты
- Настройте правило автоинвокации в клиенте
- Сначала получайте library_id, потом документацию

#### 2. **cclsp** - Навигация по коду
- **Пакет:** `cclsp@0.6.2`
- **Назначение:** Интеграция LLM с Language Server Protocol (LSP)
- **Решает проблему:** Неточность в определении строк/столбцов

**Проблема:** "LLM-based coding agents struggle with accurate line/column numbers"
**Решение:** "Intelligently tries multiple position combinations"

**Доступные инструменты:**
- `cclsp.find_definition` - Найти определение символа
- `cclsp.find_references` - Найти все ссылки
- `cclsp.rename_symbol` - Переименовать (с бэкапом)
- `cclsp.get_diagnostics` - Получить диагностики
- `cclsp.restart_server` - Перезапустить LSP

**Конфигурация cclsp (/Users/playra/vibee-eliza-999/.claude/cclsp.json):**
```json
{
  "servers": [
    {
      "extensions": ["ts", "tsx"],
      "command": ["npx", "--", "typescript-language-server", "--stdio"],
      "rootDir": "."
    },
    {
      "extensions": ["py", "pyi"],
      "command": ["pylsp"],
      "restartInterval": 5
    },
    {
      "extensions": ["rs"],
      "command": ["rust-analyzer"],
      "rootDir": "."
    }
  ]
}
```

**ВАЖНО:** Все конфигурации MCP хранятся в репозитории `/Users/playra/vibee-eliza-999/.claude/`, а НЕ в `~/.claude/`!

**Примеры использования cclsp:**
```typescript
// Найти определение
await cclsp.find_definition({
  file_path: "src/utils.ts",
  symbol_name: "processData",
  symbol_kind: "function"
})

// Найти все ссылки
await cclsp.find_references({
  file_path: "src/config.ts",
  symbol_name: "API_URL",
  include_declaration: true
})

// Переименовать (сначала dry_run!)
await cclsp.rename_symbol({
  file_path: "src/api.ts",
  symbol_name: "getUser",
  new_name: "fetchUser",
  dry_run: true  // Предварительный просмотр
})
```

#### 3. **filesystem** - Работа с файлами
- **Пакет:** `@modelcontextprotocol/server-filesystem`
- **Назначение:** Доступ к файловой системе через MCP

#### 4. **sequential-thinking** - Планирование
- **Пакет:** `@modelcontextprotocol/server-sequential-thinking`
- **Назначение:** Пошаговый анализ задач

#### 5. **telegram** - Интеграция с Telegram
- **Пакет:** `besir-mcp-telegram-bot`
- **Назначение:** Работа с Telegram API

### Полная конфигурация MCP (/Users/playra/vibee-eliza-999/.claude/mcp.json)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "cclsp": {
      "command": "cclsp",
      "env": {
        "CCLSP_CONFIG_PATH": "/Users/playra/vibee-eliza-999/.claude/cclsp.json"
      }
    },
    "filesystem": {
      "command": "mcp",
      "args": ["run", "@modelcontextprotocol/server-filesystem", "/Users/playra/vibee-eliza-999"]
    },
    "sequential-thinking": {
      "command": "mcp",
      "args": ["run", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "telegram": {
      "command": "mcp",
      "args": ["run", "besir-mcp-telegram-bot"]
    }
  }
}
```

**ВАЖНО:** Конфигурация в репозитории `/Users/playra/vibee-eliza-999/.claude/mcp.json`, а не в `~/.claude/mcp.json`!

### Мощная комбинация: Context7 + cclsp

**Context7** - актуальная документация
**cclsp** - навигация по коду
**Вместе** - полный контроль над разработкой!

---

## 🔑 Environment Variables

### Required
```bash
# Model Provider (at least one)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Infisical (Cloud-First Configuration)
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev

# Node Environment
NODE_ENV=development
```

### Optional
```bash
# Telegram
TELEGRAM_BOT_TOKEN=

# Discord
DISCORD_APPLICATION_ID=
DISCORD_API_TOKEN=

# Twitter
TWITTER_TARGET_USERS=
TWITTER_DRY_RUN=false

# Blockchain
EVM_PRIVATE_KEY=
SOLANA_PRIVATE_KEY=
```

---

## 🎯 MCP Integration

**MCP (Model Context Protocol)** - система интеграции инструментов для Claude Code.

### Available MCP Servers:
- **context7** - Получение актуальной документации библиотек
- **sequential-thinking** - Пошаговый анализ задач
- **filesystem** - Работа с файловой системой
- **telegram** - Интеграция с Telegram

### Usage Examples:
```typescript
// Получить документацию библиотеки
await mcp__context7__resolve-library-id({ libraryName: "react" })
await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/facebook/react",
  topic: "hooks"
})
```

---

## 📚 Resources

- **ElizaOS Docs:** https://github.com/elizaos/docs
- **Context7 Library:** https://context7.com/websites/elizaos_ai
- **Bun Docs:** https://bun.sh
- **Turborepo Docs:** https://turbo.build/repo
- **Vite Guide:** https://vitejs.dev/guide
- **React Docs:** https://react.dev
- **Infisical Docs:** https://infisical.com/docs

---

*Документация обновлена: 2025-11-24*
*Generated via Context7 MCP for Vibee Project*
