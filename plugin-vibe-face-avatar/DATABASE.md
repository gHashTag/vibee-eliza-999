# Avatar Face Plugin - Database Setup

## Supported Databases

This plugin supports **two database modes**:

### 1. **SQLite** (Default - Zero Setup)
Perfect for development and testing. No installation required!

**Features:**
- File-based database (`data/avatar-face.db`)
- Automatic creation on first run
- Zero configuration
- Works offline

**Usage:**
```bash
# Just run the plugin - SQLite is used by default
bun run dev
```

---

### 2. **PostgreSQL** (Production Ready)
Recommended for production deployments with high load.

**Features:**
- Full ACID compliance
- Scalable for multiple users
- Better performance for concurrent operations
- Optional: PgAdmin for GUI management

---

## Quick Start

### Option A: SQLite (Simplest)

1. No setup needed! Just run:
```bash
cd /Users/playra/vibee-agent/plugin-vibe-face-avatar
bun run dev
```

Database file will be created automatically at `data/avatar-face.db`.

---

### Option B: PostgreSQL (Docker)

1. Start PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

2. Set environment variable:
```bash
export DATABASE_URL="postgresql://eliza:eliza_dev_password@localhost:5432/avatar_face"
```

3. Run migrations to create tables:
```bash
bun run db:migrate
```

4. Start the plugin:
```bash
bun run dev
```

**Access PgAdmin** (optional GUI):
- URL: http://localhost:5050
- Email: `admin@avatarface.local`
- Password: `admin`

---

## Database Migrations

### Generate migrations (after schema changes):
```bash
bun run db:generate
```

### Apply migrations to database:
```bash
bun run db:migrate
```

### View migration status:
```bash
bunx drizzle-kit migrate:status
```

---

## Switching Between Modes

The plugin automatically detects which database to use based on `DATABASE_URL`:

| DATABASE_URL | Mode Used |
|--------------|-----------|
| Not set or `sqlite` | SQLite (local file) |
| `postgresql://...` | PostgreSQL |

---

## Production Deployment

### 1. Using Cloud PostgreSQL (Recommended)

Set `DATABASE_URL` to your cloud provider:

**Supabase:**
```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

**Neon:**
```bash
export DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]"
```

**Railway:**
```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/railway"
```

### 2. Using Self-Hosted PostgreSQL

Use the provided `docker-compose.yml` with persistent volumes:

```bash
docker-compose up -d postgres
```

**Important:** Update credentials in production!

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"
```bash
bun add better-sqlite3
```

### "Database connection failed"
Check that:
1. PostgreSQL is running (`docker-compose ps`)
2. `DATABASE_URL` is correct
3. Migrations are applied (`bun run db:migrate`)

### SQLite "database is locked"
This is normal if you have multiple processes. SQLite uses WAL mode for better concurrency.

---

## File Structure

```
plugin-vibe-face-avatar/
├── data/                    # SQLite database files (auto-created)
│   └── avatar-face.db
├── drizzle/                 # Migrations
│   └── migrations/
├── docker-compose.yml       # PostgreSQL setup
├── drizzle.config.ts        # Drizzle Kit config
└── src/
    └── db/
        ├── schema.ts        # Database schema
        └── client.ts        # DB connection (hybrid mode)
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite` | Database connection string |

**Examples:**
```bash
# SQLite (default)
DATABASE_URL=sqlite

# Local PostgreSQL
DATABASE_URL=postgresql://eliza:eliza_dev_password@localhost:5432/avatar_face

# Cloud PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database
```
