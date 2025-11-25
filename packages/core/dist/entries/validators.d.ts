/**
 * Валидаторы для AI Entry Patterns
 * Обеспечивают проверку корректности Entry конфигураций
 */
import type { AgentEntry, AIServiceEntry, AIPluginEntry, AgentEntryConfig, ServiceConfig, PluginConfig, ModelConfig, ValidationResult } from './types';
export declare function validateAgentConfig(config: AgentEntryConfig): ValidationResult;
/**
 * Валидация Agent Entry
 */
export declare function validateAgentEntry(entry: AgentEntry): ValidationResult;
export declare function validateServiceConfig(config: ServiceConfig): ValidationResult;
/**
 * Валидация Model Config
 */
export declare function validateModelConfig(config: ModelConfig): ValidationResult;
/**
 * Валидация AIService Entry
 */
export declare function validateAIServiceEntry(service: AIServiceEntry): ValidationResult;
export declare function validatePluginConfig(config: PluginConfig): ValidationResult;
/**
 * Валидация AIPlugin Entry
 */
export declare function validateAIPluginEntry(plugin: AIPluginEntry): ValidationResult;
export declare function validateChainOfThoughtEntry(entry: any): ValidationResult;
export declare function validateRAGEntry(entry: any): ValidationResult;
export declare function validateMultiAgentEntry(entry: any): ValidationResult;
//# sourceMappingURL=validators.d.ts.map