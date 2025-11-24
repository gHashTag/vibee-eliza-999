import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import postgres from 'postgres';
import { Database } from 'bun:sqlite';
import * as schemaPg from './schema';
import * as schemaSqlite from './schema.sqlite';
import * as fs from 'fs';
import * as path from 'path';

// Database mode detection
// Try POSTGRES_URL first (ElizaOS standard), fallback to DATABASE_URL
const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const USE_SQLITE = !DATABASE_URL || DATABASE_URL === 'sqlite' || DATABASE_URL.startsWith('sqlite:');

// Use appropriate schema based on database mode
const schema = USE_SQLITE ? schemaSqlite : schemaPg;

/**
 * Drizzle ORM Client for Avatar Face Plugin
 * 
 * Supports TWO modes:
 * - SQLite (local file-based, zero setup) - default for development
 * - PostgreSQL (production-ready, scalable)
 * 
 * Set DATABASE_URL to switch to PostgreSQL:
 * - PostgreSQL: DATABASE_URL=postgresql://user:password@host:5432/database
 * - SQLite: Leave DATABASE_URL empty or set to "sqlite"
 * 
 * Best practice from ElizaOS: Use Proxy pattern for lazy loading
 */

// Lazy-initialized DB instances
let _dbPg: ReturnType<typeof drizzlePg> | null = null;
let _dbSqlite: ReturnType<typeof drizzleSqlite> | null = null;

/**
 * Get PostgreSQL DATABASE_URL from environment
 */
function getDatabaseUrl(): string {
  if (!DATABASE_URL || DATABASE_URL === 'sqlite') {
    throw new Error('DATABASE_URL not configured for PostgreSQL mode');
  }
  return DATABASE_URL;
}

/**
 * Get SQLite database path
 * Creates data directory if it doesn't exist
 */
function getSqlitePath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'avatar-face.db');
}

/**
 * Initialize SQLite database
 */
function initSqlite() {
  if (!_dbSqlite) {
    const dbPath = getSqlitePath();
    console.log(`[Avatar Face Plugin] Connecting to SQLite: ${dbPath}`);
    const sqlite = new Database(dbPath);
    
    _dbSqlite = drizzleSqlite(sqlite, { schema });
    console.log('[Avatar Face Plugin] SQLite connected');
  }
  return _dbSqlite;
}

/**
 * Initialize PostgreSQL database
 */
function initPostgres() {
  if (!_dbPg) {
    const url = getDatabaseUrl();
    console.log('[Avatar Face Plugin] Connecting to PostgreSQL...');
    const queryClient = postgres(url, {
      ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10, // Connection pool size
      idle_timeout: 30, // Seconds
      connect_timeout: 10, // Seconds
    });
    _dbPg = drizzlePg(queryClient, { schema });
    console.log('[Avatar Face Plugin] PostgreSQL connected');
  }
  return _dbPg;
}

/**
 * Lazy-initialized Drizzle client
 * 
 * Usage:
 * ```typescript
 * import { db } from '@/db/client';
 * const models = await db.select().from(userModels);
 * ```
 */
export const db = new Proxy({} as ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleSqlite>, {
  get(target, prop) {
    try {
      if (USE_SQLITE) {
        return (initSqlite() as any)[prop];
      } else {
        return (initPostgres() as any)[prop];
      }
    } catch (error) {
      console.error('[Avatar Face Plugin] Database connection failed:', error);
      console.warn('[Avatar Face Plugin] Falling back to SQLite...');
      return (initSqlite() as any)[prop];
    }
  }
});

/**
 * Export schema for use in queries
 */
export const userModels = USE_SQLITE ? schemaSqlite.userModels : schemaPg.userModels;

/**
 * Export database mode for debugging
 */
export const DB_MODE = USE_SQLITE ? 'SQLite' : 'PostgreSQL';
console.log(`[Avatar Face Plugin] Database mode: ${DB_MODE}`);

