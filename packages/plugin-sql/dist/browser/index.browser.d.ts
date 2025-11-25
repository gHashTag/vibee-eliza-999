import { type IDatabaseAdapter, type UUID, type Plugin } from '@elizaos/core/browser';
/**
 * Create a PGlite adapter for the browser (in-memory by default).
 * No Postgres fallback in browser builds.
 */
export declare function createDatabaseAdapter(_config: {
    dataDir?: string;
}, agentId: UUID): IDatabaseAdapter;
export declare const plugin: Plugin;
export default plugin;
export { DatabaseMigrationService } from './migration-service';
