/**
 * @fileoverview Mock implementations for Memory and related interfaces
 *
 * This module provides comprehensive mock implementations for memory objects,
 * content structures, and memory-related operations.
 */
import type { Content, Media, Memory, UUID } from '@elizaos/core';
/**
 * Type representing overrides for Memory mock creation
 */
export type MockMemoryOverrides = Partial<Memory>;
/**
 * Type representing overrides for Content mock creation
 */
export type MockContentOverrides = Partial<Content>;
/**
 * Create a comprehensive mock Memory object with intelligent defaults
 *
 * This function provides a fully-featured memory mock that includes
 * realistic content, metadata, and proper typing.
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock Memory object
 *
 * @example
 * ```typescript
 * import { createMockMemory } from '@elizaos/core/test-utils';
 *
 * const mockMessage = createMockMemory({
 *   content: { text: 'Hello, world!' },
 *   entityId: 'user-123'
 * });
 * ```
 */
export declare function createMockMemory(overrides?: MockMemoryOverrides): Memory;
/**
 * Create a mock Content object with intelligent defaults
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock Content object
 *
 * @example
 * ```typescript
 * import { createMockContent } from '@elizaos/core/test-utils';
 *
 * const mockContent = createMockContent({
 *   text: 'Custom message',
 *   actions: ['SEND_MESSAGE']
 * });
 * ```
 */
export declare function createMockContent(overrides?: MockContentOverrides): Content;
/**
 * Create a mock conversation memory (user message)
 *
 * @param text - The message text
 * @param overrides - Additional overrides
 * @returns Mock user message memory
 */
export declare function createMockUserMessage(text: string, overrides?: MockMemoryOverrides): Memory;
/**
 * Create a mock agent response memory
 *
 * @param text - The response text
 * @param thought - Optional internal thought
 * @param actions - Optional actions executed
 * @param overrides - Additional overrides
 * @returns Mock agent response memory
 */
export declare function createMockAgentResponse(text: string, thought?: string, actions?: string[], overrides?: MockMemoryOverrides): Memory;
/**
 * Create a mock fact memory for knowledge storage
 *
 * @param fact - The factual claim
 * @param confidence - Confidence level (0-1)
 * @param overrides - Additional overrides
 * @returns Mock fact memory
 */
export declare function createMockFact(fact: string, confidence?: number, overrides?: MockMemoryOverrides): Memory;
/**
 * Create a mock memory with embedding vector
 *
 * @param text - The text content
 * @param dimension - Embedding dimension (default: 1536 for OpenAI)
 * @param overrides - Additional overrides
 * @returns Mock memory with embedding
 */
export declare function createMockMemoryWithEmbedding(text: string, dimension?: number, overrides?: MockMemoryOverrides): Memory;
/**
 * Create a batch of mock conversation memories
 *
 * @param count - Number of memories to create
 * @param roomId - Room ID for all memories
 * @returns Array of mock conversation memories
 */
export declare function createMockConversation(count?: number, roomId?: UUID): Memory[];
/**
 * Create a mock Media attachment
 *
 * @param type - Media type
 * @param url - Media URL
 * @param overrides - Additional overrides
 * @returns Mock Media object
 */
export declare function createMockMedia(type?: 'image' | 'video' | 'audio' | 'document', url?: string, overrides?: Partial<Media>): Media;
//# sourceMappingURL=memory.d.ts.map