/**
 * Валидаторы для AI Entry Patterns
 * Обеспечивают проверку корректности Entry конфигураций
 */

import type {
  AgentEntry,
  AIServiceEntry,
  AIPluginEntry,
  AgentEntryConfig,
  ServiceConfig,
  PluginConfig,
  ModelConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

/**
 * Базовая валидация с поддержкой ошибок и предупреждений
 */
function createValidationResult(
  isValid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = []
): ValidationResult {
  return {
    isValid,
    errors,
    warnings,
  };
}

/**
 * Добавить ошибку валидации
 */
function addError(
  errors: ValidationError[],
  field: string,
  message: string,
  code: string
): void {
  errors.push({ field, message, code });
}

/**
 * Добавить предупреждение
 */
function addWarning(
  warnings: ValidationWarning[],
  field: string,
  message: string,
  suggestion?: string
): void {
  warnings.push({ field, message, suggestion });
}

// ===== AGENT ENTRY ВАЛИДАТОР =====

export function validateAgentConfig(config: AgentEntryConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка ID
  if (!config.id) {
    addError(errors, 'id', 'Agent ID is required', 'AGENT_ID_REQUIRED');
  }

  // Проверка character
  if (!config.character) {
    addError(errors, 'character', 'Character is required', 'CHARACTER_REQUIRED');
  } else {
    if (!config.character.name) {
      addError(errors, 'character.name', 'Character name is required', 'CHARACTER_NAME_REQUIRED');
    }
    if (!config.character.system) {
      addWarning(
        warnings,
        'character.system',
        'Character system prompt is not defined',
        'Define a system prompt for better AI behavior'
      );
    }
  }

  // Проверка runtime
  if (!config.runtime) {
    addError(errors, 'runtime', 'Runtime is required', 'RUNTIME_REQUIRED');
  }

  // Проверка capabilities
  if (config.capabilities && !Array.isArray(config.capabilities)) {
    addError(errors, 'capabilities', 'Capabilities must be an array', 'CAPABILITIES_INVALID_TYPE');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Валидация Agent Entry
 */
export function validateAgentEntry(entry: AgentEntry): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка интерфейса
  if (!entry.id) {
    addError(errors, 'id', 'Entry must have an ID', 'ENTRY_ID_REQUIRED');
  }

  if (!entry.character) {
    addError(errors, 'character', 'Entry must have a character', 'ENTRY_CHARACTER_REQUIRED');
  }

  // Проверка методов
  if (typeof entry.initialize !== 'function') {
    addError(errors, 'initialize', 'Entry must have initialize method', 'INITIALIZE_METHOD_REQUIRED');
  }

  if (typeof entry.handleMessage !== 'function') {
    addError(errors, 'handleMessage', 'Entry must have handleMessage method', 'HANDLE_MESSAGE_METHOD_REQUIRED');
  }

  if (typeof entry.shutdown !== 'function') {
    addError(errors, 'shutdown', 'Entry must have shutdown method', 'SHUTDOWN_METHOD_REQUIRED');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== SERVICE ENTRY ВАЛИДАТОР =====

export function validateServiceConfig(config: ServiceConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка serviceType
  const validServiceTypes = [
    'language',
    'vision',
    'audio',
    'multimodal',
    'embedding',
    'reranking',
    'moderation',
    'function',
  ];

  if (!config.serviceType) {
    addError(errors, 'serviceType', 'Service type is required', 'SERVICE_TYPE_REQUIRED');
  } else if (!validServiceTypes.includes(config.serviceType)) {
    addError(
      errors,
      'serviceType',
      `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`,
      'SERVICE_TYPE_INVALID'
    );
  }

  // Проверка supportedModels
  if (!config.supportedModels || config.supportedModels.length === 0) {
    addError(errors, 'supportedModels', 'At least one supported model is required', 'MODELS_REQUIRED');
  } else if (!Array.isArray(config.supportedModels)) {
    addError(errors, 'supportedModels', 'Supported models must be an array', 'MODELS_INVALID_TYPE');
  }

  // Проверка modelConfig
  if (config.modelConfig) {
    const modelConfigValidation = validateModelConfig(config.modelConfig);
    if (!modelConfigValidation.isValid) {
      errors.push(...modelConfigValidation.errors);
    }
    warnings.push(...modelConfigValidation.warnings);
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Валидация Model Config
 */
export function validateModelConfig(config: ModelConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка modelType
  if (!config.modelType) {
    addError(errors, 'modelType', 'Model type is required', 'MODEL_TYPE_REQUIRED');
  }

  // Проверка parameters
  if (config.parameters && typeof config.parameters !== 'object') {
    addError(errors, 'parameters', 'Parameters must be an object', 'PARAMETERS_INVALID_TYPE');
  }

  // Проверка provider
  if (config.provider && typeof config.provider !== 'string') {
    addError(errors, 'provider', 'Provider must be a string', 'PROVIDER_INVALID_TYPE');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Валидация AIService Entry
 */
export function validateAIServiceEntry(service: AIServiceEntry): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка serviceType
  if (!service.serviceType) {
    addError(errors, 'serviceType', 'Service must have a type', 'SERVICE_TYPE_REQUIRED');
  }

  // Проверка supportedModels
  if (!service.supportedModels || service.supportedModels.length === 0) {
    addError(errors, 'supportedModels', 'Service must support at least one model', 'MODELS_REQUIRED');
  }

  // Проверка методов
  if (typeof service.initializeModel !== 'function') {
    addError(errors, 'initializeModel', 'Service must have initializeModel method', 'INITIALIZE_MODEL_METHOD_REQUIRED');
  }

  if (typeof service.process !== 'function') {
    addError(errors, 'process', 'Service must have process method', 'PROCESS_METHOD_REQUIRED');
  }

  if (typeof service.healthCheck !== 'function') {
    addError(errors, 'healthCheck', 'Service must have healthCheck method', 'HEALTH_CHECK_METHOD_REQUIRED');
  }

  // Проверка aiCapabilities
  if (!service.aiCapabilities || !Array.isArray(service.aiCapabilities)) {
    addWarning(
      warnings,
      'aiCapabilities',
      'AI capabilities are not defined',
      'Define AI capabilities for better discoverability'
    );
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== PLUGIN ENTRY ВАЛИДАТОР =====

export function validatePluginConfig(config: PluginConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка pluginType
  const validPluginTypes = ['enhancement', 'integration', 'capability', 'connector', 'middleware'];

  if (!config.pluginType) {
    addError(errors, 'pluginType', 'Plugin type is required', 'PLUGIN_TYPE_REQUIRED');
  } else if (!validPluginTypes.includes(config.pluginType)) {
    addError(
      errors,
      'pluginType',
      `Invalid plugin type. Must be one of: ${validPluginTypes.join(', ')}`,
      'PLUGIN_TYPE_INVALID'
    );
  }

  // Проверка name
  if (!config.name) {
    addError(errors, 'name', 'Plugin name is required', 'PLUGIN_NAME_REQUIRED');
  }

  // Проверка version
  if (!config.version) {
    addError(errors, 'version', 'Plugin version is required', 'PLUGIN_VERSION_REQUIRED');
  } else if (!/^\d+\.\d+\.\d+/.test(config.version)) {
    addError(errors, 'version', 'Version must follow semantic versioning (e.g., 1.0.0)', 'PLUGIN_VERSION_INVALID');
  }

  // Проверка dependencies
  if (config.dependencies && !Array.isArray(config.dependencies)) {
    addError(errors, 'dependencies', 'Dependencies must be an array', 'DEPENDENCIES_INVALID_TYPE');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Валидация AIPlugin Entry
 */
export function validateAIPluginEntry(plugin: AIPluginEntry): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка pluginType
  if (!plugin.pluginType) {
    addError(errors, 'pluginType', 'Plugin must have a type', 'PLUGIN_TYPE_REQUIRED');
  }

  // Проверка name
  if (!plugin.name) {
    addError(errors, 'name', 'Plugin must have a name', 'PLUGIN_NAME_REQUIRED');
  }

  // Проверка version
  if (!plugin.version) {
    addError(errors, 'version', 'Plugin must have a version', 'PLUGIN_VERSION_REQUIRED');
  }

  // Проверка методов
  if (typeof plugin.initializeAI !== 'function') {
    addError(errors, 'initializeAI', 'Plugin must have initializeAI method', 'INITIALIZE_AI_METHOD_REQUIRED');
  }

  if (typeof plugin.processAIRequest !== 'function') {
    addError(errors, 'processAIRequest', 'Plugin must have processAIRequest method', 'PROCESS_AI_REQUEST_METHOD_REQUIRED');
  }

  if (typeof plugin.checkCompatibility !== 'function') {
    addError(errors, 'checkCompatibility', 'Plugin must have checkCompatibility method', 'CHECK_COMPATIBILITY_METHOD_REQUIRED');
  }

  // Проверка aiCapabilities
  if (!plugin.aiCapabilities || !Array.isArray(plugin.aiCapabilities)) {
    addWarning(
      warnings,
      'aiCapabilities',
      'AI capabilities are not defined',
      'Define AI capabilities for better discoverability'
    );
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== CHAIN OF THOUGHT ВАЛИДАТОР =====

export function validateChainOfThoughtEntry(entry: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка taskId
  if (!entry.taskId) {
    addError(errors, 'taskId', 'Task ID is required', 'TASK_ID_REQUIRED');
  }

  // Проверка task
  if (!entry.task) {
    addError(errors, 'task', 'Task description is required', 'TASK_REQUIRED');
  }

  // Проверка steps
  if (!entry.steps || !Array.isArray(entry.steps)) {
    addError(errors, 'steps', 'Steps must be an array', 'STEPS_INVALID_TYPE');
  } else if (entry.steps.length === 0) {
    addWarning(warnings, 'steps', 'No steps provided', 'Consider breaking down the task into steps');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== RAG ВАЛИДАТОР =====

export function validateRAGEntry(entry: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка queryId
  if (!entry.queryId) {
    addError(errors, 'queryId', 'Query ID is required', 'QUERY_ID_REQUIRED');
  }

  // Проверка query
  if (!entry.query) {
    addError(errors, 'query', 'Query is required', 'QUERY_REQUIRED');
  }

  // Проверка retrievedContext
  if (entry.retrievedContext && !Array.isArray(entry.retrievedContext)) {
    addError(errors, 'retrievedContext', 'Retrieved context must be an array', 'CONTEXT_INVALID_TYPE');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== MULTI-AGENT ВАЛИДАТОР =====

export function validateMultiAgentEntry(entry: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Проверка taskId
  if (!entry.taskId) {
    addError(errors, 'taskId', 'Task ID is required', 'TASK_ID_REQUIRED');
  }

  // Проверка agents
  if (!entry.agents || !Array.isArray(entry.agents)) {
    addError(errors, 'agents', 'Agents must be an array', 'AGENTS_INVALID_TYPE');
  } else if (entry.agents.length === 0) {
    addError(errors, 'agents', 'At least one agent is required', 'AGENTS_REQUIRED');
  }

  // Проверка currentPhase
  const validPhases = [
    'initialization',
    'decomposition',
    'delegation',
    'execution',
    'coordination',
    'synthesis',
    'verification',
    'completed',
    'failed',
  ];

  if (!entry.currentPhase) {
    addError(errors, 'currentPhase', 'Current phase is required', 'PHASE_REQUIRED');
  } else if (!validPhases.includes(entry.currentPhase)) {
    addError(
      errors,
      'currentPhase',
      `Invalid phase. Must be one of: ${validPhases.join(', ')}`,
      'PHASE_INVALID'
    );
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

// ===== ЭКСПОРТ =====

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
};
