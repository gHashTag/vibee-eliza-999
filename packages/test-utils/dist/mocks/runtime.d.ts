/**
 * @fileoverview Mock implementations for IAgentRuntime and related interfaces
 *
 * This module provides comprehensive mock implementations for the core runtime interfaces,
 * designed to support both unit testing and integration testing scenarios.
 */
import type { IAgentRuntime, IDatabaseAdapter } from '@elizaos/core';
/**
 * Type representing overrides for IAgentRuntime mock creation
 */
export type MockRuntimeOverrides = Partial<IAgentRuntime & IDatabaseAdapter>;
/**
 * Create a comprehensive mock of IAgentRuntime with intelligent defaults
 *
 * This function provides a fully-featured mock that implements both IAgentRuntime
 * and IDatabaseAdapter interfaces, ensuring compatibility with all test scenarios.
 *
 * @param overrides - Partial object to override specific methods or properties
 * @returns Complete mock implementation of IAgentRuntime
 *
 * @deprecated Use real runtime testing instead: import { createTestRuntime } from '@elizaos/core/test-utils'
 *
 * @example Legacy Mock Testing (Deprecated)
 * ```typescript
 * import { createMockRuntime } from '@elizaos/core/test-utils';
 *
 * const mockRuntime = createMockRuntime({
 *   getSetting: () => 'test-api-key',
 *   useModel: () => Promise.resolve('mock response')
 * });
 * ```
 */
export declare function createMockRuntime(overrides?: MockRuntimeOverrides): IAgentRuntime;
//# sourceMappingURL=runtime.d.ts.map