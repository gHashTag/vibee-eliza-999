import { Pool } from 'pg';
import { usersTable, userSessionsTable, secretAccessLogsTable } from '../schema/userSchema';
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>> & {
    $client: Pool;
};
export { usersTable, userSessionsTable, secretAccessLogsTable };
