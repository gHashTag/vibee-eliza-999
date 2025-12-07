# 🔐 ИСПРАВЛЕНИЕ ТОКЕНОВ VIBEE - Полное руководство

## 📊 Текущий статус

Все агенты VIBEE успешно запущены с PostgreSQL, но есть предупреждения о недостающих токенах:

### ❌ Проблемы:
- `TELEGRAM_BOT_TOKEN not provided` - Telegram функциональность недоступна
- `FAL_KEY не найден` - LoRA обучение не работает
- `REPLICATE_API_KEY не найден` - Генерация изображений не работает
- `[Telegram] Cannot register send handler` - Не удается зарегистрировать обработчик

### ✅ Работает:
- VIBEE Agent (порт 3000) - ✅ Работает с PostgreSQL
- KOLS Agent (порт 3002) - ✅ MTProto подключен, проактивное обучение активировано
- NeuroPhoto Agent (порт 3003) - ✅ Запущен, но без токенов

---

## 🎯 РЕШЕНИЕ - 3 ШАГА

### ШАГ 1: Добавьте токены в .env файл

Откройте файл `.env` и раскомментируйте строки с токенами (удалите `#`):

```bash
# Раскомментируйте эти строки:
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
FAL_KEY=YOUR_FAL_KEY
REPLICATE_API_KEY=YOUR_REPLICATE_KEY
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
```

**Пример заполненного файла:**
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
FAL_KEY=your-fal-ai-api-key-here
REPLICATE_API_KEY=your-replicate-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### ШАГ 2: Где получить токены

| Токен | Ссылка | Описание |
|-------|--------|----------|
| **Telegram Bot Token** | https://t.me/BotFather | Создайте бота через @BotFather |
| **FAL API Key** | https://fal.ai | Регистрация на fal.ai |
| **Replicate API Key** | https://replicate.com | Регистрация на replicate.com |
| **OpenRouter API Key** | https://openrouter.ai | Регистрация на openrouter.ai |

### ШАГ 3: Перезапустите агентов

```bash
# Остановите агентов
pkill -f 'elizaos'

# Запустите с новыми токенами
./start-agents.sh

# Проверьте логи
./view-logs-simple.sh
```

---

## 🔍 ПРОВЕРКА ТОКЕНОВ

### Автоматическая проверка:
```bash
./check-and-fix-tokens.sh
```

### Интерактивное добавление:
```bash
./add-tokens.sh
```

---

## 📋 ПОДРОБНАЯ ИНСТРУКЦИЯ

### 1. Telegram Bot Token

**Где получить:**
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте `/newbot`
4. Следуйте инструкциям
5. Скопируйте токен (формат: `1234567890:ABC...`)

**Пример:**
```
✅ Your bot token is: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. FAL API Key

**Где получить:**
1. Перейдите на https://fal.ai
2. Зарегистрируйтесь или войдите
3. Перейдите в Settings → API Keys
4. Создайте новый ключ
5. Скопируйте ключ

**Пример:**
```
fal_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Replicate API Key

**Где получить:**
1. Перейдите на https://replicate.com
2. Зарегистрируйтесь или войдите
3. Перейдите в Account → API Tokens
4. Создайте новый токен
5. Скопируйте токен

**Пример:**
```
r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. OpenRouter API Key

**Где получить:**
1. Перейдите на https://openrouter.ai
2. Зарегистрируйтесь или войдите
3. Перейдите в Keys
4. Создайте новый ключ
5. Скопируйте ключ

**Пример:**
```
sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ НАСТРОЙКА .env ФАЙЛА

### Правильное редактирование:

**❌ НЕПРАВИЛЬНО:**
```bash
# TELEGRAM_BOT_TOKEN=1234567890:ABC...   # Закомментировано
```

**✅ ПРАВИЛЬНО:**
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABC...     # Раскомментировано
```

### Полный пример .env файла:

```bash
# ==============================================================================
# 🔐 VIBEE - Файл конфигурации с PostgreSQL и токенами
# ==============================================================================

# 🔐 Infisical Cloud-First Configuration
INFISICAL_CLIENT_ID=88fcf0cd-cce9-4844-bad2-8e19b4bad3ed
INFISICAL_CLIENT_SECRET=b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314
INFISICAL_PROJECT_ID=fd763fa3-35d5-4045-93bd-1795c5f00fc3
INFISICAL_ENVIRONMENT=dev

# 🧪 Development Environment
NODE_ENV=development

# 🗄️ PostgreSQL Database Configuration (Neon)
DATABASE_ADAPTER=postgresql
POSTGRES_URL=postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_URL=postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true

# 🔑 API TOKENS - ВАШИ ТОКЕНЫ ЗДЕСЬ
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
FAL_KEY=fal_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 ПОСЛЕ ДОБАВЛЕНИЯ ТОКЕНОВ

### 1. Перезапуск агентов:
```bash
pkill -f 'elizaos'
./start-agents.sh
```

### 2. Проверка логов:
```bash
./view-logs-simple.sh
```

### 3. Ожидаемый результат:

**❌ До добавления токенов:**
```
⚠️  FAL_KEY не найден. FalService будет неактивен.
⚠️  REPLICATE_API_KEY не найден. ReplicateService будет неактивен.
Warn Telegram Bot Token not provided - Telegram functionality will be unavailable
```

**✅ После добавления токенов:**
```
✅ FalService активен
✅ ReplicateService активен
✅ Telegram Bot Token загружен
✅ Все сервисы работают
```

---

## 🛠️ ДОПОЛНИТЕЛЬНЫЕ КОМАНДЫ

### Проверка переменных окружения:
```bash
# Показать все переменные с TOKEN в названии
env | grep -i token

# Показать конкретную переменную
echo $TELEGRAM_BOT_TOKEN
```

### Проверка логов на ошибки:
```bash
# Только ошибки
./view-logs-simple.sh errors

# Поиск предупреждений о токенах
grep -i "not found\|not provided\|will be unavailable" logs/*.log
```

### Очистка логов перед тестом:
```bash
rm logs/*.log
./start-agents.sh
```

---

## 📊 СТАТУС АГЕНТОВ ПОСЛЕ ИСПРАВЛЕНИЯ

### 🔵 VIBEE Agent (порт 3000):
- ✅ PostgreSQL подключен
- ✅ OpenRouter API активен
- ✅ Telegram Bot работает
- ✅ Готов к работе

### 🟡 KOLS Agent (порт 3002):
- ✅ PostgreSQL подключен
- ✅ MTProto подключен
- ✅ OpenRouter API активен
- ✅ Telegram Bot работает
- ✅ Проактивное обучение активно
- ✅ Готов к работе

### 🟣 NeuroPhoto Agent (порт 3003):
- ✅ PostgreSQL подключен
- ✅ FAL API активен (LoRA обучение)
- ✅ Replicate API активен (Генерация изображений)
- ✅ Telegram Bot работает
- ✅ Готов к работе

---

## 🆘 РЕШЕНИЕ ПРОБЛЕМ

### Проблема: "Token not found" после добавления
**Решение:**
1. Проверьте, что файл .env сохранен
2. Убедитесь, что строки раскомментированы (нет # в начале)
3. Перезапустите агентов: `pkill -f 'elizaos' && ./start-agents.sh`

### Проблема: "Invalid token"
**Решение:**
1. Проверьте правильность токена на сайте провайдера
2. Убедитесь, что скопировали токен полностью
3. Проверьте, нет ли лишних пробелов

### Проблема: "Service will be inactive"
**Решение:**
1. Проверьте, что токен валидный
2. Убедитесь, что у вас есть кредиты на аккаунте
3. Проверьте логи на другие ошибки

---

## 📚 ПОЛЕЗНЫЕ ССЫЛКИ

- **Telegram Bot:** https://t.me/BotFather
- **FAL AI:** https://fal.ai
- **Replicate:** https://replicate.com
- **OpenRouter:** https://openrouter.ai
- **VIBEE Логи:** `./view-logs-simple.sh`
- **Проверка токенов:** `./check-and-fix-tokens.sh`

---

## ✅ ИТОГ

После добавления токенов:

1. **Все агенты будут работать на 100%**
2. **Все предупреждения исчезнут**
3. **NeuroPhoto сможет обучать LoRA и генерировать изображения**
4. **KOLS сможет отправлять сообщения в Telegram**
5. **VIBEE сможет отвечать через LLM**

**🎉 VIBEE будет полностью функциональным!**

---

## 📝 ЧЕКЛИСТ

- [ ] Получить Telegram Bot Token
- [ ] Получить FAL API Key
- [ ] Получить Replicate API Key
- [ ] Получить OpenRouter API Key
- [ ] Добавить токены в .env файл
- [ ] Перезапустить агентов
- [ ] Проверить логи
- [ ] Убедиться что нет предупреждений
- [ ] Протестировать функциональность

**✅ После выполнения всех пунктов VIBEE готов к работе!**
