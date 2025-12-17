# 🚀 БЫСТРЫЙ СТАРТ VIBECODING: Полная настройка окружения для Linux

> **"В Linux всё возможно, если знаешь как"** — Философия open-source

## 📋 Содержание

1. [🎯 Обзор Linux окружения](#-обзор-linux-окружения)
2. [💻 Базовое окружение разработчика](#-базовое-окружение-разработчика)
3. [🤖 AI-инструменты для VibeCoding](#-ai-инструменты-для-vibecoding)
4. [📝 Инструменты для документации](#-инструменты-для-документации)
5. [🔧 Дополнительные утилиты](#-дополнительные-утилиты)
6. [✅ Проверка установки](#-проверка-установки)
7. [🎓 Первый VibeCoding проект](#-первый-vibecoding-проект)

---

## 🎯 Обзор Linux окружения

### Почему Linux? Для новичков это важно!

Linux — это бесплатная операционная система, которая дает полный контроль над компьютером. В отличие от Windows или macOS, здесь вы можете:

- **Настраивать всё под себя** — как мебель в своей квартире
- **Изучать, как работает компьютер** — Linux прозрачен и открыт
- **Работать бесплатно** — никаких лицензий и подписок
- **Выбрать удобный дистрибутив** — Ubuntu для новичков, Arch для опытных

### Минимальный набор VibeCoder'а:

- **🖥️ Linux (Ubuntu/Debian/Fedora/Arch)** — это основа, как фундамент дома. Ubuntu — самый дружелюбный для новичков
  - 🔗 [Ubuntu](https://ubuntu.com/) | [Debian](https://www.debian.org/) | [Fedora](https://getfedora.org/) | [Arch Linux](https://archlinux.org/)
- **🧠 Cursor AI** — умный редактор кода с AI-помощником. Представьте Word, но для программистов + умный коллега
  - 🔗 [Официальный сайт](https://cursor.sh/) | [Скачать](https://cursor.sh/downloads)
- **📦 Node.js & npm/pnpm** — "движок" для запуска JavaScript. Без него современные сайты не работают
  - 🔗 [Node.js](https://nodejs.org/) | [nvm](https://github.com/nvm-sh/nvm) | [pnpm](https://pnpm.io/)
- **📝 Obsidian** — цифровой блокнот для заметок. Как Evernote, но для программистов
  - 🔗 [Официальный сайт](https://obsidian.md/) | [Скачать](https://obsidian.md/download)
- **🔄 Git** — система контроля версий. "Машина времени" для вашего кода
  - 🔗 [Официальный сайт](https://git-scm.com/) | [GitHub](https://github.com/)

### Рекомендуемый набор Pro:

- **🚀 Bun** — быстрый "движок" для JavaScript. Как гоночный автомобиль вместо обычного
  - 🔗 [Официальный сайт](https://bun.sh/) | [GitHub](https://github.com/oven-sh/bun)
- **🐳 Docker** — контейнеризация. Упаковывает приложения в "коробки" для легкого развертывания
  - 🔗 [Официальный сайт](https://www.docker.com/) | [Документация](https://docs.docker.com/)
- **📊 DBeaver** — менеджер баз данных. Как Excel, но для сложных данных
  - 🔗 [Официальный сайт](https://dbeaver.io/) | [Скачать](https://dbeaver.io/download/)
- **🎨 VS Code** — популярный редактор кода. Альтернатива Cursor
  - 🔗 [Официальный сайт](https://code.visualstudio.com/) | [Скачать](https://code.visualstudio.com/download)
- **🔍 FSearch** — быстрый поиск файлов. Находит любой файл за секунды
  - 🔗 [GitHub](https://github.com/cboxdoerfer/fsearch) | [PPA](https://launchpad.net/~christian-boxdoerfer/+archive/ubuntu/fsearch-daily)

### Как всё работает вместе?

```
Linux ← основа всей системы
    ↓
Cursor/VS Code ← редактирование кода
    ↓
Node.js + Git ← запуск и контроль версий
    ↓
Docker ← упаковка приложений
    ↓
Obsidian ← документирование
```

---

## 💻 Базовое окружение разработчика

### 1. Обновление системы

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Fedora/CentOS/RHEL
sudo dnf update

# Arch Linux
sudo pacman -Syu

# openSUSE
sudo zypper update
```

### 2. Установка базовых инструментов

```bash
# Ubuntu/Debian
sudo apt install -y \
    curl wget git vim nano htop tree \
    build-essential software-properties-common \
    apt-transport-https ca-certificates \
    gnupg lsb-release

# Fedora
sudo dnf install -y \
    curl wget git vim nano htop tree \
    @development-tools

# Arch Linux
sudo pacman -S \
    curl wget git vim nano htop tree \
    base-devel
```

### 3. Установка Git

```bash
# Настройка Git
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "vim"
```

### 🔐 SSH ключи - Безопасный доступ к Git

**Зачем нужны SSH ключи?** SSH ключи позволяют безопасно подключаться к GitHub без ввода пароля каждый раз. Это как "умный замок" — вы один раз настраиваете доступ, и потом входите автоматически.

**Аналогия с замком:**

```
🔑 Приватный ключ (id_ed25519) = Ключ от вашего дома
   • Храните в секрете!
   • Никогда не передавайте никому
   • Используете только вы

🏠 Публичный ключ (id_ed25519.pub) = Копия замка для гостей
   • Можно показывать всем
   • Добавляете на GitHub
   • Позволяет GitHub проверять ваш доступ
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
# -t ed25519 — современный и безопасный тип ключа
# -C "your.email@example.com" — комментарий для идентификации

# При создании:
# 1. Нажмите Enter (стандартное расположение: ~/.ssh/id_ed25519)
# 2. Придумайте пароль для дополнительной защиты (или Enter для пустого)
# 3. Подтвердите пароль

# Запуск SSH агента
eval "$(ssh-agent -s)"
# SSH агент хранит ключи в памяти для безопасного использования

# Добавление ключа в агент
ssh-add ~/.ssh/id_ed25519
# Теперь ключ готов к использованию

# Просмотр публичного ключа для копирования
cat ~/.ssh/id_ed25519.pub
# Скопируйте ВЕСЬ текст (начинается с ssh-ed25519)
```

**Где и куда добавлять ключи:**

**На GitHub:**

1. Зайдите на github.com → Нажмите на аватар → Settings
2. В меню слева выберите "SSH and GPG keys"
3. Нажмите зеленую кнопку "New SSH key"
4. В поле "Title" напишите: "Linux Desktop" или "Work Computer"
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

# Автозапуск SSH агента (добавьте в ~/.bashrc)
echo 'eval "$(ssh-agent -s)"' >> ~/.bashrc
echo 'ssh-add ~/.ssh/id_ed25519' >> ~/.bashrc
```

**Правила безопасности:**

- ✅ Публичный ключ можно публиковать
- ❌ Приватный ключ НИКОГДА не передавайте
- 🔒 Используйте пароль для ключа
- 🔄 Создавайте отдельные ключи для каждого устройства
- ⏰ Обновляйте ключи каждые 6-12 месяцев

### 4. Node.js и пакетные менеджеры

#### Установка через NodeSource (рекомендуется)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora/CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -

# Проверка
node --version
npm --version
```

#### Установка nvm (альтернативный метод)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезагрузка конфигурации shell
source ~/.bashrc

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
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Проверка
bun --version
```

---

## 🤖 AI-инструменты для VibeCoding

### 1. Cursor AI - IDE с интегрированным AI

#### Установка Cursor через AppImage

```bash
# Скачивание Cursor
wget https://download.cursor.sh/linux/appimage/Cursor-0.40.0-x86_64.AppImage

# Установка
chmod +x Cursor-0.40.0-x86_64.AppImage
sudo mv Cursor-0.40.0-x86_64.AppImage /opt/cursor/
sudo ln -sf /opt/cursor/Cursor-0.40.0-x86_64.AppImage /usr/bin/cursor

# Создание desktop файла
cat > ~/.local/share/applications/cursor.desktop << 'EOF'
[Desktop Entry]
Name=Cursor
Comment=AI-first code editor
Exec=/opt/cursor/Cursor-0.40.0-x86_64.AppImage
Icon=cursor
Type=Application
Categories=Development;IDE;
EOF
```

#### Настройка Cursor для VibeCoding

```json
// ~/.config/Cursor/User/settings.json
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
    "*.md": "markdown"
  }
}
```

### 2. VS Code (альтернатива)

```bash
# Ubuntu/Debian
sudo apt install -y code

# Fedora
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
sudo dnf install -y code

# Arch Linux
yay -S visual-studio-code-bin
```

### 3. Claude Code - AI-помощник для кода

**Зачем нужен?** Claude Code — это специализированный AI-помощник от Anthropic, который помогает писать, анализировать и улучшать код. Он понимает контекст проекта и может работать с большими кодовыми базами.

**Возможности:**

- **Анализ кода:** Понимает сложные проекты и предлагает улучшения
- **Генерация кода:** Создает функции, классы и целые модули
- **Рефакторинг:** Предлагает оптимизацию существующего кода
- **Объяснения:** Детально разбирает, как работает код

**Установка на Linux:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://claude.ai/code

# Или установите как PWA
# В Chrome/Chromium: Меню → Установить как приложение
```

**Ссылки:**

- 🔗 [Claude Code](https://claude.ai/code) | [Anthropic](https://www.anthropic.com/claude)

### 4. Claude Flow - Рабочие процессы с ИИ

**Зачем нужен?** Claude Flow помогает создавать автоматизированные рабочие процессы с использованием ИИ. Это как "конвейер" для повторяющихся задач разработки.

**Возможности:**

- **Автоматизация задач:** Создание скриптов для рутинных операций
- **Рабочие процессы:** Последовательности действий для сложных задач
- **Интеграции:** Связь с другими инструментами разработки
- **Шаблоны:** Готовые решения для типичных сценариев

**Использование в Linux:**

- Работает через браузер
- Интегрируется с локальными инструментами
- Поддерживает bash скрипты и автоматизацию

**Установка на Linux:**

```bash
# Через npm
npm install -g claude-flow

# Или клонируйте репозиторий
git clone https://github.com/ruvnet/claude-flow.git
cd claude-flow && npm install
```

**Ссылки:**

- 🔗 [Claude Flow](https://claude.ai/flow) | [Anthropic](https://www.anthropic.com/claude)
- 🔗 [GitHub](https://github.com/ruvnet/claude-flow)

### 5. Claude Router - Управление проектами

**Зачем нужен?** Claude Router помогает организовывать и управлять проектами разработки. Это как "диспетчерская" для ваших идей и задач.

**Возможности:**

- **Управление задачами:** Создание и отслеживание задач разработки
- **Планирование проектов:** Структурирование больших проектов
- **Приоритизация:** Определение важности различных функций
- **Отслеживание прогресса:** Мониторинг выполнения задач

**Использование в Linux:**

- Веб-интерфейс через браузер
- Экспорт в markdown для Obsidian
- Интеграция с Git и системами контроля версий

**Ссылки:**

- 🔗 [Claude Router](https://claude.ai/router) | [Anthropic](https://www.anthropic.com/claude)

### 6. Cristal - Анализ и визуализация кода

**Зачем нужен?** Cristal помогает анализировать и визуализировать структуру кода. Это как "рентген" для ваших проектов — показывает связи и зависимости.

**Возможности:**

- **Анализ структуры:** Понимание архитектуры проекта
- **Визуализация зависимостей:** Графическое представление связей
- **Поиск проблем:** Обнаружение потенциальных ошибок
- **Оптимизация:** Предложения по улучшению структуры

**Установка на Linux:**

```bash
# Через npm (если есть Node.js)
npm install -g cristal-cli

# Или используйте веб-версию
# https://cristal.app/
```

**Ссылки:**

- 🔗 [Cristal](https://cristal.app/) | [GitHub](https://github.com/cristal/cristal)

### 7. Cloud Code - Профессиональная облачная IDE

**Зачем нужен?** Cloud Code — это облачная среда разработки от Anthropic с интегрированным Claude AI для профессиональной разработки.

**Возможности:**

- **Облачная IDE:** Полнофункциональный редактор в браузере
- **Интеграция Claude:** Прямой доступ к AI для кода
- **Командная разработка:** Совместная работа в реальном времени
- **Предварительный просмотр:** Мгновенное тестирование

**Установка на Linux:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://claude.com/product/claude-code

# Или установите как PWA
# В Chrome/Chromium: Меню → Установить как приложение
```

**Ссылки:**

- 🔗 [Cloud Code](https://claude.com/product/claude-code) | [Anthropic](https://www.anthropic.com/claude)

### 8. OpenRouter - Универсальный AI API

**Зачем нужен?** OpenRouter предоставляет доступ к множеству AI моделей через единый API, включая Claude, GPT и другие.

**Возможности:**

- **Множественные модели:** Доступ к различным AI
- **Управление кредитами:** Контроль расходов
- **Единый API:** Один интерфейс для всех моделей
- **Аналитика:** Отслеживание использования

**Установка на Linux:**

```bash
# Через npm
npm install -g openrouter-cli

# Или используйте веб-версию
# https://openrouter.ai/settings/credits
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

**Установка на Linux:**

```bash
# Через браузер
# Зайдите на https://kilocode.ai/

# Или скачайте AppImage
wget https://kilocode.ai/download/kilocode-linux.AppImage
chmod +x kilocode-linux.AppImage
./kilocode-linux.AppImage
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

**Установка на Linux:**

```bash
# Через браузер (рекомендуется)
# Зайдите на https://stravu.com/blog/crystal

# Или установите как PWA
# В Chrome/Chromium: Меню → Установить как приложение

# Скачайте с GitHub
wget https://github.com/stravu/crystal/releases/latest/download/crystal-linux.AppImage
chmod +x crystal-linux.AppImage
./crystal-linux.AppImage

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
Cursor/VS Code ← основная среда разработки
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
# Ubuntu/Debian
wget -O obsidian.deb "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.4.16/obsidian_1.4.16_amd64.deb"
sudo dpkg -i obsidian.deb
sudo apt install -f

# Fedora
sudo dnf install obsidian

# Arch Linux
yay -S obsidian
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

#### Mermaid CLI для диаграмм

```bash
npm install -g @mermaid-js/mermaid-cli
```

#### Pandoc для конвертации документов

```bash
# Ubuntu/Debian
sudo apt install -y pandoc texlive-latex-base texlive-fonts-recommended

# Fedora
sudo dnf install -y pandoc texlive-scheme-basic

# Arch Linux
sudo pacman -S pandoc texlive-core
```

---

## 🔧 Дополнительные утилиты

### 1. FSearch - Быстрый поиск файлов

```bash
# Ubuntu/Debian
sudo add-apt-repository ppa:christian-boxdoerfer/fsearch-daily
sudo apt update
sudo apt install fsearch-trunk

# Fedora
sudo dnf install fsearch

# Arch Linux
yay -S fsearch-git
```

### 2. Kitty - Современный терминал

```bash
# Ubuntu/Debian
sudo apt install kitty

# Fedora
sudo dnf install kitty

# Arch Linux
sudo pacman -S kitty
```

### 3. HTTPie - Удобный HTTP клиент

```bash
# Ubuntu/Debian
sudo apt install httpie

# Fedora
sudo dnf install httpie

# Arch Linux
sudo pacman -S httpie
```

### 4. jq - Обработка JSON

```bash
# Ubuntu/Debian/Fedora
sudo apt install jq  # или dnf install jq

# Arch Linux
sudo pacman -S jq
```

### 5. bat - Улучшенный cat с подсветкой

```bash
# Ubuntu/Debian
sudo apt install bat

# Fedora
sudo dnf install bat

# Arch Linux
sudo pacman -S bat

# Настройка алиаса
echo 'alias cat="bat --style=numbers,changes"' >> ~/.bashrc
```

### 6. exa - Современная замена ls

```bash
# Ubuntu/Debian
sudo apt install exa

# Fedora
sudo dnf install exa

# Arch Linux
sudo pacman -S exa

# Настройка алиасов
cat >> ~/.bashrc << 'EOF'
alias ls="exa --icons --group-directories-first"
alias ll="exa -l --icons --group-directories-first"
alias la="exa -la --icons --group-directories-first"
alias lt="exa -T --icons --group-directories-first"
EOF
```

### 7. fzf - Fuzzy поиск

```bash
# Ubuntu/Debian
sudo apt install fzf

# Fedora
sudo dnf install fzf

# Arch Linux
sudo pacman -S fzf

# Установка полезных интеграций
echo 'source /usr/share/doc/fzf/examples/key-bindings.bash' >> ~/.bashrc
echo 'source /usr/share/doc/fzf/examples/completion.bash' >> ~/.bashrc
```

### 8. Docker

```bash
# Ubuntu/Debian
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Fedora
sudo dnf install -y docker docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Arch Linux
sudo pacman -S docker docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 9. DBeaver - GUI для баз данных

```bash
# Ubuntu/Debian
sudo snap install dbeaver-ce

# Fedora
sudo dnf install dbeaver

# Arch Linux
yay -S dbeaver
```

---

## ✅ Проверка установки

### Скрипт проверки окружения для Linux

```bash
#!/bin/bash
# check-linux-vibecoding.sh

echo "🔍 Проверка Linux VibeCoding окружения..."
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

check_package() {
    if dpkg -l "$1" &> /dev/null 2>&1 || rpm -q "$1" &> /dev/null 2>&1; then
        echo -e "${GREEN}✅ $1 установлен${NC}"
    else
        echo -e "${RED}❌ $1 не установлен${NC}"
    fi
    echo ""
}

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
if [ -f "/opt/cursor/Cursor-*.AppImage" ]; then
    echo -e "${GREEN}✅ Cursor установлен${NC}"
else
    echo -e "${RED}❌ Cursor не установлен${NC}"
fi

if command -v code &> /dev/null; then
    echo -e "${GREEN}✅ VS Code установлен${NC}"
else
    echo -e "${YELLOW}⚠️ VS Code не установлен (опционально)${NC}"
fi

echo "📝 Документация:"
if command -v obsidian &> /dev/null; then
    echo -e "${GREEN}✅ Obsidian установлен${NC}"
else
    echo -e "${YELLOW}⚠️ Obsidian не установлен (опционально)${NC}"
fi

echo "🗄️ Базы данных:"
if command -v dbeaver &> /dev/null; then
    echo -e "${GREEN}✅ DBeaver установлен${NC}"
else
    echo -e "${YELLOW}⚠️ DBeaver не установлен (опционально)${NC}"
fi

echo "========================================"
echo "Проверка завершена!"
echo ""
echo "💡 Советы:"
echo "- Перезагрузите систему для применения изменений Docker"
echo "- Используйте 'newgrp docker' для работы с Docker без перезагрузки"
echo "- Настройте .bashrc для персональных алиасов"
```

Запустите проверку:

```bash
chmod +x check-linux-vibecoding.sh
./check-linux-vibecoding.sh
```

---

## 🔧 Troubleshooting - Решение проблем

### Распространенные проблемы и решения:

#### 1. **Permission denied (Отказано в доступе)**

```
Проблема: sudo: command not found
Решение: Вы не в sudoers. Обратитесь к администратору системы
ИЛИ используйте: su - (если есть доступ как root)
```

#### 2. **Пакет не найден**

```
Проблема: E: Unable to locate package nodejs
Решение:
1. Обновите индекс пакетов: sudo apt update
2. Проверьте название: apt search nodejs
3. Добавьте репозиторий: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
```

#### 3. **Docker не работает**

```
Проблема: Cannot connect to the Docker daemon
Решение:
1. Запустите Docker: sudo systemctl start docker
2. Добавьте в группу: sudo usermod -aG docker $USER
3. Перезайдите в систему или выполните: newgrp docker
```

#### 4. **Cursor не запускается**

```
Проблема: ./Cursor-*.AppImage: cannot execute binary file
Решение:
1. Сделайте исполняемым: chmod +x Cursor-*.AppImage
2. Установите FUSE: sudo apt install fuse
3. Запустите как root: sudo ./Cursor-*.AppImage
```

#### 5. **Node.js не устанавливается**

```
Проблема: nvm: command not found
Решение:
1. Проверьте установку: ls -la ~/.nvm/
2. Перезагрузите shell: source ~/.bashrc
3. Переустановите nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

#### 6. **Git не подключается к GitHub**

```
Проблема: Permission denied (publickey)
Решение:
1. Проверьте SSH ключ: ls ~/.ssh/
2. Создайте ключ: ssh-keygen -t ed25519 -C "email@example.com"
3. Добавьте на GitHub: cat ~/.ssh/id_ed25519.pub
4. Проверьте: ssh -T git@github.com
```

### Диагностические команды:

```bash
# Проверить систему
uname -a && lsb_release -a

# Проверить пакеты
dpkg -l | grep -i node  # Debian/Ubuntu
rpm -qa | grep -i node  # Fedora/RHEL

# Проверить процессы
ps aux | grep -i docker
ss -tlnp | grep :22  # SSH

# Проверить диск
df -h && free -h

# Проверить сеть
ping -c 3 google.com
curl -I https://nodejs.org
```

### Если ничего не помогает:

1. **Обновите систему:** sudo apt update && sudo apt upgrade
2. **Проверьте логи:** journalctl -xe (для systemd)
3. **Перезагрузите систему:** sudo reboot
4. **Обратитесь к сообществу:** Ubuntu Forums, Stack Overflow

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

- [x] Система Linux обновлена
- [x] Git установлен и настроен
- [x] Node.js (LTS версия) установлен
- [x] pnpm настроен
- [x] Cursor IDE установлен и настроен
- [x] Obsidian установлен для документации

### Рекомендуемые компоненты:

- [ ] Bun установлен как альтернатива Node.js
- [x] Docker для контейнеризации
- [ ] VS Code как альтернативная IDE
- [ ] DBeaver для работы с БД
- [ ] HTTPie для тестирования API
- [ ] Полезные CLI утилиты (bat, exa, fzf, jq)

### Настройки и конфигурации:

- [x] SSH ключи для GitHub созданы
- [x] .bashrc настроен с алиасами
- [ ] Cursor AI extensions установлены
- [ ] .cursorrules создан для проектов
- [x] Obsidian vault для VibeCoding создан
- [x] Шаблоны документации подготовлены

---

## 📚 Полезные ресурсы для Linux

### Официальная документация:

- [Linux Command Line Basics](https://ubuntu.com/tutorials/command-line-for-beginners)
- [Bash Scripting Guide](https://tldp.org/LDP/Bash-Beginners-Guide/html/)
- [Systemd Documentation](https://systemd.io/)
- [Docker Documentation](https://docs.docker.com/)

### VibeCoding сообщество:

- [Linux VibeCoding Guide](https://github.com/vibecoding/linux-guide)
- [Arch Linux Wiki](https://wiki.archlinux.org/)
- [Ubuntu Documentation](https://help.ubuntu.com/)
- [Fedora Documentation](https://docs.fedoraproject.org/)

### Обучающие материалы:

- [The Linux Command Line](https://linuxcommand.org/tlcl.php)
- [Advanced Bash Scripting](https://tldp.org/LDP/abs/html/)
- [Linux System Administration](https://www.admin.com/)
- [Docker Mastery](https://docs.docker.com/get-started/)

---

## 🎯 Проверь себя: Linux окружение

Эти вопросы помогут проверить понимание Linux специфики установки и настройки окружения.

**Вопрос 1:** Какой пакетный менеджер используется в Ubuntu/Debian для установки программного обеспечения?

- A) dnf
- B) apt
- C) pacman
- D) zypper

<details>
<summary>✅ Правильный ответ</summary>

**B) apt**

**Объяснение:** APT (Advanced Package Tool) — стандартный пакетный менеджер для дистрибутивов на основе Debian, включая Ubuntu. Другие менеджеры используются в разных семействах: dnf в Fedora/RHEL, pacman в Arch Linux, zypper в openSUSE.

**Linux совет:** Всегда выполняйте `sudo apt update` перед установкой пакетов, чтобы обновить индекс доступных версий. Это как обновить каталог магазина перед покупкой.

**Для других дистрибутивов:**

- Fedora/RHEL: `sudo dnf update && sudo dnf install пакет`
- Arch Linux: `sudo pacman -Syu пакет`
- openSUSE: `sudo zypper refresh && sudo zypper install пакет`
</details>

---

**Вопрос 2:** Зачем нужна команда `sudo` при установке программного обеспечения в Linux?

- A) Для ускорения установки
- B) Для получения прав суперпользователя (root)
- C) Для автоматического принятия лицензионных соглашений
- D) Для скачивания пакетов из интернета

<details>
<summary>✅ Правильный ответ</summary>

**B) Для получения прав суперпользователя (root)**

**Объяснение:** `sudo` (SuperUser DO) временно предоставляет права администратора для выполнения команд, требующих системных привилегий. Установка программ затрагивает системные директории (например, `/usr/bin`, `/etc`), к которым обычный пользователь не имеет доступа по соображениям безопасности.

**Linux совет:** Никогда не запускайте `sudo` для команд, если не понимаете, что они делают. Это как дать кому-то ключи от вашей квартиры — доверяйте только проверенным командам.

**Философия безопасности Linux:**

- Обычный пользователь → безопасная песочница
- sudo → временный доступ для конкретной задачи
- root (su) → полный контроль (используется редко)
</details>

---

**Вопрос 3:** Какой конфигурационный файл используется для настройки bash shell и добавления алиасов?

- A) ~/.bash_profile
- B) ~/.bashrc
- C) ~/.bash_history
- D) /etc/bash.bashrc

<details>
<summary>✅ Правильный ответ</summary>

**B) ~/.bashrc**

**Объяснение:** `~/.bashrc` — это конфигурационный файл bash shell, который загружается при открытии каждого нового терминала. Здесь настраиваются алиасы, переменные окружения, функции и внешний вид командной строки. Символ `~` означает домашнюю директорию текущего пользователя.

**Linux совет:** Создавайте резервную копию `.bashrc` перед изменениями: `cp ~/.bashrc ~/.bashrc.backup`. Если что-то пойдет не так, всегда можно восстановить оригинал.

**Различия конфигурационных файлов:**

- `~/.bashrc` → загружается в интерактивных non-login shell (новые вкладки терминала)
- `~/.bash_profile` → загружается при login shell (первый вход в систему)
- `/etc/bash.bashrc` → системный файл для всех пользователей (требует sudo)
- `~/.bash_history` → история команд (НЕ для конфигурации)

**Для других shell:**

- zsh: `~/.zshrc`
- fish: `~/.config/fish/config.fish`
</details>

---

**Вопрос 4:** Где в Linux файловой системе обычно устанавливаются пользовательские программы, собранные из исходников?

- A) /bin
- B) /usr/bin
- C) /usr/local/bin
- D) /opt

<details>
<summary>✅ Правильный ответ</summary>

**C) /usr/local/bin** (основной) или **D) /opt** (альтернативный)

**Объяснение:** Согласно Filesystem Hierarchy Standard (FHS), программы, собранные вручную из исходников, должны размещаться в `/usr/local/` для избежания конфликтов с системными пакетами. `/opt` используется для самодостаточных коммерческих приложений.

**Linux совет:** При сборке из исходников всегда используйте `./configure --prefix=/usr/local` чтобы не засорять системные директории. Это облегчает управление и удаление.

**Иерархия Linux файловой системы:**

```
/bin         → базовые системные команды (ls, cat, cp)
/usr/bin     → пакеты из репозиториев (устанавливаются apt/dnf/pacman)
/usr/local/bin → программы, собранные вручную (make install)
/opt         → самостоятельные коммерческие приложения
~/.local/bin → пользовательские скрипты (без sudo)
```

**Правило:**

- Системные пакеты → `/usr/bin` (управляются пакетным менеджером)
- Сборка из исходников → `/usr/local/bin` (управляется вручную)
- Только для пользователя → `~/.local/bin` (в $PATH)
</details>

---

**Вопрос 5:** Что делает команда `chmod +x script.sh` в Linux?

- A) Удаляет файл script.sh
- B) Делает script.sh исполняемым (executable)
- C) Открывает script.sh в текстовом редакторе
- D) Копирует script.sh в другую директорию

<details>
<summary>✅ Правильный ответ</summary>

**B) Делает script.sh исполняемым (executable)**

**Объяснение:** `chmod +x` добавляет разрешение на выполнение (execute permission) файлу. В Linux файлы по умолчанию не исполняемые — это мера безопасности. Чтобы запустить скрипт, нужно явно разрешить его выполнение.

**Linux совет:** После `chmod +x` скрипт можно запустить как `./script.sh`. Точка и слэш `./` означают "текущая директория", что важно для безопасности.

**Права доступа в Linux (rwx):**

```
r = read    (чтение)    = 4
w = write   (запись)    = 2
x = execute (выполнение) = 1
```

**Примеры chmod:**

```bash
chmod +x file.sh          # Добавить execute всем
chmod 755 file.sh         # rwxr-xr-x (владелец: все, остальные: read+execute)
chmod 644 file.txt        # rw-r--r-- (владелец: read+write, остальные: read)
chmod u+x,go-w file.sh    # Добавить execute владельцу, убрать write у группы/других
```

**Проверка прав:**

```bash
ls -l file.sh
# -rwxr-xr-x  владелец группа остальные
```

</details>

---

**Вопрос 6:** В чем разница между установкой пакета через системный пакетный менеджер и установкой в пользовательское пространство (например, через npm/cargo)?

- A) Системные пакеты быстрее работают
- B) Системные пакеты требуют sudo, пользовательские — нет
- C) Пользовательские пакеты занимают меньше места
- D) Разницы нет, это одно и то же

<details>
<summary>✅ Правильный ответ</summary>

**B) Системные пакеты требуют sudo, пользовательские — нет**

**Объяснение:** Системные пакеты устанавливаются в защищенные директории (`/usr/bin`) и доступны всем пользователям системы, требуя административных прав. Пользовательские пакеты (npm, cargo, pip) устанавливаются в домашнюю директорию (`~/.local`, `~/.cargo`, `~/.npm`) и не требуют sudo.

**Linux совет:** Предпочитайте системные пакеты для базовых инструментов (Git, Node.js) и пользовательские для проектных зависимостей (npm packages). Это следует принципу минимальных привилегий.

**Сравнение подходов:**

| Аспект       | Системные пакеты           | Пользовательские пакеты           |
| ------------ | -------------------------- | --------------------------------- |
| Установка    | `sudo apt install git`     | `npm install -g пакет`            |
| Расположение | `/usr/bin`, `/usr/lib`     | `~/.npm`, `~/.cargo/bin`          |
| Права        | Требуется sudo             | Без sudo                          |
| Доступность  | Всем пользователям         | Только текущему пользователю      |
| Обновления   | Системный менеджер         | Специфичный менеджер (npm, cargo) |
| Версии       | Стабильные (иногда старые) | Последние версии                  |

**Примеры:**

```bash
# Системная установка (требует sudo)
sudo apt install nodejs    # Node.js для всей системы

# Пользовательская установка (без sudo)
npm install -g typescript  # TypeScript только для вас
cargo install ripgrep      # Rust утилита в ~/.cargo/bin

# Hybrid подход (рекомендуется)
sudo apt install nodejs    # Базовый Node.js
npm install -g pnpm        # Пакетный менеджер в пользовательское пространство
```

**Unix философия:** Используйте системные пакеты для инфраструктуры, пользовательские для проектов.

</details>

---

**Вопрос 7:** Что означает переменная окружения `$PATH` в Linux?

- A) Путь к домашней директории пользователя
- B) Список директорий, где система ищет исполняемые файлы
- C) Путь к текущей рабочей директории
- D) Список всех файлов в системе

<details>
<summary>✅ Правильный ответ</summary>

**B) Список директорий, где система ищет исполняемые файлы**

**Объяснение:** `$PATH` — это переменная окружения, содержащая список директорий (разделенных двоеточием `:`), где shell ищет команды при их вводе. Когда вы вводите `git`, система проверяет каждую директорию в `$PATH` по порядку, пока не найдет исполняемый файл `git`.

**Linux совет:** Добавляйте свои скрипты в `~/.local/bin` и включите эту директорию в `$PATH` в файле `~/.bashrc`. Это позволит запускать их из любой директории без указания полного пути.

**Просмотр и настройка PATH:**

```bash
# Посмотреть текущий PATH
echo $PATH
# Вывод: /usr/local/bin:/usr/bin:/bin:/usr/games:~/.local/bin

# Красиво отобразить каждую директорию
echo $PATH | tr ':' '\n'

# Проверить, где находится команда
which git
# Вывод: /usr/bin/git

# Добавить директорию в PATH (временно)
export PATH="$HOME/.local/bin:$PATH"

# Добавить в PATH постоянно (в ~/.bashrc)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc  # Перезагрузить конфигурацию
```

**Типичный PATH:**

```
~/.local/bin        → пользовательские скрипты
/usr/local/bin      → программы из исходников
/usr/bin            → системные пакеты
/bin                → базовые команды (ls, cat, etc.)
/usr/games          → игры (опционально)
```

**Важно:** Порядок имеет значение! Если одинаковые команды в разных директориях, выполнится первая найденная.

</details>

---

## 📝 Задания для Linux

### Задание 1: Базовое (20-30 мин) — "Установка через пакетный менеджер"

**Цель:** Освоить установку базового окружения разработчика через системный пакетный менеджер.

**Шаги:**

1. **Определите ваш дистрибутив:**

```bash
# Узнать дистрибутив
cat /etc/os-release
# или
lsb_release -a
```

2. **Обновите систему:**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Fedora
sudo dnf update -y

# Arch Linux
sudo pacman -Syu

# openSUSE
sudo zypper update
```

3. **Установите Git:**

```bash
# Ubuntu/Debian
sudo apt install -y git

# Fedora
sudo dnf install -y git

# Arch Linux
sudo pacman -S git

# openSUSE
sudo zypper install git
```

4. **Установите Node.js и npm:**

```bash
# Ubuntu/Debian (через NodeSource для актуальной версии)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Fedora
sudo dnf install -y nodejs npm

# Arch Linux
sudo pacman -S nodejs npm

# openSUSE
sudo zypper install nodejs npm
```

5. **Установите основные инструменты разработки:**

```bash
# Ubuntu/Debian
sudo apt install -y build-essential curl wget

# Fedora
sudo dnf install -y @development-tools curl wget

# Arch Linux
sudo pacman -S base-devel curl wget

# openSUSE
sudo zypper install -t pattern devel_basis
sudo zypper install curl wget
```

6. **Настройте Git:**

```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
```

**Критерии успеха:**

- ✅ Система обновлена до последней версии
- ✅ Git установлен и настроен с именем/email
- ✅ Node.js версии 18+ установлен
- ✅ npm работает и доступен
- ✅ Базовые инструменты сборки установлены (gcc, make, etc.)

**Команды проверки:**

```bash
# Проверка установки
echo "=== Проверка окружения ==="
echo "Дистрибутив:"
cat /etc/os-release | grep PRETTY_NAME

echo -e "\nGit версия:"
git --version

echo -e "\nNode.js версия:"
node --version

echo -e "\nnpm версия:"
npm --version

echo -e "\nGCC версия:"
gcc --version | head -n1

echo -e "\nГотово! ✅"
```

**Ожидаемый результат:**

```
=== Проверка окружения ===
Дистрибутив:
PRETTY_NAME="Ubuntu 22.04 LTS"

Git версия:
git version 2.40.0

Node.js версия:
v20.11.0

npm версия:
10.2.4

GCC версия:
gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0

Готово! ✅
```

---

### Задание 2: Продвинутое (35-50 мин) — "Настройка пользовательской среды"

**Цель:** Создать персонализированную среду разработки с настройками shell, алиасами и инструментами.

**Шаги:**

1. **Выберите и настройте shell:**

```bash
# Проверить текущий shell
echo $SHELL

# Установить zsh (опционально, если хотите продвинутый shell)
# Ubuntu/Debian
sudo apt install -y zsh

# Fedora
sudo dnf install -y zsh

# Arch Linux
sudo pacman -S zsh

# Сделать zsh шеллом по умолчанию (опционально)
chsh -s $(which zsh)
# ВАЖНО: Перезайдите в систему для применения изменений!
```

2. **Настройте алиасы в ~/.bashrc (или ~/.zshrc):**

```bash
# Создать резервную копию
cp ~/.bashrc ~/.bashrc.backup

# Добавить полезные алиасы
cat >> ~/.bashrc << 'EOF'

# === VibeCoding Aliases ===
# Навигация
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# Безопасность
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Улучшенные команды (если установлены bat, exa)
alias cat='bat --style=numbers,changes 2>/dev/null || cat'
alias ls='exa --icons --group-directories-first 2>/dev/null || ls --color=auto'
alias ll='exa -l --icons --group-directories-first 2>/dev/null || ls -lh'
alias la='exa -la --icons --group-directories-first 2>/dev/null || ls -lah'

# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph --decorate'

# Разработка
alias nrd='npm run dev'
alias nrb='npm run build'
alias nrt='npm run test'

# Системные
alias update='sudo apt update && sudo apt upgrade -y'  # для Ubuntu/Debian
alias ports='netstat -tulanp'
alias myip='curl ifconfig.me'

# === End VibeCoding Aliases ===
EOF

# Перезагрузить конфигурацию
source ~/.bashrc
```

3. **Настройте Git конфигурацию:**

```bash
# Базовая информация
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"

# Редактор по умолчанию
git config --global core.editor "vim"  # или nano, если vim пугает

# Цветной вывод
git config --global color.ui auto

# Полезные алиасы Git
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --decorate --all'

# Проверить конфигурацию
git config --list
```

4. **Установите и настройте tmux (терминальный мультиплексор):**

```bash
# Установка tmux
# Ubuntu/Debian
sudo apt install -y tmux

# Fedora
sudo dnf install -y tmux

# Arch Linux
sudo pacman -S tmux

# Создать базовую конфигурацию
cat > ~/.tmux.conf << 'EOF'
# === Базовая конфигурация tmux ===

# Изменить prefix с Ctrl+b на Ctrl+a (удобнее)
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# Разделение окон
bind | split-window -h
bind - split-window -v

# Быстрая перезагрузка конфигурации
bind r source-file ~/.tmux.conf \; display "Конфигурация перезагружена!"

# Нумерация окон с 1 (вместо 0)
set -g base-index 1
setw -g pane-base-index 1

# Увеличить историю
set -g history-limit 10000

# Включить мышь
set -g mouse on

# Статус бар
set -g status-style 'bg=colour234 fg=colour137'
set -g status-left ''
set -g status-right '#[fg=colour233,bg=colour241] %d/%m #[fg=colour233,bg=colour245] %H:%M:%S '
EOF

# Протестировать tmux
tmux new -s test
# Внутри tmux:
# Ctrl+a, затем | = вертикальное разделение
# Ctrl+a, затем - = горизонтальное разделение
# Ctrl+a, затем d = отсоединиться (detach)
# tmux attach -t test = присоединиться обратно
```

5. **Создайте SSH ключи:**

```bash
# Генерация SSH ключа
ssh-keygen -t ed25519 -C "your.email@example.com"
# Нажмите Enter для стандартного расположения
# Придумайте пароль (или Enter для пустого)

# Запуск SSH агента
eval "$(ssh-agent -s)"

# Добавление ключа
ssh-add ~/.ssh/id_ed25519

# Просмотр публичного ключа
cat ~/.ssh/id_ed25519.pub
# Скопируйте этот ключ и добавьте на GitHub:
# github.com → Settings → SSH and GPG keys → New SSH key

# Проверка соединения с GitHub
ssh -T git@github.com
```

**Критерии успеха:**

- ✅ Shell настроен с кастомными алиасами
- ✅ Алиасы для навигации и Git работают
- ✅ Git правильно настроен (имя, email, editor)
- ✅ tmux установлен и настроен
- ✅ SSH ключ сгенерирован и добавлен на GitHub
- ✅ `ssh -T git@github.com` успешно аутентифицирует

**Команды проверки:**

```bash
echo "=== Проверка пользовательской среды ==="

echo "Текущий shell:"
echo $SHELL

echo -e "\nАлиасы настроены:"
alias | grep -E "ls|gs|.." | head -n 5

echo -e "\nGit конфигурация:"
git config --list | grep -E "user.name|user.email|alias"

echo -e "\ntmux версия:"
tmux -V

echo -e "\nSSH ключи:"
ls -l ~/.ssh/id_*

echo -e "\nПроверка GitHub SSH:"
ssh -T git@github.com 2>&1 | head -n 1
```

---

### Задание 3: Проектное (50-70 мин) — "Продвинутая Linux среда разработчика"

**Цель:** Создать полноценную профессиональную среду разработки с инструментами сборки, dotfiles управлением и оптимизацией.

**Шаги:**

1. **Установите инструменты разработки (build-essential):**

```bash
# Ubuntu/Debian
sudo apt install -y \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    clang \
    llvm

# Fedora
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y \
    cmake \
    pkgconfig \
    openssl-devel \
    clang \
    llvm

# Arch Linux
sudo pacman -S \
    base-devel \
    cmake \
    pkgconfig \
    openssl \
    clang \
    llvm

# Проверка
gcc --version
clang --version
cmake --version
```

2. **Соберите программу из исходников (практика):**

```bash
# Пример: установим ripgrep (быстрый grep) из исходников
# Это научит вас процессу ./configure, make, make install

# Установим Rust (ripgrep написан на Rust)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Клонируем и собираем ripgrep
cd /tmp
git clone https://github.com/BurntSushi/ripgrep
cd ripgrep
cargo build --release

# Устанавливаем в пользовательское пространство
mkdir -p ~/.local/bin
cp target/release/rg ~/.local/bin/

# Добавляем в PATH (если еще не добавлено)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Проверка
rg --version
```

3. **Настройте переменные окружения:**

```bash
# Создайте файл для переменных окружения
cat >> ~/.bashrc << 'EOF'

# === Переменные окружения для разработки ===

# Увеличить историю команд
export HISTSIZE=10000
export HISTFILESIZE=20000

# Игнорировать дубликаты в истории
export HISTCONTROL=ignoredups:erasedups

# Editor по умолчанию
export EDITOR=vim
export VISUAL=vim

# Node.js настройки
export NODE_ENV=development

# Добавить пользовательские бинарники в PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Rust окружение
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# === Конец переменных окружения ===
EOF

# Перезагрузить
source ~/.bashrc
```

4. **Создайте systemd user service (опционально, для продвинутых):**

```bash
# Пример: автоматический запуск SSH агента при логине
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/ssh-agent.service << 'EOF'
[Unit]
Description=SSH Agent
Documentation=man:ssh-agent(1)

[Service]
Type=simple
Environment=SSH_AUTH_SOCK=%t/ssh-agent.socket
ExecStart=/usr/bin/ssh-agent -D -a $SSH_AUTH_SOCK

[Install]
WantedBy=default.target
EOF

# Добавить в ~/.bashrc
cat >> ~/.bashrc << 'EOF'

# SSH Agent автозапуск
export SSH_AUTH_SOCK="${XDG_RUNTIME_DIR}/ssh-agent.socket"
EOF

# Включить и запустить службу
systemctl --user enable ssh-agent.service
systemctl --user start ssh-agent.service

# Проверка
systemctl --user status ssh-agent.service
```

5. **Создайте dotfiles репозиторий:**

```bash
# Создайте репозиторий для ваших конфигурационных файлов
cd ~
mkdir -p ~/dotfiles
cd ~/dotfiles

# Инициализация Git
git init
echo "# My Linux Dotfiles" > README.md

# Скопируйте важные конфиги
cp ~/.bashrc .
cp ~/.tmux.conf . 2>/dev/null
cp ~/.gitconfig .
cp ~/.vimrc . 2>/dev/null

# Создайте установочный скрипт
cat > install.sh << 'EOF'
#!/bin/bash
# Установка dotfiles

DOTFILES_DIR="$HOME/dotfiles"

echo "Устанавливаем dotfiles из $DOTFILES_DIR..."

# Создать резервные копии
for file in .bashrc .tmux.conf .gitconfig .vimrc; do
    if [ -f "$HOME/$file" ]; then
        cp "$HOME/$file" "$HOME/${file}.backup.$(date +%Y%m%d)"
        echo "Создана резервная копия: ${file}.backup"
    fi
done

# Создать симлинки
ln -sf "$DOTFILES_DIR/.bashrc" "$HOME/.bashrc"
ln -sf "$DOTFILES_DIR/.tmux.conf" "$HOME/.tmux.conf" 2>/dev/null
ln -sf "$DOTFILES_DIR/.gitconfig" "$HOME/.gitconfig"
ln -sf "$DOTFILES_DIR/.vimrc" "$HOME/.vimrc" 2>/dev/null

echo "✅ Dotfiles установлены! Перезагрузите shell: source ~/.bashrc"
EOF

chmod +x install.sh

# Коммит
git add .
git commit -m "Initial dotfiles commit"

# ОПЦИОНАЛЬНО: Загрузите на GitHub
# Создайте репозиторий на github.com (например, username/dotfiles)
# git remote add origin git@github.com:username/dotfiles.git
# git push -u origin main

echo "Dotfiles репозиторий создан в ~/dotfiles"
```

6. **Установите продвинутые CLI инструменты:**

```bash
# bat (cat с подсветкой синтаксиса)
# Ubuntu/Debian
sudo apt install -y bat

# Arch Linux
sudo pacman -S bat

# exa (современный ls)
# Ubuntu/Debian
sudo apt install -y exa

# Arch Linux
sudo pacman -S exa

# fzf (fuzzy finder)
# Ubuntu/Debian
sudo apt install -y fzf

# Arch Linux
sudo pacman -S fzf

# fd (быстрый find)
# Ubuntu/Debian
sudo apt install -y fd-find

# Arch Linux
sudo pacman -S fd

# Настроить алиасы (если еще не настроены)
cat >> ~/.bashrc << 'EOF'

# Современные CLI инструменты
alias cat='bat --style=numbers,changes 2>/dev/null || cat'
alias find='fd 2>/dev/null || find'
EOF

source ~/.bashrc
```

**Критерии успеха:**

- ✅ Build tools установлены (gcc, make, cmake)
- ✅ Успешно собрана программа из исходников (ripgrep)
- ✅ Переменные окружения настроены в ~/.bashrc
- ✅ PATH включает ~/.local/bin и ~/.cargo/bin
- ✅ Dotfiles репозиторий создан с резервными копиями
- ✅ Dotfiles под контролем Git
- ✅ Современные CLI инструменты установлены

**Команды проверки:**

```bash
#!/bin/bash
echo "=== Проверка продвинутой среды разработчика ==="

echo "Build tools:"
gcc --version | head -n1
make --version | head -n1
cmake --version | head -n1

echo -e "\nRust toolchain:"
rustc --version 2>/dev/null || echo "Rust не установлен"
cargo --version 2>/dev/null || echo "Cargo не установлен"

echo -e "\nСобранные из исходников:"
rg --version 2>/dev/null || echo "ripgrep не найден"

echo -e "\nПеременные окружения:"
echo "EDITOR=$EDITOR"
echo "PATH содержит ~/.local/bin: $(echo $PATH | grep -q "$HOME/.local/bin" && echo "✅ Да" || echo "❌ Нет")"
echo "PATH содержит ~/.cargo/bin: $(echo $PATH | grep -q "$HOME/.cargo/bin" && echo "✅ Да" || echo "❌ Нет")"

echo -e "\nDotfiles репозиторий:"
[ -d ~/dotfiles/.git ] && echo "✅ Dotfiles под Git" || echo "❌ Dotfiles не в Git"
[ -f ~/dotfiles/install.sh ] && echo "✅ install.sh существует" || echo "❌ install.sh отсутствует"

echo -e "\nСовременные CLI инструменты:"
bat --version 2>/dev/null | head -n1 || echo "bat не установлен"
exa --version 2>/dev/null || echo "exa не установлен"
fzf --version 2>/dev/null || echo "fzf не установлен"
fd --version 2>/dev/null || echo "fd не установлен"

echo -e "\n✅ Проверка завершена!"
```

**Бонусные задания (для энтузиастов):**

1. **Настройте zsh с Oh My Zsh:**

```bash
# Установка Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Установка плагинов
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Активировать в ~/.zshrc
# plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

2. **Настройте Neovim как IDE:**

```bash
# Установка Neovim
# Ubuntu/Debian
sudo apt install -y neovim

# Arch Linux
sudo pacman -S neovim

# Установка vim-plug
sh -c 'curl -fLo "${XDG_DATA_HOME:-$HOME/.local/share}"/nvim/site/autoload/plug.vim --create-dirs \
       https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim'

# Базовая конфигурация
mkdir -p ~/.config/nvim
cat > ~/.config/nvim/init.vim << 'EOF'
" Базовая конфигурация Neovim
set number
set relativenumber
set expandtab
set tabstop=2
set shiftwidth=2
syntax on
EOF
```

---

## ➡️ Что дальше?

Отличная работа! Ваше Linux окружение настроено. Продолжайте обучение:

### Быстрый путь:

📄 **06-ONE-CLICK-SETUP.md** → Автоматизированная установка одной командой

### Погружение в философию:

🧘 **07-МИФЫ-О-VIBECODING.md** → Развенчание заблуждений о VibeCoding

### Linux специфика:

🐧 **Изучите Linux философию** — принципы Unix, KISS, DRY
📚 **Освойте командную строку** — bash scripting, pipes, redirects
🔧 **Погрузитесь в systemd** — управление службами и таймерами

### Сообщество:

- 💬 [Ubuntu Forums](https://ubuntuforums.org/)
- 🐧 [Arch Linux Wiki](https://wiki.archlinux.org/) — лучший источник знаний
- 📖 [Linux From Scratch](https://www.linuxfromscratch.org/) — для понимания системы изнутри
- 💼 [r/linux](https://reddit.com/r/linux) — активное сообщество

---

## 🚀 Следующие шаги

После установки всех инструментов:

1. **Изучите Linux философию** в [LINUX-PHILOSOPHY.md]
2. **Освойте командную строку** в [BASH-MASTERY.md]
3. **Настройте свою среду разработки** в [DEV-ENVIRONMENT.md]
4. **Присоединитесь к Linux сообществу** и начните свой путь VibeCoder'а!

---

> **"В Linux нет ограничений, только возможности"** — Философия open-source

_Добро пожаловать в мир Linux VibeCoding! Ваше окружение готово, теперь время творить свободно! 🐧✨_
