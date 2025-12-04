# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VIBEE Agent - ElizaOS Development Guide

> **Optimized for Claude LLM** - Complete reference for VIBEE ElizaOS agent project with Telegram interface, Avatar Face plugin, and Rainbow Bridge testing

## 🗣️ Язык общения и документации

**КРИТИЧЕСКИ ВАЖНО:**

- ✅ **Документация ВСЕГДА на русском языке** - Все .md файлы, комментарии в коде, README, руководства - только русский
- ✅ **Общение с пользователем на русском** - Отвечать, объяснять, писать код-комментарии на русском
- ✅ **Переменные и функции можно на английском** - Имена переменных, функций, классов - английский (как обычно в коде)
- ✅ **Текст пользователю на русском** - Все сообщения, уведомления, help-тексты - русский

**Пример:**
```typescript
// Хорошо ✅
const userName = "Иван"; // переменная на англ, комментарий на русском
/**
 * Получает данные пользователя
 * @param userId - ID пользователя
 */
function getUserData(userId: string) {
  return "Данные пользователя"; // текст пользователю на русском
}

// Плохо ❌
const polzovatel = "Иван"; // переменная на русском
// Get user data - комментарий на английском
```

Всегда говорим с пользователем на русском! 🇷🇺

---

# 🚨 КРИТИЧЕСКИ ВАЖНО: КОМАНДА ЗАПУСКА АГЕНТА

## ⚡ ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА

**✅ ВСЕГДА ИСПОЛЬЗУЕМ:**
```bash
bun dev
```

**❌ НИКОГДА НЕ ИСПОЛЬЗУЕМ:**
- `npm run dev`
- `npm run dev:hot`
- `bun run dev`
- `elizaos dev`
- Любые другие команды!

**🎯 ПОЧЕМУ ТОЛЬКО `bun dev`:**

Это **ОДИН СКРИПТ** который:
- Запускает агента с правильной конфигурацией
- Автоматически настраивает все переменные окружения
- Подключает Infisical секреты
- Запускает все необходимые сервисы
- **НИКАКИХ дополнительных команд не нужно!**

**📜 ЗАПОМНИ НАВСЕГДА:** `bun dev` - единственная команда запуска агента VIBEE!

Любые другие команды - это ошибка. Всегда используем только `bun dev`.

---

## 📋 Project Overview

| Property            | Value                         |
| ------------------- | ----------------------------- |
| **Project Type**    | VIBEE ElizaOS Agent           |
| **Package Manager** | `bun` (REQUIRED)              |
| **Interface**       | Telegram Bot                  |
| **Framework**       | ElizaOS with plugin ecosystem |
| **Architecture**    | Plugin composition pattern    |
| **Testing**         | Rainbow Bridge (Autonomous)   |

## 📚 Документация проекта

В проекте есть несколько ключевых документов:

### 📖 Основные документы

1. **CLAUDE.md** (этот файл) - Руководство для Claude Code
   - Команды разработки
   - Архитектура проекта
   - Лучшие практики
   - Правила работы с кодом

2. **VIBEE_SPECIFICATION.md** - Полная спецификация VIBEE (17,734 строк!)
   - Функциональное программирование (TaskEither, Either, pipe)
   - Радужный мост (Rainbow Bridge)
   - UX/UI с анимациями и геймификацией
   - Автономный цикл агентов
   - Принцип "7 раз отмерь, один раз отрежь"
   - VIBE-KNOWLEDGE-KEEPER (хранитель порядка)
   - И многое другое

3. **AVATAR_FACE.md** - Детальный план реализации плагина Avatar Face
   - Digital Avatar Body (обучение LoRA моделей)
   - NeuroPhoto (генерация изображений)
   - Архитектура плагина
   - Интерфейсы и база данных

4. **README.md** - Краткое описание проекта
   - Основные команды
   - Запуск в dev режиме
   - Быстрый старт

5. **llms-full.txt** - Полный контекст для LLM (46K строк)
   - Используй этот файл для понимания всего проекта
   - Содержит документацию всех ElizaOS компонентов
   - Критически важен для работы с кодовой базой

### 🎯 Как использовать документы

- **Новичок в проекте**: Начните с README.md → CLAUDE.md → AVATAR_FACE.md
- **Разработка функционала**: Смотрите VIBEE_SPECIFICATION.md для архитектурных решений
- **Работа с Claude Code**: Читайте CLAUDE.md для правил и команд
- **Реализация Avatar Face**: Детально изучите AVATAR_FACE.md

## 🏗️ VIBEE Architecture
| ------------------- | ----------------------------- |
| **Project Type**    | VIBEE ElizaOS Agent           |
| **Package Manager** | `bun` (REQUIRED)              |
| **Interface**       | Telegram Bot                  |
| **Framework**       | ElizaOS with plugin ecosystem |
| **Architecture**    | Plugin composition pattern    |
| **Testing**         | Rainbow Bridge (Autonomous)   |

## 🏗️ VIBEE Architecture

VIBEE is a **Telegram-native AI mentor** with autonomous testing capabilities:

```
📦 VIBEE Agent Project
├── 🤖 Eliza Character (Telegram-native mentor)
├── 🔌 Plugin Ecosystem
│   └── plugin-vibe-face-avatar (LoRA training + NeuroPhoto)
├── 🌈 Rainbow Bridge (Autonomous Telegram testing)
├── 🔐 Infisical (Cloud-first secret management)
├── 📱 Telegram Interface (Primary platform)
└── 🚀 ElizaOS Runtime
```

### Key Components

**1. Character** (`src/character.ts`)
- Named "Eliza" - helpful AI assistant
- Configured for Telegram interaction
- Supports multiple LLM providers (OpenAI, Anthropic, OpenRouter, Ollama)

**2. Plugin: plugin-vibe-face-avatar** (`/plugin-vibe-face-avatar/`)
- **Digital Avatar Body**: Train personal LoRA models from user photos
- **NeuroPhoto**: Generate images using trained LoRA models
- Uses Fal.ai and Replicate APIs
- Functional style with TaskEither

**3. Rainbow Bridge** (`scripts/rainbow-bridge-runner.py`)
- **Autonomous testing through real Telegram**
- No human intervention required
- Critical test scenarios for production validation
- Tests actual bot behavior via Telegram API

**4. Infisical Cloud-First Secrets**
- All secrets loaded from Infisical cloud
- `.env.dev` only contains Infisical credentials + dev settings
- 50+ variables managed centrally in cloud

## 📁 Project Structure

```
vibee-agent/
├── 📂 src/                           # Main agent source
│   ├── 📄 character.ts              # Eliza character config
│   ├── 📄 index.ts                  # Main entry point
│   ├── 📄 plugin.ts                 # Starter plugin
│   └── 📂 frontend/                 # React frontend (optional)
├── 📂 plugin-vibe-face-avatar/      # Core plugin: Avatar Face
│   ├── 📂 src/
│   │   ├── 📂 actions/              # User commands
│   │   ├── 📂 services/             # API integrations (Fal/Replicate)
│   │   ├── 📂 providers/            # Context providers
│   │   └── 📄 index.ts              # Plugin export
│   └── 📄 package.json
├── 📂 scripts/                      # Utility scripts
│   └── 📄 test-all.sh               # Test runner
├── 📂 tests/                        # Test scenarios (if exists)
├── 📂 data/                         # Agent memory & storage
├── 🔐 .env.dev                      # Dev secrets (Infisical + minimal)
├── 🔐 .env                          # Production secrets (gitignored)
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript config
└── 📄 CLAUDE.md                     # This file
```

## 🤖 Character Configuration

### Core Character Definition

```typescript
// src/character.ts
import { Character } from '@elizaos/core';

export const character: Character = {
  // Basic Identity
  name: 'AssistantAgent',
  username: 'assistant',

  // Personality & Behavior
  bio: 'A helpful AI assistant created to provide assistance and engage in meaningful conversations.',

  system: `You are a helpful, harmless, and honest AI assistant.
Core principles:
- Always strive to provide accurate and useful information
- Be respectful and considerate in all interactions  
- Admit when you don't know something
- Ask clarifying questions when requests are ambiguous`,

  // Conversation Examples (Training Data)
  messageExamples: [
    [
      { name: 'user', content: { text: 'Hello! How are you today?' } },
      {
        name: 'AssistantAgent',
        content: {
          text: "Hello! I'm doing well, thank you for asking. I'm here and ready to help you with whatever you need. How can I assist you today?",
        },
      },
    ],
    [
      { name: 'user', content: { text: 'Can you help me understand a complex topic?' } },
      {
        name: 'AssistantAgent',
        content: {
          text: "Absolutely! I'd be happy to help you understand any topic. Could you tell me which specific topic you'd like to explore? I'll break it down in a clear, easy-to-understand way.",
        },
      },
    ],
  ],

  // Communication Style
  style: {
    all: [
      'Be helpful and friendly',
      'Use clear and concise language',
      'Show genuine interest in helping',
      'Maintain a professional yet approachable tone',
    ],
    chat: [
      'Respond naturally and conversationally',
      'Use appropriate emojis sparingly for warmth',
      'Ask follow-up questions to better understand needs',
    ],
    post: [
      'Be informative and engaging',
      'Structure information clearly',
      'Include actionable insights when possible',
    ],
  },

  // Plugin Configuration
  plugins: [
    // REQUIRED: Core functionality
    '@elizaos/plugin-bootstrap', // Essential actions & handlers
    '@elizaos/plugin-sql', // Memory & database management

    // REQUIRED: Model provider (choose one or more)
    '@elizaos/plugin-openai', // GPT-4, GPT-3.5, etc.
    // "@elizaos/plugin-anthropic", // Claude models
    // "@elizaos/plugin-groq",      // Fast inference

    // OPTIONAL: Communication channels
    // "@elizaos/plugin-discord",   // Discord integration
    // "@elizaos/plugin-twitter",   // Twitter/X integration
    // "@elizaos/plugin-telegram",  // Telegram bot

    // OPTIONAL: Specialized capabilities
    // "@elizaos/plugin-solana",    // Solana blockchain
    // "@elizaos/plugin-evm",       // Ethereum/EVM chains
  ],

  // Agent Settings
  settings: {
    voice: 'en-US-Neural2-F',
    model: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    secrets: {},
    intiface: false,
    chains: [],
  },
};

export default character;
```

### Character Variants Pattern

```typescript
// characters/variants.ts
import { Character } from '@elizaos/core';
import { baseCharacter } from '../src/character';

// Production character
export const productionCharacter: Character = {
  ...baseCharacter,
  name: 'ProductionAgent',
  settings: {
    ...baseCharacter.settings,
    model: 'gpt-4', // More capable model for production
  },
};

// Development character
export const devCharacter: Character = {
  ...baseCharacter,
  name: 'DevAgent',
  settings: {
    ...baseCharacter.settings,
    model: 'gpt-4o-mini', // Faster/cheaper for development
  },
  plugins: [
    ...baseCharacter.plugins,
    // Add development-only plugins
  ],
};

// Specialized character
export const cryptoCharacter: Character = {
  ...baseCharacter,
  name: 'CryptoAgent',
  bio: 'A cryptocurrency and blockchain expert assistant',
  plugins: [...baseCharacter.plugins, '@elizaos/plugin-solana', '@elizaos/plugin-evm'],
};
```

## 🔌 Plugin Ecosystem

### Required Plugins

| Plugin                      | Purpose                        | Status       |
| --------------------------- | ------------------------------ | ------------ |
| `@elizaos/plugin-bootstrap` | Core actions, message handling | **REQUIRED** |
| `@elizaos/plugin-sql`       | Memory, database management    | **REQUIRED** |

### Model Provider Plugins (Choose One or More)

| Plugin                      | Models                   | Use Case                       |
| --------------------------- | ------------------------ | ------------------------------ |
| `@elizaos/plugin-openai`    | GPT-4, GPT-3.5, GPT-4o   | General purpose, reliable      |
| `@elizaos/plugin-anthropic` | Claude 3.5 Sonnet, Haiku | Reasoning, analysis            |
| `@elizaos/plugin-groq`      | Llama, Mixtral           | Fast inference, cost-effective |
| `@elizaos/plugin-llama`     | Local Llama models       | Privacy, offline operation     |

### Communication Plugins (Optional)

```bash
# Social platforms
bun add @elizaos/plugin-discord      # Discord bot integration
bun add @elizaos/plugin-twitter      # Twitter/X posting & monitoring
bun add @elizaos/plugin-telegram     # Telegram bot functionality

# Web interfaces
bun add @elizaos/plugin-web          # Web UI for agent interaction
bun add @elizaos/plugin-rest         # REST API endpoints
```

### Specialized Plugins (Optional)

```bash
# Blockchain & Crypto
bun add @elizaos/plugin-solana       # Solana transactions & data
bun add @elizaos/plugin-evm          # Ethereum & EVM chains

# Data & Tools
bun add @elizaos/plugin-web-search   # Web search capabilities
bun add @elizaos/plugin-image        # Image generation & analysis
```

## 🔐 Environment Configuration

### ⚠️ CRITICAL: Cloud-First Secret Management

VIBEE uses **Infisical Cloud** for secret management. DO NOT add secrets to `.env` files!

### `.env.dev` Structure (Development)

```bash
# 🔐 Infisical Cloud-First Configuration (ONLY these 5 variables!)
# Получи эти значения из Infisical Dashboard
INFISICAL_CLIENT_ID=<your-client-id-from-infisical>
INFISICAL_CLIENT_SECRET=<your-client-secret-from-infisical>
INFISICAL_PROJECT_ID=<your-project-id-from-infisical>
INFISICAL_ENVIRONMENT=dev

# 🧪 Development Environment
NODE_ENV=development

# 📱 Telegram API (for Rainbow Bridge) - получи на https://my.telegram.org
TELEGRAM_API_ID=<your-api-id>
TELEGRAM_API_HASH=<your-api-hash>
TELEGRAM_PHONE=<your-phone-number>

# 🌈 Rainbow Bridge Session - генерируется автоматически при первом запуске
TELEGRAM_SESSION_STRING=<generated-session-string>
```

### Secrets Loaded from Infisical Cloud

All other secrets (50+ variables) are loaded from Infisical at runtime:
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` - LLM providers
- `FAL_KEY` - Fal.ai API for LoRA training
- `REPLICATE_API_KEY` - Replicate API for image generation
- Database credentials
- All other service API keys

### Environment Files Structure

```bash
# ✅ .env.dev (IN GIT - Dev credentials only)
# Contains Infisical client creds + minimal dev settings

# ✅ .env (GITIGNORED - Production)
# Contains production Infisical client creds

# ✅ .env.local (GITIGNORED - Local overrides)
# For local testing, never commit
```

### Setting Up Infisical

```bash
# 1. Install Infisical CLI
npm install -g @infisical/cli

# 2. Login to Infisical
infisical login

# 3. Link project
infisical init --projectId=fd763fa3-35d5-4045-93bd-1795c5f00fc3

# 4. Pull secrets (dev environment)
infisical secrets pull --env=dev

# 5. Set local environment
source .infisical.json  # Or use Infisical's integration
```

**⚠️ NEVER add API keys directly to .env files! Use Infisical Cloud only!**

### Verification Commands

```bash
# Check Infisical connection
infisical status

# List available secrets
infisical secrets list --env=dev

# Validate critical secrets
grep -E "(INFISICAL|TELEGRAM)" .env.dev
```

## 🚀 Development Workflow

### Essential Commands

```bash
# ================================
# CORE DEVELOPMENT COMMANDS
# ================================

# Install dependencies
bun install

# 🎯 ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА АГЕНТА
bun dev
# - Автоматически настраивает все окружение
# - Подключает Infisical секреты
# - Запускает агента с правильной конфигурацией
# - ВСЕГДА используем только эту команду!

# Run all tests
npm test

# Type checking
npm run type-check

# Build project
npm run build

# ================================
# RAINBOW BRIDGE TESTING
# ================================

# Test critical scenarios only (FAST - for CI/CD)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# Test all scenarios (SLOW - for manual validation)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json

# ================================
# PLUGIN DEVELOPMENT
# ================================

# Develop plugin in isolation
cd plugin-vibe-face-avatar
bun install
elizaos dev

# Build plugin
bun run build

# Test plugin
bun test

# ================================
# FORMATTING & LINTING
# ================================

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check

# ================================
# COMPLETE VALIDATION
# ================================

# Run all checks: typecheck + format + test
npm run check-all
```

### Development Scripts

```json
// package.json
{
  "scripts": {
    "start": "elizaos start",
    "dev": "elizaos dev",
    "dev:hot": "elizaos start --dev", // HOT RELOAD - RECOMMENDED!
    "build": "bun run build.ts",
    "test": "bun run test:install && bun test",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ./src",
    "format:check": "prettier --check ./src",
    "check-all": "bun run type-check && bun run format:check && bun run test"
  }
}
```

**🎯 ВАЖНО: Главная команда для запуска агента**

```bash
bun dev
```

### Testing Strategy

#### **Method 1: Rainbow Bridge (⭐ PRIMARY - Autonomous)**

**What is Rainbow Bridge?**
- Bot tests itself through REAL Telegram
- No human intervention needed
- Runs critical test scenarios autonomously
- Validates production behavior

```bash
# Critical tests only (fast, for CI)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# All tests (slow, for manual validation)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json
```

**Rainbow Bridge Flow:**
1. Starts Telegram session via API
2. Sends commands to bot
3. Validates responses
4. Checks database state
5. Generates test report
6. tears down session

#### **Method 2: Interactive Development**

```bash
# 🎯 ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА АГЕНТА
bun dev

# С отладочным логированием
LOG_LEVEL=debug bun dev
```

**Почему только `bun dev`:**
- Автоматически настраивает все окружение
- Подключает Infisical секреты
- Включает hot reload для разработки
- Один скрипт - все настройки

#### **Method 3: Component Testing**

```bash
# Run specific test file
bun test src/__tests__/character.test.ts

# Watch mode (auto-run on changes)
bun test --watch

# Coverage report
bun test --coverage
```

#### **Method 4: Integration Testing**

```bash
# Full test suite (component + e2e)
npm test

# Install test dependencies
npm run test:install
```

## 🎨 Plugin: plugin-vibe-face-avatar

This is VIBEE's core plugin for LoRA training and image generation.

### Overview

```
plugin-vibe-face-avatar/
├── 🤖 Digital Avatar Body     # Train personal LoRA models
└── 📸 NeuroPhoto              # Generate images from LoRA
```

### Digital Avatar Body (LoRA Training)

**Purpose**: Train personal LoRA models from user photos

**Flow**:
1. User selects training model (Portrait Trainer 550⭐ or Fast Training 220⭐)
2. User selects gender (Male ♂️ / Female ♀️)
3. User enters model name (2-50 chars, auto-sanitized)
4. User uploads 10-25 photos (JPG/PNG/WEBP, max 10MB)
5. System creates ZIP and sends to Fal.ai
6. Model saved to DB with status: training → completed/failed

**Commands**:
- `/face add` - Add face for training
- `/face train` - Train LoRA model

**Database**: `user_models` table
- `model_url` - URL of trained LoRA model
- `trigger_word` - Word to include in prompts (e.g., "NEURO_SAGE")
- `status` - training/completed/failed
- `gender` - male/female/person

### NeuroPhoto (Image Generation)

**Purpose**: Generate images using ONLY user's trained LoRA models

**Flow**:
1. Get user's active models via `getActiveUserModelsByType(telegramId, 'replicate')`
2. If no models → "Use /face add to create a model first"
3. If one model → auto-select
4. If multiple models → show inline buttons to select
5. User enters prompt (min 3 chars)
6. System generates with:
   - User's `trigger_word` from model
   - User's `gender` from profile
   - Additional enhancement prompts
7. Result sent via Telegram with metadata

**Commands**:
- `/neurophoto <prompt>` - Generate image
- `нарисуй <prompt>` - Russian alternative
- `create image <prompt>` - English alternative

**Cost**: 4⭐ per image (via `calculateServiceCost('neuro_photo', { num_images })`)

**Technical Details**:
- Uses `generateNeuroPhotoHybrid()` function
- Combines `trigger_word` + gender + prompt
- Saves operation to `operations` table
- Saves image to `assets` table
- Deducts balance atomically

### Plugin Architecture

```typescript
// plugin-vibe-face-avatar/src/
├── 📂 actions/
│   ├── faceAddAction.ts       # /face add
│   ├── faceTrainAction.ts     # /face train
│   └── neuroPhotoAction.ts    # /neurophoto
├── 📂 services/
│   ├── loraTrainingService.ts # Fal.ai LoRA training
│   ├── imageGenerationService.ts # Image gen via LoRA
│   └── costCalculator.ts      # Centralized pricing
├── 📂 providers/
│   └── avatarFaceProvider.ts  # Context about commands
└── 📄 index.ts                # Plugin export
```

### Development Commands

```bash
cd plugin-vibe-face-avatar

# Install dependencies
bun install

# 🎯 ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА ПЛАГИНА
elizaos dev

# Build plugin
bun run build

# Test plugin
bun test

# Type check
tsc --noEmit
```

### Testing Plugin

```bash
# Test in isolation
cd plugin-vibe-face-avatar
elizaos dev

# Test in full agent
cd ../../
bun dev

# Test LoRA training flow (manual)
# 1. Send /face add
# 2. Select model type
# 3. Select gender
# 4. Enter model name
# 5. Upload photos
# 6. Wait for completion

# Test NeuroPhoto flow (manual)
# 1. Train a model first
# 2. Send /neurophoto beautiful sunset
# 3. Verify image generation
```

## 🎛️ Custom Plugin Development

For project-specific functionality beyond available plugins:

### When to Create Custom Plugins

- ✅ **Unique business logic** not available in existing plugins
- ✅ **Proprietary API integrations** specific to your use case
- ✅ **Custom data sources** or specialized workflows
- ✅ **VIBEE-specific features** (like Avatar Face plugin)
- ❌ **NOT** for simple configuration changes (use character config)
- ❌ **NOT** for combining existing plugins (use character composition)

### Custom Plugin Structure (ElizaOS)

```typescript
// src/plugin.ts
import { Plugin, Action, ActionResult, Service } from '@elizaos/core';

// Service: Handle external APIs
class CustomService extends Service {
  static serviceType = 'custom';
  private apiClient: ExternalAPI;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.apiClient = new ExternalAPI(process.env.API_KEY);
  }

  async processRequest(data: any): Promise<any> {
    return await this.apiClient.process(data);
  }
}

// Action: Handle user commands
const customAction: Action = {
  name: 'CUSTOM_ACTION',
  description: 'Handles custom functionality',

  validate: async (runtime, message) => {
    return message.content.text.includes('custom');
  },

  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    try {
      const service = runtime.getService<CustomService>('custom');
      const result = await service.processRequest(message.content);

      // callback() sends message to user
      await callback({
        text: 'Custom functionality executed successfully',
        action: 'CUSTOM_ACTION',
      });

      // Return ActionResult for action chaining
      return {
        success: true,
        text: 'Custom action completed',
        values: { customResult: result },
        data: { actionName: 'CUSTOM_ACTION', result },
      };
    } catch (error) {
      await callback({
        text: 'Failed to execute custom action',
        error: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      { name: 'user', content: { text: 'custom request' } },
      { name: 'assistant', content: { text: 'Executing custom action', action: 'CUSTOM_ACTION' } },
    ],
  ] as ActionExample[][],
};

// Provider: Supply contextual information
const customProvider: Provider = {
  name: 'CUSTOM_PROVIDER',
  get: async (runtime, message) => {
    return {
      text: 'Custom contextual information',
      values: {},
      data: {},
    };
  },
};

export const customPlugin: Plugin = {
  name: 'custom-project-plugin',
  description: 'Project-specific functionality',
  priority: 0, // Plugin priority (higher runs first)
  services: [CustomService],
  actions: [customAction],
  providers: [customProvider], // Optional
};
```

### Integrating Custom Plugin

```typescript
// src/character.ts
import { customPlugin } from './plugin';

export const character: Character = {
  name: 'Eliza',
  plugins: [
    // Core plugins
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',

    // Model providers (choose one or more)
    ...(process.env.OPENAI_API_KEY ? ['@elizaos/plugin-openai'] : []),
    ...(process.env.ANTHROPIC_API_KEY ? ['@elizaos/plugin-anthropic'] : []),
    ...(process.env.OPENROUTER_API_KEY ? ['@elizaos/plugin-openrouter'] : []),

    // Custom plugin
    customPlugin,

    // Communication
    ...(process.env.TELEGRAM_BOT_TOKEN ? ['@elizaos/plugin-telegram'] : []),
  ],
};
```

## 📊 Database & Memory

### VIBEE Database Schema

VIBEE uses PostgreSQL via Drizzle ORM with these key tables:

#### `users` table
```typescript
{
  id: string (UUID)
  telegram_id: number
  bot_name: string
  username?: string
  first_name?: string
  last_name?: string
  gender?: 'male' | 'female'
  is_premium: boolean
  created_at: Date
  updated_at: Date
}
```

#### `user_models` table (Avatar Face)
```typescript
{
  id: string (UUID)
  telegram_id: number
  bot_name: string
  model_name: string
  model_url: string (URL of trained LoRA)
  trigger_word: string (e.g., 'NEURO_SAGE')
  gender?: 'male' | 'female' | 'person'
  status: 'training' | 'completed' | 'failed'
  training_model?: 'flux-lora-portrait-trainer' | 'flux-lora-fast-training'
  is_active: boolean
  created_at: Date
  completed_at?: Date
}
```

#### `operations` table
```typescript
{
  id: string (UUID)
  user_id: string (FK → users.id)
  type: string (e.g., 'NEUROPHOTO', 'FACE_TRAIN')
  service_type: string (e.g., 'neuro_photo', 'lora_training')
  status: 'pending' | 'processing' | 'completed' | 'failed'
  cost: { stars: number }
  result?: any
  metadata?: any
  created_at: Date
  updated_at: Date
}
```

#### `assets` table
```typescript
{
  id: string (UUID)
  user_id: string (FK → users.id)
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  metadata?: any
  created_at: Date
}
```

#### `balances` table
```typescript
{
  id: string (UUID)
  user_id: string (FK → users.id, UNIQUE)
  currencies: { stars: number, tokens?: number }
  updated_at: Date
}
```

### Accessing Database

```typescript
// In actions/services
import { db } from '@/core/drizzle/client';
import { users, user_models, operations, assets, balances } from '@/core/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Get user's models
const models = await db
  .select()
  .from(user_models)
  .where(and(
    eq(user_models.telegram_id, telegramId),
    eq(user_models.is_active, true),
    eq(user_models.status, 'completed')
  ));

// Create operation
await db.insert(operations).values({
  user_id: user.id,
  type: 'NEUROPHOTO',
  service_type: 'neuro_photo',
  status: 'completed',
  cost: { stars: 4 },
  metadata: { prompt, model: 'flux-schnell' },
});

// Update balance
await db.execute(sql`
  UPDATE balances
  SET currencies = jsonb_set(
    currencies,
    '{stars}',
    ((currencies->>'stars')::numeric - ${costStars})::text::jsonb
  ),
  updated_at = NOW()
  WHERE user_id = ${user.id}
`);
```

### ElizaOS Memory System

```typescript
// Add memory
await runtime.addMemory({
  content: { text: 'User prefers Russian language' },
  type: 'preference',
  roomId: currentRoomId,
});

// Get memories
const memories = await runtime.getMemories({
  roomId: currentRoomId,
  count: 10,
  unique: true,
});

// Search memories
const results = await runtime.searchMemories({
  tableName: 'preference',
  query: 'language preference',
  match_threshold: 0.8,
});
```

### Database Configuration

```bash
# Development (SQLite)
DATABASE_URL=sqlite://./data/dev.sqlite

# Production (PostgreSQL - from Infisical)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Custom adapter
DATABASE_ADAPTER=custom
```

## 🚀 Deployment Guide

### Local Production Deployment

```bash
# Build for production
bun run build

# Start in production mode
NODE_ENV=production elizaos start --character characters/production.json

# With process manager (recommended)
pm2 start "elizaos start --character characters/production.json" --name "my-agent"
```

## 🔧 Advanced Configuration

### Multi-Character Management

```typescript
// src/characters.ts
export const characters = {
  assistant: assistantCharacter,
  crypto: cryptoCharacter,
  social: socialCharacter,
  researcher: researcherCharacter
};

// Start specific character
elizaos start --character characters/crypto.json
```

### Plugin Configuration Override

```typescript
// Advanced plugin configuration
export const character: Character = {
  // ... base config
  plugins: [
    {
      // Plugin with custom config
      name: '@elizaos/plugin-openai',
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
  ],
};
```

### Performance Optimization

```typescript
// High-performance character config
export const character: Character = {
  // ... base config
  settings: {
    // Optimize for speed
    model: 'gpt-4o-mini', // Faster model
    embeddingModel: 'text-embedding-3-small', // Smaller embeddings

    // Memory management
    maxMemories: 1000, // Limit memory size
    memoryDecay: 0.95, // Gradual forgetting

    // Response optimization
    streamingEnabled: true, // Stream responses
    batchSize: 5, // Batch API calls
  },
};
```

## 🌈 Rainbow Bridge Testing

### What is Rainbow Bridge?

**Rainbow Bridge** is VIBEE's autonomous testing system that validates bot functionality through **real Telegram** without human intervention.

### How It Works

1. **Session Setup**: Uses Telegram API with session string
2. **Scenario Execution**: Runs test scenarios from JSON file
3. **Response Validation**: Checks bot responses match expected behavior
4. **Database Verification**: Validates data in PostgreSQL
5. **Report Generation**: Creates detailed test report
6. **Auto Cleanup**: Tears down Telegram session

### Test Scenarios Structure

```json
// tests/rainbow-bridge-scenarios.json
{
  "scenarios": [
    {
      "name": "face_add_basic",
      "description": "Test /face add command",
      "critical": true,
      "steps": [
        {
          "action": "send_message",
          "command": "/face add"
        },
        {
          "action": "wait_response",
          "expected_text": "Выберите модель обучения"
        },
        {
          "action": "check_database",
          "table": "operations",
          "conditions": {
            "type": "FACE_ADD"
          }
        }
      ]
    }
  ]
}
```

### Running Rainbow Bridge

```bash
# Run critical tests only (FAST - 2-3 minutes)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# Run all tests (SLOW - 10-15 minutes)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json

# Run specific scenario
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --filter "neurophoto"

# Generate HTML report
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --html-report
```

### Test Scenario Example

```python
# Test NeuroPhoto generation
{
  "name": "neurophoto_generation",
  "critical": True,
  "steps": [
    {
      "action": "send_message",
      "command": "/neurophoto красивый закат"
    },
    {
      "action": "wait_response",
      "expected_attachments": 1,
      "attachment_type": "image"
    },
    {
      "action": "check_database",
      "table": "operations",
      "conditions": {
        "type": "NEUROPHOTO",
        "status": "completed"
      }
    },
    {
      "action": "check_database",
      "table": "assets",
      "conditions": {
        "type": "image"
      }
    }
  ]
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Rainbow Bridge Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v3
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          bun install

      - name: Run Rainbow Bridge (Critical Only)
        run: |
          python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only
        env:
          TELEGRAM_API_ID: ${{ secrets.TELEGRAM_API_ID }}
          TELEGRAM_API_HASH: ${{ secrets.TELEGRAM_API_HASH }}
          TELEGRAM_SESSION_STRING: ${{ secrets.TELEGRAM_SESSION_STRING }}

      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: rainbow-bridge-report
          path: reports/
```

## 🐛 Troubleshooting Guide

### VIBEE-Specific Issues

| Issue                                    | Symptoms                                     | Solution                                                      |
| ---------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| **Infisical not loading secrets**        | "API key not found" errors                   | Check `.env.dev` has correct Infisical credentials           |
| **Rainbow Bridge timeout**               | Test fails with timeout                      | Increase timeout in runner script, check Telegram API limits |
| **LoRA training fails**                  | Model status stuck on "training"             | Check FAL_KEY in Infisical, verify image formats/limits      |
| **NeuroPhoto no models**                 | "No models found" message                    | User must train a model first with `/face add`               |
| **Balance not deducted**                 | Operations succeed but balance unchanged     | Check `calculateServiceCost()` function, verify transaction  |
| **Agent not starting**                   | Agent won't run                              | Use `bun dev` (ONLY command for launching!)                  |

### General Issues

| Issue                     | Symptoms                          | Solution                                              |
| ------------------------- | --------------------------------- | ----------------------------------------------------- |
| **Agent won't start**     | "Plugin not found" errors         | Run `bun install`, check plugin exports               |
| **No responses**          | Loads but doesn't reply           | Verify TELEGRAM_BOT_TOKEN in Infisical                |
| **Database errors**       | Connection failed                 | Check DATABASE_URL, ensure PostgreSQL is running      |
| **Type errors**           | TypeScript compilation fails      | Run `npm run type-check`                              |
| **Slow responses**        | Long delays (10+ seconds)         | Switch to faster model (gpt-4o-mini) in character.ts  |
| **Rate limits**           | API quota exceeded                | Check usage, upgrade plan, implement rate limiting    |

### Debug Commands

```bash
# Maximum verbosity (see all logs)
LOG_LEVEL=debug bun dev

# Check Infisical secrets loaded
node -e "console.log(Object.keys(process.env).filter(k => k.includes('API') || k.includes('TOKEN')))"

# Test Rainbow Bridge connectivity
python3 -c "
import asyncio
from telegram import Client
client = Client('test', api_id=<your-api-id>, api_hash='<your-api-hash>', session_string='...')
await client.start()
print('Connected!')
"

# Check database schema
bun run db:migrate

# Validate plugin structure
tsc --noEmit --skipLibCheck

# Test specific action
elizaos test --filter "neurophoto"
```

### Health Monitoring

```typescript
// Health check endpoints
GET /health              # Basic status
GET /health/detailed     # System info + plugins loaded
GET /api/status         # Agent status + recent operations

// Manual health check
curl http://localhost:3000/health

// Check plugin status
curl http://localhost:3000/api/plugins
```

## 📋 Production Checklist

### VIBEE-Specific Pre-Deployment

#### Rainbow Bridge Testing
- [ ] All critical scenarios pass: `python3 scripts/rainbow-bridge-runner.py --critical-only`
- [ ] Test LoRA training flow (`/face add` → training → completed)
- [ ] Test NeuroPhoto generation (`/neurophoto` → image)
- [ ] Test balance deduction (operations table, balances table)
- [ ] Verify Telegram session cleanup after tests
- [ ] Generate HTML report for stakeholder review

#### Avatar Face Plugin
- [ ] LoRA training completes successfully via Fal.ai
- [ ] Trained models saved to `user_models` table with correct metadata
- [ ] `trigger_word` properly applied in NeuroPhoto prompts
- [ ] Only user's own models used in generation (no shared models)
- [ ] Gender from user profile correctly added to prompts
- [ ] Cost calculation via `calculateServiceCost()` accurate

#### Infisical & Secrets
- [ ] All secrets moved to Infisical Cloud
- [ ] `.env` files contain ONLY Infisical credentials
- [ ] Verify production environment in Infisical: `prod` or `production`
- [ ] Test secret loading in production mode

### Security

- [ ] API keys stored in Infisical (NOT in .env files)
- [ ] Database credentials secured via Infisical
- [ ] Rate limiting configured for external APIs
- [ ] Input validation in all actions (Zod schemas)
- [ ] Error messages don't leak sensitive data
- [ ] Telegram session strings secured
- [ ] LoRA model URLs properly validated

### Performance

- [ ] Model selection appropriate (gpt-4o-mini for speed)
- [ ] Memory limits configured (maxMemories, memoryDecay)
- [ ] PostgreSQL optimized for production (indexes, connections)
- [ ] Image generation optimized (aspect ratios, batch sizes)
- [ ] Hot reload NOT enabled in production
- [ ] Health monitoring endpoints configured

### Reliability

- [ ] Error handling with TaskEither in all critical paths
- [ ] Graceful degradation for API failures (fallback providers)
- [ ] Database transaction safety (atomic operations)
- [ ] Backup strategy configured for PostgreSQL
- [ ] Process monitoring (PM2, systemd, or Docker health checks)
- [ ] Logging level set to `info` (not `debug`)

### Testing & Quality

- [ ] Component tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Formatting check passes: `npm run format:check`
- [ ] Integration tests validate end-to-end flows
- [ ] Rainbow Bridge tests validate production behavior
- [ ] Load testing for image generation (concurrent requests)

### Monitoring & Observability

- [ ] Health endpoints monitored: `/health`, `/health/detailed`
- [ ] Metrics collection (operations per minute, error rates)
- [ ] Alerting configured for:
  - Failed LoRA trainings > threshold
  - Image generation failures
  - Database connection issues
  - Balance deduction errors
- [ ] Log aggregation (structured JSON logs)

### Deployment Steps

```bash
# 1. Build project
npm run build

# 2. Run Rainbow Bridge tests
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# 3. Verify all checks pass
npm run check-all

# 4. Set production environment
export NODE_ENV=production

# 5. Start with process manager
pm2 start "elizaos start" --name vibee-agent

# 6. Verify health
curl http://localhost:3000/health

# 7. Monitor logs
pm2 logs vibee-agent
```

## 🎯 VIBEE Development Workflow

### Daily Development Cycle

```bash
# 1. Pull latest secrets
infisical secrets pull --env=dev

# 2. 🎯 ЕДИНСТВЕННАЯ КОМАНДА ЗАПУСКА АГЕНТА
bun dev

# 3. Make changes
# - Edit plugin code
# - Test via Telegram bot
# - Check console for errors

# 4. Run tests
npm test

# 5. Check types
npm run type-check

# 6. Format code
npm run format

# 7. Commit changes
git add .
git commit -m "feat: description"
```

### Feature Development Process

1. **Plan**: Review AVATAR_FACE.md for requirements
2. **Implement**: Develop in plugin directory
3. **Test**: Manual testing via Telegram
4. **Validate**: Run Rainbow Bridge tests
5. **Document**: Update AVATAR_FACE.md if needed
6. **Deploy**: Follow production checklist

### Plugin Development Checklist

For `plugin-vibe-face-avatar`:

- [ ] Action validates user input correctly
- [ ] Service integrates with external APIs (Fal/Replicate)
- [ ] Database operations use transactions
- [ ] Errors handled via TaskEither
- [ ] Balance deducted atomically
- [ ] Operations logged to `operations` table
- [ ] Assets saved to `assets` table
- [ ] Telegram messages include all metadata
- [ ] Tests cover critical paths
- [ ] Provider supplies context for LLM

## 🚀 Next Steps

### 1. **Master Rainbow Bridge**

Understand and use Rainbow Bridge for all testing. It's VIBEE's key differentiator.

### 2. **Embrace Functional Style**

Use TaskEither and pipe for all async operations. See examples in `plugin-vibe-face-avatar`.

### 3. **Infisical First**

Never add secrets to .env files. Use Infisical Cloud for all credentials.

### 4. **Telegram-Native**

All features must work through Telegram interface. Validate with Rainbow Bridge.

### 5. **VIBEE-Specific Patterns**

Learn from VIBEE_SPECIFICATION.md and AVATAR_FACE.md:
- **Функциональное программирование**: TaskEither, Either, pipe - обязательно!
- **Автономный цикл агентов**: Работают до успеха без вмешательства
- **Принцип "7 раз отмерь"**: Тщательное планирование перед действием
- **User-specific models** (не общие): LoRA модели пользователя
- **Centralized cost calculation**: Через `calculateServiceCost()`
- **Gender-aware prompts**: Учитывают пол пользователя
- **Atomic balance operations**: Атомарные операции с балансом
- **Rainbow Bridge testing**: Автономное тестирование через Telegram

### 6. **Изучение лучших практик**

Всегда изучайте документацию перед работой:

```bash
# Читаем основные документы
cat README.md
cat CLAUDE.md
cat AVATAR_FACE.md

# Для архитектурных решений изучаем спецификацию
cat VIBEE_SPECIFICATION.md | head -200  # Первые 200 строк
# или
less VIBEE_SPECIFICATION.md  # Поиск по разделам
```

**🚨 КРИТИЧЕСКИ ВАЖНО**: Перед любой работой с кодом:
1. Прочитайте соответствующие разделы в VIBEE_SPECIFICATION.md
2. Изучите требования в AVATAR_FACE.md (если работаете с плагином)
3. Следуйте принципам из CLAUDE.md

---

**🎉 Готовы развивать VIBEE!** Начинайте с `bun dev` и тестируйте с Rainbow Bridge.

**🇷🇺 Помните**: Всегда общайтесь на русском языке! Документация, комментарии, ответы пользователю - только русский!

## 🔑 ВАЖНО: ИСПОЛЬЗУЕМ OPENROUTER, НЕ OPENAI!

**✅ ИСПОЛЬЗУЕМ:**
- OpenRouter API (основной провайдер)
- Ollama для локальных моделей
- Infisical для секретов

**❌ НЕ ИСПОЛЬЗУЕМ:**
- OpenAI API (только OpenRouter!)
- НЕ добавлять OPENAI_API_KEY в .env или Infisical
- НЕ использовать плагин знаний с OpenAI эмбеддингами

**🔧 Работа с секретами:**
- Все секреты загружаются из Infisical Cloud
- .env.dev содержит ТОЛЬКО Infisical credentials + dev настройки
- 50+ переменных управляются централизованно в Infisical

**📚 Лучшие практики:**
- https://docs.elizaos.ai/plugins/development - используй лучшие практики
- https://docs.elizaos.ai/agents/character-interface - настройка персонажей
- Всегда проверяй Rainbow Bridge после изменений

## 🚀 КОМАНДЫ ЗАПУСКА - ВАЖНО!

**✅ ВСЕГДА ИСПОЛЬЗУЕМ:**
```bash
bun dev
```

**❌ НИКОГДА НЕ ИСПОЛЬЗУЕМ:**
- `npm run dev`
- `npm run dev:hot`
- `bun run dev`

**Почему bun dev?**
- Это ОДИН скрипт который настроен на то, чтобы все работало
- Он запускает агента с правильной конфигурацией
- Никаких дополнительных команд или скриптов не нужно

**📝 ЗАПОМНИТЕ НАВСЕГДА:** `bun dev` - единственная команда запуска агента!
---

# 🔥🔥🔥 КРИТИЧЕСКИ ВАЖНО - ПРАВИЛА ДЛЯ AI 🔥🔥🔥

## ⛔ ЖЕЛЕЗНЫЕ ПРАВИЛА (НЕ НАРУШАТЬ!):

### 1. ЗАПУСК АГЕНТОВ
```bash
bun dev          # ✅ ВСЕГДА запускает ВСЕХ агентов
bun dev:all      # ✅ Явно запускает всех
bun dev:single   # ⚠️ Только по просьбе пользователя
```

### 2. НЕ УДАЛЯТЬ АГЕНТОВ
- ❌ **НИКОГДА** не удаляй `characters/*.json`
- ❌ **НИКОГДА** не удаляй персонажей, которых ты не создавал
- ❌ **НИКОГДА** не удаляй работающих агентов
- ✅ **ТОЛЬКО ДОБАВЛЯЙ** новых агентов

**Существующие агенты (НЕПРИКАСАЕМЫЕ):**
- `characters/vibeeAgent.json` - Главный VIBEE
- `characters/instagramExpert.json` - Instagram
- `characters/kolsAgent.json` - KOLS мониторинг

### 3. АВАТАРЫ
- ✅ Генерировать для НОВЫХ агентов
- ❌ НЕ удалять существующие
- Путь: `avatars/` и `vibee-client/public/avatars/`

### 4. ПРОВЕРКА ПЕРЕД ИЗМЕНЕНИЯМИ
```bash
# Всегда проверяй агентов перед работой
ls -la characters/*.json

# Проверяй процессы
ps aux | grep elizaos

# Проверяй логи
tail -f agent.log
```

## 📖 Полные правила:
См. файл `AGENT_RULES.md`

---
- PostgreSQL - ✅ ИСПРАВЛЕНО

  Исправлены SQL-запросы для
  работы с PostgreSQL вместо
  SQLite.

  📝 Итоговый Отчет

  Полный отчет сохранен в
  /tmp/FIXES_APPLIED.md

  ⚠️ Осталась одна проблема

  При перезапуске возникает ошибка
   миграции базы данных в самом
  ElizaOS:
  Database migration failed:
  Failed query: CREATE SCHEMA IF
  NOT EXISTS migrations

  Это проблема в @elizaos/server -
   он использует SQLite-синтаксис
  для PostgreSQL. Это не наш код,
  это библиотека.