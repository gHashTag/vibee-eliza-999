# 📋 VIBEE - Все команды для просмотра логов

## 🚀 Рекомендуемые команды (ОТ ПРОСТОГО К СЛОЖНОМУ)

### 1. ✅ **ПРОСТЕЙШИЙ СПОСОБ** (работает в любом терминале!)
```bash
./view-logs-simple.sh
```
**Возможности:**
- ✅ Работает в терминале любого размера
- ✅ Автоматически адаптируется под размер окна
- ✅ Показывает последние строки + live-обновления
- ✅ Можно смотреть конкретный лог: `./view-logs-simple.sh vibee`

---

### 2. 📺 **СТАНДАРТНЫЙ СПОСОБ** (с multitail если доступен)
```bash
./view-logs.sh
```
**Возможности:**
- ✅ Использует multitail для красивого отображения
- ✅ Автоматически падает на стандартный tail если multitail недоступен
- ✅ Разделение по агентам: `./view-logs.sh vibee|kols|neuro|errors`

---

### 3. 🎨 **КРАСИВЫЙ СПОСОБ** (требует большой терминал)
```bash
./view-logs-beautiful.sh
```
**Требования:**
- 📐 Минимум 100 колонок x 30 строк
- 📦 multitail (`brew install multitail`)
**Возможности:**
- 🎨 Разделенные панели для каждого агента
- 🔵🔴🟡 Цветовое кодирование
- 📊 Одновременный просмотр

---

### 4. 🚀 **ВСЕ-В-ОДНОМ** (запуск + мониторинг)
```bash
./start-and-monitor.sh
```
**Что делает:**
- 1️⃣ Останавливает старые процессы
- 2️⃣ Запускает всех агентов
- 3️⃣ Ожидает инициализацию
- 4️⃣ Открывает красивый просмотр логов

---

## 📊 Краткая справочная таблица

| Скрипт | Запуск | Режим | Требования |
|--------|--------|-------|------------|
| `view-logs-simple.sh` | ✅ ЛЮБОЙ терминал | Простой | Никаких |
| `view-logs.sh` | ✅ Большинство | Стандартный | multitail (опционально) |
| `view-logs-beautiful.sh` | ⚠️ Только большой | Красивый | multitail + 100x30 |
| `start-and-monitor.sh` | ✅ Любой | Все-в-одном | Зависит от режима |

---

## 🔍 Команды для просмотра конкретного лога

### VIBEE Agent
```bash
# Простой
./view-logs-simple.sh vibee

# Стандартный
./view-logs.sh vibee

# Только последние 50 строк
tail -50 logs/vibee.log
```

### KOLS Agent
```bash
# Простой
./view-logs-simple.sh kols

# Стандартный
./view-logs.sh kols

# Поиск ошибок
grep -i "error\|fail" logs/kols.log
```

### NeuroPhoto Agent
```bash
# Простой
./view-logs-simple.sh neuro

# Стандартный
./view-logs.sh neuro

# Поиск предупреждений
grep -i "warn" logs/neurophoto.log
```

### Только ошибки из всех логов
```bash
./view-logs-simple.sh errors
./view-logs.sh errors
tail -f logs/*.log | grep -i "error\|fail\|warn"
```

---

## 🛠️ Дополнительные команды

### Проверка статуса агентов
```bash
ps aux | grep elizaos
```

### Остановка агентов
```bash
pkill -f 'elizaos'
```

### Просмотр размера логов
```bash
du -sh logs/*
```

### Очистка логов
```bash
# Очистить все
rm logs/*.log

# Очистить конкретный
> logs/vibee.log
```

### Создание архива логов
```bash
tar -czf logs-$(date +%Y%m%d-%H%M%S).tar.gz logs/
```

---

## 📐 Проверка размера терминала

```bash
# Показать размер
echo "Размер: $(tput cols)x$(tput lines)"

# Минимальные требования для красивого режима
echo "Красивый режим: 100x30"
echo "Ваш размер: $(tput cols)x$(tput lines)"
```

---

## 🎯 Рекомендации по использованию

### Для маленьких терминалов (80x24, 120x30)
```bash
# ✅ ИСПОЛЬЗУЕМ
./view-logs-simple.sh

# ❌ НЕ ИСПОЛЬЗУЕМ
./view-logs-beautiful.sh
```

### Для средних терминалов (120x40)
```bash
# ✅ РЕКОМЕНДУЕТСЯ
./view-logs.sh

# ✅ ТАКЖЕ ХОРОШО
./view-logs-simple.sh
```

### Для больших терминалов (150x50+)
```bash
# ✅ МОЖНО ИСПОЛЬЗОВАТЬ
./view-logs-beautiful.sh

# ✅ ИЛИ
./view-logs.sh
```

---

## 🔧 Установка multitail

```bash
# macOS
brew install multitail

# Ubuntu/Debian
sudo apt-get install multitail

# CentOS/RHEL
sudo yum install multitail

# Проверка установки
which multitail
```

---

## ⚡ Быстрые команды (алиасы)

Добавьте в `.bashrc` или `.zshrc`:

```bash
# Алиасы для логов VIBEE
alias vibee-logs='./view-logs-simple.sh'
alias vibee-start='./start-agents.sh'
alias vibee-monitor='./start-and-monitor.sh'
alias vibee-stop='pkill -f elizaos'

# Использование
vibee-logs       # Посмотреть логи
vibee-start      # Запустить агентов
vibee-monitor    # Запуск + мониторинг
vibee-stop       # Остановить агентов
```

---

## 🎓 Примеры использования

### Пример 1: Ежедневная работа
```bash
# 1. Запускаем агентов
./start-agents.sh

# 2. В отдельном терминале смотрим логи
./view-logs-simple.sh

# 3. Для поиска ошибок
./view-logs-simple.sh errors
```

### Пример 2: Разработка
```bash
# 1. Запуск + мониторинг
./start-and-monitor.sh

# 2. Скрипт автоматически покажет логи
```

### Пример 3: Поиск проблем
```bash
# 1. Проверяем статус
ps aux | grep elizaos

# 2. Смотрим ошибки
./view-logs-simple.sh errors

# 3. Детальный анализ конкретного агента
./view-logs-simple.sh vibee
```

### Пример 4: Мониторинг в реальном времени
```bash
# В отдельном терминале (автообновление)
watch -n 2 'ps aux | grep elizaos'

# В другом терминале
./view-logs-simple.sh
```

---

## 🆘 Решение проблем

### Проблема: "multitail не найден"
```bash
# Решение 1: Установить multitail
brew install multitail

# Решение 2: Использовать простой режим
./view-logs-simple.sh
```

### Проблема: "Терминал слишком маленький"
```bash
# Решение 1: Увеличить окно терминала
# Или

# Решение 2: Использовать простой режим
./view-logs-simple.sh
```

### Проблема: "Нет логов"
```bash
# Решение 1: Запустить агентов
./start-agents.sh

# Решение 2: Подождать 10-15 секунд
sleep 15

# Решение 3: Проверить статус
ps aux | grep elizaos
```

### Проблема: "Ошибки в логах"
```bash
# Посмотреть только ошибки
./view-logs-simple.sh errors

# Или поиск по ключевым словам
grep -i "error\|exception\|fail" logs/*.log
```

---

## 💡 Полезные советы

1. **Для экономии места в терминале:**
   - Используйте `./view-logs-simple.sh`
   - Уменьшите размер окна браузера
   - Закройте ненужные вкладки

2. **Для лучшего мониторинга:**
   - Откройте 2-3 терминала
   - В одном - логи VIBEE
   - В другом - логи KOLS
   - В третьем - команды разработки

3. **Для поиска проблем:**
   - Всегда смотрите `./view-logs-simple.sh errors`
   - Ищите по времени ошибки
   - Проверяйте статус процессов

4. **Для продакшена:**
   - Используйте `./view-logs-simple.sh vibee` для конкретного агента
   - Архивируйте логи: `tar -czf logs-$(date +%Y%m%d).tar.gz logs/`
   - Настройте ротацию логов

---

## 🎉 ИТОГ

**ГЛАВНЫЕ КОМАНДЫ:**
```bash
# Запуск агентов
./start-agents.sh

# Просмотр логов (РЕКОМЕНДУЕТСЯ!)
./view-logs-simple.sh

# Все-в-одном
./start-and-monitor.sh
```

**📚 Дополнительная документация:**
- `LOGS_VIEWER_GUIDE.md` - Полное руководство
- `LOGS_COMMANDS.md` - Эта страница

---

**✅ Все скрипты протестированы и готовы к использованию!**
