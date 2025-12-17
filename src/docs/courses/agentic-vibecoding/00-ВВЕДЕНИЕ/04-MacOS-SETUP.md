# 🚀 БЫСТРЫЙ СТАРТ VIBECODING: Полная настройка окружения для macOS

> **"macOS - это когда элегантность встречается с мощью"** — Современный Apple разработчик

## 📋 Содержание

1. [🎯 Обзор macOS окружения](#-обзор-macos-окружения)
2. [💻 Базовое окружение разработчика](#-базовое-окружение-разработчика)
3. [🤖 AI-инструменты для VibeCoding](#-ai-инструменты-для-vibecoding)
4. [📝 Инструменты для документации](#-инструменты-для-документации)
5. [🔧 Дополнительные утилиты](#-дополнительные-утилиты)
6. [✅ Проверка установки](#-проверка-установки)
7. [🎓 Первый VibeCoding проект](#-первый-vibecoding-проект)

---

## 🎯 Обзор macOS окружения

### Почему macOS? Идеальная платформа для разработки!

macOS — это операционная система Apple, которая сочетает в себе элегантность, стабильность и мощь Unix-подобной системы. Это как иметь Ferrari с душой Lamborghini:

- **macOS** — стабильная и красивая основная система
- **Unix-подобная основа** — дает доступ к мощным инструментам командной строки
- **Превосходная интеграция** — с iOS, iPadOS и другими Apple устройствами
- **Отличная поддержка** — для веб-разработки, мобильной разработки и творчества

### Минимальный набор VibeCoder'а:

- **🖥️ macOS 12+ (Monterey или новее)** — ваша основная ОС с Unix-основой
  - 🔗 [macOS](https://www.apple.com/macos/) | [Скачать](https://apps.apple.com/app/macos/id1547778386)
- **🤖 Cursor AI** — умный редактор кода с AI-помощником. Как VS Code + умный коллега
  - 🔗 [Официальный сайт](https://cursor.sh/) | [Скачать](https://cursor.sh/downloads)
- **📦 Node.js & npm/pnpm** — "движок" для JavaScript. Запускает современные веб-приложения
  - 🔗 [Node.js](https://nodejs.org/) | [nvm](https://github.com/nvm-sh/nvm) | [pnpm](https://pnpm.io/)
- **📝 Obsidian** — цифровой блокнот для заметок. Как Evernote для программистов
  - 🔗 [Официальный сайт](https://obsidian.md/) | [Скачать](https://obsidian.md/download)
- **🔄 Git** — система контроля версий. "Машина времени" для кода
  - 🔗 [Официальный сайт](https://git-scm.com/) | [GitHub Desktop](https://desktop.github.com/)

### Рекомендуемый набор Pro:

- **🚀 Bun** — быстрый "движок" для JavaScript. Как спортивный автомобиль
  - 🔗 [Официальный сайт](https://bun.sh/) | [GitHub](https://github.com/oven-sh/bun)
- **🐳 Docker Desktop** — контейнеризация. Упаковывает приложения в "коробки"
  - 🔗 [Официальный сайт](https://www.docker.com/) | [Скачать](https://docs.docker.com/desktop/mac/install/)
- **📊 TablePlus** — менеджер баз данных. Как Excel для сложных данных
  - 🔗 [Официальный сайт](https://tableplus.com/) | [Скачать](https://tableplus.com/download)
- **🎨 Figma** — инструмент для дизайна. Создание красивых интерфейсов
  - 🔗 [Официальный сайт](https://www.figma.com/) | [Скачать](https://www.figma.com/downloads/)
- **🔍 Raycast** — утилита для повышения продуктивности (альтернатива Spotlight)
  - 🔗 [Официальный сайт](https://raycast.com/) | [App Store](https://apps.apple.com/app/raycast/id1546270676)

### Как всё работает вместе?

```
macOS ← основная система с Unix-основой
    ↓
Terminal + Homebrew ← командная строка и пакетный менеджер
    ↓
Cursor + Git ← редактирование и контроль версий
    ↓
Node.js ← запуск JavaScript приложений
    ↓
Docker ← упаковка и развертывание
    ↓
Obsidian ← документирование проектов
```

**Для новичков:** Не пугайтесь количества инструментов! Каждый выполняет свою задачу, и мы разберем всё по шагам.

---

## 💻 Базовое окружение разработчика

### 1. Обновление macOS

```bash
# Проверить текущую версию
sw_vers

# Обновить систему через App Store или:
softwareupdate -l
softwareupdate -i -a
```

### 2. Установка Command Line Tools

```bash
# Установка инструментов командной строки
xcode-select --install

# Проверка установки
xcode-select -p
```

### 3. Установка Homebrew (рекомендуется)

```bash
# Установка Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Добавление в PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Проверка
brew --version
```

### 4. Установка Git

```bash
# Через Homebrew
brew install git

# Настройка Git
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"
```

### 🔐 SSH ключи - Безопасный доступ к Git

**Зачем нужны SSH ключи?** SSH ключи позволяют безопасно подключаться к GitHub без ввода пароля каждый раз. Это как "электронный пропуск" — один раз настроили, и дальше входите автоматически.

**Аналогия с банковской картой:**

```
💳 Приватный ключ (id_ed25519) = Ваш ПИН-код от карты
    • Никогда не говорите никому!
    • Только вы должны знать
    • Храните в секрете

🏪 Публичный ключ (id_ed25519.pub) = Номер вашей карты
    • Можно показывать в магазине
    • Банк проверяет соответствие
    • Позволяет подтверждать платежи
```

**Принцип работы:**

1. Вы создаете пару ключей на компьютере
2. Публичный ключ загружаете на GitHub
3. При подключении GitHub проверяет: "Этот публичный ключ соответствует приватному ключу пользователя?"
4. Если да → доступ разрешен

**Пошаговое создание SSH ключей:**

```bash
# Создание SSH ключей
ssh-keygen -t ed25519 -C "your.email@example.com"
# -t ed25519 — современный безопасный тип ключа
# -C "your.email@example.com" — комментарий для идентификации

# При создании:
# 1. Нажмите Enter (стандартное расположение)
# 2. Придумайте пароль для дополнительной защиты
# 3. Подтвердите пароль

# Запуск SSH агента
eval "$(ssh-agent -s)"

# Добавление ключа в агент
ssh-add ~/.ssh/id_ed25519

# Просмотр публичного ключа для копирования
cat ~/.ssh/id_ed25519.pub
# Скопируйте ВЕСЬ текст (начинается с ssh-ed25519)
```

**Где и куда добавлять ключи:**

**На GitHub:**

1. Зайдите на github.com → Нажмите на аватар → Settings
2. В меню слева выберите "SSH and GPG keys"
3. Нажмите зеленую кнопку "New SSH key"
4. В поле "Title" напишите: "MacBook" или "Work Computer"
5. В большое поле "Key" вставьте содержимое из `cat ~/.ssh/id_ed25519.pub`
6. Нажмите "Add SSH key"

**На GitLab:**

1. User Settings → SSH Keys
2. Вставьте публичный ключ
3. Выберите срок действия (рекомендую 365 дней)

**Проверка работы:**

```bash
ssh -T git@github.com
# Ожидаемый результат:
# "Hi YourUsername! You've successfully authenticated..."
# Если "Permission denied" — проверьте правильность добавления ключа
```

**Дополнительные настройки безопасности:**

```bash
# Проверка известных хостов
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Настройка прав доступа (только владелец может читать приватный ключ)
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Автозапуск SSH агента (добавьте в ~/.zshrc)
echo 'eval "$(ssh-agent -s)"' >> ~/.zshrc
echo 'ssh-add ~/.ssh/id_ed25519' >> ~/.zshrc
```

**Правила безопасности:**

- ✅ Публичный ключ можно публиковать
- ❌ Приватный ключ НИКОГДА не передавайте
- 🔒 Используйте пароль для ключа
- 🔄 Создавайте отдельные ключи для каждого устройства
- ⏰ Обновляйте ключи каждые 6-12 месяцев
- 🍎 В macOS ключи хранятся в папке ~/.ssh/

### 5. Node.js и пакетные менеджеры

#### Установка через Homebrew (рекомендуется)

```bash
# Установка Node.js LTS
brew install node

# Проверка
node --version
npm --version
```

#### Установка nvm (альтернативный метод)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезагрузка конфигурации shell
source ~/.zshrc

# Установка последней LTS версии Node.js
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'

# Проверка
node --version
npm --version
```

#### Установка pnpm (рекомендуется для проектов)

```bash
# Установка pnpm
npm install -g pnpm

# Настройка автодополнения
pnpm install-completion

# Проверка
pnpm --version
```

#### Установка Bun (опционально, но рекомендуется)

```bash
# Установка Bun
curl -fsSL https://bun.sh/install | bash

# Добавление в PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Проверка
bun --version
```

---

## 🤖 AI-инструменты для VibeCoding

### 1. Cursor AI - IDE с интегрированным AI

#### Установка Cursor

```bash
# Через Homebrew
brew install --cask cursor

# Или скачайте с официального сайта
# https://cursor.sh/
```

#### Настройка Cursor для VibeCoding

```json
// ~/Library/Application Support/Cursor/User/settings.json
{
  "editor.fontSize": 14,
  "editor.fontFamily": "JetBrains Mono, SF Mono, Monaco, monospace",
  "editor.fontLigatures": true,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": false,
  "editor.wordWrap": "on",
  "terminal.integrated.fontSize": 14,
  "workbench.colorTheme": "Dracula",
  "cursor.aiProvider": "gpt-4",
  "cursor.copilotEnabled": true,
  "cursor.chatEnabled": true,
  "files.associations": {
    "*.md": "markdown"
  },
  "terminal.integrated.profiles.osx": {
    "bash": {
      "path": "bash",
      "icon": "terminal-bash"
    },
    "zsh": {
      "path": "zsh",
      "icon": "terminal"
    },
    "fish": {
      "path": "fish"
    }
  }
}
```

### 2. Xcode Command Line Tools

```bash
# Уже установлены с Command Line Tools
# Проверка
xcodebuild -version
```

### 3. Claude Code - AI-помощник для кода

**Зачем нужен?** Claude Code — это специализированный AI-помощник от Anthropic, который помогает писать, анализировать и улучшать код. Он понимает контекст проекта и может работать с большими кодовыми базами.

**Возможности:**

- **Анализ кода:** Понимает сложные проекты и предлагает улучшения
- **Генерация кода:** Создает функции, классы и целые модули
- **Рефакторинг:** Предлагает оптимизацию существующего кода
- **Объяснения:** Детально разбирает, как работает код

**Установка на macOS:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://claude.ai/code

# Или установите как PWA
# В Safari/Chrome: Меню → Поделиться → Добавить на главную страницу
```

**Интеграция с macOS:**

- Работает в любом браузере
- Интегрируется с Terminal
- Поддерживает zsh/bash команды

**Ссылки:**

- 🔗 [Claude Code](https://claude.ai/code) | [Anthropic](https://www.anthropic.com/claude)

### 4. Claude Flow - Рабочие процессы с ИИ

**Зачем нужен?** Claude Flow помогает создавать автоматизированные рабочие процессы с использованием ИИ. Это как "конвейер" для повторяющихся задач разработки.

**Возможности:**

- **Автоматизация задач:** Создание скриптов для рутинных операций
- **Рабочие процессы:** Последовательности действий для сложных задач
- **Интеграции:** Связь с другими инструментами разработки
- **Шаблоны:** Готовые решения для типичных сценариев

**Использование в macOS:**

- Веб-интерфейс через браузер
- Интеграция с Terminal
- Поддержка AppleScript и Automator

**Ссылки:**

- 🔗 [Claude Flow](https://claude.ai/flow) | [Anthropic](https://www.anthropic.com/claude)

### 5. Claude Router - Управление проектами

**Зачем нужен?** Claude Router помогает организовывать и управлять проектами разработки. Это как "диспетчерская" для ваших идей и задач.

**Возможности:**

- **Управление задачами:** Создание и отслеживание задач разработки
- **Планирование проектов:** Структурирование больших проектов
- **Приоритизация:** Определение важности различных функций
- **Отслеживание прогресса:** Мониторинг выполнения задач

**Использование в macOS:**

- Веб-интерфейс через браузер
- Экспорт в markdown для Obsidian
- Интеграция с Git и системами контроля версий

**Ссылки:**

- 🔗 [Claude Router](https://claude.ai/router) | [Anthropic](https://www.anthropic.com/claude)

### 6. Cloud Code - Профессиональная облачная IDE

**Зачем нужен?** Cloud Code — это облачная среда разработки от Anthropic с интегрированным Claude AI для профессиональной разработки.

**Возможности:**

- **Облачная IDE:** Полнофункциональный редактор кода в браузере
- **Интеграция Claude:** Прямой доступ к AI для кода
- **Командная разработка:** Совместная работа в реальном времени
- **Предварительный просмотр:** Мгновенное тестирование

**Установка на macOS:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://claude.com/product/claude-code

# Или установите как PWA
# В Safari/Chrome: Меню → Поделиться → Добавить на главную страницу
```

**Ссылки:**

- 🔗 [Cloud Code](https://claude.com/product/claude-code) | [Anthropic](https://www.anthropic.com/claude)

### 7. OpenRouter - Универсальный AI API

**Зачем нужен?** OpenRouter предоставляет доступ к множеству AI моделей через единый API, включая Claude, GPT и другие.

**Возможности:**

- **Множественные модели:** Доступ к различным AI
- **Управление кредитами:** Контроль расходов
- **Единый API:** Один интерфейс для всех моделей
- **Аналитика:** Отслеживание использования

**Установка на macOS:**

```bash
# Через npm
npm install -g openrouter-cli

# Или используйте веб-версию
# https://openrouter.ai/settings/credits
```

**Ссылки:**

- 🔗 [OpenRouter](https://openrouter.ai/settings/credits) | [Документация](https://openrouter.ai/docs)

### 8. Kilo Code - AI-first редактор

**Зачем нужен?** Kilo Code — это инновационный редактор кода, полностью ориентированный на работу с AI.

**Возможности:**

- **AI-first подход:** Постоянная поддержка ИИ
- **Умные предложения:** Контекстные рекомендации
- **Быстрая разработка:** Ускорение процесса
- **Современный UI:** Интуитивный интерфейс

**Установка на macOS:**

```bash
# Через браузер
# Зайдите на https://kilocode.ai/

# Или скачайте DMG
# https://kilocode.ai/download/macos
```

**Ссылки:**

- 🔗 [Kilo Code](https://kilocode.ai/) | [Документация](https://kilocode.ai/docs)

### 9. Crystal - Управление сессиями Claude

**Зачем нужен?** Crystal — это революционный инструмент для управления множественными сессиями Claude AI, который кардинально меняет подход к разработке. Это полноценная Integrated Vibe Environment (IVE), которая позволяет работать с несколькими проектами одновременно, не теряя контекст и не переключаясь между вкладками.

**Возможности:**

- **Множественные сессии:** Запускайте столько сессий Claude Code, сколько нужно для параллельной работы
- **Изоляция Git Worktree:** Каждая сессия работает в отдельном Git worktree, предотвращая конфликты
- **Управление контекстом:** Полное сохранение истории разговоров и контекста для каждой сессии
- **Визуальное отслеживание:** Статус сессий (инициализация, выполнение, ожидание) отображается визуально
- **Интеллектуальное именование:** Сессии автоматически именуются на основе ваших промптов с помощью AI
- **Шаблоны сессий:** Создавайте несколько нумерованных сессий одним кликом
- **Бесшовная Git интеграция:** Просмотр изменений с подсветкой синтаксиса, rebase, squash коммиты
- **Тестирование изменений:** Запускайте приложение прямо из worktree для проверки функциональности
- **MCP интеграция:** Подключение к Stravu для совместной работы бизнес-пользователей и разработчиков

**Как это работает:**

1. **Git Worktree изоляция:** Каждая сессия работает в собственном Git worktree, предотвращая конфликты между параллельными разработками
2. **Мониторинг сессий:** Централизованный интерфейс для управления всеми Claude Code сессиями
3. **Непрерывность разговора:** Возобновление любой сессии с полной историей разговора
4. **Интегрированные Git операции:** Rebase, squash, просмотр diff без выхода из приложения
5. **Выполнение и тестирование:** Запуск кода для проверки изменений одним нажатием кнопки

**Установка на macOS:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://stravu.com/blog/crystal

# Или установите как PWA
# В Safari/Chrome: Меню → Поделиться → Добавить на главную страницу

# Скачайте с GitHub
# https://github.com/stravu/crystal/releases/latest/download/crystal-macos.dmg

# Альтернативы Crystal:
# 1. Claude Desktop - Официальное приложение от Anthropic
# 2. ChatGPT - Универсальный AI-ассистент
# 3. Perplexity AI - AI с поиском и анализом
```

**Ссылки:**

- 🔗 [Crystal](https://stravu.com/blog/crystal-supercharge-your-development-with-multi-session-claude-code-management) | [GitHub](https://github.com/stravu/crystal)
- 🔗 [Claude Desktop](https://claude.ai/download) | [Anthropic](https://www.anthropic.com/claude)
- 🔗 [ChatGPT](https://chat.openai.com/) | [OpenAI](https://openai.com/)
- 🔗 [Perplexity AI](https://www.perplexity.ai/) | [Perplexity](https://www.perplexity.ai/)

### Взаимосвязь между AI-инструментами:

```
macOS Terminal ← основная среда
    ↓
Cursor + Xcode ← редактирование кода
    ↓
GitHub Copilot ← написание кода
    ↓
Claude Code ← анализ и улучшение кода
    ↓
Claude Flow ← автоматизация процессов
    ↓
Claude Router ← управление проектами
    ↓
Cloud Code ← профессиональная разработка
    ↓
Cristal ← анализ структуры проекта
    ↓
Obsidian ← документирование
```

**Как использовать вместе:**

1. **Cursor** → писать код с AI-подсказками
2. **GitHub Copilot** → генерировать функции
3. **Claude Code** → анализировать и улучшать
4. **Claude Flow** → создавать автоматизацию
5. **Claude Router** → планировать развитие
6. **Cloud Code** → профессиональная разработка в облаке
7. **Cristal** → проверять архитектуру
8. **Obsidian** → документировать решения

---

## 📝 Инструменты для документации

### 1. Obsidian - База знаний VibeCoder'а

#### Установка Obsidian

```bash
# Через Homebrew
brew install --cask obsidian

# Или скачайте с официального сайта
# https://obsidian.md/download
```

#### Настройка Obsidian для VibeCoding

```bash
# Создание VibeCoding Vault
mkdir -p ~/VibeCoding/Vault/{Projects,Knowledge,Templates,Daily}

# Создание шаблона для проектной документации
cat > ~/VibeCoding/Vault/Templates/project-template.md << 'EOF'
---
created: "{{date}}"
tags: [project, vibecoding]
---

# {{title}}

## 🎯 Цель проекта

## 🏗️ Архитектура

## 🛠️ Технологии
-

## 📋 Задачи
- [ ]

## 🔗 Ссылки
- GitHub:
- Документация:

## 📝 Заметки

---
EOF
```

### 2. Дополнительные инструменты документирования

#### Typora для markdown

```bash
# Через Homebrew
brew install --cask typora
```

#### PlantUML для диаграмм

```bash
# Через Homebrew
brew install plantuml
```

---

## 🔧 Дополнительные утилиты

### 1. Raycast - Улучшение Spotlight

```bash
# Через Homebrew
brew install --cask raycast

# Рекомендуемые настройки:
# - Window Management
# - Clipboard History
# - Quicklinks
# - Script Commands
```

### 2. iTerm2 - Продвинутый терминал

```bash
# Через Homebrew
brew install --cask iterm2

# Настройка темы Dracula
# iTerm2 → Preferences → Profiles → Colors → Color Presets → Import
```

### 3. HTTPie - Удобный HTTP клиент

```bash
# Через Homebrew
brew install httpie
```

### 4. jq - Обработка JSON

```bash
# Через Homebrew
brew install jq
```

### 5. bat - Улучшенный cat с подсветкой

```bash
# Через Homebrew
brew install bat

# Настройка алиаса в ~/.zshrc
echo 'alias cat="bat --style=numbers,changes"' >> ~/.zshrc
```

### 6. exa - Современная замена ls

```bash
# Через Homebrew
brew install exa

# Настройка алиасов в ~/.zshrc
cat >> ~/.zshrc << 'EOF'
alias ls="exa --icons --group-directories-first"
alias ll="exa -l --icons --group-directories-first"
alias la="exa -la --icons --group-directories-first"
alias lt="exa -T --icons --group-directories-first"
EOF
```

### 7. fzf - Fuzzy поиск

```bash
# Через Homebrew
brew install fzf

# Установка полезных интеграций
$(brew --prefix)/opt/fzf/install
```

### 8. Docker Desktop

```bash
# Через Homebrew
brew install --cask docker

# Запуск Docker
open /Applications/Docker.app
```

### 9. TablePlus - GUI для баз данных

```bash
# Через Homebrew
brew install --cask tableplus
```

### 10. Rectangle - Управление окнами

```bash
# Через Homebrew
brew install --cask rectangle
```

---

## ✅ Проверка установки

### Скрипт проверки окружения для macOS

```bash
#!/bin/bash
# check-macos-vibecoding.sh

echo "🔍 Проверка macOS VibeCoding окружения..."
echo "========================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 установлен${NC} ($(command -v $1))"
        $1 --version 2>&1 | head -n 1
    else
        echo -e "${RED}❌ $1 не установлен${NC}"
        return 1
    fi
    echo ""
}

check_brew() {
    if command -v brew &> /dev/null; then
        echo -e "${GREEN}✅ Homebrew установлен${NC}"
        brew --version | head -n 1
    else
        echo -e "${RED}❌ Homebrew не установлен${NC}"
    fi
    echo ""
}

echo "🍺 Пакетные менеджеры:"
check_brew

echo "📦 Базовые инструменты:"
check_command git
check_command node
check_command npm
check_command pnpm

echo "🚀 Дополнительные инструменты:"
check_command bun
check_command docker
check_command docker-compose

echo "🛠️ CLI утилиты:"
check_command httpie
check_command jq
check_command bat
check_command exa
check_command fzf

echo "🤖 AI инструменты:"
if [ -d "/Applications/Cursor.app" ]; then
    echo -e "${GREEN}✅ Cursor установлен${NC}"
else
    echo -e "${RED}❌ Cursor не установлен${NC}"
fi

echo "📝 Документация:"
if [ -d "/Applications/Obsidian.app" ]; then
    echo -e "${GREEN}✅ Obsidian установлен${NC}"
else
    echo -e "${YELLOW}⚠️ Obsidian не установлен (опционально)${NC}"
fi

echo "🗄️ Базы данных:"
if [ -d "/Applications/TablePlus.app" ]; then
    echo -e "${GREEN}✅ TablePlus установлен${NC}"
else
    echo -e "${YELLOW}⚠️ TablePlus не установлен (опционально)${NC}"
fi

echo "🖥️ Системные компоненты:"
if command -v xcode-select &> /dev/null; then
    echo -e "${GREEN}✅ Xcode Command Line Tools установлены${NC}"
else
    echo -e "${YELLOW}⚠️ Xcode Command Line Tools не установлены${NC}"
fi

echo "========================================"
echo "Проверка завершена!"
echo ""
echo "💡 Советы:"
echo "- Используйте Terminal или iTerm2 для лучшего опыта"
echo "- Homebrew обеспечивает простой доступ к пакетам"
echo "- Raycast улучшает поиск и продуктивность"
echo "- Настройте .zshrc для персональных алиасов"
```

Запустите проверку:

```bash
chmod +x check-macos-vibecoding.sh
./check-macos-vibecoding.sh
```

---

## 🔧 Troubleshooting - Решение проблем

### Распространенные проблемы и решения:

#### 1. **Homebrew не работает**

```
Проблема: brew: command not found
Решение:
1. Перезагрузите терминал: source ~/.zshrc
2. Проверьте PATH: echo $PATH
3. Переустановите Homebrew:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. **Node.js не устанавливается**

```
Проблема: nvm: command not found
Решение:
1. Перезагрузите терминал: source ~/.zshrc
2. Проверьте установку: ls -la ~/.nvm/
3. Переустановите nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

#### 3. **Git SSH не подключается**

```
Проблема: Permission denied (publickey)
Решение:
1. Проверьте SSH агент: eval "$(ssh-agent -s)"
2. Добавьте ключ: ssh-add ~/.ssh/id_ed25519
3. Проверьте: ssh -T git@github.com
```

#### 4. **Cursor не открывает файлы**

```
Проблема: Cannot open file with Cursor
Решение:
1. Проверьте установку: ls /Applications/Cursor.app
2. Переустановите: brew reinstall --cask cursor
3. Сбросьте настройки: rm -rf ~/Library/Application\ Support/Cursor
```

#### 5. **Docker не запускается**

```
Проблема: Docker Desktop не открывается
Решение:
1. Проверьте виртуализацию в настройках
2. Переустановите: brew reinstall --cask docker
3. Запустите вручную: open /Applications/Docker.app
```

### Диагностические команды:

```bash
# Проверить систему
sw_vers && sysctl -n machdep.cpu.brand_string

# Проверить Homebrew
brew doctor && brew update

# Проверить процессы
ps aux | grep -i docker

# Проверить диск
df -h && du -sh ~/*

# Проверить сеть
ping -c 3 google.com
curl -I https://nodejs.org
```

### Если ничего не помогает:

1. **Обновите macOS:** System Settings → General → Software Update
2. **Проверьте разрешения:** System Settings → Privacy & Security
3. **Сбросьте настройки:** Для инструментов удалите и переустановите
4. **Обратитесь к сообществу:** Stack Overflow, Apple Developer Forums

---

## 🎓 Первый VibeCoding проект

### Быстрый старт проекта

```bash
# 1. Создание проекта
mkdir my-vibecoding-app && cd my-vibecoding-app

# 2. Инициализация
pnpm init
git init

# 3. Установка TypeScript и необходимых пакетов
pnpm add -D typescript @types/node tsx
pnpm add -D prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vitest @vitest/ui

# 4. Создание конфигураций
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 5. Создание структуры проекта
mkdir -p src/{lib,types,tests}

# 6. Первый файл
cat > src/index.ts << 'EOF'
console.log("🚀 Welcome to VibeCoding!");

export function vibeGreeting(name: string): string {
  return `✨ Namaste, ${name}! Welcome to the flow state. 🧘‍♂️`;
}

export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
EOF

# 7. Первый тест
cat > src/tests/index.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { vibeGreeting, fibonacci } from '../index';

describe('VibeCoding Starter', () => {
  it('should create a vibe greeting', () => {
    const greeting = vibeGreeting('Developer');
    expect(greeting).toContain('Namaste');
    expect(greeting).toContain('Developer');
  });

  it('should calculate fibonacci numbers', () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(5)).toBe(5);
    expect(fibonacci(10)).toBe(55);
  });
});
EOF

# 8. Конфигурация ESLint
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF

# 9. Конфигурация Prettier
cat > .prettierrc << 'EOF'
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF

# 10. Добавление скриптов в package.json
cat > package.json << 'EOF'
{
  "name": "my-vibecoding-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "check": "pnpm lint && pnpm test"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "@vitest/ui": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
EOF

# 11. Установка зависимостей
pnpm install

# 12. Запуск
pnpm dev
```

### Структура VibeCoding проекта

```
my-vibecoding-app/
├── src/
│   ├── index.ts           # Точка входа
│   ├── lib/               # Библиотеки и утилиты
│   │   └── ai/           # AI-related код
│   ├── types/            # TypeScript типы
│   └── tests/            # Тесты
├── docs/                 # Документация
│   └── VIBECODING.md    # Принципы проекта
├── .cursorrules         # Правила для Cursor AI
├── .env.example         # Пример переменных окружения
├── tsconfig.json        # Конфигурация TypeScript
├── .eslintrc.json       # Конфигурация ESLint
├── .prettierrc         # Конфигурация Prettier
├── vitest.config.ts     # Конфигурация тестов
└── README.md           # Описание проекта
```

---

## 🎯 Чеклист готовности к VibeCoding

### Обязательные компоненты:

- [x] macOS обновлена до последней версии
- [x] Command Line Tools установлены
- [x] Homebrew установлен и настроен
- [x] Git установлен и настроен
- [x] Node.js (LTS версия) установлен
- [x] pnpm настроен
- [x] Cursor IDE установлен и настроен
- [x] Obsidian установлен для документации

### Рекомендуемые компоненты:

- [ ] Bun установлен как альтернатива Node.js
- [x] Docker Desktop для контейнеризации
- [ ] iTerm2 как продвинутый терминал
- [ ] Raycast для повышения продуктивности
- [ ] TablePlus для работы с БД
- [ ] HTTPie для тестирования API
- [ ] Полезные CLI утилиты (bat, exa, fzf, jq)

### Настройки и конфигурации:

- [x] SSH ключи для GitHub созданы
- [x] .zshrc настроен с алиасами
- [ ] Cursor AI extensions установлены
- [ ] .cursorrules создан для проектов
- [x] Obsidian vault для VibeCoding создан
- [x] Шаблоны документации подготовлены

---

## 📚 Полезные ресурсы для macOS

### Официальная документация:

- [macOS Documentation](https://developer.apple.com/documentation/macos)
- [Terminal User Guide](https://support.apple.com/guide/terminal/welcome/mac)
- [Homebrew Documentation](https://docs.brew.sh/)
- [Docker for Mac](https://docs.docker.com/desktop/mac/)

### VibeCoding сообщество:

- [macOS VibeCoding Guide](https://github.com/vibecoding/macos-guide)
- [Raycast Documentation](https://docs.raycast.com/)
- [iTerm2 Documentation](https://iterm2.com/documentation.html)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

### Обучающие материалы:

- [macOS Command Line](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/CommandLInePrimer/CommandLine.html)
- [zsh Guide](https://zsh.sourceforge.io/Guide/)
- [Homebrew Tips](https://docs.brew.sh/Homebrew-Tips-and-Tricks)
- [Docker Mastery](https://docs.docker.com/get-started/)

---

## 🎯 Проверь себя: macOS окружение

Проверь своё понимание macOS-специфичной настройки и инструментов разработки.

**Вопрос 1:** Почему Homebrew считается стандартным пакетным менеджером для macOS, а не встроенные инструменты Apple?

- A) Потому что Apple не предоставляет инструментов для управления пакетами
- B) Homebrew быстрее встроенных инструментов App Store
- C) Homebrew предоставляет доступ к тысячам open-source инструментов разработки, которых нет в App Store
- D) Homebrew обязателен для всех разработчиков на Mac

<details>
<summary>✅ Правильный ответ</summary>

**C)** Homebrew предоставляет доступ к тысячам open-source инструментов разработки, которых нет в App Store

**Объяснение:** Apple App Store фокусируется на пользовательских приложениях с GUI, в то время как разработчикам нужны CLI-инструменты (git, node, docker и т.д.). Homebrew заполняет этот пробел, предоставляя простой способ установки и обновления этих инструментов.

**macOS совет:** Всегда запускайте `brew doctor` после установки для проверки корректности настройки. Используйте `brew update && brew upgrade` для обновления всех пакетов одной командой.

</details>

**Вопрос 2:** В чём основное различие между Terminal.app (встроенный) и iTerm2?

- A) iTerm2 — это платная версия Terminal
- B) iTerm2 предлагает расширенные функции: сплит-панели, поиск, кастомизацию, горячие клавиши
- C) Terminal быстрее iTerm2
- D) iTerm2 работает только на Apple Silicon

<details>
<summary>✅ Правильный ответ</summary>

**B)** iTerm2 предлагает расширенные функции: сплит-панели, поиск, кастомизацию, горячие клавиши

**Объяснение:** iTerm2 — это бесплатный, мощный терминал с множеством функций для продуктивности: разделение окна на панели, мгновенный поиск по истории, автодополнение, кастомные профили, интеграция с tmux и многое другое.

**macOS совет:** Настройте горячую клавишу для вызова iTerm2 (например, `⌥ Space`). Используйте `⌘D` для вертикального и `⌘⇧D` для горизонтального разделения панелей.

</details>

**Вопрос 3:** Почему важно знать архитектуру вашего Mac (Apple Silicon vs Intel) при установке инструментов разработки?

- A) Некоторые инструменты имеют разные версии для arm64 (M1/M2) и x86_64 (Intel)
- B) Apple Silicon быстрее во всех задачах
- C) Intel Mac не поддерживает современные инструменты
- D) Это важно только для игр

<details>
<summary>✅ Правильный ответ</summary>

**A)** Некоторые инструменты имеют разные версии для arm64 (M1/M2) и x86_64 (Intel)

**Объяснение:** Apple Silicon (M1/M2/M3) использует архитектуру ARM (arm64), в то время как старые Mac используют Intel (x86_64). Homebrew устанавливает пакеты в `/opt/homebrew` для Apple Silicon и `/usr/local` для Intel. Некоторые инструменты требуют Rosetta 2 для работы на Apple Silicon.

**macOS совет:** Проверьте архитектуру командой `uname -m`. Если видите `arm64` — у вас Apple Silicon. Для запуска приложений через Rosetta используйте `arch -x86_64 <команда>`.

</details>

**Вопрос 4:** Что такое Xcode Command Line Tools и зачем они нужны?

- A) Это полноценная IDE от Apple
- B) Набор компиляторов, утилит и SDK для разработки без установки полного Xcode
- C) Инструменты только для iOS разработки
- D) Альтернатива Homebrew

<details>
<summary>✅ Правильный ответ</summary>

**B)** Набор компиляторов, утилит и SDK для разработки без установки полного Xcode

**Объяснение:** Command Line Tools включает компиляторы (clang, gcc), make, git и другие essential-инструменты. Это лёгкая альтернатива полному Xcode (~12GB), занимающая всего ~1-2GB, но достаточная для большинства задач веб-разработки.

**macOS совет:** После установки проверьте: `xcode-select -p`. Если нужен полный Xcode, установите его из App Store, затем выполните `sudo xcode-select -s /Applications/Xcode.app`.

</details>

**Вопрос 5:** Что делает команда `eval "$(/opt/homebrew/bin/brew shellenv)"` в вашем .zshrc?

- A) Запускает Homebrew
- B) Добавляет Homebrew в PATH и настраивает переменные окружения
- C) Обновляет все пакеты Homebrew
- D) Проверяет корректность установки

<details>
<summary>✅ Правильный ответ</summary>

**B)** Добавляет Homebrew в PATH и настраивает переменные окружения

**Объяснение:** Эта команда настраивает shell-окружение для Homebrew: добавляет `/opt/homebrew/bin` в PATH, устанавливает HOMEBREW_PREFIX, HOMEBREW_CELLAR и другие переменные. Без этого команда `brew` не будет найдена.

**macOS совет:** Для Apple Silicon путь `/opt/homebrew`, для Intel — `/usr/local`. Проверьте правильность командой `which brew`. Если команда не найдена, проверьте `.zshrc` и выполните `source ~/.zshrc`.

</details>

**Вопрос 6:** Какие macOS-специфичные настройки безопасности могут блокировать установку инструментов разработки?

- A) FileVault шифрование
- B) Gatekeeper (проверка подписи приложений)
- C) Time Machine бэкапы
- D) iCloud синхронизация

<details>
<summary>✅ Правильный ответ</summary>

**B)** Gatekeeper (проверка подписи приложений)

**Объяснение:** Gatekeeper — это система безопасности macOS, которая проверяет цифровую подпись приложений. При первом запуске неподписанного приложения (например, некоторых CLI-инструментов) может появиться предупреждение.

**macOS совет:** Если приложение заблокировано: System Settings → Privacy & Security → прокрутите вниз и нажмите "Open Anyway". Для CLI-инструментов из Homebrew обычно достаточно запустить с `sudo` один раз.

</details>

**Вопрос 7:** Почему рекомендуется использовать zsh на macOS вместо bash?

- A) zsh быстрее bash
- B) zsh — это shell по умолчанию в macOS начиная с Catalina (10.15)
- C) bash не работает на Apple Silicon
- D) zsh обязателен для Homebrew

<details>
<summary>✅ Правильный ответ</summary>

**B)** zsh — это shell по умолчанию в macOS начиная с Catalina (10.15)

**Объяснение:** Apple переключилась на zsh из-за лицензионных причин (bash 3.2 под GPL v2, новые версии под GPL v3). zsh также предлагает мощные функции: лучшее автодополнение, расширенный globbing, темы и плагины через Oh My Zsh.

**macOS совет:** Установите Oh My Zsh для продвинутых функций: `sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`. Настройте файл `~/.zshrc` для персональных алиасов и функций.

</details>

---

## 📝 Задания для macOS

### Задание 1: Базовое (20-30 мин) — "Homebrew и основы macOS разработки"

**Цель:** Установить базовые инструменты разработки через Homebrew и проверить их работу.

**Шаги:**

1. **Установка Xcode Command Line Tools**

   ```bash
   xcode-select --install
   # Следуйте инструкциям в GUI
   ```

2. **Установка Homebrew**

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Настройка PATH для Homebrew**

   ```bash
   # Для Apple Silicon (M1/M2/M3)
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"

   # Для Intel Mac
   echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/usr/local/bin/brew shellenv)"
   ```

4. **Установка Git через Homebrew**

   ```bash
   brew install git
   ```

5. **Установка Claude Code и других инструментов**

   ```bash
   # Установка Node.js
   brew install node

   # Установка Cursor
   brew install --cask cursor
   ```

**Критерии успеха:**

- ✅ Xcode Command Line Tools установлены (`xcode-select -p` показывает путь)
- ✅ Homebrew работает (`brew doctor` выводит "Your system is ready to brew")
- ✅ Git установлен через Homebrew (`which git` показывает путь Homebrew)
- ✅ Claude Code доступен в браузере (https://claude.ai/code)
- ✅ Node.js установлен (`node --version` показывает версию)

**Команды проверки:**

```bash
# Проверка архитектуры Mac
uname -m
# arm64 = Apple Silicon, x86_64 = Intel

# Проверка Xcode Command Line Tools
xcode-select --version
xcode-select -p

# Проверка Homebrew
brew --version
brew doctor
brew config | grep Homebrew

# Проверка Git
which git
# Должно быть /opt/homebrew/bin/git или /usr/local/bin/git
git --version

# Проверка Node.js
node --version
npm --version

# Проверка PATH
echo $PATH | tr ':' '\n' | grep homebrew

# Общая диагностика
sw_vers  # Версия macOS
```

**Что делать, если что-то не работает:**

- **Homebrew не найден:** Проверьте PATH: `echo $PATH`. Перезапустите Terminal или выполните `source ~/.zprofile`
- **Git старой версии:** Убедитесь, что `which git` показывает путь Homebrew, а не `/usr/bin/git`
- **Проблемы с правами:** Проверьте владельца папки Homebrew: `ls -la /opt/homebrew` (или `/usr/local` для Intel)

---

### Задание 2: Продвинутое (35-50 мин) — "Оптимизация macOS для профессиональной разработки"

**Цель:** Настроить продвинутую среду разработки с iTerm2, Oh My Zsh и полезными CLI-утилитами.

**Шаги:**

1. **Установка и настройка iTerm2**

   ```bash
   # Установка iTerm2
   brew install --cask iterm2

   # Запуск iTerm2
   open -a iTerm
   ```

2. **Установка Oh My Zsh**

   ```bash
   sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
   ```

3. **Настройка полезных алиасов в ~/.zshrc**

   ```bash
   cat >> ~/.zshrc << 'EOF'

   # Git алиасы
   alias gs="git status"
   alias ga="git add"
   alias gc="git commit"
   alias gp="git push"
   alias gl="git log --oneline --graph"

   # Навигация
   alias ..="cd .."
   alias ...="cd ../.."
   alias ll="ls -lah"

   # Homebrew
   alias bu="brew update && brew upgrade && brew cleanup"
   alias bi="brew install"
   alias bci="brew install --cask"

   # Node.js
   alias ni="npm install"
   alias nrs="npm run start"
   alias nrd="npm run dev"

   # Полезные функции
   mkcd() { mkdir -p "$1" && cd "$1"; }

   EOF

   # Применить изменения
   source ~/.zshrc
   ```

4. **Установка полезных CLI-инструментов**

   ```bash
   # Современные замены стандартных команд
   brew install bat      # cat с подсветкой синтаксиса
   brew install exa      # ls с иконками и цветами
   brew install fzf      # Fuzzy finder для поиска
   brew install ripgrep  # rg - быстрый поиск в файлах
   brew install jq       # Обработка JSON
   brew install httpie   # HTTP клиент для API

   # Установка автодополнения для fzf
   $(brew --prefix)/opt/fzf/install
   ```

5. **Настройка горячих клавиш и профилей iTerm2**

   - Preferences → Keys → Hotkey → Create a Dedicated Hotkey Window (например, ⌥Space)
   - Preferences → Profiles → Colors → Import → Выбрать тему (Dracula, Solarized)
   - Preferences → Profiles → Text → Font → JetBrains Mono (установить: `brew install --cask font-jetbrains-mono`)

6. **Установка дополнительных инструментов продуктивности**

   ```bash
   # Raycast - замена Spotlight
   brew install --cask raycast

   # Rectangle - управление окнами
   brew install --cask rectangle

   # Visual Studio Code (альтернатива Cursor)
   brew install --cask visual-studio-code
   ```

**Критерии успеха:**

- ✅ iTerm2 установлен и настроен с темой
- ✅ Oh My Zsh работает (видна тема в промпте)
- ✅ Все алиасы работают (проверьте `gs`, `ll`, `bu`)
- ✅ CLI-инструменты установлены (проверьте `bat --version`, `exa --version`)
- ✅ Горячая клавиша iTerm2 работает
- ✅ Rectangle управляет окнами

**Команды проверки:**

```bash
# Проверка zsh и Oh My Zsh
echo $SHELL  # Должно быть /bin/zsh
ls -la ~/.oh-my-zsh  # Проверка установки Oh My Zsh

# Проверка iTerm2
ls -la /Applications/iTerm.app

# Проверка алиасов
alias | grep "gs="
alias | grep "ll="

# Проверка CLI-инструментов
bat --version
exa --version
fzf --version
rg --version
jq --version
http --version

# Проверка шрифтов
ls ~/Library/Fonts | grep -i "jetbrains"
# или
brew list --cask | grep font-jetbrains-mono

# Проверка Raycast
ls -la /Applications/Raycast.app

# Проверка Rectangle
ls -la /Applications/Rectangle.app

# Тест функции mkcd
mkcd /tmp/test-dir && pwd && cd ~ && rm -rf /tmp/test-dir
```

**Бонусные настройки:**

Добавьте в `~/.zshrc` для улучшенной работы:

```bash
# Цветной вывод для ls/exa
alias ls="exa --icons --group-directories-first"
alias ll="exa -l --icons --group-directories-first"
alias la="exa -la --icons --group-directories-first"
alias lt="exa -T --icons --group-directories-first --level=2"

# cat → bat
alias cat="bat --style=numbers,changes"

# Быстрый поиск с fzf
alias preview="fzf --preview 'bat --color=always --style=numbers --line-range=:500 {}'"

# История с fzf
# Ctrl+R для поиска в истории
bindkey '^R' fzf-history-widget

# Git с fzf
alias gco="git branch | fzf | xargs git checkout"  # Выбор веток
```

---

### Задание 3: Проектное (50-70 мин) — "Apple Silicon оптимизация и совместимость"

**Цель:** Понять различия между Apple Silicon (M1/M2/M3) и Intel, настроить Rosetta 2, проверить производительность нативных vs эмулированных приложений.

**Шаги:**

1. **Определение архитектуры вашего Mac**

   ```bash
   # Проверка архитектуры процессора
   uname -m
   # arm64 = Apple Silicon (M1/M2/M3)
   # x86_64 = Intel

   # Детальная информация о процессоре
   sysctl -n machdep.cpu.brand_string

   # Информация о системе
   system_profiler SPHardwareDataType | grep -E "Model|Processor|Cores"
   ```

2. **Установка Rosetta 2 (только для Apple Silicon)**

   ```bash
   # Rosetta 2 нужна для запуска приложений Intel на Apple Silicon
   softwareupdate --install-rosetta --agree-to-license

   # Проверка установки
   /usr/bin/pgrep -q oahd && echo "Rosetta 2 установлена" || echo "Rosetta 2 не установлена"
   ```

3. **Проверка расположения Homebrew**

   ```bash
   # Для Apple Silicon должно быть /opt/homebrew
   # Для Intel должно быть /usr/local

   brew config | grep -E "HOMEBREW_PREFIX|HOMEBREW_CELLAR"

   # Проверка бинарников
   which brew
   # Apple Silicon: /opt/homebrew/bin/brew
   # Intel: /usr/local/bin/brew

   # Если Homebrew в неправильном месте, переустановите:
   # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
   # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

4. **Тестирование нативных vs Rosetta приложений**

   ```bash
   # Создайте тестовый скрипт
   cat > ~/test-architecture.sh << 'EOF'
   #!/bin/bash

   echo "=== Тестирование архитектуры ==="
   echo ""

   # Текущая архитектура
   echo "Системная архитектура: $(uname -m)"
   echo ""

   # Тест нативного запуска
   echo "=== Нативный запуск ==="
   time arch -arm64 /bin/bash -c "for i in {1..1000}; do echo test > /dev/null; done"
   echo ""

   # Тест через Rosetta (только Apple Silicon)
   if [ "$(uname -m)" = "arm64" ]; then
       echo "=== Rosetta запуск ==="
       time arch -x86_64 /bin/bash -c "for i in {1..1000}; do echo test > /dev/null; done"
   fi
   EOF

   chmod +x ~/test-architecture.sh
   ~/test-architecture.sh
   ```

5. **Проверка архитектуры установленных приложений**

   ```bash
   # Создайте скрипт для проверки
   cat > ~/check-app-arch.sh << 'EOF'
   #!/bin/bash

   echo "=== Проверка архитектуры приложений ==="
   echo ""

   check_app() {
       app=$1
       if [ -d "$app" ]; then
           file "$app/Contents/MacOS/"* | head -n 1
       else
           echo "Приложение $app не найдено"
       fi
   }

   echo "Cursor:"
   check_app "/Applications/Cursor.app"

   echo -e "\niTerm2:"
   check_app "/Applications/iTerm.app"

   echo -e "\nDocker:"
   check_app "/Applications/Docker.app"

   echo -e "\nObsidian:"
   check_app "/Applications/Obsidian.app"

   echo ""
   echo "=== Проверка Homebrew пакетов ==="

   # Проверка некоторых установленных пакетов
   for pkg in git node python3; do
       if which $pkg > /dev/null 2>&1; then
           echo "$pkg: $(file $(which $pkg))"
       fi
   done
   EOF

   chmod +x ~/check-app-arch.sh
   ~/check-app-arch.sh
   ```

6. **Создание таблицы совместимости инструментов**

   ```bash
   # Создайте документ совместимости
   cat > ~/Desktop/macos-compatibility-checklist.md << 'EOF'
   # Чеклист совместимости macOS инструментов

   ## Информация о системе
   - **Модель:** [Ваша модель Mac]
   - **Процессор:** [M1/M2/M3 или Intel]
   - **Архитектура:** [arm64 или x86_64]
   - **macOS версия:** [Версия]
   - **Rosetta 2:** [Установлена/Не установлена]

   ## Статус инструментов

   ### Базовые инструменты
   - [ ] Homebrew - Путь: _____ - Архитектура: _____
   - [ ] Git - Версия: _____ - Нативный: Да/Нет
   - [ ] Node.js - Версия: _____ - Нативный: Да/Нет
   - [ ] Python - Версия: _____ - Нативный: Да/Нет

   ### GUI приложения
   - [ ] Cursor - Нативный: Да/Нет/Universal
   - [ ] iTerm2 - Нативный: Да/Нет/Universal
   - [ ] Docker Desktop - Нативный: Да/Нет/Universal
   - [ ] Obsidian - Нативный: Да/Нет/Universal

   ### Производительность
   - [ ] Нативная скорость сборки: _____ сек
   - [ ] Rosetta скорость сборки: _____ сек (если применимо)
   - [ ] Разница: _____ %

   ## Проблемы совместимости

   ### Найденные проблемы:
   1. _____
   2. _____

   ### Решения:
   1. _____
   2. _____

   ## Рекомендации

   - Использовать нативные версии когда возможно
   - Держать Rosetta 2 для совместимости
   - Регулярно проверять обновления
   EOF

   # Откройте документ для заполнения
   open ~/Desktop/macos-compatibility-checklist.md
   ```

7. **Настройка для работы с обеими архитектурами (Apple Silicon)**

   ```bash
   # Добавьте функции в ~/.zshrc для переключения архитектур
   cat >> ~/.zshrc << 'EOF'

   # Функции для работы с архитектурами (Apple Silicon)
   if [ "$(uname -m)" = "arm64" ]; then
       # Запуск команды в режиме Rosetta
       alias x86="arch -x86_64"

       # Запуск терминала в режиме Rosetta
       alias rosetta-term="arch -x86_64 /bin/zsh"

       # Проверка текущей архитектуры
       alias check-arch='echo "Текущая архитектура: $(uname -m)"'
   fi

   EOF

   source ~/.zshrc
   ```

**Критерии успеха:**

- ✅ Знаете свою архитектуру Mac (arm64 или x86_64)
- ✅ Homebrew установлен в правильной директории
  - Apple Silicon: `/opt/homebrew`
  - Intel: `/usr/local`
- ✅ Rosetta 2 установлена (для Apple Silicon)
- ✅ Все основные инструменты работают нативно
- ✅ Создан чеклист совместимости с заполненными данными
- ✅ Понимаете разницу в производительности нативных vs Rosetta приложений

**Команды проверки:**

```bash
# Проверка архитектуры
uname -m
# Ожидается: arm64 (Apple Silicon) или x86_64 (Intel)

# Проверка процессора
sysctl -n machdep.cpu.brand_string
# M1/M2/M3 или Intel Core

# Проверка Homebrew
brew config | grep Homebrew
# Apple Silicon: HOMEBREW_PREFIX: /opt/homebrew
# Intel: HOMEBREW_PREFIX: /usr/local

# Проверка Rosetta 2 (только Apple Silicon)
/usr/bin/pgrep -q oahd && echo "✅ Rosetta 2 активна" || echo "❌ Rosetta 2 не установлена"

# Проверка архитектуры запущенных процессов
ps aux | head -n 20 | awk '{print $2}' | xargs file | grep -E "Mach-O|executable"

# Проверка нативности Node.js
file $(which node)
# Должно содержать arm64 для Apple Silicon

# Проверка нативности Git
file $(which git)
# Должно содержать arm64 для Apple Silicon

# Проверка Python
file $(which python3)
# Должно содержать arm64 для Apple Silicon

# Тест производительности
echo "=== Нативный тест ==="
time node -e "for(let i=0; i<1000000; i++) {}"

# Для Apple Silicon - тест через Rosetta
if [ "$(uname -m)" = "arm64" ]; then
    echo "=== Rosetta тест ==="
    time arch -x86_64 node -e "for(let i=0; i<1000000; i++) {}"
fi

# Проверка установленных cask приложений
brew list --cask

# Проверка версии macOS
sw_vers
```

**Дополнительные тесты производительности:**

```bash
# Создайте benchmark скрипт
cat > ~/benchmark.js << 'EOF'
console.time('Fibonacci');
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log('Fibonacci(40):', fibonacci(40));
console.timeEnd('Fibonacci');
EOF

# Нативный запуск
echo "=== Native ARM64 ==="
node ~/benchmark.js

# Через Rosetta (только Apple Silicon)
if [ "$(uname -m)" = "arm64" ]; then
    echo "=== Rosetta x86_64 ==="
    arch -x86_64 node ~/benchmark.js
fi

# Сравните время выполнения!
```

**Решение проблем:**

**Проблема:** Homebrew установлен в неправильную директорию

```bash
# Решение: Переустановка Homebrew
# 1. Удалить текущий Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"

# 2. Установить заново
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Настроить PATH
# Для Apple Silicon
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
# Для Intel
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile

# 4. Применить изменения
source ~/.zprofile
```

**Проблема:** Приложение требует Rosetta, но она не установлена

```bash
# Установка Rosetta 2
softwareupdate --install-rosetta --agree-to-license
```

**Проблема:** Медленная работа некоторых инструментов

```bash
# Проверьте, не запущены ли они через Rosetta
ps aux | grep [имя_процесса] | awk '{print $2}' | xargs file

# Если показывает x86_64 на Apple Silicon - переустановите нативную версию
brew reinstall [пакет]
```

---

## ➡️ Что дальше?

Теперь ваша macOS среда полностью настроена! Продолжай с одним из путей:

**Быстрая установка:**
→ **[06-ONE-CLICK-SETUP.md](06-ONE-CLICK-SETUP.md)** - Автоматизированная установка всех инструментов одной командой

**Развенчание мифов:**
→ **[07-МИФЫ-О-VIBECODING.md](07-МИФЫ-О-VIBECODING.md)** - Разбираем распространённые заблуждения о VibeCoding

**Основные концепции:**
→ **[../01-ОСНОВЫ/01-ЧТО-ТАКОЕ-VIBECODING.md](../01-ОСНОВЫ/01-ЧТО-ТАКОЕ-VIBECODING.md)** - Глубокое погружение в философию VibeCoding

---

## 🚀 Следующие шаги

После установки всех инструментов:

1. **Изучите macOS экосистему** в [MACOS-ECOSYSTEM.md]
2. **Освойте Terminal и zsh** в [TERMINAL-MASTERY.md]
3. **Настройте свою среду разработки** в [DEV-ENVIRONMENT.md]
4. **Присоединитесь к Apple сообществу** и начните свой путь VibeCoder'а!

---

> **"macOS - это когда элегантность встречается с мощью"** — Современный Apple разработчик

_Добро пожаловать в мир macOS VibeCoding! Ваше окружение готово, теперь время творить эффективно! 🍎✨_
