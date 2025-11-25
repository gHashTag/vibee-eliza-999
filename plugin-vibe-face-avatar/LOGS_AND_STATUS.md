# 📊 Как проверить статус тренировки моделей

## 🔍 Где смотреть логи

### 1. **API Server логи** (основной источник)
```bash
# Если запущен через bun run api:dev
# Логи в том же терминале где запустили

# Проверить статус через command_status или read_terminal
```

**Что смотрим:**
- `[API] Generating image for {user_id} with model {model_id}` - запрос на генерацию
- `[API] Found user model URL: {url}` - найдена модель в БД
- `✅ [Env Init] Зарегистрировано провайдеров: N` - провайдеры инициализированы

### 2. **Frontend логи** (браузер)
```bash
# Chrome/Safari DevTools -> Console
# Смотрим:
- Запросы к /api/models (загрузка моделей)
- Запросы к /api/generate (генерация)
- Ошибки fetch
```

### 3. **База данных** (проверка статуса)
```bash
# Посмотреть все модели
sqlite3 data/avatar-face.db "SELECT * FROM user_models"

# Посмотреть только готовые
sqlite3 data/avatar-face.db "SELECT model_name, status, trigger_word FROM user_models WHERE status = 'completed'"

# Подробная информация
sqlite3 data/avatar-face.db "SELECT 
  model_name, 
  status, 
  is_active, 
  trigger_word,
  created_at 
FROM user_models 
ORDER BY created_at DESC"
```

---

## ✅ Как понять что модель натренирована?

### **Проверка в БД:**
```bash
sqlite3 data/avatar-face.db "SELECT model_name, status FROM user_models WHERE telegram_id = 123456"
```

**Статусы:**
- `pending` - ожидает тренировки
- `training` - в процессе
- `completed` - ✅ **ГОТОВА**
- `failed` - ошибка

### **Проверка через API:**
```bash
curl "http://localhost:3001/api/models?telegram_id=123456"
```

Если модель возвращается в ответе - она готова к использованию.

### **Проверка в UI:**
- Зайти на страницу **NeuroPhoto**
- В секции "My Digital Bodies" должна отображаться модель
- Если видна - натренирована ✅

---

## 📝 Текущее состояние (на 21.11.2025)

### **В базе данных:**
```
✅ Cyberpunk Warrior LoRA (completed, active)
   - trigger_word: NEURO_SAGE
   - created: 2025-11-20 10:11:39

✅ Elephant LoRA (Fal.ai) (completed, active)
   - trigger_word: NEURO_SAGE
   - created: 2025-11-20 11:42:51
```

### **Логи API сервера:**
```
[Avatar Face Plugin] SQLite connected ✅
[API] Generating image for 123456 with model 931c35b5...
[API] Found user model URL: fal-ai/flux-lora/cyberpunk-warrior-v1 ✅
```

**Вывод:** Обе модели натренированы и готовы к использованию! 🎉

---

## 🚨 Частые проблемы

### 1. **"No suitable provider found"**
**Причина:** Нет API ключей в `.env`
**Решение:**
```bash
echo "FAL_KEY=fal_xxxxx" >> .env
# Перезапустить API
pkill -f "src/api/server.ts" && bun run api:dev
```

### 2. **Модель не отображается в UI**
**Проверить:**
```bash
# 1. Модель есть в БД?
sqlite3 data/avatar-face.db "SELECT * FROM user_models WHERE is_active = 1"

# 2. API возвращает модели?
curl "http://localhost:3001/api/models?telegram_id=123456"

# 3. Frontend делает запрос?
# Открыть Chrome DevTools -> Network -> проверить /api/models
```

### 3. **"Connection refused"**
**Решение:**
```bash
# API сервер не запущен
bun run api:dev

# Проверить порт
lsof -i :3001
```

---

## 📊 Команды для мониторинга

```bash
# 1. Проверить все процессы
ps aux | grep -E "api:dev|npm run dev"

# 2. Проверить порты
lsof -i :3001  # API
lsof -i :5173  # Frontend

# 3. Проверить логи API (если в фоне)
tail -f /path/to/api/logs

# 4. Проверить здоровье API
curl http://localhost:3001/api/health
```

---

## 🎯 Быстрая диагностика

```bash
# Запустить полную проверку:
cd /Users/playra/vibee-agent/plugin-vibe-face-avatar

# 1. БД
sqlite3 data/avatar-face.db "SELECT COUNT(*) as total, 
  SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as ready 
FROM user_models"

# 2. API
curl http://localhost:3001/api/health

# 3. Модели
curl "http://localhost:3001/api/models?telegram_id=123456" | jq

# 4. Провайдеры (смотрим логи при запуске)
pkill -f "src/api/server.ts" && bun run api:dev
# Ищем: "✅ [Env Init] Зарегистрировано провайдеров: N"
```
