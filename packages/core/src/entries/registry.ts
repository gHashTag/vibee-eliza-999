/**
 * AI Entry Pattern Registry
 * Управление регистрацией и доступом к Entry компонентам
 */

import type {
  AgentEntry,
  AIServiceEntry,
  AIPluginEntry,
  EntryRegistry,
  AICapability,
} from './types';
import type { UUID } from '../types';

/**
 * Регистр для AI Entry компонентов
 */
export class AIEntryRegistry {
  private static agents = new Map<UUID, AgentEntry>();
  private static services = new Map<string, AIServiceEntry>();
  private static plugins = new Map<string, AIPluginEntry>();
  private static capabilities = new Map<string, { type: 'agent' | 'service' | 'plugin'; id: string }>();

  /**
   * Регистрация AI-агента
   */
  static registerAgent(entry: AgentEntry): void {
    if (!entry.id) {
      throw new Error('Agent entry must have an ID');
    }

    if (this.agents.has(entry.id)) {
      console.warn(`[AIEntryRegistry] Agent ${entry.id} already registered, overwriting...`);
    }

    this.agents.set(entry.id, entry);

    // Регистрация возможностей агента
    if (entry.capabilities) {
      for (const capability of entry.capabilities) {
        this.capabilities.set(capability, { type: 'agent', id: entry.id });
      }
    }

    console.log(`[AIEntryRegistry] Agent ${entry.id} registered successfully`);
  }

  /**
   * Получение AI-агента по ID
   */
  static getAgent(id: UUID): AgentEntry | undefined {
    return this.agents.get(id);
  }

  /**
   * Получение всех зарегистрированных агентов
   */
  static getAllAgents(): AgentEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Удаление AI-агента
   */
  static unregisterAgent(id: UUID): void {
    const agent = this.agents.get(id);
    if (agent) {
      // Удаление возможностей агента
      if (agent.capabilities) {
        for (const capability of agent.capabilities) {
          this.capabilities.delete(capability);
        }
      }

      // Удаление агента
      this.agents.delete(id);

      console.log(`[AIEntryRegistry] Agent ${id} unregistered successfully`);
    }
  }

  /**
   * Очистка всех агентов
   */
  static clearAgents(): void {
    // Удаление всех возможностей агентов
    for (const [capability, info] of this.capabilities.entries()) {
      if (info.type === 'agent') {
        this.capabilities.delete(capability);
      }
    }

    this.agents.clear();
    console.log('[AIEntryRegistry] All agents cleared');
  }

  /**
   * Регистрация AI-сервиса
   */
  static registerService(entry: AIServiceEntry): void {
    if (!entry.serviceType) {
      throw new Error('Service entry must have a serviceType');
    }

    if (this.services.has(entry.serviceType)) {
      console.warn(
        `[AIEntryRegistry] Service ${entry.serviceType} already registered, overwriting...`
      );
    }

    this.services.set(entry.serviceType, entry);

    // Регистрация AI-возможностей сервиса
    if (entry.aiCapabilities) {
      for (const capability of entry.aiCapabilities) {
        this.capabilities.set(capability.name, { type: 'service', id: entry.serviceType });
      }
    }

    console.log(`[AIEntryRegistry] Service ${entry.serviceType} registered successfully`);
  }

  /**
   * Получение AI-сервиса по типу
   */
  static getService(serviceType: string): AIServiceEntry | undefined {
    return this.services.get(serviceType);
  }

  /**
   * Получение сервиса по AI-возможности
   */
  static getServiceByCapability(capabilityName: string): AIServiceEntry | undefined {
    const info = this.capabilities.get(capabilityName);
    if (info && info.type === 'service') {
      return this.services.get(info.id);
    }
    return undefined;
  }

  /**
   * Получение всех зарегистрированных сервисов
   */
  static getAllServices(): AIServiceEntry[] {
    return Array.from(this.services.values());
  }

  /**
   * Удаление AI-сервиса
   */
  static unregisterService(serviceType: string): void {
    const service = this.services.get(serviceType);
    if (service) {
      // Удаление AI-возможностей сервиса
      if (service.aiCapabilities) {
        for (const capability of service.aiCapabilities) {
          this.capabilities.delete(capability.name);
        }
      }

      // Удаление сервиса
      this.services.delete(serviceType);

      console.log(`[AIEntryRegistry] Service ${serviceType} unregistered successfully`);
    }
  }

  /**
   * Очистка всех сервисов
   */
  static clearServices(): void {
    // Удаление всех возможностей сервисов
    for (const [capability, info] of this.capabilities.entries()) {
      if (info.type === 'service') {
        this.capabilities.delete(capability);
      }
    }

    this.services.clear();
    console.log('[AIEntryRegistry] All services cleared');
  }

  /**
   * Регистрация AI-плагина
   */
  static registerPlugin(entry: AIPluginEntry): void {
    if (!entry.name) {
      throw new Error('Plugin entry must have a name');
    }

    if (this.plugins.has(entry.name)) {
      console.warn(`[AIEntryRegistry] Plugin ${entry.name} already registered, overwriting...`);
    }

    this.plugins.set(entry.name, entry);

    // Регистрация AI-возможностей плагина
    if (entry.aiCapabilities) {
      for (const capability of entry.aiCapabilities) {
        this.capabilities.set(capability.name, { type: 'plugin', id: entry.name });
      }
    }

    console.log(`[AIEntryRegistry] Plugin ${entry.name} registered successfully`);
  }

  /**
   * Получение AI-плагина по имени
   */
  static getPlugin(name: string): AIPluginEntry | undefined {
    return this.plugins.get(name);
  }

  /**
   * Получение плагина по AI-возможности
   */
  static getPluginByCapability(capabilityName: string): AIPluginEntry | undefined {
    const info = this.capabilities.get(capabilityName);
    if (info && info.type === 'plugin') {
      return this.plugins.get(info.id);
    }
    return undefined;
  }

  /**
   * Получение всех зарегистрированных плагинов
   */
  static getAllPlugins(): AIPluginEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Удаление AI-плагина
   */
  static unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      // Удаление AI-возможностей плагина
      if (plugin.aiCapabilities) {
        for (const capability of plugin.aiCapabilities) {
          this.capabilities.delete(capability.name);
        }
      }

      // Удаление плагина
      this.plugins.delete(name);

      console.log(`[AIEntryRegistry] Plugin ${name} unregistered successfully`);
    }
  }

  /**
   * Очистка всех плагинов
   */
  static clearPlugins(): void {
    // Удаление всех возможностей плагинов
    for (const [capability, info] of this.capabilities.entries()) {
      if (info.type === 'plugin') {
        this.capabilities.delete(capability);
      }
    }

    this.plugins.clear();
    console.log('[AIEntryRegistry] All plugins cleared');
  }

  /**
   * Поиск Entry компонента по AI-возможности
   */
  static findEntryByCapability(capabilityName: string): {
    type: 'agent' | 'service' | 'plugin';
    entry: AgentEntry | AIServiceEntry | AIPluginEntry;
  } | undefined {
    const info = this.capabilities.get(capabilityName);
    if (!info) return undefined;

    let entry: AgentEntry | AIServiceEntry | AIPluginEntry | undefined;

    switch (info.type) {
      case 'agent':
        entry = this.agents.get(info.id as UUID);
        break;
      case 'service':
        entry = this.services.get(info.id);
        break;
      case 'plugin':
        entry = this.plugins.get(info.id);
        break;
    }

    return entry ? { type: info.type, entry } : undefined;
  }

  /**
   * Получение всех AI-возможностей
   */
  static getAllCapabilities(): { name: string; type: 'agent' | 'service' | 'plugin'; ownerId: string }[] {
    return Array.from(this.capabilities.entries()).map(([name, info]) => ({
      name,
      type: info.type,
      ownerId: info.id,
    }));
  }

  /**
   * Получение AI-возможностей по типу
   */
  static getCapabilitiesByType(type: 'agent' | 'service' | 'plugin'): string[] {
    return Array.from(this.capabilities.entries())
      .filter(([, info]) => info.type === type)
      .map(([name]) => name);
  }

  /**
   * Проверка наличия AI-возможности
   */
  static hasCapability(capabilityName: string): boolean {
    return this.capabilities.has(capabilityName);
  }

  /**
   * Инициализация всех зарегистрированных компонентов
   */
  static async initializeAll(): Promise<void> {
    console.log('[AIEntryRegistry] Initializing all registered components...');

    // Инициализация агентов
    for (const agent of this.agents.values()) {
      try {
        await agent.initialize();
      } catch (error) {
        console.error(`[AIEntryRegistry] Failed to initialize agent ${agent.id}:`, error);
      }
    }

    // Инициализация сервисов
    for (const service of this.services.values()) {
      try {
        if (typeof service.initializeModel === 'function') {
          // Модель будет инициализирована при первом использовании
        }
      } catch (error) {
        console.error(
          `[AIEntryRegistry] Failed to initialize service ${service.serviceType}:`,
          error
        );
      }
    }

    // Инициализация плагинов
    for (const plugin of this.plugins.values()) {
      try {
        // Плагины требуют runtime для инициализации AI-компонентов
        // Инициализация будет выполнена при подключении к runtime
      } catch (error) {
        console.error(`[AIEntryRegistry] Failed to initialize plugin ${plugin.name}:`, error);
      }
    }

    console.log('[AIEntryRegistry] All components initialized');
  }

  /**
   * Остановка всех зарегистрированных компонентов
   */
  static async shutdownAll(): Promise<void> {
    console.log('[AIEntryRegistry] Shutting down all registered components...');

    // Остановка агентов
    for (const agent of this.agents.values()) {
      try {
        await agent.shutdown();
      } catch (error) {
        console.error(`[AIEntryRegistry] Failed to shutdown agent ${agent.id}:`, error);
      }
    }

    console.log('[AIEntryRegistry] All components shut down');
  }

  /**
   * Получение статистики регистра
   */
  static getStats(): {
    agents: number;
    services: number;
    plugins: number;
    capabilities: number;
  } {
    return {
      agents: this.agents.size,
      services: this.services.size,
      plugins: this.plugins.size,
      capabilities: this.capabilities.size,
    };
  }

  /**
   * Получение списка компонентов по типу
   */
  static listComponentsByType(type: 'agent' | 'service' | 'plugin'): {
    id: string;
    name: string;
    type: typeof type;
  }[] {
    const components: { id: string; name: string; type: typeof type }[] = [];

    switch (type) {
      case 'agent':
        for (const [id, entry] of this.agents.entries()) {
          components.push({
            id,
            name: entry.character?.name || id,
            type: 'agent' as const,
          });
        }
        break;
      case 'service':
        for (const [id, entry] of this.services.entries()) {
          components.push({
            id,
            name: entry.serviceType,
            type: 'service' as const,
          });
        }
        break;
      case 'plugin':
        for (const [id, entry] of this.plugins.entries()) {
          components.push({
            id,
            name: entry.name,
            type: 'plugin' as const,
          });
        }
        break;
    }

    return components;
  }

  /**
   * Очистка всего регистра
   */
  static clearAll(): void {
    this.clearAgents();
    this.clearServices();
    this.clearPlugins();
    console.log('[AIEntryRegistry] All components cleared');
  }
}

// ===== ЭКСПОРТ =====

export { AIEntryRegistry };
