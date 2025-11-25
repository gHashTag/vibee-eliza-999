import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { usersTable, userSessionsTable, secretAccessLogsTable } from '../schema/userSchema';

// Создаем пул соединений
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Создаем drizzle instance
export const db = drizzle(pool);

// Экспортируем таблицы
export { usersTable, userSessionsTable, secretAccessLogsTable };
