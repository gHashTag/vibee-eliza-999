# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VIBEE Agent - ElizaOS Development Guide

## 🗣️ Язык общения

**Всегда общаемся на русском!** Документация, комментарии, ответы - только русский. Переменные и функции - на английском (стандарт).

---

## 🚨 КРИТИЧЕСКИ ВАЖНО: КОМАНДА ЗАПУСКА

```bash
bun dev   # ✅ ЕДИНСТВЕННАЯ КОМАНДА - запускает ВСЁ
```

**❌ НЕ ИСПОЛЬЗУЕМ:** `npm run dev`, `bun run dev`, `elizaos dev`, и любые другие команды.

**Что делает `bun dev`:**
- Запускает `scripts/start-all.sh`
- Поднимает 4 агента на разных портах (3000-3003)
- Запускает vibee-client на порту 5173
- Настраивает SQLite базу и миграции

---

## 📋 Обзор проекта

| Свойство | Значение |
|----------|----------|
| **Тип** | Multi-agent ElizaOS система |
| **Менеджер пакетов** | `bun` (ОБЯЗАТЕЛЬНО) |
| **Интерфейс** | Telegram Bot |
| **Framework** | ElizaOS 1.6.4 |
| **База данных** | SQLite (dev), PostgreSQL (prod) |
| **Тестирование** | Rainbow Bridge (автономное через Telegram) |

---

## 🏗️ Архитектура

```
vibee-agent/
├── characters/                    # Конфигурации агентов (JSON)
│   ├── vibeeAgent.json           # Главный VIBEE (порт 3000)
│   ├── instagramExpert.json      # Instagram эксперт (порт 3001)
│   └── kolsAgent.json            # KOLS мониторинг (порт 3002)
├── src/
│   ├── character.ts              # Базовый character
│   ├── plugin.ts                 # Starter plugin
│   ├── instagram-plugin/         # Instagram интеграция
│   └── characters/               # TypeScript characters
├── plugin-vibe-face-avatar/      # LoRA + NeuroPhoto
├── plugin-kols-userbot/          # Telegram userbot для KOLS
├── plugin-kols-unified/          # Unified KOLS логика
├── plugin-telegram-craft/        # Telegram MTProto
├── plugin-vibe-learning/         # Обучающие материалы
├── vibee-client/                 # React frontend (5173)
├── scripts/
│   └── start-all.sh              # Главный скрипт запуска
└── logs/                         # Логи агентов
```

### Агенты (characters/)

| Агент | Порт | Файл | Назначение |
|-------|------|------|------------|
| **VIBEE** | 3000 | `vibeeAgent.json` | Главный ментор, Telegram бот |
| **Instagram** | 3001 | `instagramExpert.json` | Instagram постинг |
| **KOLS** | 3002 | `kolsAgent.json` | Мониторинг Telegram каналов |

### Плагины

| Плагин | Назначение |
|--------|------------|
| `plugin-vibe-face-avatar` | LoRA обучение + NeuroPhoto генерация |
| `plugin-kols-userbot` | Telegram userbot (GramJS) |
| `plugin-kols-unified` | Единая логика KOLS |
| `plugin-telegram-craft` | MTProto интеграция |
| `plugin-vibe-learning` | Обучающие материалы |
| `src/instagram-plugin` | Instagram Graph API |

---

## 🔐 Секреты (Infisical Cloud-First)

Все секреты в Infisical Cloud. В `.env.dev` только:
```bash
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=dev
```

**Ключевые секреты в Infisical:**
- `TELEGRAM_BOT_TOKEN` - токен бота
- `OPENROUTER_API_KEY` - LLM провайдер (НЕ OpenAI!)
- `FAL_KEY` / `REPLICATE_API_KEY` - генерация изображений
- `DATABASE_URL` - PostgreSQL для prod

---

## 🚀 Основные команды

```bash
# Запуск
bun dev                    # Запуск ВСЕХ агентов + клиента

# Тестирование
npm test                   # Все тесты
npm run type-check         # Проверка типов
npm run format:check       # Проверка форматирования
npm run check-all          # Всё вместе

# Rainbow Bridge (автономное тестирование через Telegram)
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# Разработка плагина
cd plugin-vibe-face-avatar && bun install && bun run build

# Логи агентов
tail -f logs/vibee.log     # VIBEE
tail -f logs/kols.log      # KOLS
tail -f logs/instagram.log # Instagram

# Остановка всех агентов
pkill -f 'elizaos' && pkill -f 'vite'
```

---

## 🌈 Rainbow Bridge

Автономное тестирование через реальный Telegram:
1. Использует Telegram API с session string
2. Отправляет команды боту
3. Валидирует ответы
4. Проверяет состояние БД
5. Генерирует отчёт

---

## 🔌 VIBEE MCP Server (Автономная разработка)

**Расположение:** `/Users/playra/vibee-eliza-999/vibee/gleam/`

**Запуск:**
```bash
cd /Users/playra/vibee-eliza-999/vibee/gleam && gleam run -m mcp_server
# или
/Users/playra/vibee-eliza-999/vibee/gleam/run_mcp.sh
```

**41 инструмент для автономной разработки:**

| Категория | Инструменты |
|-----------|-------------|
| **Telegram (8)** | `telegram_get_dialogs`, `telegram_get_history`, `telegram_send_message`, `telegram_send_buttons`, `telegram_send_photo`, `telegram_download_media`, `telegram_get_me`, `telegram_subscribe_updates` |
| **Knowledge (2)** | `knowledge_search`, `knowledge_embed` |
| **File (3)** | `file_read`, `file_write`, `file_list` |
| **Voice (1)** | `voice_transcribe` |
| **System (2)** | `system_log`, `system_exec` |
| **Events (2)** | `event_emit`, `event_list` |
| **Debug (5)** | `debug_build`, `debug_test`, `debug_analyze`, `debug_trace`, `debug_log` |
| **Code (5)** | `code_generate`, `code_refactor`, `code_explain`, `code_find_similar`, `code_diff` |
| **Test (4)** | `test_run`, `test_create`, `test_coverage`, `test_validate` |
| **Agent (4)** | `agent_spawn`, `agent_message`, `agent_status`, `agent_kill` |
| **Bot Analysis (5)** | `bot_analyze`, `bot_compare`, `bot_monitor`, `bot_extract_commands`, `bot_test_interaction` |

**Конфигурация Claude Code (`mcp-config.json`):**
```json
{
  "mcpServers": {
    "vibee": {
      "command": "/Users/playra/vibee-eliza-999/vibee/gleam/run_mcp.sh"
    }
  }
}
```

**Тесты:** 45 тестов в `/Users/playra/vibee-eliza-999/vibee/gleam/test/mcp_tools_test.gleam`

---

## 🎨 Ключевые плагины

### plugin-vibe-face-avatar (LoRA + NeuroPhoto)

**Команды:**
- `/face add` - загрузка фото для обучения LoRA
- `/face train` - запуск обучения модели
- `/neurophoto <prompt>` - генерация изображения

**Поток обучения:** Фото → Fal.ai → LoRA модель → `user_models` таблица

**Поток генерации:** Prompt + trigger_word + gender → Replicate → изображение

### plugin-kols-userbot (Telegram мониторинг)

Использует GramJS для мониторинга Telegram каналов как userbot.

### src/instagram-plugin

Instagram Graph API интеграция для постинга через Meta Business API.

---

## 📊 База данных

SQLite для разработки, PostgreSQL для prod.

**Ключевые таблицы:**
- `users` - пользователи Telegram
- `user_models` - обученные LoRA модели
- `operations` - история операций
- `assets` - сгенерированные изображения
- `balances` - баланс звёзд пользователей

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| Секреты не загружаются | Проверить `.env.dev` с Infisical credentials |
| Агент не запускается | Использовать только `bun dev` |
| "Plugin not found" | Запустить `bun install` |
| Бот не отвечает | Проверить `TELEGRAM_BOT_TOKEN` в Infisical |
| LoRA не обучается | Проверить `FAL_KEY` в Infisical |
| Ошибки TypeScript | Запустить `npm run type-check` |

**Отладка:**
```bash
LOG_LEVEL=debug bun dev   # Подробные логи
```

---

## ⛔ ЖЕЛЕЗНЫЕ ПРАВИЛА ДЛЯ AI

### 🧪 ТЕСТЫ ОБЯЗАТЕЛЬНЫ!
**Задача НЕ считается выполненной, пока e2e тесты не проходят!**

```bash
# Обязательно перед завершением задачи:
npm run type-check          # TypeScript проверка
npm run test:elizaos        # E2E тесты с SQLite
```

- ❌ Нельзя завершать задачу если `npm run type-check` падает
- ❌ Нельзя завершать задачу если `npm run test:elizaos` падает
- ✅ Сначала исправь все ошибки, потом отчитывайся о выполнении

### НЕ УДАЛЯТЬ АГЕНТОВ!
```bash
# Неприкасаемые файлы:
characters/vibeeAgent.json      # Главный VIBEE
characters/instagramExpert.json # Instagram
characters/kolsAgent.json       # KOLS мониторинг
```

- ❌ НИКОГДА не удалять `characters/*.json`
- ❌ НИКОГДА не удалять персонажей, которых не создавал
- ✅ ТОЛЬКО добавлять новых агентов

### LLM провайдер
- ✅ **OpenRouter** - основной провайдер (`OPENROUTER_API_KEY`)
- ✅ **Ollama** - для локальных моделей
- ❌ НЕ OpenAI (не добавлять `OPENAI_API_KEY`)

### Ключевые паттерны
- **Функциональный стиль**: TaskEither, pipe для async операций
- **Atomic operations**: Атомарные операции с балансом
- **User-specific models**: LoRA модели принадлежат пользователю
- **Centralized cost**: Через `calculateServiceCost()`

---

## 📚 Документация

| Файл | Содержание |
|------|------------|
| `CLAUDE.md` | Это руководство |
| `VIBEE_SPECIFICATION.md` | Полная спецификация (17K строк) |
| `AVATAR_FACE.md` | План Avatar Face плагина |
| `README.md` | Быстрый старт |
| `llms-full.txt` | Контекст для LLM (46K строк) |

**Ссылки:**
- https://docs.elizaos.ai/plugins/development
- https://docs.elizaos.ai/agents/character-interface
- runtime.character?.settings?.secrets Используй секреты исключительно из этого
- ключ берётся только из character.settings.secrets