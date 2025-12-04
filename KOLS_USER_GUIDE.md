# 🎓 Руководство пользователя - KOLS AGENT

## 📋 Что это?

**KOLS AGENT** - это наставник по VibeCoding, который обучает студентов агентному программированию. Он интегрирован с полной "Библией вайб-кодера" и может проактивно делиться знаниями.

---

## 🚀 Как запустить агента

### Вариант 1: Скрипт запуска (рекомендуется)
```bash
bash /Users/playra/vibee-agent/scripts/start-all.sh
```

### Вариант 2: Ручной запуск
```bash
source /Users/playra/vibee-agent/.env.local
npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json
```

### Вариант 3: Отдельный запуск KOLS
```bash
source /Users/playra/vibee-agent/.env.local
env PORT=3001 npx elizaos start --character /Users/playra/vibee-agent/characters/kolsAgent.json
```

---

## ✅ Статус агента

**Порт:** 3001
**Статус:** ✅ Запущен и работает
**База знаний:** ✅ Библия вайб-кодера загружена

### Проверка статуса:
```bash
# Проверить процесс
ps aux | grep "kolsAgent.json"

# Проверить порт
netstat -an | grep 3001

# Посмотреть логи
tail -f /Users/playra/vibee-agent/logs/kols-updated.log
```

---

## 🎯 Как пользоваться

### 1. Добавить в группу
1. Найдите группу: https://t.me/c/2643951085/1
2. Добавьте бота @kols_agent или используйте MTProto для авто-join
3. Агент начнет мониторить сообщения

### 2. Обучающие команды
Просто напишите боту в группе:
```
"Расскажи о VibeCoding"
"Что такое AI-агенты?"
"Обучи меня"
"Claude Code"
"Мультиагентные системы"
"Паттерны агентного программирования"
```

### 3. Пример ответа агента
```
🎓 **Урок VibeCoding: Что такое VibeCoding?**

VibeCoding - это новый подход к программированию, где AI-агенты становятся вашими напарниками в создании кода. Вместо того чтобы писать код вручную, вы общаетесь с AI на естественном языке, а он помогает вам создавать, отлаживать и улучшать программы.

💡 **Почему это важно:** Это позволяет сосредоточиться на решении проблем, а не на синтаксисе и рутинных задачах.

🚀 **Практический совет:** Начните с простых проектов: попросите AI создать функцию, затем улучшить её, добавить тесты.

📖 Хотите узнать больше? Задайте вопрос!
```

---

## 📚 Обучающие темы

Агент знает 8+ основных тем:

1. **Основы VibeCoding** - что это и зачем нужно
2. **Claude Code** - главный инструмент вайбкодера
3. **AI-агенты** - что это и как работают
4. **Мультиагентные системы** - архитектуры и паттерны
5. **Agentic Programming** - паттерны разработки
6. **RAG** - retrieval-augmented generation
7. **Статистика AI** - почему 85% проектов проваливаются
8. **Инструменты** - Claude Code vs IDE

---

## 🔌 Подключенные плагины

1. **@elizaos/plugin-knowledge** - база знаний из Библии вайб-кодера
2. **plugin-vibe-learning** - проактивное обучение
3. **plugin-telegram-craft** - мониторинг Telegram чатов (MTProto)
4. **@elizaos/plugin-sql** - PostgreSQL база данных
5. **@elizaos/plugin-openrouter** - LLM для обучения
6. **@elizaos/plugin-bootstrap** - базовые функции

---

## 🧪 Тестирование

### Быстрая проверка
```bash
python3 /Users/playra/vibee-agent/test-kols-vibecoding.py
```

**Результат должен быть:**
```
✅ Статус агента: ПРОЙДЕН
✅ База знаний: ПРОЙДЕН
✅ Плагины: ПРОЙДЕН

🎯 Результат: 3/4 тестов пройдено
```

### Проверка логов
```bash
# Все логи
tail -f /Users/playra/vibee-agent/logs/kols-updated.log

# Только важные сообщения
tail -f /Users/playra/vibee-agent/logs/kols-updated.log | grep -E "(Plugin|KOLS|🎓|Knowledge)"
```

---

## ⚙️ Настройка

### Переменные окружения
```bash
# Библия вайб-кодера
LOAD_DOCS_ON_STARTUP=true

# PostgreSQL
POSTGRES_URL=postgresql://...
DATABASE_URL=postgresql://...

# Telegram MTProto
TELEGRAM_API_ID=27117758
TELEGRAM_API_HASH=a25b0b5b3ee9c3b3c0d4e5f6g7h8i9j0k

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=6143145384:...
```

### Файлы конфигурации
- Character: `/Users/playra/vibee-agent/characters/kolsAgent.json`
- Environment: `/Users/playra/vibee-agent/.env.local`
- База знаний: `/Users/playra/vibee-agent/docs/` (48 файлов)

---

## 🛠️ Устранение неполадок

### Агент не запускается
```bash
# Проверить порт
lsof -i :3001

# Остановить процессы на порту 3001
pkill -f "elizaos"

# Перезапустить
bash /Users/playra/vibee-agent/scripts/start-all.sh
```

### Не загружаются знания
```bash
# Проверить папку docs
ls -la /Users/playra/vibee-agent/docs/

# Проверить переменную
grep LOAD_DOCS_ON_STARTUP /Users/playra/vibee-agent/.env.local
```

### Ошибки в логах
```bash
# Посмотреть последние ошибки
tail -n 200 /Users/playra/vibee-agent/logs/kols-updated.log | grep -i error

# Очистить логи
rm /Users/playra/vibee-agent/logs/kols-updated.log
```

---

## 📞 Поддержка

### Документация
- **Полный отчет:** `/Users/playra/vibee-agent/KOLS_VIBECODING_IMPLEMENTATION_REPORT.md`
- **Это руководство:** `/Users/playra/vibee-agent/KOLS_USER_GUIDE.md`
- **Библия вайб-кодера:** `/Users/playra/vibee-agent/docs/`

### Команды для диагностики
```bash
# Статус агентов
ps aux | grep "elizaos"

# Порты
netstat -an | grep -E "(3000|3001|3002|3003)"

# Логи всех агентов
tail -f /Users/playra/vibee-agent/logs/*.log

# Тестирование
python3 /Users/playra/vibee-agent/test-kols-vibecoding.py
```

---

## 🎉 Готово к использованию!

**KOLS AGENT** готов обучать студентов VibeCoding 24/7!

🚀 **Добавляйте в группу и начинайте обучение!**

---

*Руководство обновлено: 3 декабря 2025*
