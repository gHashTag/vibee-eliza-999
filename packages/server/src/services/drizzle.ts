import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { usersTable, userSessionsTable, secretAccessLogsTable } from '../schema/userSchema';
import { envValidator } from './environmentValidator';

// 🛡️ DATABASE CONFIGURATION SYSTEM
console.log('\n🛡️ DATABASE CONFIGURATION SYSTEM');
console.log('=' .repeat(70));

// Step 2: Get POSTGRES_URL with validation
const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.error('\n💥 CRITICAL ERROR: POSTGRES_URL is not set!');
  console.error('💥 This will cause database connection failures!');
  console.error('\n📋 TO FIX THIS ISSUE:');
  console.error('   1. Ensure POSTGRES_URL is in Infisical Cloud');
  console.error('   2. Verify Infisical environment variables are set:');
  console.error('      - INFISICAL_CLIENT_ID');
  console.error('      - INFISICAL_CLIENT_SECRET');
  console.error('      - INFISICAL_PROJECT_ID');
  console.error('      - INFISICAL_ENVIRONMENT');
  console.error('   3. Check that POSTGRES_URL is properly configured in Infisical');
  console.error('   4. Redeploy the application after secrets are updated');
  console.error('=' .repeat(70) + '\n');

  // Don't throw immediately - let the pool creation fail naturally
  // This allows other parts of the app to check the validation results
}

// Step 3: Create connection pool with proper error handling
console.log('\n🔧 Creating database connection pool...');

const poolConfig = {
  connectionString: postgresUrl,
  // Connection pool settings for production reliability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

console.log('📊 Pool Configuration:');
console.log(`   - Max connections: ${poolConfig.max}`);
console.log(`   - Idle timeout: ${poolConfig.idleTimeoutMillis}ms`);
console.log(`   - Connection timeout: ${poolConfig.connectionTimeoutMillis}ms`);

const pool = new Pool(poolConfig);

// Step 4: Set up comprehensive event handlers
pool.on('connect', (client) => {
  console.log('✅ DATABASE: New client connected to PostgreSQL');
  console.log(`   Process PID: ${(client as any).processID}`);
});

pool.on('acquire', (_client) => {
  console.log('🎯 DATABASE: Client acquired from pool');
});

pool.on('error', (err, _client) => {
  console.error('\n❌ DATABASE: Unexpected error on idle client');
  console.error(`   Error: ${err.message}`);
  console.error(`   Code: ${(err as any).code || 'N/A'}`);
  console.error(`   Hint: ${(err as any).hint || 'Check database connection'}`);
  console.error('   💡 This might be a network or configuration issue');
});

pool.on('remove', (_client) => {
  console.log('🗑️ DATABASE: Client removed from pool');
});

// Step 5: Test the connection immediately (only if POSTGRES_URL is set)
async function testDatabaseConnection() {
  // Only test if we have a valid PostgreSQL URL
  if (!postgresUrl) {
    console.log('\n🗄️ DATABASE: Using PGLite fallback mode (no PostgreSQL URL)');
    return true;
  }

  try {
    console.log('\n🧪 Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ DATABASE: Connection test successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   Database version: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}`);
    return true;
  } catch (error: any) {
    console.error('\n❌ DATABASE: Connection test FAILED!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    // Дополнительная диагностика для разных типов ошибок
    if (error.code === 'ECONNREFUSED') {
      console.error('   🔍 ECONNREFUSED - Подключение отклонено:');
      if (postgresUrl) {
        try {
          const url = new URL(postgresUrl);
          console.error(`      Хост: ${url.hostname}`);
          console.error(`      Порт: ${url.port || '5432'}`);
          console.error(`      База данных: ${url.pathname.substring(1)}`);
        } catch (e) {
          console.error(`      ⚠️  Не удалось разобрать POSTGRES_URL`);
        }
      } else {
        console.error(`      ⚠️  POSTGRES_URL не установлен!`);
      }
      console.error('   💡 Возможные причины:');
      console.error('      - База данных недоступна из сети Fly.io');
      console.error('      - Неправильный хост или порт в POSTGRES_URL');
      console.error('      - Файрвол блокирует подключение');
      console.error('      - База данных не запущена');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   🔍 ENOTFOUND - Хост не найден:');
      console.error('   💡 Возможные причины:');
      console.error('      - Неправильное имя хоста в POSTGRES_URL');
      console.error('      - Проблемы с DNS');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   🔍 ETIMEDOUT - Таймаут подключения:');
      console.error('   💡 Возможные причины:');
      console.error('      - База данных недоступна');
      console.error('      - Проблемы с сетью');
      console.error('      - Файрвол блокирует подключение');
    } else {
      console.error('   💡 Common issues:');
      console.error('      - Invalid POSTGRES_URL');
      console.error('      - Network connectivity problems');
      console.error('      - Database server is down');
      console.error('      - Firewall blocking connection');
    }
    console.error('');
    return false;
  }
}

// Run connection test immediately
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n✅ DATABASE: Ready for operations');
  } else {
    console.log('\n⚠️ DATABASE: Connection issues detected!');
    console.log('⚠️ DATABASE: Application may not function correctly');
  }
  console.log('=' .repeat(70) + '\n');
}).catch(err => {
  console.error('\n💥 DATABASE: Error during connection test:', err);
});

// Step 6: Create drizzle instance
export const db = drizzle(pool);

// Step 7: Export utilities and validation status
export { usersTable, userSessionsTable, secretAccessLogsTable };

// Export validation results for other services to check
// Note: These functions are safe to call at any time - they don't trigger validation immediately
export const isDatabaseConfigured = () => {
  // Check if POSTGRES_URL is configured OR if empty (PGLite fallback mode is acceptable)
  const url = process.env.POSTGRES_URL;

  // Return true if:
  // 1. POSTGRES_URL is set and looks valid (PostgreSQL mode)
  // 2. POSTGRES_URL is empty or unset (PGLite fallback mode)
  const hasValidPostgresUrl = url && (url.startsWith('postgresql://') || url.startsWith('postgres://'));
  const isEmpty = !url || url.trim() === '';

  return hasValidPostgresUrl || isEmpty;
};

export const getValidationReport = () => envValidator.getDetailedReport();
