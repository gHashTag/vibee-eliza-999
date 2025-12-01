/**
 * Сервис для создания сервера по умолчанию через database adapter
 * Работает с PostgreSQL и PGLite
 */

// ID сервера по умолчанию (используется в ElizaOS)
export const DEFAULT_SERVER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Создать сервер по умолчанию через database adapter
 * Этот метод работает с любым адаптером (PostgreSQL или PGLite)
 */
export async function ensureDefaultServerViaAdapter(server: any): Promise<void> {
  console.log('[SERVER-CREATOR] Checking if default server exists...');

  try {
    // Получаем database adapter из runtime
    const runtime = server.getRuntime();
    if (!runtime) {
      throw new Error('Server runtime not initialized');
    }

    const db = runtime.database;
    if (!db) {
      throw new Error('Database adapter not available');
    }

    // Проверяем существует ли сервер
    console.log('[SERVER-CREATOR] Querying for existing server...');
    const existingServers = await db
      .select()
      .from('message_servers')
      .where('id', '=', DEFAULT_SERVER_ID)
      .limit(1)
      .execute();

    if (existingServers && existingServers.length > 0) {
      console.log('[SERVER-CREATOR] ✅ Default server already exists');
      return;
    }

    // Создаем сервер по умолчанию
    console.log('[SERVER-CREATOR] Creating default server...');

    await db
      .insertInto('message_servers')
      .values({
        id: DEFAULT_SERVER_ID,
        name: 'Default Server',
        sourceType: 'local',
        sourceId: 'default',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflict('id')
      .doNothing()
      .execute();

    console.log('[SERVER-CREATOR] ✅ Default server created successfully');
  } catch (error) {
    console.error('[SERVER-CREATOR] ❌ Failed to create default server:', error);
    throw error;
  }
}
