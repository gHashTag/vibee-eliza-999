/**
 * @fileoverview Mock implementations for Service and related interfaces
 *
 * This module provides comprehensive mock implementations for services,
 * supporting both unit and integration testing scenarios.
 */
import type { Service } from '@elizaos/core';
import { ServiceTypeName } from '@elizaos/core';
/**
 * Type representing overrides for Service mock creation
 */
export type MockServiceOverrides = Partial<Service>;
/**
 * Create a comprehensive mock Service with intelligent defaults
 *
 * This function provides a fully-featured service mock that implements
 * the Service interface with sensible defaults and proper lifecycle methods.
 *
 * @param serviceType - Type/category of the service
 * @param overrides - Partial object to override specific methods or properties
 * @returns Complete mock Service implementation
 *
 * @example
 * ```typescript
 * import { createMockService } from '@elizaos/core/test-utils';
 * import { mock } from 'bun:test';
 *
 * const mockService = createMockService(ServiceType.UNKNOWN, {
 *   someMethod: mock().mockResolvedValue('custom result')
 * });
 * ```
 */
export declare function createMockService(serviceType?: ServiceTypeName, overrides?: MockServiceOverrides): Service;
/**
 * Create a mock database service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock database service
 */
export declare function createMockDatabaseService(overrides?: MockServiceOverrides): Service;
/**
 * Create a mock cache service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock cache service
 */
export declare function createMockCacheService(overrides?: MockServiceOverrides): Service;
/**
 * Create a mock HTTP service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock HTTP service
 */
export declare function createMockHttpService(overrides?: MockServiceOverrides): Service;
/**
 * Create a mock blockchain service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock blockchain service
 */
export declare function createMockBlockchainService(overrides?: MockServiceOverrides): Service;
/**
 * Create a mock AI model service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock AI model service
 */
export declare function createMockModelService(overrides?: MockServiceOverrides): Service;
/**
 * Create a mock messaging service
 *
 * @param overrides - Service-specific overrides
 * @returns Mock messaging service
 */
export declare function createMockMessagingService(overrides?: MockServiceOverrides): Service;
/**
 * Create a service map with multiple mock services
 *
 * @param services - Array of service configurations
 * @returns Map of service names to mock services
 */
export declare function createMockServiceMap(services?: Array<{
    name: string;
    type?: ServiceTypeName;
    overrides?: MockServiceOverrides;
}>): Map<string, Service>;
/**
 * Create a mock service registry for runtime
 *
 * @param runtime - Mock runtime instance
 * @param services - Services to register
 * @returns Updated runtime with registered services
 */
export declare function registerMockServices(runtime: any, services?: Array<{
    name: string;
    type?: ServiceTypeName;
    overrides?: MockServiceOverrides;
}>): any;
//# sourceMappingURL=services.d.ts.map