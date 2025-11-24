# CLAUDE CODE CONFIGURATION - ELIZAOS PROJECT

This file contains project-specific configuration and preferences for Claude Code when working with the ElizaOS codebase.

---

## PROJECT INFORMATION

- **Working Directory:** `/Users/{user}/Documents/GitHub/eliza`
- **Git Repository:** Yes
- **Main Branch:** `develop`
- **Project Type:** TypeScript Monorepo
- **Package Manager:** `bun` (CRITICAL: Never use npm or pnpm)
- **Node Version:** 23.3.0
- **Monorepo Tools:** Turbo, Lerna

---

## MONOREPO ARCHITECTURE

ElizaOS is organized as a monorepo with the following key packages:

### Core Packages

- **`packages/core`** - `@elizaos/core` - Foundation runtime, types, agents, and database
- **`packages/cli`** - `@elizaos/cli` - Command-line interface and agent runtime
- **`packages/client`** - Frontend React GUI that displays through the CLI
- **`packages/app`** - Tauri-based desktop/mobile application
- **`packages/server`** - Server components and API
- **`packages/api-client`** - `@elizaos/api-client` - Type-safe API client for ElizaOS server

### Plugin & Template Packages

- **`packages/plugin-bootstrap`** - Default event handlers, actions, and providers
- **`packages/plugin-sql`** - DatabaseAdapter for Postgres and PGLite
- **`packages/plugin-starter`** - Template for creating new plugins
- **`packages/project-starter`** - Template for new projects
- **`packages/project-tee-starter`** - TEE (Trusted Execution Environment) project template

### Development & Documentation

- **`packages/autodoc`** - Documentation generation tools
- **`packages/docs`** - Official documentation (Docusaurus)
- **`packages/create-eliza`** - Project scaffolding tool

---

## COMMON COMMANDS

### Package Management & Building

```bash
bun install              # Install dependencies
bun run build            # Build all packages (excludes docs)
bun run build:docs       # Build documentation only
bun run build:cli        # Build CLI package specifically
bun run build:core       # Build core package specifically
bun run build:client     # Build client package specifically
```

### Development & Running

```bash
bun start                # Start CLI with agent runtime
bun run start:debug      # Start with debug logging
bun run start:app        # Start Tauri application
bun run dev              # Development mode with auto-rebuild

# Package-specific development
cd packages/cli && bun run dev          # CLI development mode
cd packages/client && bun run dev       # Client development mode
cd packages/core && bun run watch       # Core watch mode
```

### Testing

```bash
bun test                 # Run tests (excludes plugin-starter, docs, sql plugin)
bun run test:client      # Test client package only
bun run test:core        # Test core package only
bun run test:app         # Test app package only

# Package-specific testing (run from package directory)
cd packages/core && bun test           # Test core package directly
cd packages/cli && bun test            # Test CLI package directly
bun test src/specific-file.test.ts     # Run specific test file
```

### Code Quality

```bash
bun run lint             # Run linting and prettier
bun run format           # Format code with prettier
bun run format:check     # Check formatting without changes
bun run pre-commit       # Run pre-commit linting script

# Package-specific linting/formatting
cd packages/core && bun run lint
cd packages/cli && bun run format
```

### Database & Migration

```bash
bun run migrate          # Run database migrations
bun run migrate:generate # Generate new migrations
```

### Docker Operations

```bash
bun run docker:build    # Build Docker image
bun run docker:run      # Run Docker container
bun run docker:bash     # Access container shell
bun run docker:start    # Start container
bun run docker          # Build, run, and access container
```

### Release Management

```bash
bun run release         # Full release process
bun run release:alpha   # Release alpha version
```

---

## CRITICAL RULES

### Package Management

- **NEVER USE `npm` OR `pnpm`**
- **ALWAYS USE `bun` FOR ALL PACKAGE MANAGEMENT AND SCRIPT EXECUTION**
- **IF A COMMAND DOESN'T WORK:** Check `package.json` in the relevant package directory for correct script names
- Use `bun` for global installs: `bun install -g @elizaos/cli`

### Workspace Dependencies

- **ALWAYS USE `workspace:*` FOR ALL `@elizaos/` PACKAGE DEPENDENCIES**
- **NEVER USE HARDCODED VERSIONS** for internal monorepo packages
- **Example of CORRECT usage:**
  ```json
  {
    "dependencies": {
      "@elizaos/core": "workspace:*",
      "@elizaos/plugin-sql": "workspace:*",
      "@elizaos/server": "workspace:*"
    }
  }
  ```
- **Example of INCORRECT usage:**
  ```json
  {
    "dependencies": {
      "@elizaos/core": "1.4.2", // ❌ Don't use hardcoded versions
      "@elizaos/plugin-sql": "^1.4.0", // ❌ Don't use version ranges
      "@elizaos/server": "latest" // ❌ Don't use version tags
    }
  }
  ```
- **RATIONALE:** Workspace references ensure proper monorepo dependency resolution and prevent version conflicts

### Process Execution

- **NEVER USE `execa` OR OTHER PROCESS EXECUTION LIBRARIES**
- **NEVER USE NODE.JS APIS LIKE `execSync`, `spawnSync`, `exec`, `spawn` FROM `child_process`**
- **ALWAYS USE `Bun.spawn()` FOR SPAWNING PROCESSES**
- **USE THE EXISTING `bun-exec` UTILITY:** Located at `packages/cli/src/utils/bun-exec.ts` which provides:
  - `bunExec()` - Main execution function with full control
  - `bunExecSimple()` - For simple command execution
  - `bunExecInherit()` - For interactive commands
  - `commandExists()` - To check if commands exist
- **Example usage:**

  ```typescript
  import { bunExec, bunExecSimple } from '@/utils/bun-exec';

  // Simple command
  const output = await bunExecSimple('git status');

  // Full control
  const result = await bunExec('bun', ['test'], { cwd: '/path/to/dir' });
  ```

  **IMPORTANT:** Even in test files, avoid using Node.js `execSync` or other child_process APIs. Use the bun-exec utilities or Bun.spawn directly.

### Event Handling

- **NEVER USE `EventEmitter` FROM NODE.JS**
- **EventEmitter has compatibility issues with Bun and should be avoided**
- **ALWAYS USE BUN'S NATIVE `EventTarget` API INSTEAD**
- **When migrating from EventEmitter:**
  - Extend `EventTarget` instead of `EventEmitter`
  - Use `dispatchEvent(new CustomEvent(name, { detail: data }))` instead of `emit(name, data)`
  - Wrap handlers to extract data from `CustomEvent.detail`
  - Maintain backward-compatible API when possible
- **Example migration:**

  ```typescript
  // ❌ WRONG - Don't use EventEmitter
  import { EventEmitter } from 'events';
  class MyClass extends EventEmitter {
    doSomething() {
      this.emit('event', { data: 'value' });
    }
  }

  // ✅ CORRECT - Use EventTarget
  class MyClass extends EventTarget {
    private handlers = new Map<string, Map<Function, EventListener>>();

    emit(event: string, data: any) {
      this.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    on(event: string, handler: (data: any) => void) {
      const wrappedHandler = ((e: CustomEvent) => handler(e.detail)) as EventListener;
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Map());
      }
      this.handlers.get(event)!.set(handler, wrappedHandler);
      this.addEventListener(event, wrappedHandler);
    }
  }
  ```

### Git & GitHub

- **ALWAYS USE `gh` CLI FOR GIT AND GITHUB OPERATIONS**
- Use `gh` commands for creating PRs, issues, releases, etc.
- **WHEN USER PROVIDES GITHUB WORKFLOW RUN LINK:** Use `gh run view <run-id>` and `gh run view <run-id> --log` to get workflow details and failure logs
- **NEVER ADD CO-AUTHOR CREDITS:** Do not include "Co-Authored-By: Claude" or similar co-authoring credits in commit messages or PR descriptions

### Development Branch Strategy

- **Base Branch:** `develop` (NOT `main`)
- **Create PRs against `develop` branch**
- **Main branch is used for releases only**

### ElizaOS CLI Usage

- **The `elizaos` CLI** is built from `packages/cli`
- **INTENDED FOR:** Production use by developers/users of the project
- **DO NOT USE THE `elizaos` CLI WITHIN THE `eliza` MONOREPO ITSELF**
- **The `elizaos` CLI is for external consumers, NOT internal monorepo development**
- **For monorepo development:** Use `bun` commands directly

### ElizaOS Test Command

The `elizaos test` command runs tests for ElizaOS projects and plugins:

```bash
elizaos test [path]           # Run all tests (component + e2e)
elizaos test -t component     # Run only component tests
elizaos test -t e2e          # Run only e2e tests
elizaos test --name "test"   # Filter tests by name (case sensitive)
elizaos test --skip-build    # Skip building before tests
```

**Test Types:**

- **Component Tests:** Unit tests via `bun test` - test individual modules/components in isolation
- **E2E Tests:** Full integration tests via ElizaOS TestRunner - test complete agent runtime with server, database, and plugins

**Context Support:**

- Works in both monorepo packages and standalone projects created with `elizaos create`
- Automatically detects project type and adjusts paths accordingly
- For plugins: Creates default Eliza character as test agent
- For projects: Uses agents defined in project configuration

**Note:** The test command does NOT run Cypress or other UI tests - only ElizaOS-specific tests

---

## ARCHITECTURE PATTERNS

### Core Dependencies

- **Central Dependency:** Everything depends on `@elizaos/core` or `packages/core`
- **No Circular Dependencies:** Core cannot depend on other packages
- **Import Pattern:** Use `@elizaos/core` in package code, `packages/core` in internal references

### Key Abstractions

- **Channel → Room Mapping:** Discord/Twitter/GUI channels become "rooms"
- **Server → World Mapping:** Servers become "worlds" in agent memory
- **UUID System:** All IDs swizzled with agent's UUID into deterministic UUIDs

### Component Types

- **Actions:** Define agent capabilities and response mechanisms
- **Providers:** Supply dynamic contextual information (agent's "senses")
- **Evaluators:** Post-interaction cognitive processing
- **Tasks:** Manage deferred, scheduled, and interactive operations
- **Services:** Enable AI agents to interact with external platforms
- **Plugins:** Modular extensions for enhanced capabilities

### CRITICAL: ElizaOS Component Clarifications

**NEVER CONFUSE THESE CONCEPTS:**

#### Services vs Providers

- **Services** (`extends Service`):

  - Manage state and external integrations
  - Handle API connections, SDKs, databases
  - Perform business logic and transactions
  - Examples: `WalletService`, `DatabaseService`, `TwitterService`
  - Accessed via: `runtime.getService('serviceName')`

- **Providers** (`extends Provider`):
  - Supply READ-ONLY contextual information
  - Format data for agent prompts
  - Never modify state or call external APIs
  - Examples: `TimeProvider`, `FactProvider`, `BoredomProvider`
  - Return formatted strings via `get()` method

#### Actions vs Evaluators

- **Actions** (`extends Action`):

  - Handle user commands and requests
  - Parse user input and validate parameters
  - Execute operations (via Services)
  - Return responses to users
  - **MUST return `Promise<ActionResult>`** for proper action chaining
  - Use `callback()` to send messages to users
  - Return `ActionResult` to pass data to next action in chain

- **Evaluators** (`extends Evaluator`):
  - Process AFTER interactions complete
  - Enable agent learning and reflection
  - Analyze interaction outcomes
  - Update agent memory/knowledge
  - NOT for parsing input or monitoring

#### Correct Architecture Pattern

```
User Input → Action → Service → External API/SDK
                ↓
            Provider → Context for prompts
                ↓
        Post-interaction → Evaluator → Learning
```

#### Plugin Structure

```typescript
interface Plugin {
  name: string;
  description: string;
  actions: Action[]; // User interactions
  services: Service[]; // Stateful integrations (REQUIRED for external APIs)
  providers: Provider[]; // Context suppliers (read-only)
  evaluators?: Evaluator[]; // Post-interaction processors (optional)
}
```

#### Action Handler Example

```typescript
handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
  try {
    // 1. Get service and process
    const service = runtime.getService<MyService>('myService');
    const result = await service.process(message.content);

    // 2. Send message to user via callback
    await callback({
      text: `Processed successfully: ${result}`,
      action: 'MY_ACTION',
    });

    // 3. Return ActionResult for action chaining
    return {
      success: true,
      text: 'Operation completed',
      values: { processedData: result },
      data: { actionName: 'MY_ACTION', result },
    };
  } catch (error) {
    await callback({ text: 'Error occurred', error: true });
    return { success: false, error };
  }
};
```

**Common Mistakes to Avoid:**

- Using Providers to execute transactions → Use Services
- Using Evaluators to parse user input → Use Actions
- Direct Action → External API calls → Always go through Services
- Providers with state-changing methods → Providers are read-only
- Forgetting to return ActionResult → Breaks action chaining
- Confusing callback vs return → Callback for chat, return for chaining

### Database Architecture

- **ORM:** Drizzle ORM with IDatabaseAdapter interface
- **Adapters:** PGLite (local development), PostgreSQL (production)
- **Default:** PGLite for lightweight development

---

## DEVELOPMENT WORKFLOW

### Before Starting Any Task

1. **Understand requirement completely**
2. **Research all affected files and components**
3. **Create detailed implementation plan**
4. **Identify all possible risks and negative outcomes**
5. **ALWAYS evaluate if parallel claude code agents can be used** - Run multiple Task agents concurrently whenever possible for maximum performance

### Implementation Process

1. **Write comprehensive tests first when possible**
2. **Implement solution iteratively**
3. **Never use stubs or incomplete code**
4. **Continue until all stubs are replaced with working code**
5. **Test thoroughly - models hallucinate frequently**

### Testing Philosophy

- **Test Framework:** bun:test EXCLUSIVELY - NEVER use jest, vitest, mocha, or any other testing framework
- **All tests must pass successfully before considering code complete**
- **Prefer real integration tests that cover entire functionality flow over isolated unit tests**
- **E2E Tests:** Use actual runtime with real integrations
- **Unit Tests:** Use bun:test with standard primitives
- **Always verify tests pass before declaring changes correct**
- **First attempts are usually incorrect - test thoroughly**

---

## TASK COMPLETION VERIFICATION

### BEFORE CONSIDERING ANY TASK COMPLETE:

1. **CHECK IF ALL RELEVANT TESTS ARE PASSING**
2. **Run package-specific tests** if working on a specific package
3. **Run `bun test`** in monorepo root to test almost all packages
4. **Run `bun run build`** to ensure code builds successfully
5. **Run `bun run lint`** to check code formatting and style
6. **REFLECT:** Are all tests passing? Did you cut any corners? Are there any build issues?

### Testing Commands by Scope

```bash
# Full test suite (recommended)
bun test

# Package-specific testing (run from package directory)
cd packages/core && bun test
cd packages/cli && bun test
cd packages/client && bun test

# Run specific test files
bun test src/path/to/file.test.ts
bun test --watch                        # Watch mode for development

# Build verification
bun run build
```

---

## CODE STYLE GUIDELINES

### Language & Patterns

- **TypeScript with proper typing for all new code**
- **NEVER use any, never, or unknown types - always opt for specific types that accurately represent the data**
- **Ensure code is free of TypeScript errors or warnings - code must compile without issues**
- **Prefer iteration and modularization over code duplication**
- **Comprehensive error handling required**
- **Clear separation of concerns**

### Naming Conventions

- **Variables:** `camelCase` (e.g., `isLoading`, `hasError`)
- **Functions:** `camelCase` (e.g., `searchResults` vs `data`)
- **React Components:** `PascalCase` (e.g., `DashboardMenu`)
- **Props Interfaces:** `PascalCase` ending with `Props` (e.g., `DashboardMenuProps`)
- **File Names:** Match main export (e.g., `DashboardMenu.tsx`, `dashboardLogic.ts`)

### File Organization

- **Follow existing patterns in codebase**
- **Use descriptive variable and function names**
- **Comment complex logic**
- **Don't comment change notes**
- **Never omit code or add "// ..." as it risks breaking the codebase**

---

## ENVIRONMENT CONFIGURATION

### Required Environment Variables

```bash
# Model Provider (at least one required)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database (optional - defaults to PGLite)
POSTGRES_URL=your_postgres_connection_string

# Logging
LOG_LEVEL=info  # Options: fatal, error, warn, info, debug, trace
```

### Optional Service Keys

```bash
# Discord
DISCORD_APPLICATION_ID=
DISCORD_API_TOKEN=

# Telegram
TELEGRAM_BOT_TOKEN=

# Twitter
TWITTER_TARGET_USERS=
TWITTER_DRY_RUN=false

# Blockchain
EVM_PRIVATE_KEY=
SOLANA_PRIVATE_KEY=
```

---

## IMPORTANT FILES & LOCATIONS

### Configuration Files

- **`package.json`** - Root monorepo configuration
- **`turbo.json`** - Turbo build pipeline configuration
- **`lerna.json`** - Lerna publishing configuration
- **`tsconfig.json`** - TypeScript configuration
- **`.cursorrules`** - Cursor IDE development rules

### Key Source Files

- **`packages/core/src/types/index.ts`** - All core type definitions
- **`packages/core/src/runtime.ts`** - Main runtime implementation
- **`packages/cli/src/index.ts`** - CLI entry point
- **`.env.example`** - Environment variable template

### Documentation

- **`README.md`** - Main project documentation
- **`AGENTS.md`** - Comprehensive agent documentation (45k+ tokens)
- **`CHANGELOG.md`** - Version history
- **`scripts/dev-instructions.md`** - Developer context and guidance

---

## 📍 РАСПОЛОЖЕНИЕ КОНФИГУРАЦИЙ MCP

### ⚠️ ВАЖНОЕ ПРАВИЛО
**ВСЕ конфигурации MCP должны храниться в папке репозитория `/Users/playra/vibee-eliza-999/.claude/`, а НЕ на уровне пользователя `~/.claude/`!**

Это обеспечивает:
- Совместную работу команды в репозитории
- Версионирование конфигураций
- Централизованное управление всеми MCP настройками

**Файлы в репозитории:**
- `/Users/playra/vibee-eliza-999/.claude/mcp.json` - конфигурация всех MCP серверов
- `/Users/playra/vibee-eliza-999/.claude/cclsp.json` - конфигурация LSP серверов для cclsp

---

## MCP (Model Context Protocol) - ОБЯЗАТЕЛЬНО К ИСПОЛЬЗОВАНИЮ!

### Что это
**MCP** (Model Context Protocol) - это система интеграции инструментов для Claude Code. Обязательно использовать для всех проектов!

### Установленные MCP серверы:

#### 🔌 **Context7** (ОСНОВНОЙ - ДОКУМЕНТАЦИЯ!)
- **Пакет:** `@upstash/context7-mcp` (установлен через npm)
- **Назначение:** Получение актуальной документации и примеров кода любых библиотек
- **Без контекста:** "Code examples are outdated and based on year-old training data"
- **С Context7:** "Context7 MCP pulls up-to-date, version-specific documentation and code examples straight from the source"
- **Использование:**
  ```typescript
  // Шаг 1: Получить ID библиотеки
  await mcp__context7__resolve-library-id({ libraryName: "react" })

  // Шаг 2: Получить документацию
  await mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/facebook/react",
    topic: "hooks"
  })
  ```
- **Лучшие практики:**
  - Всегда добавляйте "use context7" в промпты для документации
  - Сначала получайте library_id, потом используйте его
  - Настройте правило автоинвокации в настройках клиента

#### 🔍 **cclsp** (КОД-НАВИГАЦИЯ!)
- **Пакет:** `cclsp@0.6.2` (установлен глобально)
- **Назначение:** Интеграция LLM с Language Server Protocol (LSP) для навигации по коду
- **Проблема:** "LLM-based coding agents often struggle with providing accurate line/column numbers"
- **Решение:** "cclsp solves this by intelligently trying multiple position combinations"
- **Инструменты cclsp:**
  - `cclsp.find_definition` - Поиск определений символов
  - `cclsp.find_references` - Поиск всех ссылок на символ
  - `cclsp.rename_symbol` - Переименование символов (создает .bak файлы)
  - `cclsp.get_diagnostics` - Получение диагностик кода
  - `cclsp.restart_server` - Перезапуск LSP серверов

**Примеры использования cclsp:**
```typescript
// Найти определение функции
await cclsp.find_definition({
  file_path: "/path/to/file.ts",
  symbol_name: "processRequest",
  symbol_kind: "function"
})

// Найти все ссылки на переменную
await cclsp.find_references({
  file_path: "/path/to/file.ts",
  symbol_name: "CONFIG_PATH",
  include_declaration: true
})

// Переименовать символ (с бэкапом!)
await cclsp.rename_symbol({
  file_path: "/path/to/file.ts",
  symbol_name: "getUserData",
  new_name: "fetchUserProfile",
  dry_run: true  // Сначала предварительный просмотр
})
```

#### 📚 **Context7 + cclsp - МОЩНАЯ КОМБИНАЦИЯ!
- **Context7** - документация и примеры кода (актуальная информация)
- **cclsp** - навигация по собственному коду (определения, рефакторинг)
- **Вместе** - полный контроль над кодом и документацией!

#### 🎨 **fal-ai-image** (ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ!)
- **Пакет:** `mcp-fal-ai-image` (установлен через npx)
- **Назначение:** Генерация изображений из текстовых описаний через FAL AI
- **Возможности:**
  - 600+ моделей для генерации изображений
  - Стабильная диффузия (SDXL, SD 1.5, и др.)
  - Быстрый Sprint режим (2-4 шага)
  - Качественный Base режим (18+ шагов)
  - Поддержка различных размеров: 512x512 до 3840x2160
  - Генерация до 4 изображений за раз
  - Seed для воспроизводимости результатов
- **API:** https://fal.ai/ (нужен API ключ)
- **Конфигурация:** Ключ `FAL_KEY` в **Infisical cloud** (НЕ в .env!)
- **Пример использования:**
  ```json
  {
    "tool": "generate-image",
    "args": {
      "prompt": "Футуристический город на закате с летающими машинами",
      "model": "fal-ai/kolors"
    }
  }
  ```

### Другие MCP серверы:

#### 🔍 **sequential-thinking**
- Для пошагового анализа и планирования сложных задач
- Помогает разбивать сложные проблемы на подзадачи

#### 📁 **filesystem**
- Для работы с файловой системой через MCP
- Доступ к файлам проекта

#### 📱 **telegram** (besir-mcp-telegram-bot)
- Для интеграции с Telegram API через MCP

### Конфигурация MCP:

**Файлы конфигурации (В РЕПОЗИТОРИИ):**
- `/Users/playra/vibee-eliza-999/.claude/mcp.json` - главная конфигурация всех MCP серверов
- `/Users/playra/vibee-eliza-999/.claude/cclsp.json` - конфигурация cclsp LSP серверов

**Установленные серверы:**
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
    "fal-ai-image": {
      "command": "npx",
      "args": ["-y", "mcp-fal-ai-image"]
    },
    "filesystem": { /* ... */ },
    "sequential-thinking": { /* ... */ },
    "telegram": { /* ... */ }
  }
}
```

**Установка дополнительных MCP серверов:**
```bash
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-everything
```

### Обязательные правила использования MCP:

#### Для Context7:
1. **ПЕРЕД работой с любой библиотекой** - всегда используйте context7
2. **Добавляйте "use context7"** в промпты для документации
3. **Сначала** получайте library_id через `resolve-library-id`, потом используйте его

#### Для cclsp:
1. **ПЕРЕД рефакторингом** - используйте `find_references` для анализа влияния
2. **ПЕРЕД переименованием** - всегда делайте `dry_run: true`
3. **ДЛЯ навигации** - используйте `find_definition` вместо ручного поиска
4. **ПРИ ошибках** - используйте `get_diagnostics` для проверки кода
5. **ПРИ зависании LSP** - используйте `restart_server`

#### Для fal-ai-image:
1. **НУЖЕН API КЛЮЧ** - получите на https://fal.ai/ и добавьте в **Infisical cloud** как `FAL_KEY`
2. **НЕ В .ENV** - все секреты должны быть в Infisical, НЕ в .env файле!
3. **ДЛЯ БЫСТРЫХ тестов** - используйте Sprint режим (2-4 шага генерации)
4. **ДЛЯ МАКСИМАЛЬНОГО качества** - используйте Base режим (18+ шагов)
5. **УКАЗЫВАЙТЕ размер** - от 512x512 до 3840x2160 пикселей
6. **СЕМЕНА (seed)** - используйте для воспроизводимых результатов

### Правило автоинвокации:

**Настройте в клиенте:**
> "Always use context7 when I need code generation, setup or configuration steps, or library/API documentation"

**В промпте просто добавьте:**
> "use context7"

**Примеры:**
- "Create a Next.js middleware that checks for a valid JWT. use context7"
- "Configure a Cloudflare Worker script to cache JSON API responses. use context7"

---

## DEVELOPMENT PRINCIPLES

### Flow - Always Plan First

- **Bug Fixes:** First identify the bug, research ALL related files, create complete change plan
- **Impact Analysis:** Identify all possible errors and negative outcomes from changes
- **Documentation:** Create thorough implementation plan BEFORE writing any code
- **Risk Assessment:** Thoroughly outline all risks and offer multiple approaches

### No Stubs or Incomplete Code

- **Never** use stubs, fake code, or incomplete implementations
- **Always** continue writing until all stubs are replaced with finished, working code
- **No POCs:** Never deliver proof-of-concepts - only finished, detailed code
- **Iteration:** Work on files until they are perfect, testing and fixing until all tests pass

### Test-Driven Development

- Models hallucinate frequently - thorough testing is critical
- Verify tests are complete and passing before declaring changes correct
- First attempts are usually incorrect - test thoroughly
- Write tests before implementation when possible

---

## IMPORTANT NOTES

### Memory System

- Each agent has a fully separate and unique set of UUIDs to describe the same world, rooms, etc
- Uses deterministic UUID generation
- All IDs swizzled with agent's UUID for consistency

### Plugin Architecture

- All components integrate through the runtime
- Services are the state management layer
- Actions drive agent behavior
- Providers supply context
- Evaluators enable learning and reflection
- HTTP routes with "public" exposed as HTML tabs (must have "name" property)

### Compatibility

- Maintain backwards compatibility in changes
- Consider migration paths for proposed changes

---

## TROUBLESHOOTING

### Common Issues

1. **Build Failures:** Check TypeScript errors with `bun run build`
2. **Test Failures:** Run `bun test` and check individual package tests
3. **Import Errors:** Verify correct use of `@elizaos/core` vs `packages/core`
4. **Environment Issues:** Check `.env` file against `.env.example`

### Performance Considerations

- Agent perspective is key for all abstractions
- Services maintain system state
- Access pattern: `getService(serviceName)`
- Services can call each other, actions can access services

### Getting Help

- Check existing documentation in `packages/docs/`
- Review `.cursorrules` for architectural guidance
- Look at existing patterns in similar packages
- Test changes thoroughly before considering complete

---

_This configuration file should be referenced at the start of any ElizaOS development session to ensure proper setup and adherence to project standards._
- # ==========================================================================================================
# 🔐 INFISICAL CLOUD-FIRST CONFIGURATION - CRITICAL FOR AI AGENTS
# ==========================================================================================================
#
# ⚠️ ⚠️ ⚠️  WARNING FOR AI AGENTS AND AUTOMATION  ⚠️ ⚠️ ⚠️
#
# DO NOT ADD ANY OTHER VARIABLES TO THIS FILE!
# DO NOT "FIX" OR "COMPLETE" THIS FILE!
#
# This file should ONLY contain 5 variables:
# 1. INFISICAL_CLIENT_ID
# 2. INFISICAL_CLIENT_SECRET
# 3. INFISICAL_PROJECT_ID
# 4. INFISICAL_ENVIRONMENT
# 5. NODE_ENV
#
# ALL other secrets (50+ variables) are loaded from Infisical cloud at runtime.
# See AI_AGENT_RULES.md for detailed explanation.
#
# ==========================================================================================================

# 🔐 Infisical Cloud-First Configuration - DEVELOPMENT
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3

# 🧪 DEVELOPMENT ENVIRONMENT
# Automatically loads BOT_TOKEN_TEST_1, BOT_TOKEN_TEST_2 and all API keys from Infisical
INFISICAL_ENVIRONMENT=dev

# NODE_ENV для development режима
NODE_ENV=development Слушай, запомни: все ключи здесь лежат .env