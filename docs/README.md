# Документация VIBEE Agent

> Навигация по всей документации проекта

## Основные документы (в корне проекта)

| Документ | Описание |
|----------|----------|
| [README.md](../README.md) | Главный файл проекта, быстрый старт |
| [CLAUDE.md](../CLAUDE.md) | Руководство для Claude Code (44KB) |
| [AVATAR_FACE.md](../AVATAR_FACE.md) | Спецификация Avatar Face плагина (75KB) |
| [VIBEE_SPECIFICATION.md](../VIBEE_SPECIFICATION.md) | Полная спецификация VIBEE (17K+ строк) |

---

## Настройка и конфигурация

Документы по установке и настройке проекта.

| Документ | Описание |
|----------|----------|
| [INFISICAL_SETUP.md](setup/INFISICAL_SETUP.md) | Настройка секретов через Infisical Cloud |
| [VIBEE_TOKENS_SETUP.md](setup/VIBEE_TOKENS_SETUP.md) | Настройка токенов VIBEE |
| [CLAUDE_PLUGIN_SETUP_REPORT.md](setup/CLAUDE_PLUGIN_SETUP_REPORT.md) | Отчёт о настройке Claude плагина |

---

## Агенты

Всё про AI-агентов в проекте.

| Документ | Описание |
|----------|----------|
| [AGENTS.md](agents/AGENTS.md) | Обзор агентов проекта |
| [AGENTS_GUIDE.md](agents/AGENTS_GUIDE.md) | Руководство по работе с агентами |
| [AI_AGENT_RULES.md](agents/AI_AGENT_RULES.md) | Правила для AI агентов |
| [AGENT_RUNNING_RULES.md](agents/AGENT_RUNNING_RULES.md) | Правила запуска агентов |
| [UNIVERSAL_AGENT_TEMPLATE.md](agents/UNIVERSAL_AGENT_TEMPLATE.md) | Универсальный шаблон агента |
| [AGENT_NEUROPHOTO_CHARACTER.md](agents/AGENT_NEUROPHOTO_CHARACTER.md) | Характер NeuroPhoto агента |
| [KOLS_AGENT_README.md](agents/KOLS_AGENT_README.md) | Документация KOLS агента |

---

## Тестирование

Руководства и отчёты по тестированию.

| Документ | Описание |
|----------|----------|
| [TESTING_GUIDE.md](testing/TESTING_GUIDE.md) | Руководство по тестированию |
| [RAINBOW_BRIDGE_TEST_REPORT.md](testing/RAINBOW_BRIDGE_TEST_REPORT.md) | Отчёт Rainbow Bridge тестов |
| [E2E_TEST_REPORT.md](testing/E2E_TEST_REPORT.md) | Отчёт E2E тестирования |

---

## Функциональность

### Instagram

| Документ | Описание |
|----------|----------|
| [INSTAGRAM_QUICKSTART.md](features/instagram/INSTAGRAM_QUICKSTART.md) | Быстрый старт с Instagram |
| [INSTAGRAM_PLUGIN_DOCUMENTATION.md](features/instagram/INSTAGRAM_PLUGIN_DOCUMENTATION.md) | Документация Instagram плагина |
| [INSTAGRAM_SETUP_COMPLETE.md](features/instagram/INSTAGRAM_SETUP_COMPLETE.md) | Завершение настройки Instagram |

### Telegram

| Документ | Описание |
|----------|----------|
| [TELEGRAM_CRAFT_STATUS.md](features/telegram/TELEGRAM_CRAFT_STATUS.md) | Статус Telegram Craft |
| [LOGS-MANAGEMENT.md](features/telegram/LOGS-MANAGEMENT.md) | Управление логами |

---

## Архив

Устаревшие отчёты и временные документы.

### Отчёты (EN)
- [archive/reports/](archive/reports/) - Английские отчёты

### Отчёты (RU)
- [archive/ru/](archive/ru/) - Русскоязычные отчёты

---

## Документация плагинов

| Плагин | Путь |
|--------|------|
| plugin-vibe-face-avatar | [plugin-vibe-face-avatar/README.md](../plugin-vibe-face-avatar/README.md) |
| plugin-telegram-craft | [plugin-telegram-craft/README.md](../plugin-telegram-craft/README.md) |

---

## Курсы обучения

| Курс | Путь |
|------|------|
| Agentic Vibecoding | [src/docs/courses/agentic-vibecoding/](../src/docs/courses/agentic-vibecoding/) |
| AI Music Production | [src/docs/courses/ai-music-production/](../src/docs/courses/ai-music-production/) |

---

## Быстрые ссылки

- **Запуск в dev режиме**: `npm run dev:hot`
- **Тесты**: `npm test`
- **Rainbow Bridge**: `python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only`
- **Секреты**: Используй Infisical Cloud (см. [INFISICAL_SETUP.md](setup/INFISICAL_SETUP.md))
