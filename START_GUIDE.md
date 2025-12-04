# 🚀 Руководство по запуску VIBEE

## Команды запуска

### 1. VIBEE Agent (Основной агент)
```bash
cd /Users/playra/vibee-agent
./scripts/dev-with-infisical.sh
```
Запускает главного агента VIBEE с:
- Плагином Telegram Craft
- Плагином Avatar Face (LoRA + NeuroPhoto)
- OpenRouter API
- Hot reload через bun dev

### 2. VIBEE Dashboard (Веб-интерфейс)
```bash
cd /Users/playra/vibee-agent/vibee-client
npm run dev
```
Веб-интерфейс на http://localhost:5173 с:
- Генератором аватаров DiceBear
- Созданием агентов
- Мониторингом агентов

### 3. Instagram Expert
```bash
cd /Users/playra/vibee-agent
./scripts/dev-with-infisical.sh characters/instagramExpert.json
```
Запускает специализированного агента для Instagram автоматизации

### 4. KOLS Agent
```bash
cd /Users/playra/vibee-agent
./scripts/dev-with-infisical.sh characters/kolsAgent.json
```
Агент для мониторинга групповых чатов

## 📋 Доступные персонажи

```bash
# Список всех персонажей
ls characters/*.json
```

- `characters/vibeeAgent.json` - Главный агент VIBEE
- `characters/instagramExpert.json` - Instagram Expert
- `characters/kolsAgent.json` - KOLS Monitor Agent
- `characters/telegramMonitor.json` - Telegram Monitor

## 🔧 Функции

### VIBEE Agent
- 🤖 Управление агентами через ElizaOS
- 🎨 Avatar Face: обучение LoRA + генерация изображений
- 🌈 Радужный Мост: автономное тестирование
- 📱 Telegram интеграция

### Instagram Expert
- 📸 Создание постов и сторис
- 📊 Аналитика Instagram
- 🏷️ Подбор хэштегов
- ⏰ Планирование контента

### Генератор аватаров
- 🎨 3 стиля: Avataaars, Human, Initials
- ✨ Золотистая цветовая схема VIBEE
- 🔄 Детерминированная генерация по имени/ID
- 📱 Автоматические аватары для всех агентов

## 🛠️ Процессы в фоне

Мониторинг запущенных процессов:
```bash
# Проверить запущенные процессы
ps aux | grep -E "elizaos|bun|vite" | grep -v grep

# Остановить все процессы
pkill -f "elizaos\|bun run dev"
```

## 🌐 Порты

- **3000** - ElizaOS API (если используется)
- **5173** - VIBEE Dashboard (веб-клиент)
- **3001** - Telegram webhook (если настроен)

## 📚 Дополнительные команды

```bash
# Мониторинг логов агента
./monitor.sh

# Проверка статуса системы
pgrep -f "elizaos.*dev" > /dev/null && echo "✅ Агент запущен" || echo "❌ Агент остановлен"

# Логи в реальном времени
tail -f agent.log
```

## ⚡ Быстрый старт

1. **Запускаем VIBEE Agent**:
   ```bash
   cd /Users/playra/vibee-agent && ./scripts/dev-with-infisical.sh &
   ```

2. **Запускаем Dashboard**:
   ```bash
   cd /Users/playra/vibee-agent/vibee-client && npm run dev &
   ```

3. **Открываем http://localhost:5173** в браузере

4. **Создаем агента** - переходим на `/create`

5. **Генерируем аватар** - выбираем стиль и создаем

## 🔑 Секреты

Все секреты загружаются из:
- `.env.dev` - для разработки (Infisical credentials)
- Infisical Cloud - для продакшена (50+ переменных)

## 📖 Документация

- `AVATAR_GENERATION_IMPLEMENTATION.md` - Генератор аватаров
- `CLAUDE.md` - Руководство для разработчиков
- `plugin-telegram-craft/README.md` - Telegram плагин

---

**🎉 Готово!** Теперь у вас есть полностью настроенная система VIBEE с веб-интерфейсом, генератором аватаров и поддержкой множественных агентов.
