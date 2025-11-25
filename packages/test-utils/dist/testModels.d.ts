import type { IAgentRuntime, GenerateTextParams, TextEmbeddingParams } from '@elizaos/core';
/**
 * Realistic Test Model Provider - Provides configurable but realistic AI model responses
 * Replaces hardcoded mock responses with intelligent, context-aware responses
 */
export declare class TestModelProvider {
    private responses;
    private patterns;
    private defaultResponse;
    private contextHistory;
    constructor(defaultResponse?: string, _options?: {
        enableContextMemory?: boolean;
        maxContextHistory?: number;
    });
    /**
     * Add realistic default response patterns
     */
    private addDefaultPatterns;
    /**
     * Generate text response based on prompt
     */
    generateText(params: GenerateTextParams): Promise<string>;
    /**
     * Generate embeddings for text (mock implementation with consistent vectors)
     */
    generateEmbedding(params: TextEmbeddingParams): Promise<number[]>;
    /**
     * Generate object-structured responses
     */
    generateObject(params: any): Promise<Record<string, any>>;
    /**
     * Make response more contextual based on prompt content
     */
    private makeContextual;
    /**
     * Generate intelligent default response based on prompt analysis
     */
    private generateIntelligentDefault;
    /**
     * Extract key terms from prompt for contextualization
     */
    private extractKeyTerms;
    /**
     * Simple hash function for deterministic embeddings
     */
    private simpleHash;
    /**
     * Add interaction to context history
     */
    private addToHistory;
    /**
     * Set a specific response for a prompt
     */
    setResponse(prompt: string, response: string): void;
    /**
     * Add a pattern-based response
     */
    addPattern(pattern: RegExp, response: string): void;
    /**
     * Set the default response
     */
    setDefaultResponse(response: string): void;
    /**
     * Clear all custom responses and patterns
     */
    clear(): void;
    /**
     * Get conversation history
     */
    getHistory(): Array<{
        prompt: string;
        response: string;
    }>;
}
/**
 * Create a test model provider with specific scenarios
 */
export declare function createTestModelProvider(scenarios?: Array<{
    prompt: RegExp | string;
    response: string;
}>, defaultResponse?: string): TestModelProvider;
/**
 * Create specialized model provider for different types of testing
 */
export declare function createSpecializedModelProvider(type: 'conversational' | 'analytical' | 'creative' | 'factual'): TestModelProvider;
/**
 * Model handler wrapper that integrates with ElizaOS runtime
 */
export declare function createModelHandler(provider: TestModelProvider): (runtime: IAgentRuntime, params: any) => Promise<any>;
/**
 * Test scenario builder for common testing patterns
 */
export declare class TestScenarioBuilder {
    private scenarios;
    addGreeting(response?: string): this;
    addTaskCreation(response?: string): this;
    addSearch(response?: string): this;
    addCustom(prompt: RegExp | string, response: string): this;
    build(defaultResponse?: string): TestModelProvider;
}
/**
 * Convenience function to quickly create test scenarios
 */
export declare function scenarios(): TestScenarioBuilder;
//# sourceMappingURL=testModels.d.ts.map