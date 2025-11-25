import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/vibee',
  });

  const db = drizzle(pool);

  console.log('🔄 Starting database migration...');

  await migrate(db, { migrationsFolder: './drizzle/migrations' });

  console.log('✅ Migration completed successfully!');

  await pool.end();
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
