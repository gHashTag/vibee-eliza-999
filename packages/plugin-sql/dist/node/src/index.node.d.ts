import type { IDatabaseAdapter, UUID } from '@elizaos/core';
import { type Plugin } from '@elizaos/core';
export declare function createDatabaseAdapter(config: {
    dataDir?: string;
    postgresUrl?: string;
}, agentId: UUID): IDatabaseAdapter;
export declare const plugin: Plugin;
export default plugin;
export { DatabaseMigrationService } from './migration-service';
export { installRLSFunctions, getOrCreateRlsOwner, setOwnerContext, assignAgentToOwner, applyRLSToNewTables, uninstallRLS, } from './rls';
