import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolClient } from 'pg';
export declare class PostgresConnectionManager {
    private pool;
    private db;
    constructor(connectionString: string, rlsOwnerId?: string);
    getDatabase(): NodePgDatabase;
    getConnection(): Pool;
    getClient(): Promise<PoolClient>;
    testConnection(): Promise<boolean>;
    /**
     * Closes the connection pool.
     * @returns {Promise<void>}
     * @memberof PostgresConnectionManager
     */
    close(): Promise<void>;
}
