/**
 * Database testing registry - ensures consistent database testing across all packages
 * Replaces fragile database adapter fallback logic with explicit test database management
 */
import type { IDatabaseAdapter } from '@elizaos/core';
export interface DatabaseTestCapabilities {
    isReady: boolean;
    tables: string[];
    supportsTransactions: boolean;
    adapter: string;
}
export interface TestDatabaseConfig {
    /** Database type preference */
    preferredAdapter: 'postgresql' | 'auto';
    /** Whether to allow fallback to mock */
    allowMockFallback: boolean;
    /** Test isolation level */
    isolation: 'shared' | 'per-test' | 'per-suite';
    /** Connection timeout */
    timeoutMs: number;
    /** Test data persistence */
    persistData: boolean;
}
export declare const DEFAULT_TEST_DB_CONFIG: TestDatabaseConfig;
/**
 * Centralized database testing management
 */
export declare class DatabaseTestRegistry {
    private static instance;
    private adapterCache;
    private testDatabases;
    private defaultConfig;
    private constructor();
    static getInstance(config?: TestDatabaseConfig): DatabaseTestRegistry;
    /**
     * Get a test database adapter with explicit requirements
     */
    getTestDatabase(testId: string, config?: Partial<TestDatabaseConfig>): Promise<TestDatabaseInstance>;
    private createTestDatabase;
    private createMockAdapter;
    private getAdapterCapabilities;
    private initializeTestSchema;
    private validateDatabaseInstance;
    /**
     * Clean up a specific test database
     */
    cleanupTestDatabase(testId: string): Promise<void>;
    /**
     * Clean up all test databases
     */
    cleanupAll(): Promise<void>;
    /**
     * Validate test requirements before running tests
     */
    validateTestRequirements(requirements: DatabaseTestRequirements): Promise<DatabaseValidationResult>;
    /**
     * Get test database statistics
     */
    getTestDatabaseStats(): TestDatabaseStats;
}
export interface TestDatabaseInstance {
    testId: string;
    adapter: IDatabaseAdapter;
    capabilities: DatabaseTestCapabilities;
    config: TestDatabaseConfig;
    createdAt: Date;
    adapterType: string;
}
export interface DatabaseTestRequirements {
    requiredAdapters: 'postgresql'[];
    performanceRequirements?: {
        maxQueryTime: number;
        maxConnectionTime: number;
    };
}
export interface DatabaseValidationResult {
    isValid: boolean;
    _errors: string[];
    warnings: string[];
    recommendations: string[];
}
export interface TestDatabaseStats {
    totalDatabases: number;
    adapterTypes: Map<string, number>;
    oldestDatabase: TestDatabaseInstance | null;
    newestDatabase: TestDatabaseInstance | null;
}
//# sourceMappingURL=DatabaseTestRegistry.d.ts.map