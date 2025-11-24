---
name: vibe-infisical
agent_id: vibe-infisical
description: 🔐 Auto-activates for Infisical secret management, cloud-first security, and environment configuration
keywords:
  - infisical
  - секреты
  - secrets
  - environment
  - переменные окружения
  - API keys
  - токены
  - cloud-first
  - безопасность
  - security
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 🔐 Vibe Infisical Skill - Cloud-First Security

Этот скилл **автоматически активируется** когда упоминается Infisical, секреты, API ключи или управление переменными окружения.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `infisical`, `Инфисикал`
- `секреты`, `secrets`, `API keys`, `токены`
- `переменные окружения`, `environment variables`
- `.env`, `.env.dev`, `.infisical.env`
- `cloud-first`, `безопасность`, `security`
- `CLIENT_ID`, `CLIENT_SECRET`
- `infisical secrets`, `загрузить секреты`

### Примеры:
```
"Как настроить Infisical для проекта"
→ Авто-активируется vibe-infisical

"Нужно добавить API ключ в Infisical"
→ Авто-активируется vibe-infisical

"Проверь загрузку секретов"
→ Авто-активируется vibe-infisical
```

## 🎯 Что Делает

1. **Infisical Setup**: Настройка клиента и проекта
2. **Secret Management**: Добавление, обновление, удаление секретов
3. **Cloud-First**: Перенос всех ключей в облако
4. **Environment Config**: Настройка .env файлов
5. **Security Audit**: Проверка утечек секретов
6. **CLI Integration**: Работа с Infisical CLI

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для безопасности
trigger_threshold: 0.8     # Высокий порог активации (80%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при работе с секретами
- **Координируется с**: vibe-devops, vibe-security, vibe-coder
- **Результат**: Безопасная конфигурация + проверки

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-infisical",
  description="Setup Infisical for VIBEE project",
  prompt="Configure .infisical.env and migrate all secrets to cloud"
)
```

### Автоматически:
```
"Добавь TELEGRAM_BOT_TOKEN в Infisical"
→ vibe-infisical активируется автоматически
```

## 🎨 Специализация

- ✅ **Infisical CLI**: Команды и интеграция
- ✅ **Secret Migration**: Перенос из .env в облако
- ✅ **Environment Setup**: .env.dev, .env.prod конфигурация
- ✅ **Security Scanning**: Поиск секретов в коде
- ✅ **Token Management**: CLIENT_ID, CLIENT_SECRET
- ✅ **Cloud-First**: Архитектурные принципы
- ✅ **Git Security**: .gitignore правила
- ✅ **Database Schema**: Drizzle ORM + Infisical secrets
- ✅ **Configuration Management**: 50+ переменных централизованно

## 📚 Паттерны (Best Practices)

### Environment Files:
```bash
# .infisical.env (ONLY Infisical credentials!)
INFISICAL_CLIENT_ID=88f...
INFISICAL_CLIENT_SECRET=b37...
INFISICAL_PROJECT_ID=fd7...
INFISICAL_ENVIRONMENT=dev

# .env.dev (Dev settings + minimal secrets)
NODE_ENV=development
# Some dev tokens for testing
```

### Infisical Commands:
```bash
# Setup
infisical login
infisical init --projectId=<ID>
infisical secrets pull --env=dev

# Management
infisical secrets list --env=dev
infisical secrets set TELEGRAM_BOT_TOKEN=<token> --env=dev
infisical status

# Production
infisical secrets pull --env=prod
```

### Database Schema with Infisical:
```typescript
// Drizzle Schema (secrets loaded from Infisical)
export const userTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
  username: varchar('username'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Repository with environment-aware DB
export class UserRepository {
  async findByTelegramId(telegramId: number): Promise<User | null> {
    // DATABASE_URL loaded from Infisical at runtime
    const db = runtime.databaseAdapter.db;
    const result = await db.select()
      .from(userTable)
      .where(eq(userTable.telegramId, telegramId))
      .limit(1);

    return result[0] || null;
  }
}
```

### Configuration Categories in Infisical:
```bash
# 🔐 API Keys (from Infisical)
TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, ANTHROPIC_API_KEY
FAL_KEY, REPLICATE_API_KEY, OPENROUTER_API_KEY

# 🗄️ Database (from Infisical)
DATABASE_URL, NEON_CONNECTION_STRING
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 🎤 Media Services (from Infisical)
ELEVENLABS_API_KEY, CARTESIA_API_KEY
SYNC_LABS_API_KEY

# 🌍 Infrastructure (from Infisical)
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
GITHUB_TOKEN, MINIMAX_API_KEY

# 📱 Social Platforms (from Infisical)
INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID
TWITTER_API_KEY, TWITTER_API_SECRET
```

### Plugin Configuration Pattern:
```typescript
export const myPlugin: Plugin = {
  name: 'my-plugin',

  // Dependencies load first (from Infisical)
  dependencies: ['@elizaos/plugin-bootstrap'],

  actions: [myAction],
  services: [MyService],

  // Database schema
  schema: mySchema,

  // Initialization (secrets available from Infisical)
  init: async (config) => {
    const apiKey = config.runtime.getSetting('API_KEY');
    if (!apiKey) {
      throw new Error('API_KEY not found in Infisical');
    }
  }
};
```

### Security Rules:
- ✅ Все секреты в Infisical Cloud
- ✅ .env файлы содержат ТОЛЬКО Infisical credentials
- ✅ 50+ переменных управляются централизованно
- ✅ Drizzle схемы используют секреты из Infisical
- ✅ НИКОГДА не коммитить API ключи
- ✅ Production secrets в отдельном environment

### Migration Strategy:
```bash
# Step 1: Audit existing secrets
grep -r "API_KEY\|TOKEN" src/ --include="*.ts" --include="*.js"

# Step 2: Add to Infisical
infisical secrets set OPENAI_API_KEY=<key> --env=dev
infisical secrets set OPENAI_API_KEY=<key> --env=prod

# Step 3: Update code
runtime.getSetting('OPENAI_API_KEY') // Instead of process.env

# Step 4: Remove from .env
# Delete from all .env files

# Step 5: Test
bun test
```

**Автоматически делает управление секретами безопасным и облачным!** 🔐☁️
