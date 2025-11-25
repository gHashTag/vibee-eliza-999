import { type UUID, Agent, Entity, Memory, Component } from '@elizaos/core';
import { BaseDrizzleAdapter } from '../base';
import { type EmbeddingDimensionColumn } from '../schema/embedding';
import type { PostgresConnectionManager } from './manager';
/**
 * Adapter class for interacting with a PostgreSQL database.
 * Extends BaseDrizzleAdapter.
 */
export declare class PgDatabaseAdapter extends BaseDrizzleAdapter {
    protected embeddingDimension: EmbeddingDimensionColumn;
    private manager;
    constructor(agentId: UUID, manager: PostgresConnectionManager, _schema?: any);
    getEntityByIds(entityIds: UUID[]): Promise<Entity[] | null>;
    getMemoriesByServerId(_params: {
        serverId: UUID;
        count?: number;
    }): Promise<Memory[]>;
    ensureAgentExists(agent: Partial<Agent>): Promise<Agent>;
    /**
     * Executes the provided operation with a database connection.
     *
     * @template T
     * @param {() => Promise<T>} operation - The operation to be executed with the database connection.
     * @returns {Promise<T>} A promise that resolves with the result of the operation.
     */
    protected withDatabase<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Asynchronously initializes the PgDatabaseAdapter by running migrations using the manager.
     * Logs a success message if initialization is successful, otherwise logs an error message.
     *
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */
    init(): Promise<void>;
    /**
     * Checks if the database connection is ready and active.
     * @returns {Promise<boolean>} A Promise that resolves to true if the connection is healthy.
     */
    isReady(): Promise<boolean>;
    /**
     * Asynchronously closes the manager associated with this instance.
     *
     * @returns A Promise that resolves once the manager is closed.
     */
    close(): Promise<void>;
    /**
     * Asynchronously retrieves the connection from the manager.
     *
     * @returns {Promise<Pool>} A Promise that resolves with the connection.
     */
    getConnection(): Promise<import("pg").Pool>;
    createAgent(agent: Agent): Promise<boolean>;
    getAgent(agentId: UUID): Promise<Agent | null>;
    updateAgent(agentId: UUID, agent: Partial<Agent>): Promise<boolean>;
    deleteAgent(agentId: UUID): Promise<boolean>;
    createEntities(entities: Entity[]): Promise<boolean>;
    getEntitiesByIds(entityIds: UUID[]): Promise<Entity[]>;
    updateEntity(entity: Entity): Promise<void>;
    createMemory(memory: Memory, tableName: string): Promise<UUID>;
    getMemoryById(memoryId: UUID): Promise<Memory | null>;
    searchMemories(params: any): Promise<any[]>;
    updateMemory(memory: Partial<Memory> & {
        id: UUID;
    }): Promise<boolean>;
    deleteMemory(memoryId: UUID): Promise<void>;
    createComponent(component: Component): Promise<boolean>;
    getComponent(entityId: UUID, type: string, worldId?: UUID, sourceEntityId?: UUID): Promise<Component | null>;
    updateComponent(component: Component): Promise<void>;
    deleteComponent(componentId: UUID): Promise<void>;
}
