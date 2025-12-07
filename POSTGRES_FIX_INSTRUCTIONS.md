# 🔧 ИНСТРУКЦИЯ: Исправление ошибки миграции PostgreSQL

## ❌ Проблема

```
Database migration failed: Failed query: CREATE SCHEMA IF NOT EXISTS migrations
```

**Причина:** `@elizaos/server` использует SQLite-синтаксис для PostgreSQL. В PostgreSQL команда `IF NOT EXISTS` работает только для CREATE TABLE, CREATE VIEW, CREATE INDEX, но НЕ для CREATE SCHEMA.

## ✅ Решения

### Решение 1: Использовать SQLite для разработки (РЕКОМЕНДУЕТСЯ)

**Шаги:**

1. Отредактировать `.env.dev`:
```bash
# Добавить в начало файла
DATABASE_URL=sqlite:./data/dev.sqlite
```

2. Создать директорию:
```bash
mkdir -p data
```

3. Запустить агента:
```bash
./start-sqlite.sh
```

**Плюсы:**
- ✅ Быстрое решение
- ✅ Не требует внешних зависимостей
- ✅ Идеально для разработки

**Минусы:**
- ❌ Не production-ready
- ❌ Не поддерживает много пользователей

---

### Решение 2: Исправить PostgreSQL (требует админских прав)

**Шаги:**

1. Подключиться к базе:
```bash
psql "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

2. Проверить права:
```sql
SELECT current_user, current_database();
SHOW rls;
```

3. Если нет прав на создание схемы:
```sql
-- Проверить существующие схемы
SELECT schema_name FROM information_schema.schemata;

-- Попробовать создать
CREATE SCHEMA migrations;
-- Если ошибка "permission denied" - проблема в правах доступа
```

---

### Решение 3: Патч @elizaos/server

**⚠️ НЕ РЕКОМЕНДУЕТСЯ** - патчи могут сломаться при обновлении

Если очень нужно, можно попробовать:
```bash
# Найти файл
find node_modules/@elizaos/server -name "*.js" -exec grep -l "CREATE SCHEMA" {} \;

# Заменить
sed -i 's/CREATE SCHEMA IF NOT EXISTS migrations/CREATE SCHEMA migrations/g' файл.js
```

---

## 🎯 Рекомендуемый workflow

### Для разработки (сейчас)
```bash
# Использовать SQLite
./start-sqlite.sh
```

### Для продакшена
1. Переключиться на PostgreSQL
2. Убедиться что есть права на создание схем
3. Или использовать готовое решение от Neon/Supabase

---

## 📊 Сравнение решений

| Критерий | SQLite | PostgreSQL |
|----------|--------|------------|
| Скорость настройки | ✅ 1 мин | ❌ 30+ мин |
| Сложность | ✅ Просто | ❌ Сложно |
| Production-ready | ❌ Нет | ✅ Да |
| Многопользовательский | ❌ Нет | ✅ Да |
| Скалирование | ❌ Нет | ✅ Да |

---

## 🚀 Текущий статус

**Применимо:** Решение 1 (SQLite)

**Команды:**
```bash
# Запуск с SQLite
./start-sqlite.sh

# Проверка логов
tail -f logs/vibee.log

# Остановка
pkill -f 'elizaos'
```

---

*Создано: 2025-12-04*
