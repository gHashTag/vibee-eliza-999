import { sql } from 'drizzle-orm';
import { logger } from '@elizaos/core';
import type { DrizzleDB, Journal, JournalEntry } from '../types';

export class JournalStorage {
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

  async loadJournal(pluginName: string): Promise<Journal | null> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_journal';

      const result = await this.db.execute(
        sql`SELECT version, dialect, entries
            FROM ${sql.raw(tableName)}
            WHERE plugin_name = ${pluginName}`
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as any;
      return {
        version: row.version,
        dialect: row.dialect,
        entries: row.entries as JournalEntry[],
      };
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, return null
      logger.debug(
        `[JournalStorage] Could not load journal (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
      return null;
    }
  }

  async saveJournal(pluginName: string, journal: Journal): Promise<void> {
    try {
      const isPGLite = this.isPGLite();
      const tablePrefix = isPGLite ? '' : 'migrations.';
      const tableName = tablePrefix + '_journal';

      await this.db.execute(
        sql`INSERT INTO ${sql.raw(tableName)} (plugin_name, version, dialect, entries)
            VALUES (${pluginName}, ${journal.version}, ${journal.dialect}, ${JSON.stringify(journal.entries)}::jsonb)
            ON CONFLICT (plugin_name)
            DO UPDATE SET
              version = EXCLUDED.version,
              dialect = EXCLUDED.dialect,
              entries = EXCLUDED.entries`
      );
    } catch (error: any) {
      // For PGLite or development mode where tables don't exist, silently skip
      logger.debug(
        `[JournalStorage] Could not save journal (likely PGLite or development): ${error?.message || 'Unknown error'}`
      );
    }
  }

  async addEntry(pluginName: string, entry: JournalEntry): Promise<void> {
    // First, get the current journal
    let journal = await this.loadJournal(pluginName);

    // If no journal exists, create a new one
    if (!journal) {
      journal = {
        version: '7', // Latest Drizzle version
        dialect: 'postgresql',
        entries: [],
      };
    }

    // Add the new entry
    journal.entries.push(entry);

    // Save the updated journal
    await this.saveJournal(pluginName, journal);
  }

  async getNextIdx(pluginName: string): Promise<number> {
    const journal = await this.loadJournal(pluginName);

    if (!journal || journal.entries.length === 0) {
      return 0;
    }

    const lastEntry = journal.entries[journal.entries.length - 1];
    return lastEntry.idx + 1;
  }

  async updateJournal(
    pluginName: string,
    idx: number,
    tag: string,
    breakpoints: boolean = true
  ): Promise<void> {
    const entry: JournalEntry = {
      idx,
      version: '7',
      when: Date.now(),
      tag,
      breakpoints,
    };

    await this.addEntry(pluginName, entry);
  }
}
