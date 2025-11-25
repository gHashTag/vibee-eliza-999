/**
 * Multi-Agent Entry Pattern
 * Координация работы нескольких AI-агентов
 */
import type { MultiAgentEntry, AgentAssignment, AgentMessage, AgentPhase } from './types';
import type { UUID } from '../types';
/**
 * Координатор Multi-Agent системы
 */
export declare class MultiAgentCoordinator {
    /**
     * Обработка Multi-Agent задачи
     */
    process(entry: MultiAgentEntry): Promise<MultiAgentEntry>;
    /**
     * Инициализация агентов
     */
    private initializeAgents;
    /**
     * Декомпозиция задачи
     */
    private decomposeTask;
    /**
     * Делегирование задач агентам
     */
    private delegateTasks;
    /**
     * Выполнение задач
     */
    private executeTasks;
    /**
     * Координация между агентами
     */
    private coordinate;
    /**
     * Синтез результатов
     */
    private synthesizeResults;
    /**
     * Верификация результатов
     */
    private verifyResults;
    /**
     * Завершение задачи
     */
    private complete;
    /**
     * Обработка неудачи
     */
    private handleFailure;
    /**
     * Анализ задачи и разбивка на подзадачи
     */
    private analyzeTask;
    /**
     * Сбор результатов от агентов
     */
    private collectResults;
    /**
     * Объединение результатов
     */
    private mergeResults;
    /**
     * Проверка качества результатов
     */
    private verifyQuality;
    /**
     * Создание новой Multi-Agent задачи
     */
    static create(taskId: string, agents: AgentAssignment[]): MultiAgentEntry;
    /**
     * Добавление агента в задачу
     */
    static addAgent(entry: MultiAgentEntry, agent: AgentAssignment): MultiAgentEntry;
    /**
     * Создание сообщения между агентами
     */
    static createMessage(senderId: UUID, receiverId: UUID, content: string, messageType?: AgentMessage['messageType'], priority?: AgentMessage['priority']): AgentMessage;
    /**
     * Переход к следующей фазе
     */
    static nextPhase(entry: MultiAgentEntry): MultiAgentEntry;
    /**
     * Создание назначения агента
     */
    static createAssignment(agentId: UUID, role: string, capabilities: string[]): AgentAssignment;
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
    };
}
//# sourceMappingURL=multi-agent-entry.d.ts.map