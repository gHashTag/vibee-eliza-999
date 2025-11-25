/**
 * AI Entry Pattern Factories
 * Обеспечивают создание и инициализацию Entry компонентов
 */
import type { AgentEntryConfig, ServiceConfig, PluginConfig, AIServiceEntry, AIPluginEntry, AgentEntry, AICapability, ValidationResult } from './types';
/**
 * Фабрика для создания Agent Entry с AI-возможностями
 */
export declare class AIAgentFactory {
    /**
     * Создание AI-агента с валидацией конфигурации
     */
    static create(config: AgentEntryConfig): Promise<AgentEntry>;
    /**
     * Валидация конфигурации агента
     */
    static validate(config: AgentEntryConfig): ValidationResult;
}
/**
 * Фабрика для создания AI Service Entry
 */
export declare class AIServiceFactory {
    /**
     * Создание AI-сервиса с валидацией
     */
    static create(config: ServiceConfig): Promise<AIServiceEntry>;
    /**
     * Создание сервиса с заданными AI-возможностями
     */
    static createWithCapabilities(config: ServiceConfig, capabilities: AICapability[]): Promise<AIServiceEntry>;
}
/**
 * Фабрика для создания AI Plugin Entry
 */
export declare class AIPluginFactory {
    /**
     * Создание AI-плагина с валидацией
     */
    static create(config: PluginConfig): Promise<AIPluginEntry>;
    /**
     * Создание плагина с заданными AI-возможностями
     */
    static createWithCapabilities(config: PluginConfig, capabilities: AICapability[]): Promise<AIPluginEntry>;
}
//# sourceMappingURL=factory.d.ts.map