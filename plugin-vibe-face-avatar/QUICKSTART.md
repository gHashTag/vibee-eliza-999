# Avatar Face Plugin - Quick Start 🚀

## Instant Setup (SQLite - Zero Configuration)

```bash
# 1. Install dependencies
bun install

# 2. Run the plugin (SQLite database auto-created)
bun run dev
```

That's it! The plugin creates a local SQLite database automatically in `data/avatar-face.db`.

---

## Production Setup (PostgreSQL)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Set environment variable
export DATABASE_URL="postgresql://eliza:eliza_dev_password@localhost:5432/avatar_face"

# 3. Apply migrations
bun run db:migrate

# 4. Run the plugin
bun run dev
```

### Option 2: Cloud PostgreSQL (Supabase, Neon, Railway)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env and set your DATABASE_URL
# DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# 3. Apply migrations
bun run db:migrate

# 4. Run the plugin
bun run dev
```

---

## Database Commands

```bash
# Generate new migrations (after schema changes)
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Open Drizzle Studio (GUI for database)
bun run db:studio

# Push schema changes directly (dev only)
bun run db:push
```

---

## Testing

```bash
# Run all tests
bun test

# Tests automatically use SQLite
# Output: [Avatar Face Plugin] Database mode: SQLite
```

---

## How It Works

The plugin **automatically detects** which database to use:

| Environment | Database Used |
|-------------|---------------|
| No `DATABASE_URL` set | **SQLite** (local file) |
| `DATABASE_URL=sqlite` | **SQLite** (local file) |
| `DATABASE_URL=postgresql://...` | **PostgreSQL** |

**Fallback**: If PostgreSQL connection fails, the plugin falls back to SQLite with a warning.

---

## Database Schema

The plugin creates one table: `user_models`

```sql
CREATE TABLE user_models (
  id UUID PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  bot_name VARCHAR(100) DEFAULT 'neuro_face_bot',
  model_name VARCHAR(100) NOT NULL,
  model_url TEXT NOT NULL,
  trigger_word VARCHAR(50) NOT NULL,
  gender VARCHAR(10),
  status VARCHAR(20) DEFAULT 'training',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Adding a User Model

### Option 1: SQL Insert

```sql
INSERT INTO user_models (telegram_id, model_name, model_url, trigger_word, status)
VALUES (123456, 'My LoRA v1', 'fal-ai/user/my-model', 'NEURO_SAGE', 'completed');
```

### Option 2: Drizzle Studio GUI

```bash
bun run db:studio
# Opens: http://localhost:4983
```

Navigate to `user_models` table and add rows via GUI.

---

## Frontend

```bash
cd src/frontend
npm run dev
# Opens: http://localhost:5173
```

The frontend automatically rebranded to **VIBEE** (was QuantumCore).

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"
```bash
bun add better-sqlite3
```

### "Database is locked" (SQLite)
Normal behavior with multiple processes. The plugin uses WAL mode for concurrency.

### PostgreSQL won't connect
1. Check Docker is running: `docker compose ps`
2. Check DATABASE_URL is correct
3. Check migrations applied: `bun run db:migrate`

---

## File Structure

```
plugin-vibe-face-avatar/
├── data/                    # SQLite database (auto-created)
│   └── avatar-face.db
├── drizzle/
│   └── migrations/          # Database migrations
├── docker-compose.yml       # PostgreSQL setup
├── drizzle.config.ts        # Drizzle Kit config
├── .env.example             # Environment template
├── DATABASE.md              # Detailed DB guide
└── src/
    ├── db/
    │   ├── schema.ts        # Database schema
    │   └── client.ts        # Hybrid DB client (SQLite/PostgreSQL)
    └── frontend/            # React + Vite frontend
```

---

## Next Steps

1. **Configure API keys** in `.env`:
   - `REPLICATE_API_KEY`
   - `FAL_KEY`

2. **Add user models** to database (see above)

3. **Test generation**:
   ```bash
   # The plugin will automatically use user's LoRA models if available
   # Otherwise falls back to Flux Schnell
   ```

For detailed database documentation, see [DATABASE.md](./DATABASE.md).
