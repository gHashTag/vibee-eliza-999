import { sql } from 'drizzle-orm';
import { logger } from '@elizaos/core';
import type { DrizzleDB } from '../types';

export class MigrationTracker {
  constructor(private db: DrizzleDB) {}

  async ensureSchema(): Promise<void> {
    try {
      await this.db.execute(sql`CREATE SCHEMA migrations`);
    } catch (error: any) {
      // For PGLite compatibility: ignore all schema creation errors
      // PGLite doesn't support schemas, so tables will be created in default namespace
      logger.debug(
        `[MigrationTracker] Schema creation failed or not supported (likely PGLite): ${error?.message || 'Unknown error'}`
      );
    }
  }

  async ensureTables(): Promise<void> {
    // Ensure schema exists (for PostgreSQL, but silently fails for PGLite)
    await this.ensureSchema();

    // For PGLite, we need to create tables without the schema prefix
    // since PGLite doesn't support schemas
    const isPGLite = this.isPGLite();
    const tablePrefix = isPGLite ? '' : 'migrations.';

    // Create migrations table (like Drizzle's __drizzle_migrations)
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.raw(tablePrefix + '_migrations')} (
          id SERIAL PRIMARY KEY,
          plugin_name TEXT NOT NULL,
          hash TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `);
    } catch (error: any) {
      logger.debug(
        `[MigrationTracker] Failed to create migrations table (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }

    // Create journal table (replaces _journal.json)
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.raw(tablePrefix + '_journal')} (
          plugin_name TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          dialect TEXT NOT NULL DEFAULT 'postgresql',
          entries JSONB NOT NULL DEFAULT '[]'
        )
      `);
    } catch (error: any) {
      logger.debug(
        `[MigrationTracker] Failed to create journal table (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }

    // Create snapshots table (replaces snapshot JSON files)
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.raw(tablePrefix + '_snapshots')} (
          id SERIAL PRIMARY KEY,
          plugin_name TEXT NOT NULL,
          idx INTEGER NOT NULL,
          snapshot JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(plugin_name, idx)
        )
      `);
    } catch (error: any) {
      logger.debug(
        `[MigrationTracker] Failed to create snapshots table (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Detect if we're using PGLite
   * PGLite doesn't support schemas, so we create tables in the default namespace
   */
  private isPGLite(): boolean {
    try {
      // Check if the db has a PGLite-specific property or method
      const dbAny = this.db as any;
      if (dbAny?.constructor?.name?.includes('Pglite')) {
        return true;
      }
      // Try to access PGLite-specific properties
      if (dbAny?.database || dbAny?.pg || dbAny?._client) {
        const client = dbAny.database || dbAny.pg || dbAny._client;
        if (client?.constructor?.name?.includes('PGlite')) {
          return true;
        }
      }
    } catch (e) {
      // If we can't detect, assume not PGLite
    }
    return false;
  }

  async getLastMigration(pluginName: string): Promise<{
    id: number;
    hash: string;
    created_at: string;
  } | null> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_migrations';

      const result = await this.db.execute(
        sql`SELECT id, hash, created_at
            FROM ${sql.raw(tableName)}
            WHERE plugin_name = ${pluginName}
            ORDER BY created_at DESC
            LIMIT 1`
      );
      return (result.rows[0] as any) || null;
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, return null
      logger.debug(
        `[MigrationTracker] Could not query last migration (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
      return null;
    }
  }

  async recordMigration(pluginName: string, hash: string, createdAt: number): Promise<void> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_migrations';

      await this.db.execute(
        sql`INSERT INTO ${sql.raw(tableName)} (plugin_name, hash, created_at)
            VALUES (${pluginName}, ${hash}, ${createdAt})`
      );
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, silently skip
      logger.debug(
        `[MigrationTracker] Could not record migration (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }
  }
}
