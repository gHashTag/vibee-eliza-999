/**
 * AI Entry Patterns - Main Exports
 * Точки входа для AI-компонентов в ElizaOS
 */
export type { AgentEntryConfig, ServiceConfig, PluginConfig, ModelConfig, AIServiceType, AIPluginType, AgentEntry, AIServiceEntry, AIPluginEntry, AICapability, ServiceRequest, ServiceResponse, AIRequest, AIResponse, AgentStatus, HealthStatus, ChainOfThoughtEntry, CoTStep, RAGEntry, Document, Source, MultiAgentEntry, AgentAssignment, AgentMessage, AgentPhase, EntryFactory, EntryRegistry, ValidationResult, ValidationError, ValidationWarning, } from './types';
export type { AgentEntry } from './types';
export { AIAgentFactory, AIServiceFactory, AIPluginFactory, } from './factory';
export { AIEntryRegistry, } from './registry';
export { validateAgentConfig, validateAgentEntry, validateServiceConfig, validateModelConfig, validateAIServiceEntry, validatePluginConfig, validateAIPluginEntry, validateChainOfThoughtEntry, validateRAGEntry, validateMultiAgentEntry, } from './validators';
export { ChainOfThoughtProcessor, } from './cot-entry';
export { RAGProcessor, } from './rag-entry';
export { MultiAgentCoordinator, } from './multi-agent-entry';
/**
 * Создание AI-агента с валидацией
 */
export declare function createAIAgent(config: AgentEntryConfig): Promise<AgentEntry>;
/**
 * Создание AI-сервиса с валидацией
 */
export declare function createAIService(config: ServiceConfig): Promise<AIServiceEntry>;
/**
 * Создание AI-плагина с валидацией
 */
export declare function createAIPlugin(config: PluginConfig): Promise<AIPluginEntry>;
/**
 * Регистрация AI-агента в глобальном реестре
 */
export declare function registerAIAgent(entry: AgentEntry): void;
/**
 * Регистрация AI-сервиса в глобальном реестре
 */
export declare function registerAIService(entry: AIServiceEntry): void;
/**
 * Регистрация AI-плагина в глобальном реестре
 */
export declare function registerAIPlugin(entry: AIPluginEntry): void;
/**
 * Получение AI-агента из реестра
 */
export declare function getAIAgent(id: string): AgentEntry | undefined;
/**
 * Получение AI-сервиса из реестра
 */
export declare function getAIService(serviceType: string): AIServiceEntry | undefined;
/**
 * Получение AI-плагина из реестра
 */
export declare function getAIPlugin(name: string): AIPluginEntry | undefined;
/**
 * Создание Chain of Thought задачи
 */
export declare function createChainOfThoughtTask(taskId: string, task: string, steps: string[]): ChainOfThoughtEntry;
/**
 * Обработка Chain of Thought задачи
 */
export declare function processChainOfThought(entry: ChainOfThoughtEntry): Promise<ChainOfThoughtEntry>;
/**
 * Создание RAG запроса
 */
export declare function createRAGQuery(queryId: string, query: string): RAGEntry;
/**
 * Обработка RAG запроса
 */
export declare function processRAG(entry: RAGEntry): Promise<RAGEntry>;
/**
 * Создание Multi-Agent задачи
 */
export declare function createMultiAgentTask(taskId: string, agents: AgentAssignment[]): MultiAgentEntry;
/**
 * Обработка Multi-Agent задачи
 */
export declare function processMultiAgent(entry: MultiAgentEntry): Promise<MultiAgentEntry>;
/**
 * Валидация всех Entry типов
 */
export declare function validateAIEntry(type: 'agent' | 'service' | 'plugin', entry: any): ValidationResult;
/**
 * Получение статистики AI Entry Registry
 */
export declare function getAIEntryStats(): any;
/**
 * Инициализация всех зарегистрированных Entry компонентов
 */
export declare function initializeAIEntries(): Promise<void>;
/**
 * Остановка всех зарегистрированных Entry компонентов
 */
export declare function shutdownAIEntries(): Promise<void>;
/**
 * Очистка AI Entry Registry
 */
export declare function clearAIEntries(): void;
/**
 * Поиск Entry компонента по AI-возможности
 */
export declare function findEntryByCapability(capabilityName: string): any;
/**
 * Получение всех AI-возможностей
 */
export declare function getAllAICapabilities(): any;
//# sourceMappingURL=index.d.ts.map