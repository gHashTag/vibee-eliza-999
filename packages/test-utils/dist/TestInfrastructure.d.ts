import type { IAgentRuntime, IDatabaseAdapter, UUID, Memory } from '@elizaos/core';
export interface TestEnvironmentConfig {
    /** Test isolation level */
    isolation: 'unit' | 'integration' | 'e2e';
    /** Use real database vs in-memory */
    useRealDatabase: boolean;
    /** Performance thresholds */
    performanceThresholds?: PerformanceThresholds;
    /** Test data configuration */
    testData?: TestDataConfig;
}
export interface PerformanceThresholds {
    actionExecution: number;
    memoryRetrieval: number;
    databaseQuery: number;
    modelInference: number;
}
export interface TestDataConfig {
    entities: number;
    memories: number;
    messages: number;
    relationships: number;
}
export declare const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds;
export declare const DEFAULT_TEST_DATA: TestDataConfig;
/**
 * Test environment manager - ensures proper setup/teardown
 */
export declare class TestEnvironment {
    private static activeEnvironments;
    private runtime;
    private databaseAdapter;
    private testId;
    private config;
    constructor(testId: string, config: TestEnvironmentConfig);
    static create(testId: string, config?: Partial<TestEnvironmentConfig>): Promise<TestEnvironment>;
    private setup;
    private createTestCharacter;
    private seedTestData;
    teardown(): Promise<void>;
    private cleanupTestData;
    static teardownAll(): Promise<void>;
    get testRuntime(): IAgentRuntime;
    get testDatabase(): IDatabaseAdapter;
    /**
     * Performance monitoring wrapper
     */
    measurePerformance<T>(operation: () => Promise<T>, threshold: keyof PerformanceThresholds, description: string): Promise<T>;
}
/**
 * Test data builder for creating realistic test scenarios
 */
export declare class TestDataBuilder {
    static createEntity(runtime: IAgentRuntime, data: {
        names: string[];
        metadata?: Record<string, any>;
    }): Promise<UUID>;
    static createTestConversation(runtime: IAgentRuntime, participants: string[], messageCount?: number): Promise<{
        roomId: `${string}-${string}-${string}-${string}-${string}`;
        messages: Memory[];
    }>;
    static createTestMemories(runtime: IAgentRuntime, roomId: string, count?: number): Promise<Memory[]>;
}
//# sourceMappingURL=TestInfrastructure.d.ts.map