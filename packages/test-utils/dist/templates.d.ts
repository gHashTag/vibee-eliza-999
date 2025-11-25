/**
 * Standardized testing templates and patterns for ElizaOS
 *
 * This module provides consistent testing patterns, templates, and utilities
 * to ensure testing consistency across all packages.
 */
import { Character, Content, IAgentRuntime, Memory, Plugin } from '@elizaos/core';
/**
 * Standard test configuration interface
 */
export interface TestConfig {
    name: string;
    timeout?: number;
    retries?: number;
    skipCondition?: () => boolean;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    expectedErrors?: unknown[];
}
/**
 * Template test result interface
 */
export interface TemplateTestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: Error;
    warnings?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Base test template class
 */
export declare abstract class TestTemplate {
    protected config: TestConfig;
    protected runtime?: IAgentRuntime;
    constructor(config: TestConfig);
    abstract execute(): Promise<TemplateTestResult>;
    protected setup(): Promise<void>;
    protected teardown(): Promise<void>;
    protected shouldSkip(): boolean;
    getConfig(): TestConfig;
}
/**
 * Unit test template for isolated component testing
 */
export declare class UnitTestTemplate extends TestTemplate {
    private testFunction;
    constructor(config: TestConfig, testFunction: () => Promise<void>);
    execute(): Promise<TemplateTestResult>;
}
/**
 * Integration test template for real runtime testing
 */
export declare class IntegrationTestTemplate extends TestTemplate {
    private testFunction;
    private character?;
    constructor(config: TestConfig, testFunction: (runtime: IAgentRuntime) => Promise<void>, character?: Character);
    execute(): Promise<TemplateTestResult>;
}
/**
 * Plugin test template for plugin-specific testing
 */
export declare class PluginTestTemplate extends TestTemplate {
    private plugin;
    private testFunction;
    constructor(config: TestConfig, plugin: Plugin, testFunction: (runtime: IAgentRuntime, plugin: Plugin) => Promise<void>);
    execute(): Promise<TemplateTestResult>;
}
/**
 * Error handling test template
 */
export declare class ErrorTestTemplate extends TestTemplate {
    private testFunction;
    private expectedError;
    constructor(config: TestConfig, testFunction: () => Promise<void>, expectedError: string);
    execute(): Promise<TemplateTestResult>;
}
/**
 * Performance test template
 */
export declare class PerformanceTestTemplate extends TestTemplate {
    private testFunction;
    private maxDuration;
    private maxMemoryMB;
    constructor(config: TestConfig, testFunction: () => Promise<void>, maxDuration: number, maxMemoryMB: number);
    execute(): Promise<TemplateTestResult>;
}
/**
 * Test suite for organizing related tests
 */
export declare class TestSuite {
    private tests;
    private name;
    constructor(name: string);
    addTest(test: TestTemplate): void;
    run(): Promise<{
        suiteName: string;
        totalTests: number;
        passed: number;
        failed: number;
        duration: number;
        results: TemplateTestResult[];
    }>;
}
/**
 * Factory functions for creating common test scenarios
 */
export declare function createUnitTest(name: string, testFunction: () => Promise<void>, options?: Partial<TestConfig>): UnitTestTemplate;
export declare function createIntegrationTest(name: string, testFunction: (runtime: IAgentRuntime) => Promise<void>, character?: Character, options?: Partial<TestConfig>): IntegrationTestTemplate;
export declare function createPluginTest(name: string, plugin: Plugin, testFunction: (runtime: IAgentRuntime, plugin: Plugin) => Promise<void>, options?: Partial<TestConfig>): PluginTestTemplate;
export declare function createErrorTest(name: string, testFunction: () => Promise<void>, expectedError: any, options?: Partial<TestConfig>): ErrorTestTemplate;
export declare function createPerformanceTest(name: string, testFunction: () => Promise<void>, maxDurationMs: number, maxMemoryMB: number, options?: Partial<TestConfig>): PerformanceTestTemplate;
/**
 * Standard test data generators
 */
export declare class TestDataGenerator {
    static generateUUID(): string;
    static generateMemory(overrides?: Partial<Memory>): Memory;
    static generateCharacter(overrides?: Partial<Character>): Character;
    static generateContent(overrides?: Partial<Content>): Content;
}
//# sourceMappingURL=templates.d.ts.map