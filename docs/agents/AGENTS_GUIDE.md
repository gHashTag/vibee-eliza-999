# 🤖 Руководство по агентам VIBEE

## 📋 Обзор агентов

В системе VIBEE теперь работают **3 агента**:

### 1. **VIBEE Agent** (Основной)
- **Имя**: AssistantAgent / VIBEE
- **Назначение**: Основной ИИ-агент-помощник
- **Интерфейс**: Web UI + Telegram
- **Команды**: Все базовые команды бота

### 2. **Instagram Expert** (Эксперт)
- **Имя**: Instagram Expert
- **Назначение**: Публикация постов в Instagram
- **Интерфейс**: Telegram
- **Команды**: 
  - `Опубликуй пост в Instagram <URL> с подписью тест`
  - `Пришлите фото с сообщением 'Опубликуй это в Instagram'`
- **Особенности**: Использует Meta Business API

### 3. **Нейрофото** (Лицо аватара) ⭐ НОВЫЙ!
- **Имя**: Нейрофото (Neurophoto)
- **Назначение**: Загрузка файлов, работа с аватарами, обход ограничений web chat
- **Интерфейс**: Web UI (вкладка "File Upload")
- **Команды**:
  - `Как загрузить файл?`
  - `Почему нельзя загружать файлы в web chat?`
  - `Помоги с аватаром`
- **Особенности**: Специализируется на Supabase Storage

## 🚀 Запуск всех агентов

```bash
cd /Users/playra/vibee-agent/
npm run dev
```

**Ожидаемые логи:**
```
[INIT] Loading character...
[INIT] Character loaded: AssistantAgent
[INIT] Initializing Instagram Expert agent
[INIT] Character loaded: Instagram Expert
[INIT] Initializing Neurophoto agent
[INIT] Character loaded: Нейрофото
[INIT] Plugin loaded: instagram
🐝 Инициализация Instagram плагина...
✅ Storage Service инициализирован (Supabase Storage с автоочисткой)
[INIT] Agent Server running on http://localhost:3000
```

## 🧪 Тестирование агентов

### 1. Тестирование VIBEE Agent (Основной)
**Открыть в браузере:**
```
http://localhost:3000
```

**Тест базовых команд:**
- Написать любое сообщение
- Проверить ответы на русском языке

### 2. Тестирование Instagram Expert
**Через Telegram:**
```
Опубликуй пост в Instagram https://picsum.photos/800/600 с подписью тест
```

**Или отправить фото с сообщением:**
```
Пришлите фото + сообщение "Опубликуй это в Instagram"
```

### 3. Тестирование Нейрофото ⭐
**В Web UI:**
1. Открыть http://localhost:3000
2. Перейти на вкладку **"File Upload"** или **"Upload"**
3. Перетащить изображение
4. Получить публичный URL

**Через Telegram:**
```
Как загрузить файл через веб-интерфейс?
Почему нельзя загружать файлы в web chat?
Помоги с аватаром
```

## 🔧 Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                    ВЕБ-ИНТЕРФЕЙС                          │
│                  http://localhost:3000                     │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  VIBEE Agent   │  │ File Upload    │  │ File Upload │ │
│  │  (Основной)    │  │ (Нейрофото)    │  │ (React UI)  │ │
│  └────────┬───────┘  └────────┬───────┘  └─────────────┘ │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                  TELEGRAM                                │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ VIBEE Agent      │  │ Instagram Expert │  Нейрофото  │
│  │ (Основной)       │  │ (Публикация IG)  │ (Помощь)   │
│  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## 📊 Сравнение агентов

| Агент | Имя | Назначение | Web UI | Telegram | Instagram | Файлы |
|-------|-----|------------|--------|----------|-----------|-------|
| VIBEE | AssistantAgent | Основной ИИ | ✅ | ✅ | ❌ | ❌ |
| Instagram | Instagram Expert | Публикация IG | ❌ | ✅ | ✅ | ✅ |
| Нейрофото | Нейрофото | Файлы, аватары | ✅ (File Upload) | ✅ | ❌ | ✅ |

## 🔑 Ключевые команды

### Для Нейрофото:
```bash
# Загрузка файла (Web UI)
Открыть File Upload → Перетащить файл → Получить URL

# Помощь (Telegram)
Как загрузить файл?
Почему web chat не поддерживает файлы?
Помоги с аватаром
```

### Для Instagram Expert:
```bash
# Публикация с URL (Telegram)
Опубликуй пост в Instagram https://... с подписью тест

# Публикация с фото (Telegram)
Отправить фото + "Опубликуй это в Instagram"
```

### Для VIBEE Agent:
```bash
# Базовые команды (Web UI или Telegram)
Привет!
Как дела?
Помоги с задачей
```

## 📁 Файлы агентов

```
/Users/playra/vibee-agent/
├── src/
│   ├── character.ts                      # VIBEE Agent
│   └── index.ts                          # Все агенты
│
├── characters/
│   ├── instagram.ts                      # Instagram Expert
│   └── neurophoto.ts                     # Нейрофото ⭐
│
├── src/frontend/
│   ├── supabase.ts                       # Supabase клиент
│   ├── components/FileUpload.tsx         # React компонент
│   └── index.tsx                         # Панели интерфейса
│
└── plugin-vibe-instagram/
    └── src/services/storageService.ts    # Storage сервис
```

## ⚠️ Важные моменты

### 1. Запуск из корня
```bash
cd /Users/playra/vibee-agent/ && npm run dev
```

### 2. Все агенты активны одновременно
- VIBEE Agent (основной)
- Instagram Expert (для IG постов)
- Нейрофото (для файлов)

### 3. Разные интерфейсы
- **VIBEE Agent**: Работает везде (Web + Telegram)
- **Instagram Expert**: Только Telegram
- **Нейрофото**: Web UI (File Upload) + Telegram (помощь)

## 🎯 Использование по задачам

### Задача: Общение с ИИ
→ **VIBEE Agent** (Web UI или Telegram)

### Задача: Публикация в Instagram
→ **Instagram Expert** (Telegram)

### Задача: Загрузка файлов, работа с аватарами
→ **Нейрофото** (Web UI: File Upload или Telegram)

## 📚 Документация

- `FILE_UPLOAD_SYSTEM.md` - система загрузки файлов
- `TESTING_GUIDE.md` - руководство по тестированию
- `INFISICAL_SETUP.md` - настройка Supabase
- `AGENTS_GUIDE.md` - этот файл

---

## 📌 **ИТОГОВОЕ РЕЗЮМЕ**

✅ **3 агента работают одновременно**
✅ **VIBEE Agent** - основной помощник
✅ **Instagram Expert** - публикация в Instagram
✅ **Нейрофото** - загрузка файлов и аватары ⭐
✅ **Все агенты запускаются одной командой**
✅ **Web UI + Telegram интерфейсы**

**Для начала работы:**
1. `cd /Users/playra/vibee-agent/ && npm run dev`
2. Открыть http://localhost:3000
3. Выбрать вкладку "File Upload" для Нейрофото
4. Отправлять IG команды в Telegram для Instagram Expert
5. Общаться с VIBEE Agent в любом интерфейсе

**Система готова к использованию!** 🚀
