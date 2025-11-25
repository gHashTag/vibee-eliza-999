/**
 * @fileoverview Mock implementations for IDatabaseAdapter and related database interfaces
 *
 * This module provides comprehensive mock implementations for database operations,
 * supporting both unit and integration testing scenarios.
 */
import type { IDatabaseAdapter } from '@elizaos/core';
/**
 * Type representing overrides for IDatabaseAdapter mock creation
 */
export type MockDatabaseOverrides = Partial<IDatabaseAdapter>;
/**
 * Create a comprehensive mock of IDatabaseAdapter with intelligent defaults
 *
 * This function provides a fully-featured database adapter mock that implements
 * all database operations with sensible defaults and proper return types.
 *
 * @param overrides - Partial object to override specific methods or properties
 * @returns Complete mock implementation of IDatabaseAdapter
 *
 * @example
 * ```typescript
 * import { createMockDatabase } from '@elizaos/core/test-utils';
 * import { mock } from 'bun:test';
 *
 * const mockDb = createMockDatabase({
 *   getMemories: mock().mockResolvedValue([mockMemory]),
 *   createMemory: mock().mockResolvedValue('memory-id')
 * });
 * ```
 */
export declare function createMockDatabase(overrides?: MockDatabaseOverrides): IDatabaseAdapter;
/**
 * Create a simple mock database connection object
 *
 * @param overrides - Partial object to override specific methods
 * @returns Mock database connection
 */
export declare function createMockDbConnection(overrides?: any): any;
//# sourceMappingURL=database.d.ts.map