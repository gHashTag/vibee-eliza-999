/**
 * AI Entry Pattern Registry
 * Управление регистрацией и доступом к Entry компонентам
 */
import type { AgentEntry, AIServiceEntry, AIPluginEntry } from './types';
import type { UUID } from '../types';
/**
 * Регистр для AI Entry компонентов
 */
export declare class AIEntryRegistry {
    private static agents;
    private static services;
    private static plugins;
    private static capabilities;
    /**
     * Регистрация AI-агента
     */
    static registerAgent(entry: AgentEntry): void;
    /**
     * Получение AI-агента по ID
     */
    static getAgent(id: UUID): AgentEntry | undefined;
    /**
     * Получение всех зарегистрированных агентов
     */
    static getAllAgents(): AgentEntry[];
    /**
     * Удаление AI-агента
     */
    static unregisterAgent(id: UUID): void;
    /**
     * Очистка всех агентов
     */
    static clearAgents(): void;
    /**
     * Регистрация AI-сервиса
     */
    static registerService(entry: AIServiceEntry): void;
    /**
     * Получение AI-сервиса по типу
     */
    static getService(serviceType: string): AIServiceEntry | undefined;
    /**
     * Получение сервиса по AI-возможности
     */
    static getServiceByCapability(capabilityName: string): AIServiceEntry | undefined;
    /**
     * Получение всех зарегистрированных сервисов
     */
    static getAllServices(): AIServiceEntry[];
    /**
     * Удаление AI-сервиса
     */
    static unregisterService(serviceType: string): void;
    /**
     * Очистка всех сервисов
     */
    static clearServices(): void;
    /**
     * Регистрация AI-плагина
     */
    static registerPlugin(entry: AIPluginEntry): void;
    /**
     * Получение AI-плагина по имени
     */
    static getPlugin(name: string): AIPluginEntry | undefined;
    /**
     * Получение плагина по AI-возможности
     */
    static getPluginByCapability(capabilityName: string): AIPluginEntry | undefined;
    /**
     * Получение всех зарегистрированных плагинов
     */
    static getAllPlugins(): AIPluginEntry[];
    /**
     * Удаление AI-плагина
     */
    static unregisterPlugin(name: string): void;
    /**
     * Очистка всех плагинов
     */
    static clearPlugins(): void;
    /**
     * Поиск Entry компонента по AI-возможности
     */
    static findEntryByCapability(capabilityName: string): {
        type: 'agent' | 'service' | 'plugin';
        entry: AgentEntry | AIServiceEntry | AIPluginEntry;
    } | undefined;
    /**
     * Получение всех AI-возможностей
     */
    static getAllCapabilities(): {
        name: string;
        type: 'agent' | 'service' | 'plugin';
        ownerId: string;
    }[];
    /**
     * Получение AI-возможностей по типу
     */
    static getCapabilitiesByType(type: 'agent' | 'service' | 'plugin'): string[];
    /**
     * Проверка наличия AI-возможности
     */
    static hasCapability(capabilityName: string): boolean;
    /**
     * Инициализация всех зарегистрированных компонентов
     */
    static initializeAll(): Promise<void>;
    /**
     * Остановка всех зарегистрированных компонентов
     */
    static shutdownAll(): Promise<void>;
    /**
     * Получение статистики регистра
     */
    static getStats(): {
        agents: number;
        services: number;
        plugins: number;
        capabilities: number;
    };
    /**
     * Получение списка компонентов по типу
     */
    static listComponentsByType(type: 'agent' | 'service' | 'plugin'): {
        id: string;
        name: string;
        type: typeof type;
    }[];
    /**
     * Очистка всего регистра
     */
    static clearAll(): void;
}
//# sourceMappingURL=registry.d.ts.map