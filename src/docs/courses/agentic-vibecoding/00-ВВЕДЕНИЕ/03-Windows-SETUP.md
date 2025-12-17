# 🚀 БЫСТРЫЙ СТАРТ VIBECODING: Полная настройка окружения для Windows

> **"Windows - это когда мощь встречается с удобством"** — Современный Windows разработчик

## 📋 Содержание

1. [🎯 Обзор Windows окружения](#-обзор-windows-окружения)
2. [💻 Базовое окружение разработчика](#-базовое-окружение-разработчика)
3. [🤖 AI-инструменты для VibeCoding](#-ai-инструменты-для-vibecoding)
4. [📝 Инструменты для документации](#-инструменты-для-документации)
5. [🔧 Дополнительные утилиты](#-дополнительные-утилиты)
6. [✅ Проверка установки](#-проверка-установки)
7. [🎓 Первый VibeCoding проект](#-первый-vibecoding-проект)

---

## 🎯 Обзор Windows окружения

### Почему Windows + WSL2? Идеальное сочетание!

Windows — самая распространенная ОС в мире, а WSL2 добавляет лучшее из Linux. Это как иметь два компьютера в одном:

- **Windows** — для повседневной работы и стабильности
- **WSL2** — для программирования (Linux в Windows)
- **Результат** — лучшее из обоих миров!

### Минимальный набор VibeCoder'а:

- **🖥️ Windows 10/11** — ваша основная ОС. WSL2 добавляет Linux-совместимость
  - 🔗 [Windows 11](https://www.microsoft.com/windows/windows-11) | [WSL2](https://docs.microsoft.com/windows/wsl/)
- **🤖 Cursor AI** — умный редактор кода с AI-помощником. Как Word + умный коллега
  - 🔗 [Официальный сайт](https://cursor.sh/) | [Скачать](https://cursor.sh/downloads)
- **📦 Node.js & npm/pnpm** — "движок" для JavaScript. Запускает современные веб-приложения
  - 🔗 [Node.js](https://nodejs.org/) | [nvm-windows](https://github.com/coreybutler/nvm-windows) | [pnpm](https://pnpm.io/)
- **📝 Obsidian** — цифровой блокнот для заметок. Как Evernote для программистов
  - 🔗 [Официальный сайт](https://obsidian.md/) | [Скачать](https://obsidian.md/download)
- **🔄 Git** — система контроля версий. "Машина времени" для кода
  - 🔗 [Официальный сайт](https://git-scm.com/) | [GitHub Desktop](https://desktop.github.com/)

### Рекомендуемый набор Pro:

- **🚀 Bun** — быстрый "движок" для JavaScript. Как спортивный автомобиль
  - 🔗 [Официальный сайт](https://bun.sh/) | [GitHub](https://github.com/oven-sh/bun)
- **🐳 Docker Desktop** — контейнеризация. Упаковывает приложения в "коробки"
  - 🔗 [Официальный сайт](https://www.docker.com/) | [Скачать](https://www.docker.com/products/docker-desktop/)
- **📊 DBeaver** — универсальный менеджер баз данных. Бесплатный инструмент для работы с любыми БД
  - 🔗 [Официальный сайт](https://dbeaver.io/) | [Скачать](https://dbeaver.io/download/)
- **🎨 Figma** — инструмент для дизайна. Создание красивых интерфейсов
  - 🔗 [Официальный сайт](https://www.figma.com/) | [Скачать](https://www.figma.com/downloads/)
- **🔍 PowerToys** — утилиты Microsoft для повышения продуктивности
  - 🔗 [Официальный сайт](https://docs.microsoft.com/windows/powertoys/) | [GitHub](https://github.com/microsoft/PowerToys)

### Как всё работает вместе?

```
Windows ← основная система
    ↓
WSL2 ← Linux-окружение для разработки
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

### 1. Установка Windows Terminal

```powershell
# Установка через Microsoft Store
winget install --id=Microsoft.WindowsTerminal -e

# Или через Chocolatey
choco install microsoft-windows-terminal

# Настройка профиля PowerShell
cat > $PROFILE << 'EOF'
# PowerShell profile for VibeCoding
$env:EDITOR = 'code'
Set-Alias -Name vim -Value 'code'
Set-Alias -Name nano -Value 'notepad'

# Git aliases
function gst { git status }
function gaa { git add . }
function gcm { param($msg) git commit -m $msg }
function gph { git push }
function gpl { git pull }
EOF
```

### 2. Установка WSL2 (рекомендуется)

```powershell
# Включение WSL2
wsl --install

# Установка дистрибутива Ubuntu
wsl --install -d Ubuntu

# Проверка WSL
wsl --list --verbose

# Настройка WSL для VibeCoding
wsl --set-default-version 2
```

### 3. Установка Git для Windows

```powershell
# Через winget
winget install --id=Git.Git -e

# Или через Chocolatey
choco install git

# Настройка Git
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

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

````

**Принцип работы:**
1. Вы создаете пару ключей на компьютере
2. Публичный ключ загружаете на GitHub
3. При подключении GitHub проверяет: "Этот публичный ключ соответствует приватному ключу пользователя?"
4. Если да → доступ разрешен

**Пошаговое создание SSH ключей:**
```powershell
# Создание SSH ключей
ssh-keygen -t ed25519 -C "your.email@example.com"
# -t ed25519 — современный безопасный тип ключа
# -C "your.email@example.com" — комментарий для идентификации

# При создании:
# 1. Нажмите Enter (стандартное расположение)
# 2. Придумайте пароль для дополнительной защиты
# 3. Подтвердите пароль

# Настройка SSH агента для автоматического управления ключами
Get-Service -Name ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# Добавление ключа в агент
ssh-add ~/.ssh/id_ed25519
# Теперь ключ готов к использованию

# Просмотр публичного ключа для копирования
cat ~/.ssh/id_ed25519.pub
# Или в PowerShell:
# Get-Content ~/.ssh/id_ed25519.pub
# Скопируйте ВЕСЬ текст (начинается с ssh-ed25519)
````

**Где и куда добавлять ключи:**

**На GitHub:**

1. Зайдите на github.com → Нажмите на аватар → Settings
2. В меню слева выберите "SSH and GPG keys"
3. Нажмите зеленую кнопку "New SSH key"
4. В поле "Title" напишите: "Windows Laptop" или "Work Computer"
5. В большое поле "Key" вставьте содержимое из `cat ~/.ssh/id_ed25519.pub`
6. Нажмите "Add SSH key"

**На GitLab:**

1. User Settings → SSH Keys
2. Вставьте публичный ключ
3. Выберите срок действия (рекомендую 365 дней)

**Проверка работы:**

```powershell
ssh -T git@github.com
# Ожидаемый результат:
# "Hi YourUsername! You've successfully authenticated..."
# Если "Permission denied" — проверьте правильность добавления ключа
```

**Дополнительные настройки для Windows:**

```powershell
# Проверка известных хостов
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Настройка прав доступа (только владелец может читать приватный ключ)
icacls ~/.ssh/id_ed25519 /inheritance:r /grant:r "$env:USERNAME:(R)"
icacls ~/.ssh/id_ed25519.pub /inheritance:r /grant:r "$env:USERNAME:(R)"

# Автозапуск SSH агента (добавьте в профиль PowerShell)
# Добавьте в $PROFILE:
# Get-Service ssh-agent | Set-Service -StartupType Automatic
# Start-Service ssh-agent
# ssh-add ~/.ssh/id_ed25519
```

**Правила безопасности:**

- ✅ Публичный ключ можно публиковать
- ❌ Приватный ключ НИКОГДА не передавайте
- 🔒 Используйте пароль для ключа
- 🔄 Создавайте отдельные ключи для каждого устройства
- ⏰ Обновляйте ключи каждые 6-12 месяцев
- 🪟 В Windows ключи хранятся в папке C:\Users\ВашеИмя\.ssh\

````

### 4. Node.js и пакетные менеджеры

#### Установка через winget
```powershell
# Установка Node.js LTS
winget install OpenJS.NodeJS.LTS

# Проверка
node --version
npm --version
````

#### Установка nvm для Windows

```powershell
# Установка nvm-windows
winget install nvm-windows

# Перезагрузка PowerShell/CMD
nvm install lts
nvm use lts
nvm on

# Проверка
node --version
npm --version
```

#### Установка pnpm

```powershell
# Через npm
npm install -g pnpm

# Или через winget
winget install pnpm

# Настройка автодополнения
pnpm install-completion powershell

# Проверка
pnpm --version
```

#### Установка Bun

```powershell
# Через PowerShell
powershell -c "irm bun.sh/install.ps1 | iex"

# Добавление в PATH
$env:BUN_INSTALL = "$env:USERPROFILE\.bun"
$env:PATH += ";$env:BUN_INSTALL\bin"

# Проверка
bun --version
```

---

## 🤖 AI-инструменты для VibeCoding

### 1. Cursor AI - IDE с интегрированным AI

#### Установка Cursor

```powershell
# Через winget
winget install --id=Anysphere.Cursor  -e

# Или скачайте с официального сайта
# https://cursor.sh/
```

#### Настройка Cursor для VibeCoding

```json
// %APPDATA%\Cursor\User\settings.json
{
  "editor.fontSize": 14,
  "editor.fontFamily": "JetBrains Mono, Fira Code, monospace",
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
    "*.md": "markdown",
    "*.ps1": "powershell"
  },
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Command Prompt": {
      "path": [
        "${env:windir}\\Sysnative\\cmd.exe",
        "${env:windir}\\System32\\cmd.exe"
      ],
      "args": [],
      "icon": "terminal-cmd"
    },
    "WSL": {
      "path": "wsl.exe",
      "args": ["-d", "Ubuntu"],
      "icon": "terminal-linux"
    }
  }
}
```

### 2. Windows Terminal настройка

```json
// %LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json
{
  "profiles": {
    "defaults": {
      "font": {
        "face": "JetBrains Mono",
        "size": 14
      },
      "colorScheme": "Dracula"
    }
  },
  "schemes": [
    {
      "name": "Dracula",
      "background": "#282a36",
      "foreground": "#f8f8f2",
      "cursorColor": "#f8f8f0",
      "selectionBackground": "#44475a",
      "black": "#21222c",
      "red": "#ff5555",
      "green": "#50fa7b",
      "yellow": "#f1fa8c",
      "blue": "#bd93f9",
      "purple": "#ff79c6",
      "cyan": "#8be9fd",
      "white": "#f8f8f2",
      "brightBlack": "#6272a4",
      "brightRed": "#ff6e6e",
      "brightGreen": "#69ff94",
      "brightYellow": "#ffffa5",
      "brightBlue": "#d6acff",
      "brightPurple": "#ff92df",
      "brightCyan": "#a4ffff",
      "brightWhite": "#ffffff"
    }
  ]
}
```

### 3. Claude Code - AI-помощник для кода

**Зачем нужен?** Claude Code — это специализированный AI-помощник от Anthropic, который помогает писать, анализировать и улучшать код. Он понимает контекст проекта и может работать с большими кодовыми базами.

**Возможности:**

- **Анализ кода:** Понимает сложные проекты и предлагает улучшения
- **Генерация кода:** Создает функции, классы и целые модули
- **Рефакторинг:** Предлагает оптимизацию существующего кода
- **Объяснения:** Детально разбирает, как работает код

**Установка на Windows:**

```powershell
# Через браузер (рекомендуется)
# Зайдите на https://claude.ai/code

# Или установите как PWA
# В Edge/Chrome: Меню → Приложения → Установить это сайт как приложение
```

**Интеграция с Windows:**

- Работает в любом браузере
- Интегрируется с WSL2
- Поддерживает PowerShell команды

**Ссылки:**

- 🔗 [Claude Code](https://claude.ai/code) | [Anthropic](https://www.anthropic.com/claude)

### 4. Claude Flow - Рабочие процессы с ИИ

**Зачем нужен?** Claude Flow помогает создавать автоматизированные рабочие процессы с использованием ИИ. Это как "конвейер" для повторяющихся задач разработки.

**Возможности:**

- **Автоматизация задач:** Создание скриптов для рутинных операций
- **Рабочие процессы:** Последовательности действий для сложных задач
- **Интеграции:** Связь с другими инструментами разработки
- **Шаблоны:** Готовые решения для типичных сценариев

**Использование в Windows:**

- Веб-интерфейс через браузер
- Интеграция с PowerShell
- Поддержка Windows Script Host

**Ссылки:**

- 🔗 [Claude Flow](https://claude.ai/flow) | [Anthropic](https://www.anthropic.com/claude)

### 5. Claude Router - Управление проектами

**Зачем нужен?** Claude Router помогает организовывать и управлять проектами разработки. Это как "диспетчерская" для ваших идей и задач.

**Возможности:**

- **Управление задачами:** Создание и отслеживание задач разработки
- **Планирование проектов:** Структурирование больших проектов
- **Приоритизация:** Определение важности различных функций
- **Отслеживание прогресса:** Мониторинг выполнения задач

**Использование в Windows:**

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

**Установка на Windows:**

```powershell
# Через браузер (рекомендуется)
# Зайдите на https://claude.com/product/claude-code

# Или установите как PWA
# В Edge/Chrome: Меню → Приложения → Установить как приложение
```

**Ссылки:**

- 🔗 [Cloud Code](https://claude.com/product/claude-code) | [Anthropic](https://www.anthropic.com/claude)

### 8. OpenRouter - Универсальный AI API

**Зачем нужен?** OpenRouter предоставляет доступ к множеству AI моделей через единый API.

**Возможности:**

- **Множественные модели:** Доступ к разным AI
- **Управление кредитами:** Контроль расходов
- **Единый API:** Один интерфейс для всех моделей
- **Аналитика:** Отслеживание использования

**Установка на Windows:**

```powershell
# Через npm
npm install -g openrouter-cli

# Или используйте веб-версию
# https://openrouter.ai/settings/credits

# Через Chocolatey
choco install openrouter
```

**Ссылки:**

- 🔗 [OpenRouter](https://openrouter.ai/settings/credits) | [Документация](https://openrouter.ai/docs)

### 9. Kilo Code - AI-first редактор

**Зачем нужен?** Kilo Code — это инновационный редактор кода, полностью ориентированный на работу с AI.

**Возможности:**

- **AI-first подход:** Постоянная поддержка ИИ
- **Умные предложения:** Контекстные рекомендации
- **Быстрая разработка:** Ускорение процесса
- **Современный UI:** Интуитивный интерфейс

**Установка на Windows:**

```powershell
# Через браузер
# Зайдите на https://kilocode.ai/

# Или скачайте установщик
# https://kilocode.ai/download/windows

# Через Chocolatey
choco install kilocode
```

**Ссылки:**

- 🔗 [Kilo Code](https://kilocode.ai/) | [Документация](https://kilocode.ai/docs)

### 10. Crystal - Управление сессиями Claude

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

**Установка на Windows:**

```powershell
# Через браузер (рекомендуется)
# Зайдите на https://stravu.com/blog/crystal

# Или установите как PWA
# В Edge/Chrome: Меню → Приложения → Установить как приложение

# Скачайте с GitHub
# https://github.com/stravu/crystal/releases/latest/download/crystal-windows.exe

# Через npm
npm install -g crystal-cli

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
Windows Terminal + WSL2 ← основная среда
    ↓
Cursor + VS Code ← редактирование кода
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

```powershell
# Через winget
winget install Obsidian.Obsidian

# Или через Chocolatey
choco install obsidian
```

#### Настройка Obsidian для VibeCoding

```powershell
# Создание VibeCoding Vault
mkdir "$env:USERPROFILE\VibeCoding\Vault\Projects"
mkdir "$env:USERPROFILE\VibeCoding\Vault\Knowledge"
mkdir "$env:USERPROFILE\VibeCoding\Vault\Templates"
mkdir "$env:USERPROFILE\VibeCoding\Vault\Daily"

# Создание шаблона для проектной документации
@"
---
created: `"{{date}}`"
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
"@ | Out-File -FilePath "$env:USERPROFILE\VibeCoding\Vault\Templates\project-template.md" -Encoding UTF8
```

### 2. Дополнительные инструменты документирования

#### PowerShell Markdown модуль

```powershell
# Установка модуля
Install-Module -Name PowerShellMarkdown -Scope CurrentUser

# Создание документации
New-MarkdownDocument -Title "VibeCoding Project" -Path .\README.md
```

---

## 🔧 Дополнительные утилиты

### 1. PowerToys - Утилиты для продуктивности

```powershell
# Через winget
winget install Microsoft.PowerToys

# Рекомендуемые настройки:
# - FancyZones для управления окнами
# - PowerRename для массового переименования
# - File Explorer Add-ons
# - Keyboard Manager
```

### 2. Windows Subsystem for Linux (WSL2)

```powershell
# Установка дополнительных дистрибутивов
wsl --install -d Debian
wsl --install -d openSUSE-42

# Настройка WSL конфигурации
@"
[wsl2]
memory=4GB
processors=2
swap=2GB
localhostForwarding=true

[network]
generateHosts=false
"@ | Out-File -FilePath "$env:USERPROFILE\.wslconfig" -Encoding ASCII
```

### 3. Chocolatey - Пакетный менеджер

```powershell
# Установка Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Проверка
choco --version
```

### 4. Scoop - Альтернативный пакетный менеджер

```powershell
# Установка Scoop
iex (new-object net.webclient).downloadstring('https://get.scoop.sh')

# Добавление buckets
scoop bucket add extras
scoop bucket add nerd-fonts

# Установка полезных пакетов
scoop install sudo curl wget git vim nano
```

### 5. HTTPie - Удобный HTTP клиент

```powershell
# Через Chocolatey
choco install httpie

# Или через Scoop
scoop install httpie
```

### 6. jq - Обработка JSON

```powershell
# Через Chocolatey
choco install jq

# Или через Scoop
scoop install jq
```

### 7. bat - Улучшенный cat с подсветкой

```powershell
# Через Chocolatey
choco install bat

# Или через Scoop
scoop install bat

# Настройка алиаса в PowerShell
function cat { bat $args }
```

### 8. exa - Современная замена ls

```powershell
# Через Chocolatey
choco install exa

# Или через Scoop
scoop install exa

# Настройка алиасов в PowerShell
function ls { exa $args }
function ll { exa -l $args }
function la { exa -la $args }
```

### 9. fzf - Fuzzy поиск

```powershell
# Через Chocolatey
choco install fzf

# Или через Scoop
scoop install fzf

# Установка полезных интеграций
# Добавьте в PowerShell профиль:
# Import-Module PSFzf
# Set-PsFzfOption -PSReadlineChordProvider 'Ctrl+f' -PSReadlineChordReverseHistory 'Ctrl+r'
```

### 10. Docker Desktop

```powershell
# Через winget
winget install Docker.DockerDesktop

# Или через Chocolatey
choco install docker-desktop

# Включение Docker Compose V2
docker compose version
```

### 11. DBeaver - Универсальный GUI для баз данных

**Зачем нужен?** DBeaver — это бесплатный универсальный инструмент для работы с базами данных. Поддерживает практически все популярные СУБД: PostgreSQL, MySQL, SQLite, Oracle, SQL Server, MongoDB и многие другие.

**Возможности:**

- **Универсальность:** Работа с любыми базами данных через единый интерфейс
- **SQL редактор:** Подсветка синтаксиса, автодополнение, форматирование
- **Визуализация данных:** Диаграммы, графики, экспорт в различные форматы
- **Управление схемой:** Создание и изменение таблиц, индексов, связей
- **Импорт/экспорт:** Поддержка CSV, JSON, XML, Excel и других форматов
- **Скрипты и процедуры:** Выполнение сложных SQL скриптов
- **Бесплатность:** Community Edition полностью бесплатна

**Установка на Windows:**

```powershell
# Через winget (рекомендуется)
winget install dbeaver.dbeaver

# Или через Chocolatey
choco install dbeaver

# Или скачайте с официального сайта
# https://dbeaver.io/download/
```

**Первоначальная настройка:**

```powershell
# После установки DBeaver:
# 1. Запустите DBeaver
# 2. Создайте новое подключение: Database → New Database Connection
# 3. Выберите тип БД (PostgreSQL, MySQL, SQLite и т.д.)
# 4. Введите параметры подключения
# 5. Протестируйте соединение

# Полезные настройки в Preferences:
# - General → Editors → SQL Editor → Enable auto-completion
# - General → Editors → SQL Editor → Enable syntax highlighting
# - Connections → Connection types → Configure connection pooling
```

**Подключение к популярным БД:**

**PostgreSQL (например, Neon, Supabase):**

```
Host: your-host.neon.tech
Port: 5432
Database: neondb
Username: your-username
Password: your-password
SSL: require
```

**MySQL:**

```
Host: localhost
Port: 3306
Database: your-database
Username: root
Password: your-password
```

**SQLite:**

```
Path: C:\path\to\your\database.db
```

**MongoDB:**

```
Host: localhost
Port: 27017
Database: your-database
Authentication: SCRAM-SHA-1
```

**Полезные функции DBeaver:**

- **Ctrl+Enter** — выполнить SQL запрос
- **Ctrl+Shift+F** — форматировать SQL
- **F4** — открыть редактор данных
- **Ctrl+Shift+O** — открыть SQL скрипт
- **Alt+X** — выполнить выделенный текст

**Ссылки:**

- 🔗 [Официальный сайт](https://dbeaver.io/) | [Скачать](https://dbeaver.io/download/)
- 🔗 [Документация](https://dbeaver.io/docs/) | [GitHub](https://github.com/dbeaver/dbeaver)

---

## ✅ Проверка установки

### Скрипт проверки окружения для Windows

```powershell
# check-windows-vibecoding.ps1

Write-Host "🔍 Проверка Windows VibeCoding окружения..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor White

$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"

function Test-Command {
    param($Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Host "✅ $Command установлен" -ForegroundColor $GREEN
        & $Command --version 2>$null | Select-Object -First 1
    } catch {
        Write-Host "❌ $Command не установлен" -ForegroundColor $RED
    }
    Write-Host ""
}

function Test-Program {
    param($ProgramName, $IsOptional = $false)
    try {
        $null = Get-Package $ProgramName -ErrorAction Stop
        Write-Host "✅ $ProgramName установлен" -ForegroundColor $GREEN
    } catch {
        if ($IsOptional) {
            Write-Host "⚠️ $ProgramName не установлен (опционально)" -ForegroundColor $YELLOW
        } else {
            Write-Host "❌ $ProgramName не установлен" -ForegroundColor $RED
        }
    }
    Write-Host ""
}

Write-Host "📦 Базовые инструменты:" -ForegroundColor Magenta
Test-Command git
Test-Command node
Test-Command npm
Test-Command pnpm

Write-Host "🚀 Дополнительные инструменты:" -ForegroundColor Magenta
Test-Command bun
Test-Command docker
Test-Command docker-compose

Write-Host "🛠️ CLI утилиты:" -ForegroundColor Magenta
Test-Command httpie
Test-Command jq
Test-Command bat
Test-Command exa
Test-Command fzf

Write-Host "🤖 AI инструменты:" -ForegroundColor Magenta
try {
    $cursor = Get-Package "Cursor" -ErrorAction Stop
    Write-Host "✅ Cursor установлен" -ForegroundColor $GREEN
} catch {
    Write-Host "❌ Cursor не установлен" -ForegroundColor $RED
}
Write-Host ""

Write-Host "📝 Документация:" -ForegroundColor Magenta
try {
    $obsidian = Get-Package "Obsidian*" -ErrorAction Stop
    Write-Host "✅ Obsidian установлен" -ForegroundColor $GREEN
} catch {
    Write-Host "⚠️ Obsidian не установлен (опционально)" -ForegroundColor $YELLOW
}
Write-Host ""

Write-Host "🗄️ Базы данных:" -ForegroundColor Magenta
try {
    $dbeaver = Get-Package "DBeaver*" -ErrorAction Stop
    Write-Host "✅ DBeaver установлен" -ForegroundColor $GREEN
} catch {
    Write-Host "⚠️ DBeaver не установлен (опционально)" -ForegroundColor $YELLOW
}
Write-Host ""

Write-Host "🖥️ Системные компоненты:" -ForegroundColor Magenta
try {
    $wsl = wsl --list --quiet 2>$null
    Write-Host "✅ WSL2 установлен и настроен" -ForegroundColor $GREEN
} catch {
    Write-Host "⚠️ WSL2 не настроен (опционально)" -ForegroundColor $YELLOW
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor White
Write-Host "Проверка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Советы:" -ForegroundColor Cyan
Write-Host "- Используйте Windows Terminal для лучшего опыта"
Write-Host "- WSL2 обеспечивает Linux-совместимость"
Write-Host "- PowerToys улучшает продуктивность"
Write-Host "- Настройте PowerShell профиль для удобства"
```

Запустите проверку:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\check-windows-vibecoding.ps1
```

---

## 🔧 Troubleshooting - Решение проблем

### Распространенные проблемы и решения:

#### 1. **Windows Terminal не устанавливается**

```
Проблема: winget: command not found
Решение:
1. Обновите Windows: Settings → Update & Security → Windows Update
2. Установите App Installer: https://www.microsoft.com/store/productId/9NBLGGH4NNS1
3. Установите вручную: https://aka.ms/terminal
```

#### 2. **WSL2 не работает**

```
Проблема: WSL 2 requires an update to its kernel component
Решение:
1. Запустите PowerShell как администратор
2. Выполните: wsl --update
3. Перезагрузите компьютер
4. Проверьте: wsl --list --verbose
```

#### 3. **Docker не запускается**

```
Проблема: Docker Desktop - Access denied
Решение:
1. Проверьте виртуализацию в BIOS
2. В PowerShell как админ: bcdedit /set hypervisorlaunchtype auto
3. Перезагрузите компьютер
4. Проверьте: docker run hello-world
```

#### 4. **Node.js не устанавливается**

```
Проблема: nvm: command not found
Решение:
1. Перезагрузите PowerShell/CMD
2. Проверьте PATH: echo %PATH%
3. Переустановите nvm: winget install nvm-windows
4. Выполните: nvm on
```

#### 5. **Git SSH не подключается**

```
Проблема: Permission denied (publickey)
Решение:
1. Проверьте SSH агент: Get-Service ssh-agent
2. Запустите агент: Start-Service ssh-agent
3. Добавьте ключ: ssh-add ~/.ssh/id_ed25519
4. Проверьте: ssh -T git@github.com
```

#### 6. **Cursor не открывает файлы**

```
Проблема: Cannot open file with Cursor
Решение:
1. Проверьте установку: Get-Package "Cursor"
2. Переустановите: winget install Cursor.Cursor
3. Сбросьте настройки: del %APPDATA%\Cursor\
4. Проверьте права доступа к файлам
```

### Диагностические команды PowerShell:

```powershell
# Проверить систему
systeminfo | Select-String "OS Version","System Type"

# Проверить пакеты
Get-Package | Where-Object {$_.Name -like "*node*"}

# Проверить процессы
Get-Process | Where-Object {$_.ProcessName -like "*docker*"}

# Проверить службы
Get-Service | Where-Object {$_.Name -like "*docker*"}

# Проверить WSL
wsl --list --verbose

# Проверить PATH
$env:PATH -split ';' | Select-String "node"
```

### Если ничего не помогает:

1. **Обновите Windows:** Settings → Update & Security → Windows Update
2. **Проверьте антивирус:** Временно отключите и попробуйте снова
3. **Сбросьте настройки:** Для инструментов удалите и переустановите
4. **Обратитесь к сообществу:** Stack Overflow, Microsoft Community

---

## 🎓 Первый VibeCoding проект

### Быстрый старт проекта

```powershell
# 1. Создание проекта
mkdir my-vibecoding-app
cd my-vibecoding-app

# 2. Инициализация
pnpm init
git init

# 3. Установка TypeScript и необходимых пакетов
pnpm add -D typescript @types/node tsx
pnpm add -D prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D vitest @vitest/ui

# 4. Создание конфигураций
@"
{
  `"compilerOptions`": {
    `"target`": `"ES2022`",
    `"module`": `"ESNext`",
    `"moduleResolution`": `"node`",
    `"strict`": true,
    `"esModuleInterop`": true,
    `"skipLibCheck`": true,
    `"forceConsistentCasingInFileNames`": true,
    `"resolveJsonModule`": true,
    `"allowJs`": true,
    `"noEmit`": true,
    `"types`": [`"node`", `"vitest/globals`"]
  },
  `"include`": [`"src/**/*`"],
  `"exclude`": [`"node_modules`", `"dist`"]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8

# 5. Создание структуры проекта
mkdir src\lib, src\types, src\tests

# 6. Первый файл
@"
console.log(`"🚀 Welcome to VibeCoding!`");

export function vibeGreeting(name: string): string {
  return `"✨ Namaste, `${name}! Welcome to the flow state. 🧘‍♂️`";
}

export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
"@ | Out-File -FilePath "src\index.ts" -Encoding UTF8

# 7. Первый тест
@"
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
"@ | Out-File -FilePath "src\tests\index.test.ts" -Encoding UTF8

# 8. Конфигурация ESLint
@"
{
  `"extends`": [
    `"@typescript-eslint/recommended`"
  ],
  `"parser`": `"@typescript-eslint/parser`",
  `"plugins`": [`"@typescript-eslint`"],
  `"rules`": {
    `"@typescript-eslint/no-unused-vars`": `"error`",
    `"@typescript-eslint/no-explicit-any`": `"warn`"
  }
}
"@ | Out-File -FilePath ".eslintrc.json" -Encoding UTF8

# 9. Конфигурация Prettier
@"
{
  `"semi`": false,
  `"trailingComma`": `"es5`",
  `"singleQuote`": true,
  `"printWidth`": 80,
  `"tabWidth`": 2
}
"@ | Out-File -FilePath ".prettierrc" -Encoding UTF8

# 10. Добавление скриптов в package.json
@"
{
  `"name`": `"my-vibecoding-app`",
  `"version`": `"1.0.0`",
  `"type`": `"module`",
  `"scripts`": {
    `"dev`": `"tsx watch src/index.ts`",
    `"build`": `"tsc`",
    `"test`": `"vitest`",
    `"test:ui`": `"vitest --ui`",
    `"lint`": `"eslint . --ext .ts`",
    `"format`": `"prettier --write \`"src/**/*.ts\`"`",
    `"check`": `"pnpm lint && pnpm test`"
  },
  `"devDependencies`": {
    `"@types/node`": `"latest`",
    `"@typescript-eslint/eslint-plugin`": `"latest`",
    `"@typescript-eslint/parser`": `"latest`",
    `"@vitest/ui`": `"latest`",
    `"eslint`": `"latest`",
    `"prettier`": `"latest`",
    `"tsx`": `"latest`",
    `"typescript`": `"latest`",
    `"vitest`": `"latest`"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

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

- [x] Windows Terminal установлен и настроен
- [x] Git установлен и настроен
- [x] Node.js (LTS версия) установлен
- [x] pnpm настроен
- [x] Cursor IDE установлен и настроен
- [x] Obsidian установлен для документации

### Рекомендуемые компоненты:

- [x] WSL2 установлен для Linux-совместимости
- [x] Bun установлен как альтернатива Node.js
- [x] Docker Desktop для контейнеризации
- [x] PowerToys для продуктивности
- [ ] DBeaver для работы с БД
- [ ] HTTPie для тестирования API
- [ ] Полезные CLI утилиты (bat, exa, fzf, jq)

### Настройки и конфигурации:

- [x] SSH ключи для GitHub созданы
- [x] PowerShell профиль настроен
- [ ] Cursor AI extensions установлены
- [ ] .cursorrules создан для проектов
- [x] Obsidian vault для VibeCoding создан
- [x] Шаблоны документации подготовлены

---

## 📚 Полезные ресурсы для Windows

### Официальная документация:

- [Windows Terminal Documentation](https://docs.microsoft.com/en-us/windows/terminal/)
- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Chocolatey Documentation](https://chocolatey.org/docs/)

### VibeCoding сообщество:

- [Windows VibeCoding Guide](https://github.com/vibecoding/windows-guide)
- [PowerToys Documentation](https://docs.microsoft.com/en-us/windows/powertoys/)
- [Windows Developer Documentation](https://docs.microsoft.com/en-us/windows/dev-environment/)
- [WSL Best Practices](https://docs.microsoft.com/en-us/windows/wsl/best-practices)

### Обучающие материалы:

- [Windows Command Line](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands)
- [PowerShell Scripting](https://docs.microsoft.com/en-us/powershell/scripting/overview)
- [WSL Setup Guide](https://docs.microsoft.com/en-us/windows/wsl/setup/environment)
- [Docker on Windows](https://docs.docker.com/desktop/windows/)

---

## 🎯 Проверь себя: Windows окружение

**Вопрос 1:** В чём основное различие между PowerShell, Command Prompt (CMD) и WSL?

- A) Это разные названия одной и той же программы
- B) PowerShell — современная оболочка Windows, CMD — устаревшая, WSL — Linux внутри Windows
- C) CMD только для старых компьютеров, PowerShell только для серверов
- D) Между ними нет никакой разницы

<details>
<summary>✅ Правильный ответ</summary>
B) PowerShell — современная оболочка Windows, CMD — устаревшая, WSL — Linux внутри Windows

**Объяснение:**

- **PowerShell** — это современная командная оболочка Windows с поддержкой скриптов, объектной модели и автоматизации. Используйте для большинства задач разработки.
- **Command Prompt (CMD)** — это устаревшая командная строка Windows. Сохранена для совместимости со старыми скриптами.
- **WSL (Windows Subsystem for Linux)** — это настоящий Linux, работающий внутри Windows. Идеально для кроссплатформенной разработки.

**Windows совет:** Для современной разработки используйте Windows Terminal с PowerShell как основной оболочкой, а WSL — когда нужна Linux-совместимость (например, для Docker или специфичных Linux-инструментов).

</details>

---

**Вопрос 2:** Что произойдёт, если установить Node.js через `nvm-windows`, а потом напрямую через `winget install NodeJS`?

- A) Ничего страшного, они будут работать параллельно
- B) Возникнет конфликт версий в PATH, команды могут работать непредсказуемо
- C) Windows автоматически удалит старую версию
- D) Обе версии объединятся в одну

<details>
<summary>✅ Правильный ответ</summary>
B) Возникнет конфликт версий в PATH, команды могут работать непредсказуемо

**Объяснение:** Когда вы устанавливаете Node.js несколькими способами, обе установки добавляют свои пути в переменную окружения PATH. Windows будет использовать первую найденную версию, что может привести к:

- Запуску неожиданной версии Node.js
- Ошибкам при установке пакетов
- Несоответствию версий между `node` и `npm`

**Windows совет:** Выберите ОДИН способ установки:

- **nvm-windows** — если нужны разные версии Node.js для разных проектов
- **winget** или **прямая установка** — если используете одну стабильную версию

Проверить конфликты можно командой:

```powershell
where.exe node  # Покажет ВСЕ найденные версии в PATH
```

</details>

---

**Вопрос 3:** При установке Git вы получили ошибку "Permission denied" при создании SSH ключей. В чём вероятная причина?

- A) У вас нет папки `.ssh`
- B) Антивирус блокирует создание ключей
- C) Неправильные права доступа к папке `.ssh` или ключам
- D) Все вышеперечисленное

<details>
<summary>✅ Правильный ответ</summary>
D) Все вышеперечисленное

**Объяснение:** В Windows с SSH ключами могут быть проблемы по нескольким причинам:

1. **Отсутствие папки `.ssh`**: Windows может не создать её автоматически

   ```powershell
   mkdir ~/.ssh  # Создайте вручную
   ```

2. **Антивирус**: Windows Defender или другой антивирус может блокировать создание криптографических ключей как подозрительную активность

3. **Права доступа**: В Windows права на приватный ключ должны быть строго ограничены
   ```powershell
   icacls ~/.ssh/id_ed25519 /inheritance:r /grant:r "$env:USERNAME:(R)"
   ```

**Windows совет:** Всегда проверяйте права на ключи после создания:

```powershell
# Проверить права
icacls ~/.ssh/id_ed25519

# Правильные права: только ваш пользователь с правом чтения
# Неправильные: BUILTIN\Users, Everyone и другие группы
```

</details>

---

**Вопрос 4:** В Windows Terminal вы хотите быстро переключаться между PowerShell и WSL. Какое сочетание клавиш самое эффективное?

- A) Alt+Tab для переключения между окнами
- B) Ctrl+Shift+T для новой вкладки и выбор профиля
- C) Ctrl+Shift+[1-9] для переключения на конкретный профиль
- D) Закрыть текущую вкладку и открыть новую

<details>
<summary>✅ Правильный ответ</summary>
C) Ctrl+Shift+[1-9] для переключения на конкретный профиль

**Объяснение:** Windows Terminal поддерживает несколько профилей (PowerShell, CMD, WSL, и т.д.) и позволяет быстро переключаться между ними:

- **Ctrl+Shift+1** — открыть первый профиль (обычно PowerShell)
- **Ctrl+Shift+2** — открыть второй профиль (обычно CMD или WSL)
- **Ctrl+Shift+3** и далее — другие профили

Другие полезные сочетания:

- **Ctrl+Shift+D** — дублировать текущую вкладку
- **Ctrl+Tab** / **Ctrl+Shift+Tab** — переключение между вкладками
- **Ctrl+,** — открыть настройки

**Windows совет:** Настройте порядок профилей в настройках Windows Terminal для удобства. Поставьте часто используемые профили на первые позиции.

</details>

---

**Вопрос 5:** Ваш проект работает в WSL, но вы хотите редактировать файлы в Cursor на Windows. Как правильно открыть проект?

- A) Скопировать все файлы из WSL в Windows и работать с копией
- B) Использовать путь `\\wsl$\Ubuntu\home\username\project` в Cursor
- C) Открыть файлы через WSL командой `cursor .` из папки проекта
- D) Варианты B и C правильные

<details>
<summary>✅ Правильный ответ</summary>
D) Варианты B и C правильные

**Объяснение:** Windows и WSL интегрированы, и есть два основных способа работы с файлами:

**Способ 1: Через сетевой путь Windows**

```powershell
# В Cursor или проводнике Windows используйте:
\\wsl$\Ubuntu\home\username\project
```

Плюсы: Работает из любого места Windows
Минусы: Чуть медленнее, чем нативный доступ

**Способ 2: Через команду из WSL**

```bash
# В WSL терминале:
cd /home/username/project
cursor .  # Откроет Cursor с текущей папкой
```

Плюсы: Быстрый доступ, правильные права
Минусы: Нужен открытый WSL терминал

**Windows совет:** Лучшая практика — хранить код в WSL файловой системе (`/home/username/`) для максимальной производительности, особенно с Git и Node.js. Доступ из Windows через `\\wsl$\` очень удобен для редактирования.

**Не делайте так:**

- ❌ Копирование файлов туда-сюда (потеря синхронизации)
- ❌ Хранение проектов в `/mnt/c/` (медленная работа Git и npm)
</details>

---

**Вопрос 6:** Docker Desktop на Windows работает через WSL2. Что это означает для разработчика?

- A) Docker не будет работать в PowerShell, только в WSL
- B) Docker команды работают везде, но контейнеры выполняются в WSL2 backend
- C) Нужно устанавливать Docker отдельно в WSL
- D) Docker будет медленнее, чем на Linux

<details>
<summary>✅ Правильный ответ</summary>
B) Docker команды работают везде, но контейнеры выполняются в WSL2 backend

**Объяснение:** Docker Desktop на Windows использует WSL2 как backend для запуска контейнеров, что даёт лучшую производительность:

**Как это работает:**

```
PowerShell/CMD → Docker CLI → Docker Desktop → WSL2 Backend → Контейнеры
```

**Что это значит:**

- ✅ Команды `docker` работают в PowerShell, CMD и WSL
- ✅ Производительность почти как на нативном Linux
- ✅ Файловая система WSL2 работает быстрее для Docker volumes
- ✅ Можно использовать Linux-контейнеры без виртуализации

**Windows совет:** Для максимальной производительности:

1. Храните Dockerfiles и код в WSL файловой системе (`/home/username/`)
2. Используйте WSL2 терминал для Docker команд
3. Настройте ресурсы WSL2 в `.wslconfig`:
   ```ini
   [wsl2]
   memory=4GB
   processors=2
   ```
   </details>

---

**Вопрос 7:** Переменная окружения PATH в Windows — что это и зачем она нужна разработчику?

- A) Это путь к папке пользователя
- B) Список папок, где Windows ищет исполняемые файлы команд
- C) Конфигурационный файл для настройки терминала
- D) Переменная для хранения паролей

<details>
<summary>✅ Правильный ответ</summary>
B) Список папок, где Windows ищет исполняемые файлы команд

**Объяснение:** PATH — это одна из самых важных переменных окружения. Когда вы вводите команду (например, `git` или `node`), Windows ищет исполняемый файл по всем путям в PATH:

**Как это работает:**

```powershell
# Вы вводите команду
> node --version

# Windows ищет node.exe в папках:
C:\Program Files\nodejs\  ← Нашёл! Запускаем
C:\Windows\System32\
C:\Users\YourName\AppData\Local\Programs\
# ...и другие папки из PATH
```

**Проверить PATH:**

```powershell
# Посмотреть все пути
$env:PATH -split ';'

# Найти, где установлена программа
where.exe node
where.exe git
```

**Добавить в PATH:**

```powershell
# Временно (до закрытия PowerShell)
$env:PATH += ";C:\MyPrograms\bin"

# Постоянно (через System Properties)
# Win+R → sysdm.cpl → Advanced → Environment Variables
```

**Windows совет:** Проблемы с "command not found" в 90% случаев связаны с PATH. Всегда проверяйте:

1. Установлена ли программа? `where.exe имя_программы`
2. Есть ли путь в PATH? `$env:PATH -split ';' | Select-String "имя"`
3. Перезапустили ли PowerShell после установки?
</details>

---

## 📝 Задания для Windows

### Задание 1: Базовое (15-25 мин) — "Windows Terminal мастер"

**Цель:** Настроить профессиональную среду разработки в Windows Terminal.

**Шаги:**

1. Установите Windows Terminal из Microsoft Store или через winget
2. Настройте PowerShell как профиль по умолчанию
3. Измените цветовую схему на Dracula или другую на ваш вкус
4. Установите шрифт с лигатурами (JetBrains Mono или Fira Code)
5. Создайте профиль PowerShell с вашими настройками

**Критерии успеха:**

- ✅ Windows Terminal открывается с PowerShell по умолчанию
- ✅ Красивая цветовая схема применена
- ✅ Шрифт с лигатурами установлен и настроен
- ✅ Размер шрифта комфортный для чтения (рекомендуется 12-14pt)
- ✅ Можете переключаться между профилями горячими клавишами

**Команды проверки (PowerShell):**

```powershell
# Проверить версию PowerShell
$PSVersionTable

# Проверить установленные программы
Get-Command git
Get-Command node

# Проверить настройки терминала
cat $PROFILE  # Должен показать ваши алиасы и настройки
```

**Дополнительное задание (+10 мин):**

- Настройте красивый PowerShell промпт с помощью Oh My Posh:
  ```powershell
  winget install JanDeDobbeleer.OhMyPosh
  oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\paradox.omp.json" | Invoke-Expression
  ```

---

### Задание 2: Продвинутое (30-45 мин) — "WSL2 + Windows интеграция"

**Цель:** Настроить бесшовную работу между Windows и Linux окружениями.

**Шаги:**

1. Установите WSL2 с Ubuntu: `wsl --install -d Ubuntu`
2. Создайте пользователя и пароль в Ubuntu
3. Обновите пакеты: `sudo apt update && sudo apt upgrade -y`
4. Установите основные инструменты в WSL:
   ```bash
   sudo apt install -y git curl wget build-essential
   ```
5. Установите Node.js через nvm в WSL:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install --lts
   ```
6. Создайте тестовый проект в WSL и откройте его в Cursor из Windows
7. Убедитесь, что Git работает корректно в обоих окружениях

**Критерии успеха:**

- ✅ WSL2 установлен и работает
- ✅ Ubuntu обновлен до последней версии
- ✅ Node.js и Git установлены в WSL
- ✅ Можете создать файл в WSL и увидеть его в проводнике Windows через `\\wsl$\Ubuntu\`
- ✅ Cursor может открывать и редактировать файлы из WSL
- ✅ Git команды работают в PowerShell и WSL

**Команды проверки (WSL):**

```bash
# В WSL терминале
cat /etc/os-release  # Информация о Ubuntu
node --version
npm --version
git --version

# Тест интеграции
mkdir ~/test-project
cd ~/test-project
echo "# Test from WSL" > README.md
cat README.md
```

**Команды проверки (PowerShell):**

```powershell
# В PowerShell
wsl --list --verbose  # Должен показать Ubuntu с версией 2
wsl cat /etc/os-release  # Выполнить Linux команду из Windows
ls \\wsl$\Ubuntu\home\  # Увидеть файлы WSL из Windows
```

**Дополнительное задание (+15 мин):**

- Настройте VS Code Remote WSL расширение для работы напрямую в WSL
- Сравните скорость работы Git в WSL vs Windows (подсказка: WSL быстрее!)

---

### Задание 3: Проектное (45-60 мин) — "Полная Windows среда разработки VibeCoder"

**Цель:** Создать полноценную профессиональную среду разработки в Windows с лучшими практиками.

**Шаги:**

**Часть 1: Установка инструментов (15 мин)**

1. Установите пакетный менеджер (Chocolatey или Scoop)
2. Установите через него базовые инструменты:

   ```powershell
   # Через Chocolatey
   choco install git nodejs pnpm docker-desktop vscode -y

   # Или через Scoop
   scoop install git nodejs pnpm
   ```

3. Установите PowerToys для повышения продуктивности

**Часть 2: Настройка окружения (15 мин)**

1. Создайте PowerShell профиль с алиасами и функциями:

   ```powershell
   # Откройте профиль
   code $PROFILE

   # Добавьте полезные алиасы
   function gst { git status }
   function gaa { git add . }
   function gcm { param($m) git commit -m $m }
   function dev { pnpm run dev }
   function build { pnpm run build }
   ```

2. Настройте Git с правильным именем и email
3. Создайте SSH ключи для GitHub
4. Добавьте SSH ключ на GitHub

**Часть 3: Тестовый проект (20 мин)**

1. Создайте новый проект в PowerShell:
   ```powershell
   mkdir test-vibecoding-windows
   cd test-vibecoding-windows
   pnpm init
   ```
2. Установите TypeScript и Vitest:
   ```powershell
   pnpm add -D typescript @types/node vitest
   ```
3. Создайте файл `src/index.ts` с простой функцией
4. Создайте тест в `src/index.test.ts`
5. Запустите тесты: `pnpm exec vitest`

**Часть 4: WSL версия (10 мин)**

1. Повторите создание проекта в WSL
2. Сравните производительность установки пакетов
3. Откройте проект из WSL в Cursor из Windows

**Критерии успеха:**

- ✅ Пакетный менеджер установлен и работает
- ✅ Все инструменты установлены и доступны в PATH
- ✅ PowerShell профиль настроен с алиасами
- ✅ Git настроен с SSH ключами
- ✅ Тестовый проект создан и работает в PowerShell
- ✅ Тестовый проект создан и работает в WSL
- ✅ Можете переключаться между PowerShell и WSL в одном проекте
- ✅ Понимаете, когда использовать PowerShell, а когда WSL

**Документация:**
Создайте файл `WINDOWS-SETUP.md` с описанием:

- Какие инструменты установлены и зачем
- Какие настройки применены
- Ваш предпочтительный workflow (PowerShell vs WSL)
- Решения найденных проблем

**Дополнительное задание (+20 мин):**

1. Установите Docker Desktop и запустите контейнер:
   ```powershell
   docker run -d -p 3000:80 nginx
   ```
2. Настройте `.wslconfig` для оптимизации ресурсов
3. Создайте скрипт автоматической проверки окружения (используйте скрипт из раздела "Проверка установки" как основу)

---

## ➡️ Что дальше?

Отличная работа! Вы настроили профессиональную среду разработки в Windows. 🎉

**Выберите свой путь:**

1. **Быстрая установка одной командой** → **[06-ONE-CLICK-SETUP.md](06-ONE-CLICK-SETUP.md)**

   - Автоматизированная установка всех инструментов
   - Скрипты для PowerShell и Bash
   - Проверка окружения

2. **Развенчание мифов о VibeCoding** → **[07-МИФЫ-О-VIBECODING.md](07-МИФЫ-О-VIBECODING.md)**

   - "VibeCoding только для профессионалов?"
   - "Нужно знать много инструментов?"
   - "Windows не подходит для разработки?"

3. **Углубиться в Windows инструменты** → **[08-TOOLS-EXPLAINED.md](08-TOOLS-EXPLAINED.md)**
   - Подробное объяснение каждого инструмента
   - Когда использовать PowerShell, CMD или WSL
   - Продвинутые настройки

**Рекомендация для Windows пользователей:**

- Если вы новичок → начните с **06-ONE-CLICK-SETUP.md**
- Если хотите понять глубже → читайте **08-TOOLS-EXPLAINED.md**
- Если сомневаетесь в VibeCoding → **07-МИФЫ-О-VIBECODING.md** развеет сомнения

---

## 🚀 Следующие шаги

После установки всех инструментов:

1. **Настройте WSL2** в [WSL2-SETUP.md]

---

_Добро пожаловать в мир Windows VibeCoding! Ваше окружение готово, теперь время творить эффективно! 🪟✨_
