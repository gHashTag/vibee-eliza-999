/**
 * @fileoverview Factory functions for creating complete test scenarios
 *
 * This module provides high-level factory functions that combine multiple
 * mock objects to create realistic testing scenarios.
 */
import type { IAgentRuntime, Memory, State, Action, Provider, Evaluator, UUID, ActionResult } from '@elizaos/core';
/**
 * Create a complete test environment with runtime, character, and conversation
 *
 * @param options - Configuration options for the test environment
 * @returns Complete test environment
 *
 * @example
 * ```typescript
 * import { createTestEnvironment } from '@elizaos/core/test-utils';
 *
 * const { runtime, character, conversation } = createTestEnvironment({
 *   characterName: 'TestBot',
 *   conversationLength: 5,
 *   roomId: 'test-room-123'
 * });
 * ```
 */
export declare function createTestEnvironment(options?: {
    characterName?: string;
    conversationLength?: number;
    roomId?: UUID;
    plugins?: string[];
    runtimeOverrides?: any;
    characterOverrides?: any;
}): {
    runtime: IAgentRuntime;
    character: import("@elizaos/core").Character;
    conversation: Memory[];
    state: State;
    roomId: `${string}-${string}-${string}-${string}-${string}`;
};
/**
 * Create a test action with complete mock setup
 *
 * @param name - Action name
 * @param options - Action configuration options
 * @returns Mock action with handlers
 */
export declare function createTestAction(name: string, options?: {
    description?: string;
    validateResult?: boolean;
    handlerResult?: ActionResult;
    examples?: any[];
}): Action;
/**
 * Create a test provider with complete mock setup
 *
 * @param name - Provider name
 * @param options - Provider configuration options
 * @returns Mock provider
 */
export declare function createTestProvider(name: string, options?: {
    description?: string;
    text?: string;
    values?: Record<string, any>;
    data?: Record<string, any>;
    dynamic?: boolean;
    isPrivate?: boolean;
}): Provider;
/**
 * Create a test evaluator with complete mock setup
 *
 * @param name - Evaluator name
 * @param options - Evaluator configuration options
 * @returns Mock evaluator
 */
export declare function createTestEvaluator(name: string, options?: {
    description?: string;
    alwaysRun?: boolean;
    validateResult?: boolean;
    handlerResult?: any;
}): Evaluator;
/**
 * Create a complete plugin test scenario
 *
 * @param pluginName - Name of the plugin being tested
 * @param options - Plugin test configuration
 * @returns Complete plugin test scenario
 */
export declare function createPluginTestScenario(pluginName: string, options?: {
    actions?: string[];
    providers?: string[];
    evaluators?: string[];
    services?: string[];
    conversationSteps?: string[];
}): {
    runtime: IAgentRuntime;
    character: import("@elizaos/core").Character;
    state: State;
    roomId: `${string}-${string}-${string}-${string}-${string}`;
    conversation: Memory[];
    components: {
        actions: Action[];
        providers: Provider[];
        evaluators: Evaluator[];
    };
    helpers: {
        executeAction: (actionName: string, message?: Memory) => Promise<void | ActionResult>;
        getProviderData: (providerName: string, message?: Memory) => Promise<import("@elizaos/core").ProviderResult>;
        runEvaluator: (evaluatorName: string, message?: Memory) => Promise<void | ActionResult>;
    };
};
/**
 * Create a multi-agent test scenario
 *
 * @param agentCount - Number of agents to create
 * @param options - Multi-agent test configuration
 * @returns Multi-agent test scenario
 */
export declare function createMultiAgentScenario(agentCount?: number, options?: {
    sharedRoomId?: UUID;
    agentNames?: string[];
    conversationSteps?: Array<{
        agentIndex: number;
        message: string;
    }>;
}): {
    agents: {
        runtime: IAgentRuntime;
        character: import("@elizaos/core").Character;
        index: number;
    }[];
    sharedRoomId: `${string}-${string}-${string}-${string}-${string}`;
    conversation: Memory[];
    helpers: {
        sendMessage: (agentIndex: number, text: string) => Memory;
        getAgentByName: (name: string) => {
            runtime: IAgentRuntime;
            character: import("@elizaos/core").Character;
            index: number;
        };
    };
};
//# sourceMappingURL=factories.d.ts.map