/**
 * @fileoverview Mock implementations for Character and related interfaces
 *
 * This module provides comprehensive mock implementations for character objects,
 * agent configurations, and personality definitions.
 */
import type { Character } from '@elizaos/core';
/**
 * Type representing overrides for Character mock creation
 */
export type MockCharacterOverrides = Partial<Character>;
/**
 * Create a comprehensive mock Character with intelligent defaults
 *
 * This function provides a fully-featured character mock that includes
 * realistic personality traits, message examples, and configuration.
 *
 * @param overrides - Partial object to override specific properties
 * @returns Complete mock Character object
 *
 * @example
 * ```typescript
 * import { createMockCharacter } from '@elizaos/core/test-utils';
 *
 * const mockCharacter = createMockCharacter({
 *   name: 'CustomAgent',
 *   bio: ['A specialized test agent'],
 *   plugins: ['@elizaos/plugin-test']
 * });
 * ```
 */
export declare function createMockCharacter(overrides?: MockCharacterOverrides): Character;
/**
 * Create a minimal mock character with only required fields
 *
 * @param name - Character name
 * @param overrides - Additional overrides
 * @returns Minimal mock character
 */
export declare function createMinimalMockCharacter(name?: string, overrides?: MockCharacterOverrides): Character;
/**
 * Create a mock character for specific plugin testing
 *
 * @param pluginName - Name of the plugin to test
 * @param overrides - Additional overrides
 * @returns Plugin-specific mock character
 */
export declare function createPluginTestCharacter(pluginName: string, overrides?: MockCharacterOverrides): Character;
/**
 * Create a mock character with extensive conversation examples
 *
 * @param overrides - Additional overrides
 * @returns Character with rich conversation examples
 */
export declare function createRichConversationCharacter(overrides?: MockCharacterOverrides): Character;
/**
 * Create multiple mock characters for multi-agent testing
 *
 * @param count - Number of characters to create
 * @param baseName - Base name for characters (will be numbered)
 * @param overrides - Common overrides for all characters
 * @returns Array of mock characters
 */
export declare function createMultipleCharacters(count?: number, baseName?: string, overrides?: MockCharacterOverrides): Character[];
//# sourceMappingURL=character.d.ts.map