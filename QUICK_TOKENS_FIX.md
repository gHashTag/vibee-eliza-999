# 🚀 КРАТКАЯ ИНСТРУКЦИЯ - Исправление токенов VIBEE

## ⚡ БЫСТРОЕ РЕШЕНИЕ

### 1️⃣ Откройте файл .env
```bash
nano .env
```

### 2️⃣ Найдите раздел с токенами (строки 20-37) и раскомментируйте:
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABC...
FAL_KEY=ваш-fal-ключ
REPLICATE_API_KEY=ваш-replicate-ключ
OPENROUTER_API_KEY=ваш-openrouter-ключ
```

### 3️⃣ Перезапустите агентов
```bash
pkill -f 'elizaos'
./start-agents.sh
```

### 4️⃣ Проверьте логи
```bash
./view-logs-simple.sh
```

---

## 🔑 ГДЕ ВЗЯТЬ ТОКЕНЫ

| Сервис | Ссылка | Формат токена |
|--------|--------|---------------|
| Telegram | https://t.me/BotFather | `1234567890:ABC...` |
| FAL | https://fal.ai | `fal_key_xxx...` |
| Replicate | https://replicate.com | `r8_xxx...` |
| OpenRouter | https://openrouter.ai | `sk-or-v1-xxx...` |

---

## 📚 ДОКУМЕНТАЦИЯ

- `TOKENS_FIX_GUIDE.md` - Подробное руководство
- `check-and-fix-tokens.sh` - Автоматическая проверка
- `add-tokens.sh` - Интерактивное добавление

---

## ✅ РЕЗУЛЬТАТ

После исправления:
- ❌ Исчезнут все предупреждения "not found"
- ✅ Telegram функциональность заработает
- ✅ NeuroPhoto сможет обучать LoRA
- ✅ Генерация изображений будет работать
- ✅ Все агенты на 100% функциональны
