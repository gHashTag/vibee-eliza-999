import type { Character, IAgentRuntime, Plugin } from '@elizaos/core';
import { TestModelProvider, createSpecializedModelProvider, scenarios } from './testModels';
export interface RuntimeConfig {
    character: Character;
    plugins: Array<Plugin | string>;
    databaseUrl?: string;
    apiKeys: Record<string, string>;
    modelProviders?: Record<string, any>;
    isolated?: boolean;
}
export interface RealRuntimeTestResult {
    scenarioName: string;
    passed: boolean;
    errors: string[];
    executedActions: string[];
    createdMemories: number;
    responseTime: number;
    memoryUsage?: number;
}
/**
 * Runtime Test Harness - Creates actual AgentRuntime instances for testing
 * Uses the standard AgentRuntime without any mocks or proxies
 */
export declare class RuntimeTestHarness {
    private runtimes;
    private databaseManager;
    private testId;
    constructor(testId?: string);
    /**
     * Creates an AgentRuntime instance for testing
     * This uses the standard AgentRuntime - it will actually execute all functionality
     */
    createTestRuntime(config: RuntimeConfig): Promise<IAgentRuntime>;
    /**
     * Loads a plugin by name from the ElizaOS ecosystem
     * Uses dynamic imports to avoid circular dependencies during build
     */
    private loadPlugin;
    /**
     * Creates a test model provider that gives realistic responses
     */
    createRealisticModelProvider(scenarios?: Array<{
        prompt: RegExp;
        response: string;
    }>): TestModelProvider;
    /**
     * Executes a real message processing test
     */
    processTestMessage(runtime: IAgentRuntime, messageText: string, options?: {
        roomId?: string;
        entityId?: string;
        expectedActions?: string[];
        timeoutMs?: number;
    }): Promise<RealRuntimeTestResult>;
    /**
     * Gets actions that were actually executed (not mocked)
     */
    private getExecutedActions;
    /**
     * Validates that a runtime is actually functional
     */
    validateRuntimeHealth(runtime: IAgentRuntime): Promise<{
        healthy: boolean;
        issues: string[];
        services: string[];
        plugins: string[];
    }>;
    /**
     * Cleanup all test resources
     */
    cleanup(): Promise<void>;
}
/**
 * Convenience function to create and configure a test runtime
 */
export declare function createTestRuntime(config?: Partial<RuntimeConfig>): Promise<{
    runtime: IAgentRuntime;
    harness: RuntimeTestHarness;
}>;
/**
 * Helper to run a quick integration test
 */
export declare function runIntegrationTest(testName: string, testFn: (runtime: IAgentRuntime) => Promise<void>, config?: Partial<RuntimeConfig>): Promise<RealRuntimeTestResult>;
export { createSpecializedModelProvider, scenarios };
//# sourceMappingURL=realRuntime.d.ts.map