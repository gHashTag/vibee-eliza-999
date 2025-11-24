/**
 * AI Entry Patterns - Main Exports
 * Точки входа для AI-компонентов в ElizaOS
 */

// ===== ТИПЫ =====
export type {
  // Базовые типы
  AgentEntryConfig,
  ServiceConfig,
  PluginConfig,
  ModelConfig,
  AIServiceType,
  AIPluginType,

  // Основные интерфейсы
  AgentEntry,
  AIServiceEntry,
  AIPluginEntry,

  // Дополнительные типы
  AICapability,
  ServiceRequest,
  ServiceResponse,
  AIRequest,
  AIResponse,
  AgentStatus,
  HealthStatus,

  // Chain of Thought типы
  ChainOfThoughtEntry,
  CoTStep,

  // RAG типы
  RAGEntry,
  Document,
  Source,

  // Multi-Agent типы
  MultiAgentEntry,
  AgentAssignment,
  AgentMessage,
  AgentPhase,

  // Фабрика и реестр
  EntryFactory,
  EntryRegistry,

  // Валидация
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

// ===== ИНТЕРФЕЙСЫ ДЛЯ АГЕНТОВ =====
export type { AgentEntry } from './types';

// ===== ФАБРИКИ =====
export {
  AIAgentFactory,
  AIServiceFactory,
  AIPluginFactory,
} from './factory';

// ===== РЕЕСТР =====
export {
  AIEntryRegistry,
} from './registry';

// ===== ВАЛИДАТОРЫ =====
export {
  validateAgentConfig,
  validateAgentEntry,
  validateServiceConfig,
  validateModelConfig,
  validateAIServiceEntry,
  validatePluginConfig,
  validateAIPluginEntry,
  validateChainOfThoughtEntry,
  validateRAGEntry,
  validateMultiAgentEntry,
} from './validators';

// ===== ПРОЦЕССОРЫ =====
export {
  ChainOfThoughtProcessor,
} from './cot-entry';

export {
  RAGProcessor,
} from './rag-entry';

export {
  MultiAgentCoordinator,
} from './multi-agent-entry';

// ===== УТИЛИТЫ =====

/**
 * Создание AI-агента с валидацией
 */
export async function createAIAgent(config: AgentEntryConfig): Promise<AgentEntry> {
  return AIAgentFactory.create(config);
}

/**
 * Создание AI-сервиса с валидацией
 */
export async function createAIService(config: ServiceConfig): Promise<AIServiceEntry> {
  return AIServiceFactory.create(config);
}

/**
 * Создание AI-плагина с валидацией
 */
export async function createAIPlugin(config: PluginConfig): Promise<AIPluginEntry> {
  return AIPluginFactory.create(config);
}

/**
 * Регистрация AI-агента в глобальном реестре
 */
export function registerAIAgent(entry: AgentEntry): void {
  AIEntryRegistry.registerAgent(entry);
}

/**
 * Регистрация AI-сервиса в глобальном реестре
 */
export function registerAIService(entry: AIServiceEntry): void {
  AIEntryRegistry.registerService(entry);
}

/**
 * Регистрация AI-плагина в глобальном реестре
 */
export function registerAIPlugin(entry: AIPluginEntry): void {
  AIEntryRegistry.registerPlugin(entry);
}

/**
 * Получение AI-агента из реестра
 */
export function getAIAgent(id: string): AgentEntry | undefined {
  return AIEntryRegistry.getAgent(id);
}

/**
 * Получение AI-сервиса из реестра
 */
export function getAIService(serviceType: string): AIServiceEntry | undefined {
  return AIEntryRegistry.getService(serviceType);
}

/**
 * Получение AI-плагина из реестра
 */
export function getAIPlugin(name: string): AIPluginEntry | undefined {
  return AIEntryRegistry.getPlugin(name);
}

/**
 * Создание Chain of Thought задачи
 */
export function createChainOfThoughtTask(taskId: string, task: string, steps: string[]): ChainOfThoughtEntry {
  return ChainOfThoughtProcessor.create(taskId, task, steps);
}

/**
 * Обработка Chain of Thought задачи
 */
export async function processChainOfThought(entry: ChainOfThoughtEntry): Promise<ChainOfThoughtEntry> {
  const processor = new ChainOfThoughtProcessor();
  return processor.process(entry);
}

/**
 * Создание RAG запроса
 */
export function createRAGQuery(queryId: string, query: string): RAGEntry {
  return RAGProcessor.create(queryId, query);
}

/**
 * Обработка RAG запроса
 */
export async function processRAG(entry: RAGEntry): Promise<RAGEntry> {
  const processor = new RAGProcessor();
  return processor.process(entry);
}

/**
 * Создание Multi-Agent задачи
 */
export function createMultiAgentTask(taskId: string, agents: AgentAssignment[]): MultiAgentEntry {
  return MultiAgentCoordinator.create(taskId, agents);
}

/**
 * Обработка Multi-Agent задачи
 */
export async function processMultiAgent(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
  const coordinator = new MultiAgentCoordinator();
  return coordinator.process(entry);
}

/**
 * Валидация всех Entry типов
 */
export function validateAIEntry(type: 'agent' | 'service' | 'plugin', entry: any): ValidationResult {
  switch (type) {
    case 'agent':
      return validateAgentEntry(entry);
    case 'service':
      return validateAIServiceEntry(entry);
    case 'plugin':
      return validateAIPluginEntry(entry);
    default:
      return {
        isValid: false,
        errors: [{ field: 'type', message: `Unknown type: ${type}`, code: 'UNKNOWN_TYPE' }],
        warnings: [],
      };
  }
}

/**
 * Получение статистики AI Entry Registry
 */
export function getAIEntryStats() {
  return AIEntryRegistry.getStats();
}

/**
 * Инициализация всех зарегистрированных Entry компонентов
 */
export async function initializeAIEntries(): Promise<void> {
  await AIEntryRegistry.initializeAll();
}

/**
 * Остановка всех зарегистрированных Entry компонентов
 */
export async function shutdownAIEntries(): Promise<void> {
  await AIEntryRegistry.shutdownAll();
}

/**
 * Очистка AI Entry Registry
 */
export function clearAIEntries(): void {
  AIEntryRegistry.clearAll();
}

/**
 * Поиск Entry компонента по AI-возможности
 */
export function findEntryByCapability(capabilityName: string) {
  return AIEntryRegistry.findEntryByCapability(capabilityName);
}

/**
 * Получение всех AI-возможностей
 */
export function getAllAICapabilities() {
  return AIEntryRegistry.getAllCapabilities();
}
