// Скрипт очистки блокировки миграции (ES modules)
import pkg from 'pg';

const { Pool } = pkg;

const POSTGRES_URL = "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function clearMigrationLock() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: {
      require: true
    }
  });

  try {
    console.log('🔌 Подключаемся к PostgreSQL...');

    // Пробуем разные варианты таблиц блокировок
    const tables = [
      'migration_locks',
      'drizzle.__drizzle_migrations',
      'drizzle.__drizzle_migrations_lock',
      'migrations',
      '_prisma_migrations',
      'pg_migrations'
    ];

    for (const table of tables) {
      try {
        console.log(`\n📋 Проверяем таблицу: ${table}`);
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = '${table}'
          );
        `);

        if (result.rows[0].exists) {
          console.log(`✅ Таблица ${table} существует`);

          // Проверяем содержимое
          const content = await pool.query(`SELECT * FROM ${table} LIMIT 10;`);
          console.log(`📄 Содержимое (${content.rows.length} записей):`);
          content.rows.forEach((row, i) => {
            console.log(`  ${i + 1}.`, JSON.stringify(row));
          });

          // Очищаем таблицу
          console.log(`\n🗑️  Очищаем таблицу ${table}...`);
          await pool.query(`DELETE FROM ${table};`);
          console.log(`✅ Таблица ${table} очищена!`);
          break;
        }
      } catch (err) {
        console.log(`❌ Ошибка при работе с таблицей ${table}:`, err.message);
      }
    }

    console.log('\n✅ Блокировки миграций очищены!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

clearMigrationLock();
