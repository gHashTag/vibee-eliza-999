/**
 * @fileoverview Mock implementations for State and related interfaces
 *
 * This module provides comprehensive mock implementations for state objects,
 * provider results, and state composition utilities.
 */
import type { ActionResult, ProviderResult, State } from '@elizaos/core';
/**
 * Type representing overrides for State mock creation
 */
export type MockStateOverrides = Partial<State>;
/**
 * Type representing overrides for ProviderResult mock creation
 */
export type MockProviderResultOverrides = Partial<ProviderResult>;
/**
 * Type representing overrides for ActionResult mock creation
 */
export type MockActionResultOverrides = Partial<ActionResult>;
/**
 * Create a comprehensive mock State object with intelligent defaults
 *
 * This function provides a fully-featured state mock that includes
 * realistic data structures and proper typing for agent context.
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock State object
 *
 * @example
 * ```typescript
 * import { createMockState } from '@elizaos/core/test-utils';
 *
 * const mockState = createMockState({
 *   values: { currentUser: 'john_doe' },
 *   data: { conversationLength: 5 }
 * });
 * ```
 */
export declare function createMockState(overrides?: MockStateOverrides): State;
/**
 * Create a mock ProviderResult object
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock ProviderResult object
 *
 * @example
 * ```typescript
 * import { createMockProviderResult } from '@elizaos/core/test-utils';
 *
 * const providerResult = createMockProviderResult({
 *   text: '[WEATHER] Current weather is sunny',
 *   values: { temperature: 72, conditions: 'sunny' }
 * });
 * ```
 */
export declare function createMockProviderResult(overrides?: MockProviderResultOverrides): ProviderResult;
/**
 * Create a mock ActionResult object
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock ActionResult object
 *
 * @example
 * ```typescript
 * import { createMockActionResult } from '@elizaos/core/test-utils';
 *
 * const actionResult = createMockActionResult({
 *   text: 'Action completed successfully',
 *   values: { success: true, id: 'action-123' }
 * });
 * ```
 */
export declare function createMockActionResult(overrides?: MockActionResultOverrides): ActionResult;
/**
 * Create a state with specific provider context
 *
 * @param providerName - Name of the provider
 * @param providerData - Data from the provider
 * @param overrides - Additional state overrides
 * @returns State with provider context
 */
export declare function createMockStateWithProvider(providerName: string, providerData: any, overrides?: MockStateOverrides): State;
/**
 * Create a state with action execution history
 *
 * @param actionResults - Array of action results
 * @param overrides - Additional state overrides
 * @returns State with action history
 */
export declare function createMockStateWithActions(actionResults: ActionResult[], overrides?: MockStateOverrides): State;
/**
 * Create a state with realistic conversation context
 *
 * @param conversationHistory - Array of recent messages
 * @param currentUser - Current user name
 * @param overrides - Additional state overrides
 * @returns State with conversation context
 */
export declare function createMockConversationState(conversationHistory?: string[], currentUser?: string, overrides?: MockStateOverrides): State;
//# sourceMappingURL=state.d.ts.map