import type { IDatabaseAdapter } from '@elizaos/core';
/**
 * Test Database Manager - Creates isolated database instances for testing
 * Each test gets its own database to prevent interference and ensure isolation
 */
export declare class TestDatabaseManager {
    private testDatabases;
    private tempPaths;
    /**
     * Creates an isolated database for testing
     * Uses PostgreSQL for testing when available, falls back to mock database
     */
    createIsolatedDatabase(testId: string): Promise<IDatabaseAdapter>;
    /**
     * Creates a minimal mock database adapter for testing when real database unavailable
     * This is a FUNCTIONAL mock that actually stores data in memory
     */
    private createMockDatabase;
    /**
     * Cleanup a specific test database
     */
    cleanupDatabase(testId: string): Promise<void>;
    /**
     * Cleanup all test databases
     */
    cleanup(): Promise<void>;
    /**
     * Get statistics about test databases
     */
    getStats(): {
        activeDatabases: number;
        tempPaths: string[];
        memoryUsage: string;
    };
}
/**
 * Convenience function to create an isolated test database
 */
export declare function createTestDatabase(testId?: string): Promise<{
    adapter: IDatabaseAdapter;
    manager: TestDatabaseManager;
    testId: string;
}>;
//# sourceMappingURL=testDatabase.d.ts.map