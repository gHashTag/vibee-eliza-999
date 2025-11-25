import { sql } from 'drizzle-orm';
import { logger } from '@elizaos/core';
import type { DrizzleDB, SchemaSnapshot } from '../types';

export class SnapshotStorage {
  constructor(private db: DrizzleDB) {}

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

  async saveSnapshot(pluginName: string, idx: number, snapshot: SchemaSnapshot): Promise<void> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_snapshots';

      await this.db.execute(
        sql`INSERT INTO ${sql.raw(tableName)} (plugin_name, idx, snapshot)
            VALUES (${pluginName}, ${idx}, ${JSON.stringify(snapshot)}::jsonb)
            ON CONFLICT (plugin_name, idx)
            DO UPDATE SET
              snapshot = EXCLUDED.snapshot,
              created_at = NOW()`
      );
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, silently skip
      logger.debug(
        `[SnapshotStorage] Could not save snapshot (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }
  }

  async loadSnapshot(pluginName: string, idx: number): Promise<SchemaSnapshot | null> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_snapshots';

      const result = await this.db.execute(
        sql`SELECT snapshot
            FROM ${sql.raw(tableName)}
            WHERE plugin_name = ${pluginName} AND idx = ${idx}`
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].snapshot as SchemaSnapshot;
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, return null
      logger.debug(
        `[SnapshotStorage] Could not load snapshot (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
      return null;
    }
  }

  async getLatestSnapshot(pluginName: string): Promise<SchemaSnapshot | null> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_snapshots';

      const result = await this.db.execute(
        sql`SELECT snapshot
            FROM ${sql.raw(tableName)}
            WHERE plugin_name = ${pluginName}
            ORDER BY idx DESC
            LIMIT 1`
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].snapshot as SchemaSnapshot;
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, return null
      logger.debug(
        `[SnapshotStorage] Could not get latest snapshot (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
      return null;
    }
  }

  async getAllSnapshots(pluginName: string): Promise<SchemaSnapshot[]> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_snapshots';

      const result = await this.db.execute(
        sql`SELECT snapshot
            FROM ${sql.raw(tableName)}
            WHERE plugin_name = ${pluginName}
            ORDER BY idx ASC`
      );

      return result.rows.map((row) => row.snapshot as SchemaSnapshot);
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, return empty array
      logger.debug(
        `[SnapshotStorage] Could not get all snapshots (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
      return [];
    }
  }
}
