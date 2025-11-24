/**
 * Multi-Agent Entry Pattern
 * Координация работы нескольких AI-агентов
 */

import type {
  MultiAgentEntry,
  AgentAssignment,
  AgentMessage,
  AgentPhase,
  ValidationResult,
} from './types';
import { validateMultiAgentEntry } from './validators';
import type { UUID } from '../types';

/**
 * Координатор Multi-Agent системы
 */
export class MultiAgentCoordinator {
  /**
   * Обработка Multi-Agent задачи
   */
  async process(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    // Валидация входных данных
    const validation = validateMultiAgentEntry(entry);
    if (!validation.isValid) {
      throw new Error(
        `Invalid Multi-Agent entry: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    console.log(`[MultiAgentCoordinator] Processing task ${entry.taskId}, phase: ${entry.currentPhase}`);

    switch (entry.currentPhase) {
      case 'initialization':
        return this.initializeAgents(entry);
      case 'decomposition':
        return this.decomposeTask(entry);
      case 'delegation':
        return this.delegateTasks(entry);
      case 'execution':
        return this.executeTasks(entry);
      case 'coordination':
        return this.coordinate(entry);
      case 'synthesis':
        return this.synthesizeResults(entry);
      case 'verification':
        return this.verifyResults(entry);
      case 'completed':
        return this.complete(entry);
      case 'failed':
        return this.handleFailure(entry);
      default:
        throw new Error(`Unknown phase: ${entry.currentPhase}`);
    }
  }

  /**
   * Инициализация агентов
   */
  private async initializeAgents(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Initializing ${entry.agents.length} agents`);

    // Инициализация каждого агента
    const initializedAgents = await Promise.all(
      entry.agents.map(async (agent) => {
        try {
          console.log(`[MultiAgentCoordinator] Initializing agent ${agent.agentId}`);

          // Имитация инициализации
          await new Promise(resolve => setTimeout(resolve, 100));

          return {
            ...agent,
            status: 'idle' as const,
          };
        } catch (error) {
          console.error(`[MultiAgentCoordinator] Failed to initialize agent ${agent.agentId}:`, error);
          return {
            ...agent,
            status: 'failed' as const,
          };
        }
      })
    );

    return {
      ...entry,
      agents: initializedAgents,
      currentPhase: 'decomposition',
      metadata: {
        ...entry.metadata,
        initializedAt: Date.now(),
        initializedAgents: initializedAgents.filter(a => a.status === 'idle').length,
      },
    };
  }

  /**
   * Декомпозиция задачи
   */
  private async decomposeTask(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Decomposing task`);

    // Анализ задачи и разбивка на подзадачи
    const subtasks = this.analyzeTask(entry);

    // Обновление агентов с информацией о задачах
    const updatedAgents = entry.agents.map(agent => ({
      ...agent,
      workload: subtasks.filter(task => task.assignedTo === agent.agentId).length,
    }));

    // Добавление сообщения о декомпозиции
    const decompositionMessage: AgentMessage = {
      senderId: 'coordinator',
      receiverId: 'all',
      content: `Task decomposed into ${subtasks.length} subtasks`,
      timestamp: Date.now(),
      messageType: 'coordination',
      priority: 'normal',
    };

    return {
      ...entry,
      agents: updatedAgents,
      messageHistory: [...entry.messageHistory, decompositionMessage],
      currentPhase: 'delegation',
      metadata: {
        ...entry.metadata,
        subtasksCount: subtasks.length,
        decomposedAt: Date.now(),
      },
    };
  }

  /**
   * Делегирование задач агентам
   */
  private async delegateTasks(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Delegating tasks`);

    // Создание сообщений о делегировании
    const delegationMessages: AgentMessage[] = entry.agents
      .filter(agent => agent.status === 'idle')
      .map(agent => ({
        senderId: 'coordinator',
        receiverId: agent.agentId,
        content: `Task assigned: ${agent.role}`,
        timestamp: Date.now(),
        messageType: 'request',
        priority: 'high',
      }));

    // Обновление статуса агентов
    const updatedAgents = entry.agents.map(agent => {
      if (agent.status === 'idle') {
        return {
          ...agent,
          status: 'busy' as const,
        };
      }
      return agent;
    });

    return {
      ...entry,
      agents: updatedAgents,
      messageHistory: [...entry.messageHistory, ...delegationMessages],
      currentPhase: 'execution',
      metadata: {
        ...entry.metadata,
        delegatedAt: Date.now(),
        delegatedAgents: delegationMessages.length,
      },
    };
  }

  /**
   * Выполнение задач
   */
  private async executeTasks(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Monitoring task execution`);

    // Имитация выполнения задач
    await new Promise(resolve => setTimeout(resolve, 200));

    // Обновление статуса агентов (в реальной системе здесь будет опрос состояния)
    const updatedAgents = entry.agents.map(agent => {
      if (agent.status === 'busy') {
        return {
          ...agent,
          status: 'completed' as const,
        };
      }
      return agent;
    });

    // Сообщения о завершении
    const completionMessages: AgentMessage[] = updatedAgents
      .filter(agent => agent.status === 'completed')
      .map(agent => ({
        senderId: agent.agentId,
        receiverId: 'coordinator',
        content: `Task completed: ${agent.role}`,
        timestamp: Date.now(),
        messageType: 'response',
        priority: 'normal',
      }));

    return {
      ...entry,
      agents: updatedAgents,
      messageHistory: [...entry.messageHistory, ...completionMessages],
      currentPhase: 'coordination',
      metadata: {
        ...entry.metadata,
        executedAt: Date.now(),
        completedAgents: updatedAgents.filter(a => a.status === 'completed').length,
      },
    };
  }

  /**
   * Координация между агентами
   */
  private async coordinate(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Coordinating between agents`);

    // Анализ сообщений и согласование действий
    const coordinationMessage: AgentMessage = {
      senderId: 'coordinator',
      receiverId: 'all',
      content: 'Coordinating results from all agents',
      timestamp: Date.now(),
      messageType: 'coordination',
      priority: 'high',
    };

    return {
      ...entry,
      messageHistory: [...entry.messageHistory, coordinationMessage],
      currentPhase: 'synthesis',
      metadata: {
        ...entry.metadata,
        coordinatedAt: Date.now(),
      },
    };
  }

  /**
   * Синтез результатов
   */
  private async synthesizeResults(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Synthesizing results`);

    // Сбор результатов от всех агентов
    const results = this.collectResults(entry);

    // Создание итогового результата
    const finalResult = this.mergeResults(results);

    const synthesisMessage: AgentMessage = {
      senderId: 'coordinator',
      receiverId: 'all',
      content: 'Results synthesized successfully',
      timestamp: Date.now(),
      messageType: 'broadcast',
      priority: 'normal',
    };

    return {
      ...entry,
      finalResult,
      messageHistory: [...entry.messageHistory, synthesisMessage],
      currentPhase: 'verification',
      metadata: {
        ...entry.metadata,
        synthesizedAt: Date.now(),
        resultSize: JSON.stringify(finalResult).length,
      },
    };
  }

  /**
   * Верификация результатов
   */
  private async verifyResults(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Verifying results`);

    // Проверка качества результатов
    const verificationPassed = this.verifyQuality(entry.finalResult);

    const verificationMessage: AgentMessage = {
      senderId: 'coordinator',
      receiverId: 'all',
      content: verificationPassed ? 'Verification passed' : 'Verification failed',
      timestamp: Date.now(),
      messageType: 'coordination',
      priority: 'high',
    };

    return {
      ...entry,
      messageHistory: [...entry.messageHistory, verificationMessage],
      currentPhase: verificationPassed ? 'completed' : 'failed',
      metadata: {
        ...entry.metadata,
        verifiedAt: Date.now(),
        verificationPassed,
      },
    };
  }

  /**
   * Завершение задачи
   */
  private async complete(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Task completed successfully`);

    return {
      ...entry,
      metadata: {
        ...entry.metadata,
        completedAt: Date.now(),
        totalExecutionTime: Date.now() - (entry.metadata?.initializedAt || Date.now()),
      },
    };
  }

  /**
   * Обработка неудачи
   */
  private async handleFailure(entry: MultiAgentEntry): Promise<MultiAgentEntry> {
    console.log(`[MultiAgentCoordinator] Task failed, analyzing failure`);

    const failureMessage: AgentMessage = {
      senderId: 'coordinator',
      receiverId: 'all',
      content: 'Task failed, initiating recovery procedures',
      timestamp: Date.now(),
      messageType: 'coordination',
      priority: 'urgent',
    };

    return {
      ...entry,
      messageHistory: [...entry.messageHistory, failureMessage],
      metadata: {
        ...entry.metadata,
        failedAt: Date.now(),
        failureReason: 'Verification failed - results did not meet quality criteria',
      },
    };
  }

  /**
   * Анализ задачи и разбивка на подзадачи
   */
  private analyzeTask(entry: MultiAgentEntry): Array<{ id: string; assignedTo: UUID; description: string }> {
    const subtasks: Array<{ id: string; assignedTo: UUID; description: string }> = [];

    // Простая эвристика разбивки задачи
    for (const agent of entry.agents) {
      subtasks.push({
        id: `subtask_${agent.agentId}`,
        assignedTo: agent.agentId,
        description: `${agent.role}: ${agent.capabilities.join(', ')}`,
      });
    }

    return subtasks;
  }

  /**
   * Сбор результатов от агентов
   */
  private collectResults(entry: MultiAgentEntry): Record<string, any> {
    const results: Record<string, any> = {};

    for (const agent of entry.agents) {
      if (agent.status === 'completed') {
        results[agent.agentId] = {
          role: agent.role,
          capabilities: agent.capabilities,
          workload: agent.workload,
          timestamp: Date.now(),
        };
      }
    }

    return results;
  }

  /**
   * Объединение результатов
   */
  private mergeResults(results: Record<string, any>): any {
    return {
      status: 'completed',
      agents: results,
      summary: `Task completed by ${Object.keys(results).length} agents`,
      timestamp: Date.now(),
    };
  }

  /**
   * Проверка качества результатов
   */
  private verifyQuality(result: any): boolean {
    // Простая проверка качества
    if (!result || typeof result !== 'object') {
      return false;
    }

    if (!result.agents || Object.keys(result.agents).length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Создание новой Multi-Agent задачи
   */
  static create(taskId: string, agents: AgentAssignment[]): MultiAgentEntry {
    return {
      taskId,
      agents,
      messageHistory: [],
      currentPhase: 'initialization',
      metadata: {
        createdAt: Date.now(),
        agentCount: agents.length,
      },
    };
  }

  /**
   * Добавление агента в задачу
   */
  static addAgent(entry: MultiAgentEntry, agent: AgentAssignment): MultiAgentEntry {
    return {
      ...entry,
      agents: [...entry.agents, agent],
      metadata: {
        ...entry.metadata,
        agentCount: entry.agents.length + 1,
      },
    };
  }

  /**
   * Создание сообщения между агентами
   */
  static createMessage(
    senderId: UUID,
    receiverId: UUID,
    content: string,
    messageType: AgentMessage['messageType'] = 'request',
    priority: AgentMessage['priority'] = 'normal'
  ): AgentMessage {
    return {
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
      messageType,
      priority,
    };
  }

  /**
   * Переход к следующей фазе
   */
  static nextPhase(entry: MultiAgentEntry): MultiAgentEntry {
    const phases: AgentPhase[] = [
      'initialization',
      'decomposition',
      'delegation',
      'execution',
      'coordination',
      'synthesis',
      'verification',
    ];

    const currentIndex = phases.indexOf(entry.currentPhase);
    const nextPhase = phases[currentIndex + 1] || 'completed';

    return {
      ...entry,
      currentPhase: nextPhase,
    };
  }

  /**
   * Создание назначения агента
   */
  static createAssignment(
    agentId: UUID,
    role: string,
    capabilities: string[]
  ): AgentAssignment {
    return {
      agentId,
      role,
      capabilities,
      workload: 0,
      status: 'idle',
    };
  }

  /**
   * Получение статистики Multi-Agent задачи
   */
  static getStats(entry: MultiAgentEntry): {
    taskId: string;
    currentPhase: AgentPhase;
    agentCount: number;
    messageCount: number;
    completedAgents: number;
    busyAgents: number;
    failedAgents: number;
    idleAgents: number;
  } {
    return {
      taskId: entry.taskId,
      currentPhase: entry.currentPhase,
      agentCount: entry.agents.length,
      messageCount: entry.messageHistory.length,
      completedAgents: entry.agents.filter(a => a.status === 'completed').length,
      busyAgents: entry.agents.filter(a => a.status === 'busy').length,
      failedAgents: entry.agents.filter(a => a.status === 'failed').length,
      idleAgents: entry.agents.filter(a => a.status === 'idle').length,
    };
  }
}
