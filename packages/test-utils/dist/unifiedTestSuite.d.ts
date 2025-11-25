/**
 * Unified Testing Infrastructure for ElizaOS
 *
 * This module provides the standardized TestSuite interface that all ElizaOS packages
 * should use for consistent testing across the monorepo. It integrates with Bun's
 * testing framework while providing a unified API.
 */
/**
 * Unified TestSuite class for consistent testing across ElizaOS packages
 * This provides the same interface used by all migrated packages
 */
export declare class TestSuite {
    private name;
    private tests;
    private beforeEachFn?;
    private afterEachFn?;
    constructor(name: string);
    beforeEach<T = any>(fn: (context: T) => Promise<void> | void): void;
    afterEach<T = any>(fn: (context: T) => Promise<void> | void): void;
    addTest<T = any>(name: string, fn: (context: T) => Promise<void> | void): void;
    run(): void;
}
/**
 * Helper function to create a TestSuite for unit tests
 * This is the primary way packages should create test suites
 */
export declare function createUnitTest(name: string): TestSuite;
/**
 * Helper function to create a TestSuite for plugin tests
 */
export declare function createPluginTest(name: string): TestSuite;
/**
 * Helper function to create a TestSuite for integration tests
 */
export declare function createIntegrationTest(name: string): TestSuite;
/**
 * Helper function to create a TestSuite for E2E tests
 */
export declare function createE2ETest(name: string): TestSuite;
//# sourceMappingURL=unifiedTestSuite.d.ts.map