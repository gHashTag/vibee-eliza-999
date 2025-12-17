# 🎯 ONE-CLICK SETUP: Автоматическая установка VibeCoding окружения

> **"Автоматизируй все, что можно автоматизировать"** — DevOps принцип

## 🚀 Установка за одну команду

### macOS/Linux

```bash
# Прямая установка из Gist
curl -fsSL https://gist.githubusercontent.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03/raw/vibecoding-setup.sh | bash
```

### Windows PowerShell

```powershell
# Запустите PowerShell от имени администратора
irm https://gist.githubusercontent.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03/raw/vibecoding-setup.ps1 | iex
```

### Локальная установка (скачать скрипт):

#### macOS/Linux:

```bash
# Скачать скрипт
curl -fsSL https://gist.githubusercontent.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03/raw/vibecoding-setup.sh -o vibecoding-setup.sh

# Сделать исполняемым и запустить
chmod +x vibecoding-setup.sh
./vibecoding-setup.sh
```

#### Windows:

```powershell
# Скачать скрипт
irm https://gist.githubusercontent.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03/raw/vibecoding-setup.ps1 -OutFile vibecoding-setup.ps1

# Запустить
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\vibecoding-setup.ps1
```

## 📜 Исходный код скриптов

Полные скрипты доступны на GitHub Gist:
**🔗 https://gist.github.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03**

Там вы найдете:

- `vibecoding-setup.sh` — для macOS/Linux
- `vibecoding-setup.ps1` — для Windows

### Что устанавливают скрипты:

**📦 Базовые инструменты:**

- Git — система контроля версий
- Node.js (через nvm) — JavaScript runtime
- pnpm — быстрый пакетный менеджер
- Bun — ультрабыстрый JavaScript runtime
- Claude Code CLI — официальный CLI для Claude

**🤖 AI инструменты:**

- Cursor — AI-powered IDE
- Obsidian — база знаний для документации

**🔧 Настройка:**

- Git конфигурация (имя, email)
- SSH ключи для GitHub
- Перезагрузка shell конфигурации

**✨ Всё автоматически!**

## 🔧 Troubleshooting

### Проблема: Homebrew не устанавливается

```bash
# Попробуйте установить вручную
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Проблема: Node.js не устанавливается через nvm

```bash
# Установите через Homebrew
brew install node
```

### Проблема: Cursor не открывается из терминала

```bash
# Добавьте в PATH
sudo ln -s /Applications/Cursor.app/Contents/Resources/app/bin/cursor /usr/local/bin/cursor
```

### Проблема: Расширения не устанавливаются

```bash
# Установите вручную через интерфейс Cursor
# Cmd+Shift+X → Поиск → Установка
```

## 📊 Проверка установки

После завершения установки проверьте компоненты:

```bash
# Проверка базовых инструментов
git --version
node --version
pnpm --version
bun --version
claude --version

# Проверка авторизации Claude
claude auth
```

## 🎯 Проверь себя: Автоматизация установки

**Вопрос 1:** Почему ВАЖНО прочитать скрипт автоматической установки перед его запуском?

- A) Чтобы понять, сколько времени займет установка
- B) Чтобы узнать, что именно будет установлено и какие изменения произойдут в системе
- C) Чтобы проверить грамматические ошибки в комментариях
- D) Это необязательно, скрипты всегда безопасны

<details>
<summary>✅ Правильный ответ</summary>
B) Чтобы узнать, что именно будет установлено и какие изменения произойдут в системе

**Объяснение:** Скрипт установки может вносить значительные изменения в вашу систему: устанавливать программы, изменять конфигурацию, создавать файлы. Понимание того, что делает скрипт, помогает:

- Избежать установки нежелательного ПО
- Предотвратить конфликты с существующими инструментами
- Понять, где искать установленные компоненты
- Обеспечить безопасность системы

**Совет по автоматизации:** Всегда открывайте скрипт в текстовом редакторе перед запуском. Ищите подозрительные команды вроде `rm -rf`, `curl | bash` без проверки источника, или запросы sudo без объяснения.

</details>

---

**Вопрос 2:** Что делает команда `curl -fsSL url | bash`?

- A) Скачивает файл и сохраняет его на диск
- B) Скачивает скрипт и сразу выполняет его без сохранения
- C) Проверяет скрипт на вирусы перед выполнением
- D) Создает резервную копию системы

<details>
<summary>✅ Правильный ответ</summary>
B) Скачивает скрипт и сразу выполняет его без сохранения

**Объяснение:** Эта команда состоит из двух частей:

- `curl -fsSL url` — скачивает содержимое по URL
- `| bash` — передает скачанное содержимое в bash для немедленного выполнения

**Флаги curl:**

- `-f` (fail silently) — не показывать ошибки сервера
- `-s` (silent) — тихий режим
- `-S` (show error) — показывать ошибки
- `-L` (location) — следовать редиректам

**Совет по автоматизации:** Безопаснее использовать двухшаговый подход:

```bash
# Шаг 1: Скачать и просмотреть
curl -fsSL url -o setup.sh
cat setup.sh  # или открыть в редакторе

# Шаг 2: Запустить после проверки
chmod +x setup.sh
./setup.sh
```

</details>

---

**Вопрос 3:** Что означает "идемпотентный скрипт"?

- A) Скрипт, который работает только один раз
- B) Скрипт, который можно запускать многократно с одним и тем же результатом
- C) Скрипт, который автоматически откатывает изменения
- D) Скрипт, который требует пароль администратора

<details>
<summary>✅ Правильный ответ</summary>
B) Скрипт, который можно запускать многократно с одним и тем же результатом

**Объяснение:** Идемпотентность — ключевой принцип автоматизации. Такой скрипт:

- Проверяет, установлен ли уже инструмент, прежде чем устанавливать
- Не дублирует настройки при повторном запуске
- Безопасен для повторного выполнения после ошибки
- Не ломает систему при случайном двойном запуске

**Пример идемпотентного кода:**

```bash
# Плохо (не идемпотентно)
echo "export PATH=$PATH:/new/path" >> ~/.bashrc

# Хорошо (идемпотентно)
if ! grep -q "/new/path" ~/.bashrc; then
  echo "export PATH=$PATH:/new/path" >> ~/.bashrc
fi
```

**Совет по автоматизации:** Всегда делайте скрипты идемпотентными, используя проверки `if` перед каждым действием.

</details>

---

**Вопрос 4:** Как проверить, что автоматическая установка прошла успешно?

- A) Просто подождать, пока скрипт завершится
- B) Проверить версии всех установленных инструментов и их доступность
- C) Перезагрузить компьютер
- D) Запустить скрипт еще раз

<details>
<summary>✅ Правильный ответ</summary>
B) Проверить версии всех установленных инструментов и их доступность

**Объяснение:** Успешное завершение скрипта не гарантирует правильную работу всех компонентов. Необходимо проверить:

**Команды проверки:**

```bash
# Проверка наличия и версий
git --version       # Git установлен?
node --version      # Node.js работает?
pnpm --version      # pnpm доступен?
bun --version       # Bun установлен?
claude --version    # Claude CLI готов?

# Проверка расположения
which git           # Где установлен Git?
which node          # Откуда запускается Node?

# Проверка функциональности
git config --list   # Git настроен?
claude auth         # Claude авторизован?
```

**Что проверять:**

- ✅ Все команды доступны в терминале
- ✅ Версии соответствуют ожидаемым
- ✅ Нет сообщений об ошибках
- ✅ Пути установки корректны

**Совет по автоматизации:** Создайте checklist проверки и сохраните команды в отдельный файл `verify-setup.sh` для быстрой диагностики.

</details>

---

**Вопрос 5:** В каких случаях лучше использовать ручную установку вместо автоматической?

- A) Никогда, автоматизация всегда лучше
- B) Когда у вас уже установлены некоторые инструменты или нужны специфические версии
- C) Только если вы профессиональный разработчик
- D) Только на production серверах

<details>
<summary>✅ Правильный ответ</summary>
B) Когда у вас уже установлены некоторые инструменты или нужны специфические версии

**Объяснение:** Ручная установка предпочтительна когда:

**Сценарии для ручной установки:**

- 🔧 **Частичная установка**: У вас уже есть Git, нужен только Claude
- 🎯 **Специфические версии**: Проекту требуется Node.js 18, а не последняя версия
- ⚙️ **Кастомная конфигурация**: Нестандартные пути установки
- 🔍 **Обучение**: Вы хотите понять каждый шаг процесса
- 🛡️ **Контроль**: Критическая система, где важна каждая деталь
- 🔄 **Конфликты**: Избежание перезаписи существующих настроек

**Сценарии для автоматизации:**

- ⚡ **Чистая система**: Новый компьютер или виртуальная машина
- 🚀 **Стандартная установка**: Нужны все инструменты с дефолтными настройками
- 👥 **Массовая установка**: Настройка окружения для команды
- 🔄 **Повторяемость**: Одинаковое окружение на разных машинах

**Совет по автоматизации:** Начните с ручной установки, чтобы понять процесс. Затем автоматизируйте то, что делаете регулярно.

</details>

---

**Вопрос 6:** Что делать, если автоматическая установка завершилась с ошибкой?

- A) Запустить скрипт снова, возможно, ошибка временная
- B) Прочитать сообщение об ошибке, найти проблемный шаг, установить его вручную
- C) Переустановить операционную систему
- D) Сдаться и вернуться к ручной установке всего

<details>
<summary>✅ Правильный ответ</summary>
B) Прочитать сообщение об ошибке, найти проблемный шаг, установить его вручную

**Объяснение:** Методичный подход к отладке:

**Шаги диагностики:**

1. **Читаем ошибку**

```bash
# Пример ошибки
Error: Failed to install Node.js via nvm
Command 'nvm install node' returned exit code 1
```

2. **Определяем проблемный компонент**

- Какой инструмент не установился?
- На каком шаге произошла ошибка?
- Есть ли зависимости, которых не хватает?

3. **Проверяем состояние**

```bash
# Что уже установилось успешно?
git --version        # ✅ Работает
nvm --version        # ❌ Не найден
```

4. **Устанавливаем проблемный компонент вручную**

```bash
# Вместо nvm используем Homebrew
brew install node
```

5. **Продолжаем с рабочего места**

```bash
# Комментируем в скрипте уже установленное
# install_git()  # Уже установлен
# install_node() # Установлен вручную
install_pnpm()   # Продолжаем отсюда
```

**Совет по автоматизации:** Хорошие скрипты создают лог-файлы. Ищите файлы вроде `setup.log` или перенаправьте вывод:

```bash
./setup.sh 2>&1 | tee setup.log
```

</details>

---

**Вопрос 7:** Зачем нужно делать скрипт установки модульным (разбитым на функции)?

- A) Чтобы код выглядел профессиональнее
- B) Чтобы можно было легко пропустить или повторить отдельные шаги установки
- C) Это требование всех bash-скриптов
- D) Чтобы скрипт работал быстрее

<details>
<summary>✅ Правильный ответ</summary>
B) Чтобы можно было легко пропустить или повторить отдельные шаги установки

**Объяснение:** Модульная структура обеспечивает гибкость и отказоустойчивость:

**Преимущества модульности:**

```bash
# Плохо: Монолитный скрипт
#!/bin/bash
brew install git
brew install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/install.sh | bash
# ... 100+ строк подряд

# Хорошо: Модульный скрипт
#!/bin/bash

install_git() {
  echo "Installing Git..."
  brew install git
}

install_node() {
  echo "Installing Node.js..."
  brew install node
}

install_nvm() {
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/install.sh | bash
}

# Гибкое выполнение
main() {
  install_git
  # install_node  # Закомментировали — уже есть
  install_nvm
}

main
```

**Возможности модульного подхода:**

- ✅ **Выборочная установка**: Запустить только нужные функции
- ✅ **Легкая отладка**: Тестировать каждую функцию отдельно
- ✅ **Повторное использование**: Использовать функции в других скриптах
- ✅ **Понятный код**: Каждая функция делает одно дело
- ✅ **Простое обслуживание**: Обновить один компонент, не трогая остальные

**Совет по автоматизации:** Создавайте функции для каждого логического шага и добавляйте флаги для управления:

```bash
# Установить только Git и Node
./setup.sh --only-git --only-node

# Пропустить Cursor
./setup.sh --skip-cursor
```

</details>

---

## 📝 Задания по автоматизации

### Задание 1: Базовое (15-25 мин) — "Анализ и использование готового скрипта"

**Цель:** Научиться безопасно использовать автоматические скрипты установки.

**Шаги:**

1. **Скачайте скрипт (НЕ запускайте сразу!):**

```bash
curl -fsSL https://gist.githubusercontent.com/gHashTag/3f8d9ff255bfa6b3ca28c5ac36857e03/raw/vibecoding-setup.sh -o vibecoding-setup.sh
```

2. **Откройте скрипт в текстовом редакторе:**

```bash
# В Cursor/VS Code
code vibecoding-setup.sh

# Или просто просмотр
cat vibecoding-setup.sh
```

3. **Проанализируйте скрипт:**

- Какие инструменты устанавливаются?
- Какие команды требуют sudo?
- Есть ли потенциально опасные операции?
- Куда устанавливаются программы?
- Какие файлы конфигурации изменяются?

4. **Создайте checklist того, что скрипт делает:**

```markdown
## Анализ vibecoding-setup.sh

### Устанавливаемые инструменты:

- [ ] Git
- [ ] Node.js (через nvm)
- [ ] pnpm
- [ ] Bun
- [ ] Claude CLI
- [ ] Cursor

### Изменения конфигурации:

- [ ] ~/.gitconfig (имя, email)
- [ ] ~/.ssh/ (SSH ключи)
- [ ] ~/.bashrc или ~/.zshrc (PATH, алиасы)

### Требуемые разрешения:

- [ ] sudo для установки системных пакетов
- [ ] Доступ к интернету для скачивания

### Потенциальные проблемы:

- [ ] Конфликт с существующим Node.js
- [ ] Перезапись SSH ключей
```

5. **Запустите скрипт:**

```bash
chmod +x vibecoding-setup.sh
./vibecoding-setup.sh
```

6. **Проверьте результат:**

```bash
# Проверка всех компонентов
git --version
node --version
pnpm --version
bun --version
claude --version

# Проверка путей установки
which git
which node
which pnpm
which bun
which claude

# Проверка конфигурации
git config --list
cat ~/.ssh/config
```

**Критерии успеха:**

- ✅ Создан подробный checklist анализа скрипта
- ✅ Вы понимаете, что делает каждая секция скрипта
- ✅ Скрипт выполнен без ошибок
- ✅ Все компоненты установлены и работают
- ✅ Вы можете объяснить, где находится каждый установленный инструмент
- ✅ Нет "сюрпризов" — все изменения были предсказуемы

**Команды диагностики:**

```bash
# Проверка версий с подробной информацией
git --version && which git
node --version && which node && npm --version
pnpm --version && which pnpm
bun --version && which bun
claude --version && which claude

# Проверка конфигурации Git
git config user.name
git config user.email

# Проверка SSH ключей
ls -la ~/.ssh/
cat ~/.ssh/config
```

**Документируйте результат:**

```markdown
## Результаты установки

**Дата:** [дата]
**ОС:** [ваша ОС и версия]

### Установленные версии:

- Git: [версия]
- Node.js: [версия]
- pnpm: [версия]
- Bun: [версия]
- Claude: [версия]

### Проблемы:

- [Опишите любые ошибки или предупреждения]

### Решения:

- [Как вы решили проблемы]
```

---

### Задание 2: Продвинутое (30-45 мин) — "Кастомизация скрипта установки"

**Цель:** Научиться адаптировать скрипты под свои нужды.

**Шаги:**

1. **Создайте копию оригинального скрипта:**

```bash
cp vibecoding-setup.sh my-custom-setup.sh
```

2. **Добавьте проверки уже установленных инструментов:**

```bash
# Пример: Добавить в начало каждой функции установки
install_git() {
  if command -v git &> /dev/null; then
    echo "✅ Git уже установлен: $(git --version)"
    return 0
  fi

  echo "📦 Устанавливаем Git..."
  # ... код установки
}

install_node() {
  if command -v node &> /dev/null; then
    echo "✅ Node.js уже установлен: $(node --version)"
    read -p "Переустановить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      return 0
    fi
  fi

  echo "📦 Устанавливаем Node.js..."
  # ... код установки
}
```

3. **Добавьте дополнительные инструменты:**

```bash
install_additional_tools() {
  echo "📦 Устанавливаем дополнительные инструменты..."

  # fzf - fuzzy finder
  if ! command -v fzf &> /dev/null; then
    brew install fzf
    $(brew --prefix)/opt/fzf/install --all
  fi

  # ripgrep - быстрый поиск
  if ! command -v rg &> /dev/null; then
    brew install ripgrep
  fi

  # bat - улучшенный cat
  if ! command -v bat &> /dev/null; then
    brew install bat
  fi

  # jq - JSON процессор
  if ! command -v jq &> /dev/null; then
    brew install jq
  fi
}
```

4. **Добавьте логирование:**

```bash
# В начале скрипта
LOG_FILE="setup-$(date +%Y%m%d-%H%M%S).log"

log() {
  echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# Использование вместо echo
log "✅ Git установлен успешно"
log "❌ Ошибка установки Node.js"
```

5. **Добавьте обработку ошибок:**

```bash
set -e  # Остановка при ошибке

# Функция обработки ошибок
handle_error() {
  log "❌ Ошибка на строке $1"
  log "💡 Проверьте лог: $LOG_FILE"
  exit 1
}

trap 'handle_error $LINENO' ERR

# Или для отдельных команд
install_tool() {
  if ! command_that_might_fail; then
    log "❌ Не удалось установить tool"
    log "💡 Попробуйте установить вручную: brew install tool"
    return 1
  fi
}
```

6. **Добавьте интерактивный режим:**

```bash
# Спрашивать перед каждой установкой
interactive_install() {
  echo "🔧 Хотите установить $1? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    return 0
  else
    log "⏭️  Пропускаем установку $1"
    return 1
  fi
}

# Использование
if interactive_install "Git"; then
  install_git
fi
```

7. **Добавьте dry-run режим:**

```bash
DRY_RUN=false

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
  esac
done

# Функция выполнения с dry-run
execute() {
  if [ "$DRY_RUN" = true ]; then
    log "🔍 [DRY RUN] Выполнилась бы команда: $*"
  else
    log "▶️  Выполняем: $*"
    "$@"
  fi
}

# Использование
execute brew install git
```

8. **Протестируйте кастомный скрипт:**

```bash
# Сначала dry-run
./my-custom-setup.sh --dry-run

# Затем реальный запуск
./my-custom-setup.sh

# Проверка лога
cat setup-*.log
```

**Критерии успеха:**

- ✅ Скрипт проверяет уже установленные инструменты (идемпотентность)
- ✅ Добавлены дополнительные полезные инструменты
- ✅ Ведется подробный лог всех операций
- ✅ Есть обработка ошибок с понятными сообщениями
- ✅ Скрипт можно запустить в dry-run режиме
- ✅ Все изменения документированы в комментариях
- ✅ Скрипт работает без ошибок на вашей системе

**Пример финальной структуры:**

```bash
#!/bin/bash
# my-custom-setup.sh
# Кастомная установка VibeCoding окружения
# Автор: [Ваше имя]
# Дата: [Дата]

set -e

# Конфигурация
LOG_FILE="setup-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false

# Утилиты
log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"; }
handle_error() { log "❌ Ошибка: $1"; exit 1; }
execute() {
  [ "$DRY_RUN" = true ] && log "🔍 [DRY RUN] $*" || "$@"
}

# Функции установки
install_git() { ... }
install_node() { ... }
install_additional_tools() { ... }

# Главная функция
main() {
  log "🚀 Начинаем установку VibeCoding окружения"
  install_git
  install_node
  install_additional_tools
  log "✅ Установка завершена! Лог: $LOG_FILE"
}

main "$@"
```

---

### Задание 3: Проектное (45-60 мин) — "Создание собственного скрипта автоматизации"

**Цель:** Создать полноценный скрипт автоматизации с нуля, применяя все лучшие практики.

**Требования к скрипту:**

1. Кроссплатформенность (macOS/Linux или Windows)
2. Идемпотентность (можно запускать многократно)
3. Обработка ошибок
4. Логирование
5. Dry-run режим
6. Модульная структура

**Шаги:**

1. **Создайте базовую структуру:**

```bash
#!/bin/bash
# vibecoding-pro-setup.sh
# Профессиональная установка VibeCoding окружения
# Версия: 1.0.0

set -euo pipefail  # Строгий режим

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
INTERACTIVE=true
SKIP_LIST=()

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# УТИЛИТЫ
# ============================================================================

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  # Создаем директорию логов, если нет
  mkdir -p "$LOG_DIR"

  # Цвет в зависимости от уровня
  local color=$NC
  case $level in
    ERROR)   color=$RED ;;
    SUCCESS) color=$GREEN ;;
    WARN)    color=$YELLOW ;;
  esac

  # Вывод в консоль с цветом
  echo -e "${color}[$timestamp] [$level] $message${NC}"

  # Вывод в лог без цвета
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# ============================================================================
# ПРОВЕРКИ СИСТЕМЫ
# ============================================================================

detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macos"
  else
    echo "unknown"
  fi
}

check_internet() {
  log INFO "Проверка подключения к интернету..."
  if ping -c 1 google.com &> /dev/null; then
    log SUCCESS "Интернет доступен"
    return 0
  else
    log ERROR "Нет подключения к интернету"
    return 1
  fi
}

check_disk_space() {
  log INFO "Проверка свободного места на диске..."
  local available=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
  if (( $(echo "$available < 5" | bc -l) )); then
    log WARN "Мало свободного места: ${available}GB"
    return 1
  fi
  log SUCCESS "Свободно: ${available}GB"
  return 0
}

# ============================================================================
# ПРОВЕРКА ИНСТРУМЕНТОВ
# ============================================================================

is_installed() {
  command -v "$1" &> /dev/null
}

get_version() {
  local tool=$1
  case $tool in
    git)   git --version 2>/dev/null | awk '{print $3}' ;;
    node)  node --version 2>/dev/null ;;
    pnpm)  pnpm --version 2>/dev/null ;;
    bun)   bun --version 2>/dev/null ;;
    *)     echo "unknown" ;;
  esac
}

should_skip() {
  local tool=$1
  for skip in "${SKIP_LIST[@]}"; do
    if [[ "$tool" == "$skip" ]]; then
      return 0
    fi
  done
  return 1
}

# ============================================================================
# ФУНКЦИИ УСТАНОВКИ
# ============================================================================

install_git() {
  local tool="git"

  if should_skip "$tool"; then
    log INFO "Пропускаем $tool (в списке исключений)"
    return 0
  fi

  if is_installed "$tool"; then
    local version=$(get_version "$tool")
    log SUCCESS "$tool уже установлен: $version"

    if [[ "$INTERACTIVE" == true ]]; then
      read -p "Переустановить? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
      fi
    else
      return 0
    fi
  fi

  log INFO "Устанавливаем $tool..."

  local os=$(detect_os)
  if [[ "$DRY_RUN" == true ]]; then
    log INFO "[DRY RUN] Установка $tool на $os"
  else
    case $os in
      macos)
        brew install git || { log ERROR "Не удалось установить $tool"; return 1; }
        ;;
      linux)
        sudo apt-get update && sudo apt-get install -y git || \
        { log ERROR "Не удалось установить $tool"; return 1; }
        ;;
      *)
        log ERROR "Неподдерживаемая ОС: $os"
        return 1
        ;;
    esac
  fi

  log SUCCESS "$tool установлен: $(get_version $tool)"
}

install_homebrew() {
  local tool="brew"

  if should_skip "$tool"; then
    log INFO "Пропускаем $tool (в списке исключений)"
    return 0
  fi

  if is_installed "$tool"; then
    log SUCCESS "Homebrew уже установлен"
    return 0
  fi

  log INFO "Устанавливаем Homebrew..."

  if [[ "$DRY_RUN" == true ]]; then
    log INFO "[DRY RUN] Установка Homebrew"
  else
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || \
    { log ERROR "Не удалось установить Homebrew"; return 1; }
  fi

  log SUCCESS "Homebrew установлен"
}

install_node() {
  local tool="node"

  if should_skip "$tool"; then
    log INFO "Пропускаем $tool"
    return 0
  fi

  if is_installed "$tool"; then
    log SUCCESS "$tool уже установлен: $(get_version $tool)"
    return 0
  fi

  log INFO "Устанавливаем Node.js через nvm..."

  if [[ "$DRY_RUN" == true ]]; then
    log INFO "[DRY RUN] Установка Node.js"
  else
    # Установка nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

    # Загрузка nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    # Установка Node.js
    nvm install node || { log ERROR "Не удалось установить Node.js"; return 1; }
  fi

  log SUCCESS "Node.js установлен: $(get_version node)"
}

# ============================================================================
# ГЛАВНАЯ ФУНКЦИЯ
# ============================================================================

print_banner() {
  cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       VibeCoding Pro Setup v1.0.0                        ║
║       Профессиональная установка окружения               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
}

print_summary() {
  log INFO "================================================"
  log INFO "СВОДКА УСТАНОВКИ"
  log INFO "================================================"

  local tools=("git" "node" "pnpm" "bun" "claude")

  for tool in "${tools[@]}"; do
    if is_installed "$tool"; then
      local version=$(get_version "$tool")
      log SUCCESS "✅ $tool: $version"
    else
      log WARN "❌ $tool: не установлен"
    fi
  done

  log INFO "================================================"
  log INFO "Лог сохранен: $LOG_FILE"
  log INFO "================================================"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run)
        DRY_RUN=true
        log INFO "Режим DRY RUN активирован"
        shift
        ;;
      --non-interactive)
        INTERACTIVE=false
        log INFO "Неинтерактивный режим"
        shift
        ;;
      --skip)
        SKIP_LIST+=("$2")
        log INFO "Пропускаем: $2"
        shift 2
        ;;
      --help)
        print_help
        exit 0
        ;;
      *)
        log ERROR "Неизвестный аргумент: $1"
        print_help
        exit 1
        ;;
    esac
  done
}

print_help() {
  cat << EOF
Использование: $0 [ОПЦИИ]

ОПЦИИ:
  --dry-run              Показать что будет сделано, без реального выполнения
  --non-interactive      Не задавать вопросы, использовать значения по умолчанию
  --skip TOOL            Пропустить установку инструмента (можно использовать многократно)
  --help                 Показать эту справку

ПРИМЕРЫ:
  $0                                  # Обычная установка
  $0 --dry-run                        # Посмотреть что будет установлено
  $0 --skip git --skip node           # Пропустить Git и Node.js
  $0 --non-interactive                # Автоматическая установка без вопросов

ИНСТРУМЕНТЫ:
  git, brew, node, pnpm, bun, claude

EOF
}

main() {
  parse_args "$@"

  print_banner

  log INFO "Начинаем установку VibeCoding окружения"
  log INFO "ОС: $(detect_os)"
  log INFO "Лог: $LOG_FILE"

  # Предварительные проверки
  check_internet || exit 1
  check_disk_space || log WARN "Продолжаем несмотря на мало места..."

  # Установка
  install_homebrew
  install_git
  install_node
  # Добавьте другие install_* функции

  # Итоги
  print_summary

  log SUCCESS "🎉 Установка завершена!"
  log INFO "Перезагрузите терминал для применения изменений"
}

# Точка входа
main "$@"
```

2. **Протестируйте скрипт:**

```bash
# Проверка справки
./vibecoding-pro-setup.sh --help

# Dry-run
./vibecoding-pro-setup.sh --dry-run

# Установка с пропуском существующих инструментов
./vibecoding-pro-setup.sh --skip git --skip node

# Полная автоматическая установка
./vibecoding-pro-setup.sh --non-interactive
```

3. **Создайте документацию:**

```markdown
# VibeCoding Pro Setup

Профессиональный скрипт установки VibeCoding окружения.

## Возможности

- ✅ Кроссплатформенность (macOS/Linux)
- ✅ Идемпотентность (безопасный повторный запуск)
- ✅ Dry-run режим
- ✅ Подробное логирование
- ✅ Обработка ошибок
- ✅ Интерактивный и автоматический режимы

## Использование

[См. вывод --help]

## Логи

Все операции логируются в `logs/setup-[timestamp].log`

## Безопасность

Скрипт использует `set -euo pipefail` для строгой обработки ошибок.
```

**Критерии успеха:**

- ✅ Скрипт работает на вашей ОС без ошибок
- ✅ Реализована полная обработка ошибок
- ✅ Ведется подробное логирование с временными метками
- ✅ Dry-run режим работает корректно
- ✅ Скрипт идемпотентен (можно запускать многократно)
- ✅ Есть справка (--help)
- ✅ Код хорошо документирован комментариями
- ✅ Создана отдельная README с инструкциями

**Бонусные возможности:**

```bash
# Добавьте бэкап существующих конфигураций
backup_config() {
  local config_file=$1
  if [[ -f "$config_file" ]]; then
    local backup="${config_file}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$config_file" "$backup"
    log INFO "Создан бэкап: $backup"
  fi
}

# Добавьте функцию отката
rollback() {
  log WARN "Выполняем откат изменений..."
  # Восстановление бэкапов
  # Удаление установленных инструментов
}

# Добавьте прогресс-бар
show_progress() {
  local current=$1
  local total=$2
  local percent=$((current * 100 / total))
  printf "\rПрогресс: [%-50s] %d%%" $(printf "#%.0s" $(seq 1 $((percent / 2)))) $percent
}
```

---

## ➡️ Что дальше?

1. **Перезагрузите терминал** для применения всех настроек
2. **Откройте Warp Terminal** и настройте тему
3. **Запустите Cursor** и откройте пример проекта
4. **Создайте Obsidian Vault** для документации
5. **Начните свой первый VibeCoding проект!**

**Следующий шаг:** Развенчай мифы о VibeCoding → **07-МИФЫ-О-VIBECODING.md**

---

> **"Автоматизация — это не лень, это стратегическая эффективность."** — Билл Гейтс

_Ваше VibeCoding окружение готово к работе! 🚀✨_
