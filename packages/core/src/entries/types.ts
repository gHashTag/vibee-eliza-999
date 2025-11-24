/**
 * Типы для AI Entry Patterns
 * Определяет основные интерфейсы и типы для точек входа AI-компонентов
 */

import type {
  IAgentRuntime,
  Character,
  UUID,
  Content,
  ActionResult,
  Service,
  ModelType,
  Plugin,
} from '../types';

// ===== БАЗОВЫЕ ТИПЫ =====

export interface AgentEntryConfig {
  id: UUID;
  character: Character;
  runtime: IAgentRuntime;
  modelType?: ModelType;
  capabilities?: string[];
}

export interface ServiceConfig {
  serviceType: AIServiceType;
  supportedModels: ModelType[];
  modelConfig?: ModelConfig;
  provider?: string;
}

export interface PluginConfig {
  pluginType: AIPluginType;
  name: string;
  version: string;
  dependencies?: string[];
}

export interface ModelConfig {
  modelType: ModelType;
  parameters?: Record<string, any>;
  provider?: string;
  apiKey?: string;
}

// ===== ТИПЫ AI-СЕРВИСОВ =====

export type AIServiceType =
  | 'language'
  | 'vision'
  | 'audio'
  | 'multimodal'
  | 'embedding'
  | 'reranking'
  | 'moderation'
  | 'function';

export type AIPluginType =
  | 'enhancement'
  | 'integration'
  | 'capability'
  | 'connector'
  | 'middleware';

// ===== ОСНОВНЫЕ ИНТЕРФЕЙСЫ =====

export interface AgentEntry {
  /** Идентификатор агента */
  readonly id: UUID;
  /** Характеристики агента */
  readonly character: Character;
  /** Конфигурация среды выполнения */
  readonly runtime: IAgentRuntime;
  /** AI-возможности агента */
  readonly capabilities: string[];
  /** Инициализация агента */
  initialize(): Promise<void>;
  /** Обработка входящих сообщений */
  handleMessage(message: Content): Promise<ActionResult>;
  /** Генерация ответа */
  generateResponse(input: string): Promise<string>;
  /** Остановка агента */
  shutdown(): Promise<void>;
  /** Проверка состояния */
  getStatus(): AgentStatus;
}

export interface AIServiceEntry extends Service {
  /** Тип AI-сервиса */
  readonly serviceType: AIServiceType;
  /** Поддерживаемые модели */
  readonly supportedModels: ModelType[];
  /** AI-функции сервиса */
  aiCapabilities: AICapability[];
  /** Инициализация модели */
  initializeModel(modelConfig: ModelConfig): Promise<void>;
  /** Обработка запроса */
  process(request: ServiceRequest): Promise<ServiceResponse>;
  /** Проверка здоровья сервиса */
  healthCheck(): Promise<HealthStatus>;
  /** Получение модели */
  getModel(): Promise<any>;
}

export interface AIPluginEntry extends Plugin {
  /** Тип плагина */
  readonly pluginType: AIPluginType;
  /** AI-функции плагина */
  readonly aiCapabilities: AICapability[];
  /** Версия плагина */
  readonly version: string;
  /** Инициализация AI-компонентов */
  initializeAI(runtime: IAgentRuntime): Promise<void>;
  /** Обработка AI-запросов */
  processAIRequest(request: AIRequest): Promise<AIResponse>;
  /** Проверка совместимости */
  checkCompatibility(runtime: IAgentRuntime): Promise<boolean>;
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ТИПЫ =====

export interface AICapability {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  parameters?: Record<string, any>;
}

export interface ServiceRequest {
  type: string;
  input: any;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ServiceResponse {
  success: boolean;
  output: any;
  confidence?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface AIRequest {
  capability: string;
  input: any;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  output: any;
  confidence?: number;
  reasoning?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface AgentStatus {
  isRunning: boolean;
  isInitialized: boolean;
  lastActivity?: number;
  uptime?: number;
  memoryUsage?: number;
  activeTasks: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  errorRate?: number;
  details?: Record<string, any>;
}

// ===== CHAIN OF THOUGHT ТИПЫ =====

export interface ChainOfThoughtEntry {
  taskId: string;
  task: string;
  steps: CoTStep[];
  finalAnswer: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, any>;
}

export interface CoTStep {
  stepNumber: number;
  thought: string;
  action: string;
  result: string;
  reasoning: string;
  confidence: number;
  timestamp: number;
}

// ===== RAG (RETRIEVAL-AUGMENTED GENERATION) ТИПЫ =====

export interface RAGEntry {
  queryId: string;
  query: string;
  retrievedContext: Document[];
  generatedResponse: string;
  sources: Source[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarityScore: number;
  chunkIndex?: number;
  embedding?: number[];
}

export interface Source {
  documentId: string;
  relevanceScore: number;
  excerpt: string;
  pageNumber?: number;
  timestamp: number;
}

// ===== MULTI-AGENT ТИПЫ =====

export interface MultiAgentEntry {
  taskId: string;
  agents: AgentAssignment[];
  messageHistory: AgentMessage[];
  currentPhase: AgentPhase;
  finalResult?: any;
  metadata?: Record<string, any>;
}

export interface AgentAssignment {
  agentId: string;
  role: string;
  capabilities: string[];
  workload: number;
  status: 'idle' | 'busy' | 'completed' | 'failed';
}

export interface AgentMessage {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  messageType: 'request' | 'response' | 'coordination' | 'broadcast';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export type AgentPhase =
  | 'initialization'
  | 'decomposition'
  | 'delegation'
  | 'execution'
  | 'coordination'
  | 'synthesis'
  | 'verification'
  | 'completed'
  | 'failed';

// ===== FACTORY И РЕЕСТР ТИПЫ =====

export interface EntryFactory {
  create(config: any): Promise<any>;
  validate(config: any): boolean;
}

export interface EntryRegistry<T> {
  register(id: string, entry: T): void;
  get(id: string): T | undefined;
  unregister(id: string): void;
  list(): T[];
  clear(): void;
}

// ===== ВАЛИДАЦИЯ ТИПЫ =====

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ===== ЭКСПОРТ ТИПОВ =====

export type {
  AgentEntryConfig,
  ServiceConfig,
  PluginConfig,
  ModelConfig,
  AIServiceType,
  AIPluginType,
  AgentEntry,
  AIServiceEntry,
  AIPluginEntry,
  AICapability,
  ServiceRequest,
  ServiceResponse,
  AIRequest,
  AIResponse,
  AgentStatus,
  HealthStatus,
  ChainOfThoughtEntry,
  CoTStep,
  RAGEntry,
  Document,
  Source,
  MultiAgentEntry,
  AgentAssignment,
  AgentMessage,
  AgentPhase,
  EntryFactory,
  EntryRegistry,
  ValidationResult,
  ValidationError,
  ValidationWarning,
};
