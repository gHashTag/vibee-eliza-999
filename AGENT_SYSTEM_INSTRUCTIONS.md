# 🐝 Система Агентов VIBEE - Инструкция по запуску

## 🚨 КРИТИЧЕСКИ ВАЖНО

**ЕДИНСТВЕННАЯ команда запуска агента VIBEE:**
```bash
bun dev
```

## 📁 Созданные скрипты

### 1. `start-vibee-agents.sh`
**Для ручного запуска системы агентов VIBEE**

```bash
./start-vibee-agents.sh
```

**Что делает:**
- ✅ Проверяет наличие `bun`
- ✅ Загружает секреты из Infisical
- ✅ Устанавливает зависимости
- ✅ Запускает VIBEE agent через `bun dev`

---

### 2. `traycer-vibee-agent.sh`
**Для интеграции с Traycer**

```bash
./traycer-vibee-agent.sh
```

**Что делает:**
- ✅ Читает переменные Traycer (`$TRAYCER_PROMPT`, `$TRAYCER_TASK_ID`, etc.)
- ✅ Показывает информацию о задаче
- ✅ Запускает VIBEE agent

---

### 3. `traycer-agent-cli.sh`
**Заменитель для вашего скрипта**

```bash
#!/bin/sh
exec "$(dirname "$0")/traycer-vibee-agent.sh" "$@"
```

**Используйте этот скрипт в Traycer вместо вашего старого скрипта!**

---

## 🔧 Как обновить Traycer конфигурацию

**Старый скрипт (НЕ РАБОТАЕТ):**
```bash
claude --dangerously-skip-permissions /task "$TRAYCER_PROMPT"
```

**Новый скрипт (РАБОТАЕТ):**
```bash
/Users/playra/vibee-agent/traycer-agent-cli.sh
```

---

## 🚀 Быстрый старт

### Ручной запуск:
```bash
cd /Users/playra/vibee-agent
./start-vibee-agents.sh
```

### Через Traycer:
1. Обновите конфигурацию Traycer:
   ```bash
   traycer-agent-cli.sh
   ```
2. Запустите задачу через Traycer

---

## 📋 Проверка работоспособности

```bash
# Проверить, что bun установлен
bun --version

# Проверить зависимости
bun install

# Запустить агента
bun dev
```

---

## ⚠️ Важные моменты

1. **VIBEE использует ElizaOS**, не Claude CLI
2. **Всегда используем `bun dev`** - это единственная команда запуска
3. **Секреты загружаются из Infisical**, не из .env
4. **Система агентов-пчелок** запускается автоматически при старте VIBEE

---

## 🐛 Устранение неисправностей

| Проблема | Решение |
|----------|---------|
| `bun: command not found` | Установите bun: https://bun.sh |
| `.env.dev not found` | Скопируйте `.env.example` в `.env.dev` |
| `.infisical.env not found` | Выполните: `infisical secrets pull --env=dev` |
| `Permission denied` | Выполните: `chmod +x *.sh` |
| Agent не отвечает | Проверьте `TELEGRAM_BOT_TOKEN` в Infisical |

---

## 🎯 Следующие шаги

1. ✅ Скрипты созданы
2. 🔄 **Обновите конфигурацию Traycer**
3. 🚀 **Запустите систему агентов**
4. 🧪 **Протестируйте работу**

---

**Помните:** Единственная команда для запуска агента - `bun dev`!
