# Подключение к Production БД (Supabase)

## Вариант 1: Через Supabase Client (Recommended)

### 1. Получить credentials из Supabase Dashboard

- Project URL: `https://[PROJECT_ID].supabase.co`
- API Key: `anon` public key
- Database Password: из Project Settings → Database

### 2. Добавить в .env:

```bash
# Supabase Connection (PostgreSQL pooler for better performance)
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# Or direct connection (port 5432)
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
```

### 3. Применить миграции:

```bash
bun run db:migrate
```

### 4. Проверить подключение:

```bash
bun run db:studio
# Должен открыть Drizzle Studio с данными из Supabase
```

---

## Вариант 2: Через stage host

Если у вас есть stage environment в Supabase:

### 1. Получить stage DATABASE_URL

From Supabase Dashboard → Project Settings → Database → Connection String:

**Transaction mode** (recommended for Drizzle):
```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session mode** (if you need transactions):
```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 2. Добавить SSL параметры (если нужно):

```bash
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
```

### 3. Test connection:

```bash
# Простой тест подключения
DATABASE_URL="your_connection_string" bun test
```

---

## Создание таблицы user_models в Supabase

### Option 1: Через Drizzle Migrate (Recommended)

```bash
export DATABASE_URL="your_supabase_connection_string"
bun run db:migrate
```

### Option 2: Через Supabase SQL Editor

1. Открыть Supabase Dashboard → SQL Editor
2. Выполнить SQL из `drizzle/migrations/0000_gray_tomorrow_man.sql`:

```sql
CREATE TABLE "user_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "telegram_id" bigint NOT NULL,
  "bot_name" varchar(100) DEFAULT 'neuro_face_bot' NOT NULL,
  "model_name" varchar(100) NOT NULL,
  "model_url" text NOT NULL,
  "trigger_word" varchar(50) NOT NULL,
  "gender" varchar(10),
  "training_model" varchar(100),
  "status" varchar(20) DEFAULT 'training' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX "idx_user_models_telegram_id" ON "user_models" USING btree ("telegram_id");
CREATE INDEX "idx_user_models_bot_name" ON "user_models" USING btree ("bot_name");
CREATE INDEX "idx_user_models_status" ON "user_models" USING btree ("status");
CREATE INDEX "idx_user_models_is_active" ON "user_models" USING btree ("is_active");
CREATE INDEX "idx_user_models_telegram_bot" ON "user_models" USING btree ("telegram_id","bot_name");
```

---

## Проверка работы

### 1. Проверить подключение:

```bash
DATABASE_URL="your_connection_string" bun run dev
```

Вы должны увидеть в логах:
```
[Avatar Face Plugin] Database mode: PostgreSQL
[Avatar Face Plugin] PostgreSQL connected
```

### 2. Добавить тестовую модель:

Через Supabase Dashboard → Table Editor → user_models → Insert row:

```json
{
  "telegram_id": 123456,
  "bot_name": "neuro_face_bot",
  "model_name": "Test LoRA v1",
  "model_url": "fal-ai/flux-lora/test-model",
  "trigger_word": "NEURO_SAGE",
  "status": "completed",
  "is_active": true
}
```

### 3. Протестировать загрузку:

```bash
# Плагин должен загрузить модель и использовать ее для генерации
DATABASE_URL="your_connection_string" bun test
```

---

## Troubleshooting

### Connection timed out
- Проверьте что IP разрешен в Supabase Dashboard → Settings → Database → Connection pooling
- Используйте pooler (port 6543) вместо прямого подключения (port 5432)

### SSL required
Добавьте в connection string:
```
?sslmode=require
```

### Too many connections
Используйте connection pooler (port 6543) вместо прямого подключения

---

## Environment Variables для Production

```bash
# .env.production
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# API Keys
REPLICATE_API_KEY=your_key
FAL_KEY=your_key

# Optional: Supabase credentials (if using Supabase client directly)
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=your_anon_key
```
