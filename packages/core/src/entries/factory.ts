/**
 * AI Entry Pattern Factories
 * Обеспечивают создание и инициализацию Entry компонентов
 */

import type {
  AgentEntryConfig,
  ServiceConfig,
  PluginConfig,
  ModelConfig,
  AIServiceEntry,
  AIPluginEntry,
  AgentEntry,
  AICapability,
  ServiceRequest,
  ServiceResponse,
  AIRequest,
  AIResponse,
  AgentStatus,
  HealthStatus,
  ValidationResult,
} from './types';
import {
  validateAgentConfig,
  validateServiceConfig,
  validateModelConfig,
  validatePluginConfig,
  validateAIServiceEntry,
  validateAIPluginEntry,
} from './validators';
import type {
  IAgentRuntime,
  Character,
  Content,
  ActionResult,
  Service,
  Plugin,
  UUID,
} from '../types';

/**
 * Фабрика для создания Agent Entry с AI-возможностями
 */
export class AIAgentFactory {
  /**
   * Создание AI-агента с валидацией конфигурации
   */
  static async create(config: AgentEntryConfig): Promise<AgentEntry> {
    // Валидация конфигурации
    const validationResult = validateAgentConfig(config);
    if (!validationResult.isValid) {
      throw new Error(
        `Invalid agent config: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    // Создание идентификатора агента
    const agentId = config.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Инициализация среды выполнения
    const runtime = config.runtime;

    // Создание Agent Entry
    const agentEntry: AgentEntry = {
      readonly id: agentId,
      readonly character: config.character,
      readonly runtime,
      readonly capabilities: config.capabilities || [],
      readonly modelType: config.modelType,

      async initialize() {
        try {
          // Инициализация среды выполнения
          await runtime.initialize();

          // Загрузка AI-модели
          if (config.modelType) {
            await this.initializeModel(config.modelType);
          }

          console.log(`[AgentFactory] Agent ${agentId} initialized successfully`);
        } catch (error) {
          console.error(`[AgentFactory] Failed to initialize agent ${agentId}:`, error);
          throw error;
        }
      },

      async handleMessage(message: Content): Promise<ActionResult> {
        try {
          // Обработка сообщения через AI
          const response = await this.processAIMessage(message);

          return {
            success: true,
            text: response,
            values: {
              agentId,
              timestamp: Date.now(),
            },
            data: {
              agentId,
              messageType: 'ai_response',
              response,
            },
          };
        } catch (error) {
          console.error(`[AgentFactory] Error handling message:`, error);
          return {
            success: false,
            error,
            text: 'Failed to process message',
          };
        }
      },

      async generateResponse(input: string): Promise<string> {
        try {
          // Генерация ответа через AI
          return await this.processAIInput(input);
        } catch (error) {
          console.error(`[AgentFactory] Error generating response:`, error);
          throw error;
        }
      },

      async shutdown() {
        try {
          // Остановка всех сервисов агента
          await runtime.stop();
          console.log(`[AgentFactory] Agent ${agentId} shut down successfully`);
        } catch (error) {
          console.error(`[AgentFactory] Error shutting down agent ${agentId}:`, error);
          throw error;
        }
      },

      getStatus(): AgentStatus {
        const isRunning = runtime.isRunning || false;
        const lastActivity = runtime.lastActivity || Date.now();
        const uptime = runtime.uptime || 0;

        return {
          isRunning,
          isInitialized: runtime.isInitialized || false,
          lastActivity,
          uptime,
          memoryUsage: runtime.memoryUsage || 0,
          activeTasks: runtime.activeTasks || 0,
        };
      },

      // Private helper methods
      async initializeModel(modelType: any): Promise<void> {
        // Получение AI-сервиса для модели
        const aiService = runtime.getService('ai') as any;
        if (aiService && typeof aiService.initializeModel === 'function') {
          const modelConfig: ModelConfig = {
            modelType,
            provider: config.modelType ? 'default' : undefined,
          };
          await aiService.initializeModel(modelConfig);
        }
      },

      async processAIMessage(message: Content): Promise<string> {
        // Получение AI-сервиса
        const aiService = runtime.getService('ai') as any;
        if (!aiService) {
          throw new Error('AI service not available');
        }

        // Создание AI-запроса
        const request: AIRequest = {
          capability: 'message_generation',
          input: {
            content: message.content,
            sender: message.senderId,
            roomId: message.roomId,
          },
          context: {
            agentId,
            character: config.character,
            capabilities: this.capabilities,
          },
        };

        // Обработка через AI
        const response: AIResponse = await aiService.processAIRequest(request);
        if (!response.success) {
          throw new Error(response.error || 'AI processing failed');
        }

        return response.output;
      },

      async processAIInput(input: string): Promise<string> {
        // Получение AI-сервиса
        const aiService = runtime.getService('ai') as any;
        if (!aiService) {
          throw new Error('AI service not available');
        }

        // Создание AI-запроса
        const request: AIRequest = {
          capability: 'text_generation',
          input,
          context: {
            agentId,
            character: config.character,
            capabilities: this.capabilities,
          },
        };

        // Обработка через AI
        const response: AIResponse = await aiService.processAIRequest(request);
        if (!response.success) {
          throw new Error(response.error || 'AI processing failed');
        }

        return response.output;
      },
    };

    return agentEntry;
  }

  /**
   * Валидация конфигурации агента
   */
  static validate(config: AgentEntryConfig): ValidationResult {
    return validateAgentConfig(config);
  }
}

/**
 * Фабрика для создания AI Service Entry
 */
export class AIServiceFactory {
  /**
   * Создание AI-сервиса с валидацией
   */
  static async create(config: ServiceConfig): Promise<AIServiceEntry> {
    // Валидация конфигурации
    const validationResult = validateServiceConfig(config);
    if (!validationResult.isValid) {
      throw new Error(
        `Invalid service config: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    // Создание базового сервиса
    const service: AIServiceEntry = {
      readonly serviceType: config.serviceType,
      readonly supportedModels: config.supportedModels,
      readonly aiCapabilities: [],

      async initializeModel(modelConfig: ModelConfig) {
        try {
          // Валидация конфигурации модели
          const modelValidation = validateModelConfig(modelConfig);
          if (!modelValidation.isValid) {
            throw new Error(
              `Invalid model config: ${modelValidation.errors.map(e => e.message).join(', ')}`
            );
          }

          // Инициализация модели
          await this.initModel(modelConfig);
          console.log(`[ServiceFactory] Model initialized for service ${config.serviceType}`);
        } catch (error) {
          console.error(`[ServiceFactory] Failed to initialize model:`, error);
          throw error;
        }
      },

      async process(request: ServiceRequest): Promise<ServiceResponse> {
        try {
          // Обработка запроса
          const result = await this.handleRequest(request);

          return {
            success: true,
            output: result.output,
            confidence: result.confidence,
            metadata: result.metadata,
          };
        } catch (error) {
          console.error(`[ServiceFactory] Error processing request:`, error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },

      async healthCheck(): Promise<HealthStatus> {
        try {
          // Проверка здоровья сервиса
          const status = await this.checkHealth();

          return {
            status: status.healthy ? 'healthy' : 'degraded',
            latency: status.latency,
            errorRate: status.errorRate,
            details: status.details,
          };
        } catch (error) {
          console.error(`[ServiceFactory] Health check failed:`, error);
          return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },

      async getModel() {
        // Получение текущей модели
        return this.currentModel;
      },

      // Private helper methods
      async initModel(modelConfig: ModelConfig): Promise<void> {
        // Инициализация модели сервиса
        this.currentModel = {
          config: modelConfig,
          initialized: true,
          loaded: false,
        };
      },

      async handleRequest(request: ServiceRequest): Promise<{ output: any; confidence?: number; metadata?: any }> {
        // Базовая обработка запроса
        return {
          output: `Processed by ${this.serviceType} service`,
          confidence: 0.8,
          metadata: { serviceType: this.serviceType, requestType: request.type },
        };
      },

      async checkHealth(): Promise<{ healthy: boolean; latency?: number; errorRate?: number; details?: any }> {
        // Базовая проверка здоровья
        return {
          healthy: true,
          latency: 10,
          errorRate: 0.01,
          details: { serviceType: this.serviceType },
        };
      },

      currentModel: null as any,
    };

    // Валидация готового сервиса
    const serviceValidation = validateAIServiceEntry(service);
    if (!serviceValidation.isValid) {
      throw new Error(
        `Invalid service entry: ${serviceValidation.errors.map(e => e.message).join(', ')}`
      );
    }

    return service;
  }

  /**
   * Создание сервиса с заданными AI-возможностями
   */
  static async createWithCapabilities(
    config: ServiceConfig,
    capabilities: AICapability[]
  ): Promise<AIServiceEntry> {
    const service = await this.create(config);
    service.aiCapabilities = capabilities;
    return service;
  }
}

/**
 * Фабрика для создания AI Plugin Entry
 */
export class AIPluginFactory {
  /**
   * Создание AI-плагина с валидацией
   */
  static async create(config: PluginConfig): Promise<AIPluginEntry> {
    // Валидация конфигурации
    const validationResult = validatePluginConfig(config);
    if (!validationResult.isValid) {
      throw new Error(
        `Invalid plugin config: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    // Создание базового плагина
    const plugin: AIPluginEntry = {
      readonly pluginType: config.pluginType,
      readonly name: config.name,
      readonly version: config.version,
      readonly aiCapabilities: [],

      async initializeAI(runtime: IAgentRuntime) {
        try {
          // Инициализация AI-компонентов плагина
          await this.initAIComponents(runtime);
          console.log(`[PluginFactory] AI initialized for plugin ${config.name}`);
        } catch (error) {
          console.error(`[PluginFactory] Failed to initialize AI:`, error);
          throw error;
        }
      },

      async processAIRequest(request: AIRequest): Promise<AIResponse> {
        try {
          // Обработка AI-запроса
          const result = await this.handleAIRequest(request);

          return {
            success: true,
            output: result.output,
            confidence: result.confidence,
            reasoning: result.reasoning,
            metadata: result.metadata,
          };
        } catch (error) {
          console.error(`[PluginFactory] Error processing AI request:`, error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },

      async checkCompatibility(runtime: IAgentRuntime): Promise<boolean> {
        try {
          // Проверка совместимости с runtime
          return await this.verifyCompatibility(runtime);
        } catch (error) {
          console.error(`[PluginFactory] Compatibility check failed:`, error);
          return false;
        }
      },

      // Private helper methods
      async initAIComponents(runtime: IAgentRuntime): Promise<void> {
        // Инициализация AI-компонентов плагина
        this.aiComponents = {
          initialized: true,
          runtime,
          ready: true,
        };
      },

      async handleAIRequest(request: AIRequest): Promise<{ output: any; confidence?: number; reasoning?: string; metadata?: any }> {
        // Базовая обработка AI-запроса
        return {
          output: `Processed by ${this.name} plugin`,
          confidence: 0.9,
          reasoning: `Request handled by ${this.pluginType} plugin`,
          metadata: { pluginName: this.name, pluginType: this.pluginType, requestType: request.capability },
        };
      },

      async verifyCompatibility(runtime: IAgentRuntime): Promise<boolean> {
        // Базовая проверка совместимости
        return true;
      },

      aiComponents: null as any,
    };

    // Валидация готового плагина
    const pluginValidation = validateAIPluginEntry(plugin);
    if (!pluginValidation.isValid) {
      throw new Error(
        `Invalid plugin entry: ${pluginValidation.errors.map(e => e.message).join(', ')}`
      );
    }

    return plugin;
  }

  /**
   * Создание плагина с заданными AI-возможностями
   */
  static async createWithCapabilities(
    config: PluginConfig,
    capabilities: AICapability[]
  ): Promise<AIPluginEntry> {
    const plugin = await this.create(config);
    plugin.aiCapabilities = capabilities;
    return plugin;
  }
}

// ===== ЭКСПОРТ =====

export { AIAgentFactory, AIServiceFactory, AIPluginFactory };
