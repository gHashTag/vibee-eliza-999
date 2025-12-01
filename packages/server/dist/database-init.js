/**
 * Инициализация базы данных для VIBEE
 * Создает необходимые записи при запуске сервера
 */
// ID сервера по умолчанию (используется в ElizaOS)
export const DEFAULT_SERVER_ID = '00000000-0000-0000-0000-000000000000';
/**
 * Проверить и создать сервер по умолчанию
 */
export async function ensureDefaultServer() {
    try {
        console.log('[DB-INIT] Checking for default server...');
        // Динамически импортируем pg модуль
        const { Pool } = await import('pg');
        // Получаем строку подключения из переменных окружения
        const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!postgresUrl || postgresUrl.trim() === '') {
            console.log('[DB-INIT] ℹ️ Using PGLite, checking via database adapter...');
            // При использовании PGLite, проверим через database adapter
            // Это будет выполнено после инициализации SQL plugin
            return;
        }
        // Создаем пул соединений
        const pool = new Pool({
            connectionString: postgresUrl,
        });
        try {
            // Проверяем существует ли сервер по умолчанию
            const checkResult = await pool.query('SELECT id FROM message_servers WHERE id = $1', [DEFAULT_SERVER_ID]);
            if (checkResult.rows.length === 0) {
                console.log('[DB-INIT] Creating default server...');
                // Создаем сервер по умолчанию
                await pool.query('INSERT INTO message_servers (id, name, source_type, source_id, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())', [
                    DEFAULT_SERVER_ID,
                    'Default Server',
                    'local',
                    'default',
                    '{}',
                ]);
                console.log('[DB-INIT] ✅ Default server created successfully');
            }
            else {
                console.log('[DB-INIT] ✅ Default server already exists');
            }
        }
        finally {
            // Закрываем пул
            await pool.end();
        }
    }
    catch (error) {
        console.error('[DB-INIT] ❌ Failed to ensure default server:', error);
        // Не блокируем запуск сервера, просто логируем ошибку
    }
}
/**
 * Инициализировать все необходимые записи в БД
 */
export async function initializeDatabase() {
    console.log('[DB-INIT] Starting database initialization...');
    await ensureDefaultServer();
    console.log('[DB-INIT] Database initialization complete');
}
