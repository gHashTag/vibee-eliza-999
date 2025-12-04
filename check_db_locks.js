// Проверка и очистка активных блокировок в PostgreSQL
import pkg from 'pg';

const { Pool } = pkg;

const POSTGRES_URL = "postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkAndClearLocks() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: {
      require: true
    }
  });

  try {
    console.log('🔌 Подключаемся к PostgreSQL...');

    // 1. Проверяем все активные соединения
    console.log('\n📊 Активные соединения:');
    const connections = await pool.query(`
      SELECT
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        query
      FROM pg_stat_activity
      WHERE state IS NOT NULL
      ORDER BY query_start DESC
      LIMIT 20;
    `);
    connections.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. PID: ${row.pid}, State: ${row.state}, Query: ${row.query?.substring(0, 100)}...`);
    });

    // 2. Проверяем блокировки
    console.log('\n🔒 Активные блокировки:');
    const locks = await pool.query(`
      SELECT
        pl.pid,
        pl.mode,
        pl.locktype,
        pl.relation::regclass,
        pl.granted
      FROM pg_locks pl
      LEFT JOIN pg_stat_activity psa ON pl.pid = psa.pid
      WHERE pl.pid != pg_backend_pid()
      LIMIT 20;
    `);
    locks.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. PID: ${row.pid}, Lock: ${row.locktype}, Mode: ${row.mode}, Granted: ${row.granted}`);
    });

    // 3. Завершаем все соединения кроме текущего
    console.log('\n🛑 Завершаем все соединения...');
    const terminateResult = await pool.query(`
      SELECT pg_terminate_backend(pid) as terminated
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
      AND state != 'idle';
    `);
    console.log(`✅ Завершено соединений: ${terminateResult.rows.filter(r => r.terminated).length}`);

    // 4. Очищаем кеш запросов
    console.log('\n🧹 Очищаем кеш PostgreSQL...');
    await pool.query('DISCARD ALL;');
    console.log('✅ Кеш очищен!');

    console.log('\n🎉 База данных очищена и готова к работе!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndClearLocks();
