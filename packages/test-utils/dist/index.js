// src/realRuntime.ts
import { AgentRuntime, logger as logger3, stringToUuid } from "@elizaos/core";

// ../../node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0;i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// ../../node_modules/uuid/dist-node/rng.js
import { randomFillSync } from "node:crypto";
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// ../../node_modules/uuid/dist-node/native.js
import { randomUUID } from "node:crypto";
var native_default = { randomUUID };

// ../../node_modules/uuid/dist-node/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0;i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
var v4_default = v4;
// src/testDatabase.ts
import { logger } from "@elizaos/core";
class TestDatabaseManager {
  testDatabases = new Map;
  tempPaths = new Set;
  async createIsolatedDatabase(testId) {
    try {
      logger.debug(`Creating isolated test database for ${testId}`);
      let adapter;
      try {
        logger.debug(`Attempting to load PostgreSQL adapter for ${testId}`);
        if (process.env.FORCE_MOCK_DB === "true") {
          logger.warn("FORCE_MOCK_DB is set - using mock database");
          adapter = this.createMockDatabase(testId);
        } else {
          try {
            const sqlPlugin = globalThis.__elizaOS_sqlPlugin;
            if (!sqlPlugin?.createDatabaseAdapter) {
              throw new Error("SQL plugin not available - falling back to mock database");
            }
            const postgresUrl = process.env.TEST_POSTGRES_URL || process.env.POSTGRES_URL;
            if (!postgresUrl) {
              throw new Error("PostgreSQL URL not available - falling back to mock database");
            }
            adapter = await sqlPlugin.createDatabaseAdapter({
              postgresUrl
            }, "11111111-2222-3333-4444-555555555555");
            logger.debug(`Successfully created PostgreSQL adapter for ${testId}`);
          } catch (importError) {
            logger.warn(`SQL plugin not available: ${importError instanceof Error ? importError.message : String(importError)} - falling back to mock database`);
            adapter = this.createMockDatabase(testId);
          }
        }
      } catch (postgresError) {
        logger.warn(`Failed to create PostgreSQL database: ${postgresError instanceof Error ? postgresError.message : String(postgresError)} - falling back to mock database`);
        adapter = this.createMockDatabase(testId);
      }
      await adapter.init();
      this.testDatabases.set(testId, adapter);
      logger.debug(`Successfully created isolated database for ${testId}`);
      return adapter;
    } catch (error) {
      logger.error(`Failed to create test database for ${testId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Test database creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  createMockDatabase(testId) {
    const storage = {
      agents: new Map,
      entities: new Map,
      memories: new Map,
      relationships: new Map,
      rooms: new Map,
      participants: new Map,
      cache: new Map,
      worlds: new Map,
      tasks: new Map,
      logs: new Map
    };
    const adapter = {
      db: null,
      async initialize() {
        logger.debug(`Initialized mock database for ${testId}`);
      },
      async init() {
        logger.debug(`Initialized mock database for ${testId}`);
      },
      async runMigrations() {},
      async isReady() {
        return true;
      },
      async close() {
        storage.agents.clear();
        storage.entities.clear();
        storage.memories.clear();
        storage.relationships.clear();
        storage.rooms.clear();
        storage.participants.clear();
        storage.cache.clear();
        storage.worlds.clear();
        storage.tasks.clear();
      },
      async getConnection() {
        return null;
      },
      async ensureEmbeddingDimension() {},
      async getAgent(agentId) {
        return storage.agents.get(agentId) || null;
      },
      async getAgents() {
        return Array.from(storage.agents.values());
      },
      async createAgent(agent) {
        const id = agent.id || v4_default();
        const fullAgent = { ...agent, id };
        storage.agents.set(id, fullAgent);
        return true;
      },
      async updateAgent(agentId, agent) {
        if (storage.agents.has(agentId)) {
          storage.agents.set(agentId, { ...agent, id: agentId });
          return true;
        }
        return false;
      },
      async deleteAgent(agentId) {
        return storage.agents.delete(agentId);
      },
      async createEntity(entity) {
        const id = entity.id || v4_default();
        const fullEntity = { ...entity, id };
        storage.entities.set(id, fullEntity);
        return fullEntity;
      },
      async createEntities(entities) {
        for (const entity of entities) {
          const id = entity.id || v4_default();
          const fullEntity = { ...entity, id };
          storage.entities.set(id, fullEntity);
        }
        return true;
      },
      async getEntityById(id) {
        return storage.entities.get(id) || null;
      },
      async updateEntity(entity) {
        if (!entity.id || !storage.entities.has(entity.id)) {
          throw new Error("Entity not found");
        }
        storage.entities.set(entity.id, entity);
      },
      async getEntitiesForRoom(roomId) {
        const participants = Array.from(storage.participants.values()).filter((p) => p.roomId === roomId);
        const entities = [];
        for (const participant of participants) {
          const entity = storage.entities.get(participant.entityId);
          if (entity) {
            entities.push(entity);
          }
        }
        return entities;
      },
      async createMemory(memory, tableName = "messages", _unique = false) {
        const id = memory.id || v4_default();
        const fullMemory = {
          ...memory,
          id,
          createdAt: memory.createdAt || Date.now()
        };
        if (!storage.memories.has(tableName)) {
          storage.memories.set(tableName, new Map);
        }
        storage.memories.get(tableName).set(id, fullMemory);
        return id;
      },
      async getMemories(params) {
        const tableName = params.tableName || "messages";
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return [];
        }
        let memories = Array.from(tableData.values());
        if (params.roomId) {
          memories = memories.filter((m) => m.roomId === params.roomId);
        }
        if (params.entityId) {
          memories = memories.filter((m) => m.entityId === params.entityId);
        }
        memories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (params.count) {
          memories = memories.slice(0, params.count);
        }
        return memories;
      },
      async searchMemories(params) {
        const tableName = params.tableName || "messages";
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return [];
        }
        let memories = Array.from(tableData.values());
        if (params.roomId) {
          memories = memories.filter((m) => m.roomId === params.roomId);
        }
        if (params.query) {
          memories = memories.filter((m) => m.content?.text?.toLowerCase().includes(params.query.toLowerCase()));
        }
        return memories.slice(0, params.count || 10);
      },
      async getMemoryById(id) {
        for (const [_tableName, tableData] of storage.memories) {
          const memory = tableData.get(id);
          if (memory) {
            return memory;
          }
        }
        return null;
      },
      async getMemoriesByIds(ids, tableName = "messages") {
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return [];
        }
        const memories = [];
        for (const id of ids) {
          const memory = tableData.get(id);
          if (memory) {
            memories.push(memory);
          }
        }
        return memories;
      },
      async getMemoriesByRoomIds(params) {
        const tableData = storage.memories.get(params.tableName);
        if (!tableData) {
          return [];
        }
        let memories = Array.from(tableData.values()).filter((m) => params.roomIds.includes(m.roomId));
        if (params.limit) {
          memories = memories.slice(0, params.limit);
        }
        return memories;
      },
      async getCachedEmbeddings() {
        return [];
      },
      async log(params) {
        if (!storage.logs) {
          storage.logs = new Map;
        }
        const logId = v4_default();
        storage.logs.set(logId, {
          id: logId,
          ...params,
          createdAt: new Date
        });
      },
      async getLogs() {
        if (!storage.logs) {
          return [];
        }
        return Array.from(storage.logs.values());
      },
      async deleteMemory(memoryId, tableName = "messages") {
        const tableData = storage.memories.get(tableName);
        if (tableData) {
          return tableData.delete(memoryId);
        }
        return false;
      },
      async createRoom(room) {
        const id = room.id || v4_default();
        const fullRoom = { ...room, id };
        storage.rooms.set(id, fullRoom);
      },
      async getRoom(roomId) {
        return storage.rooms.get(roomId) || null;
      },
      async getRooms(worldId) {
        return Array.from(storage.rooms.values()).filter((room) => !worldId || room.worldId === worldId);
      },
      async addParticipant(entityId, roomId) {
        const participantId = `${entityId}-${roomId}`;
        storage.participants.set(participantId, { entityId, roomId });
        return true;
      },
      async removeParticipant(entityId, roomId) {
        const participantId = `${entityId}-${roomId}`;
        return storage.participants.delete(participantId);
      },
      async getParticipantsForRoom(roomId) {
        return Array.from(storage.participants.values()).filter((p) => p.roomId === roomId).map((p) => p.entityId);
      },
      async setCache(key, value) {
        storage.cache.set(key, {
          value,
          createdAt: Date.now()
        });
        return true;
      },
      async getCache(key) {
        const cached = storage.cache.get(key);
        return cached ? cached.value : null;
      },
      async deleteCache(key) {
        return storage.cache.delete(key);
      },
      async createWorld(world) {
        const id = world.id || v4_default();
        const fullWorld = { ...world, id };
        storage.worlds.set(id, fullWorld);
        return id;
      },
      async getWorld(worldId) {
        return storage.worlds.get(worldId) || null;
      },
      async getAllWorlds() {
        return Array.from(storage.worlds.values());
      },
      async createTask(task) {
        const id = task.id || v4_default();
        const fullTask = {
          ...task,
          id,
          updatedAt: task.updatedAt || Date.now()
        };
        storage.tasks.set(id, fullTask);
        return id;
      },
      async getTasks(params) {
        let tasks = Array.from(storage.tasks.values());
        if (params.roomId) {
          tasks = tasks.filter((task) => task.roomId === params.roomId);
        }
        if (params.tags) {
          tasks = tasks.filter((task) => params.tags.some((tag) => task.tags.includes(tag)));
        }
        return tasks;
      },
      async deleteTask(taskId) {
        storage.tasks.delete(taskId);
      },
      async createRelationship(relationship) {
        const id = v4_default();
        const fullRelationship = { ...relationship, id };
        storage.relationships.set(id, fullRelationship);
        return true;
      },
      async getRelationships(params) {
        let relationships = Array.from(storage.relationships.values());
        if (params.entityId) {
          relationships = relationships.filter((rel) => rel.sourceEntityId === params.entityId || rel.targetEntityId === params.entityId);
        }
        return relationships;
      },
      async getEntitiesByIds(ids) {
        const entities = [];
        for (const id of ids) {
          const entity = storage.entities.get(id);
          if (entity) {
            entities.push(entity);
          }
        }
        return entities;
      },
      async updateMemory(memory) {
        const tableName = "messages";
        const tableData = storage.memories.get(tableName);
        if (tableData && tableData.has(memory.id)) {
          const existing = tableData.get(memory.id);
          const updated = { ...existing, ...memory };
          tableData.set(memory.id, updated);
          return updated;
        }
        return null;
      },
      async countMemories(roomId, tableName = "messages") {
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return 0;
        }
        if (!roomId) {
          return tableData.size;
        }
        return Array.from(tableData.values()).filter((m) => m.roomId === roomId).length;
      },
      async getMemoriesByEntityIds(entityIds, tableName = "messages") {
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return [];
        }
        return Array.from(tableData.values()).filter((m) => entityIds.includes(m.entityId));
      },
      async removeAllMemories(roomId, tableName = "messages") {
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return;
        }
        const toDelete = [];
        for (const [id, memory] of tableData) {
          if (memory.roomId === roomId) {
            toDelete.push(id);
          }
        }
        for (const id of toDelete) {
          tableData.delete(id);
        }
      },
      async updateRoom(room) {
        if (!room.id || !storage.rooms.has(room.id)) {
          throw new Error("Room not found");
        }
        storage.rooms.set(room.id, room);
      },
      async deleteRoom(roomId) {
        storage.rooms.delete(roomId);
      },
      async getRoomsByIds(roomIds) {
        const rooms = [];
        for (const id of roomIds) {
          const room = storage.rooms.get(id);
          if (room) {
            rooms.push(room);
          }
        }
        return rooms;
      },
      async createRooms(rooms) {
        const ids = [];
        for (const room of rooms) {
          const id = room.id || v4_default();
          const fullRoom = { ...room, id };
          storage.rooms.set(id, fullRoom);
          ids.push(id);
        }
        return ids;
      },
      async getRoomsByWorld(worldId) {
        return Array.from(storage.rooms.values()).filter((room) => room.worldId === worldId);
      },
      async deleteRoomsByWorldId(worldId) {
        const toDelete = [];
        for (const [id, room] of storage.rooms) {
          if (room.worldId === worldId) {
            toDelete.push(id);
          }
        }
        for (const id of toDelete) {
          storage.rooms.delete(id);
        }
      },
      async getWorlds(params) {
        let worlds = Array.from(storage.worlds.values());
        if (params?.agentId) {
          worlds = worlds.filter((w) => w.agentId === params.agentId);
        }
        return worlds;
      },
      async removeWorld(worldId) {
        storage.worlds.delete(worldId);
      },
      async updateWorld(world) {
        if (!world.id || !storage.worlds.has(world.id)) {
          throw new Error("World not found");
        }
        storage.worlds.set(world.id, world);
      },
      async createComponent(component) {
        const entityComponents = storage.entities.get(component.entityId)?.components || [];
        entityComponents.push(component);
        const entity = storage.entities.get(component.entityId);
        if (entity) {
          entity.components = entityComponents;
          storage.entities.set(component.entityId, entity);
        }
        return true;
      },
      async getComponents(entityId) {
        const entity = storage.entities.get(entityId);
        return entity?.components || [];
      },
      async updateComponent(component) {
        const entity = storage.entities.get(component.entityId);
        if (entity && entity.components) {
          const index = entity.components.findIndex((c) => c.id === component.id);
          if (index >= 0) {
            entity.components[index] = component;
            storage.entities.set(component.entityId, entity);
            return;
          }
        }
        throw new Error("Component not found");
      },
      async deleteComponent(componentId) {
        for (const entity of storage.entities.values()) {
          if (entity.components) {
            const index = entity.components.findIndex((c) => c.id === componentId);
            if (index >= 0) {
              entity.components.splice(index, 1);
              storage.entities.set(entity.id, entity);
              return;
            }
          }
        }
      },
      async getComponent(entityId, type, worldId, sourceEntityId) {
        const entity = storage.entities.get(entityId);
        if (!entity?.components) {
          return null;
        }
        return entity.components.find((c) => c.type === type && (!worldId || c.worldId === worldId) && (!sourceEntityId || c.sourceEntityId === sourceEntityId)) || null;
      },
      async getParticipantsForEntity(entityId) {
        return Array.from(storage.participants.values()).filter((p) => p.entityId === entityId);
      },
      async getRoomsForParticipant(entityId) {
        return Array.from(storage.participants.values()).filter((p) => p.entityId === entityId).map((p) => p.roomId);
      },
      async getRoomsForParticipants(userIds) {
        const roomIds = new Set;
        for (const participant of storage.participants.values()) {
          if (userIds.includes(participant.entityId)) {
            roomIds.add(participant.roomId);
          }
        }
        return Array.from(roomIds);
      },
      async getParticipantUserState(_roomId, _entityId) {
        return null;
      },
      async setParticipantUserState(_roomId, _entityId, _state) {},
      async getRelationship(params) {
        const relationships = Array.from(storage.relationships.values());
        return relationships.find((r) => r.sourceEntityId === params.sourceEntityId && r.targetEntityId === params.targetEntityId) || null;
      },
      async updateRelationship(relationship) {
        if (!relationship.id || !storage.relationships.has(relationship.id)) {
          throw new Error("Relationship not found");
        }
        storage.relationships.set(relationship.id, relationship);
      },
      async getTask(id) {
        return storage.tasks.get(id) || null;
      },
      async getTasksByName(name) {
        return Array.from(storage.tasks.values()).filter((task) => task.name === name);
      },
      async updateTask(id, updates) {
        const task = storage.tasks.get(id);
        if (!task) {
          throw new Error("Task not found");
        }
        const updated = { ...task, ...updates, updatedAt: Date.now() };
        storage.tasks.set(id, updated);
      },
      async deleteLog(logId) {
        if (storage.logs) {
          storage.logs.delete(logId);
        }
      },
      async getMemoriesByWorldId(params) {
        const tableName = params.tableName || "messages";
        const tableData = storage.memories.get(tableName);
        if (!tableData) {
          return [];
        }
        let memories = Array.from(tableData.values()).filter((m) => m.worldId === params.worldId);
        if (params.count) {
          memories = memories.slice(0, params.count);
        }
        return memories;
      },
      async deleteManyMemories(memoryIds) {
        for (const [_tableName, tableData] of storage.memories) {
          for (const id of memoryIds) {
            tableData.delete(id);
          }
        }
      },
      async deleteAllMemories(roomId, _tableName) {
        const tableData = storage.memories.get(_tableName);
        if (!tableData) {
          return;
        }
        const toDelete = [];
        for (const [id, memory] of tableData) {
          if (memory.roomId === roomId) {
            toDelete.push(id);
          }
        }
        for (const id of toDelete) {
          tableData.delete(id);
        }
      },
      async addParticipantsRoom(entityIds, roomId) {
        for (const entityId of entityIds) {
          const participantId = `${entityId}-${roomId}`;
          storage.participants.set(participantId, { entityId, roomId });
        }
        return true;
      }
    };
    return adapter;
  }
  async cleanupDatabase(testId) {
    try {
      const adapter = this.testDatabases.get(testId);
      if (adapter) {
        await adapter.close();
        this.testDatabases.delete(testId);
        logger.debug(`Cleaned up database for ${testId}`);
      }
    } catch (error) {
      logger.warn(`Error cleaning up database ${testId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async cleanup() {
    logger.debug("Cleaning up all test databases");
    const cleanupPromises = Array.from(this.testDatabases.keys()).map((testId) => this.cleanupDatabase(testId));
    await Promise.all(cleanupPromises);
    this.tempPaths.clear();
    this.testDatabases.clear();
    logger.debug("Successfully cleaned up all test databases");
  }
  getStats() {
    return {
      activeDatabases: this.testDatabases.size,
      tempPaths: Array.from(this.tempPaths),
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}
async function createTestDatabase(testId) {
  const actualTestId = testId || `test-${v4_default().slice(0, 8)}`;
  const manager = new TestDatabaseManager;
  const adapter = await manager.createIsolatedDatabase(actualTestId);
  return { adapter, manager, testId: actualTestId };
}

// src/testModels.ts
import { logger as logger2 } from "@elizaos/core";

class TestModelProvider {
  responses = new Map;
  patterns = [];
  defaultResponse;
  contextHistory = [];
  constructor(defaultResponse = "I understand and will help with that.", _options = {}) {
    this.defaultResponse = defaultResponse;
    this.addDefaultPatterns();
  }
  addDefaultPatterns() {
    const defaultPatterns = [
      {
        pattern: /^(hello|hi|hey|greetings)/i,
        response: "Hello! How can I help you today?"
      },
      {
        pattern: /(good morning|good afternoon|good evening)/i,
        response: "Good day! What can I assist you with?"
      },
      {
        pattern: /(create|add|make).*?(todo|task|reminder)/i,
        response: "I'll create that task for you right away. Let me add it to your todo list."
      },
      {
        pattern: /(schedule|plan|organize)/i,
        response: "I'll help you schedule that. Let me organize this for you."
      },
      {
        pattern: /(search|find|look|query).*?(for|about)/i,
        response: "Let me search for that information. I'll look into it right away."
      },
      {
        pattern: /(what|how|when|where|why)/i,
        response: "Let me find that information for you. I'll provide a detailed answer."
      },
      {
        pattern: /(analyze|review|examine|check)/i,
        response: "I'll analyze this carefully and provide my assessment with detailed insights."
      },
      {
        pattern: /(explain|describe|tell me about)/i,
        response: "I'll explain that in detail for you. Here's what you need to know."
      },
      {
        pattern: /(send|email|message|notify)/i,
        response: "I'll send that message for you. Let me take care of the communication."
      },
      {
        pattern: /(delete|remove|cancel)/i,
        response: "I'll remove that for you. Let me handle the deletion safely."
      },
      {
        pattern: /(save|store|backup)/i,
        response: "I'll save that information securely. Your data will be stored properly."
      },
      {
        pattern: /(load|open|access)/i,
        response: "I'll access that resource for you. Let me retrieve the information."
      },
      {
        pattern: /(fix|repair|solve|troubleshoot)/i,
        response: "I'll help troubleshoot this issue. Let me analyze the problem and find a solution."
      },
      {
        pattern: /(help|assist|support)/i,
        response: "I'm here to help! Let me assist you with whatever you need."
      },
      {
        pattern: /(should|recommend|suggest|advise)/i,
        response: "Based on the information provided, I'd recommend the following approach."
      },
      {
        pattern: /(choose|select|decide)/i,
        response: "Let me help you make that decision. Here are the key factors to consider."
      },
      {
        pattern: /(yes|ok|okay|sure|agreed)/i,
        response: "Understood! I'll proceed with that as requested."
      },
      {
        pattern: /(no|stop|cancel|abort)/i,
        response: "Alright, I'll stop that process. Is there anything else I can help with?"
      },
      {
        pattern: /(if.*then|because|therefore|since)/i,
        response: "I understand the logic. Let me work through this step by step."
      },
      {
        pattern: /(compare|contrast|difference|similar)/i,
        response: "I'll compare these options and highlight the key differences and similarities."
      },
      {
        pattern: /(error|problem|issue|broken|failed)/i,
        response: "I see there's an issue. Let me investigate the problem and find a solution."
      }
    ];
    this.patterns.push(...defaultPatterns);
  }
  async generateText(params) {
    const prompt = params.prompt;
    try {
      const exactMatch = this.responses.get(prompt);
      if (exactMatch) {
        this.addToHistory(prompt, exactMatch);
        return exactMatch;
      }
      for (const { pattern, response } of this.patterns) {
        if (pattern.test(prompt)) {
          const contextualResponse = this.makeContextual(response, prompt);
          this.addToHistory(prompt, contextualResponse);
          return contextualResponse;
        }
      }
      const intelligentResponse = this.generateIntelligentDefault(prompt);
      this.addToHistory(prompt, intelligentResponse);
      return intelligentResponse;
    } catch (error) {
      logger2.warn(`Error in test model provider: ${error instanceof Error ? error.message : String(error)}`);
      return this.defaultResponse;
    }
  }
  async generateEmbedding(params) {
    const text = params.text;
    const hash = this.simpleHash(text);
    const embedding = [];
    for (let i = 0;i < 1536; i++) {
      const value = Math.sin(hash + i) * 0.5;
      embedding.push(value);
    }
    return embedding;
  }
  async generateObject(params) {
    const prompt = params.prompt;
    if (prompt.includes("thought") || prompt.includes("reasoning")) {
      return {
        thought: "I need to think about this carefully and provide a helpful response.",
        reasoning: "Based on the context provided, here's my analysis.",
        confidence: 0.85
      };
    }
    if (prompt.includes("action") || prompt.includes("execute")) {
      return {
        action: "RESPOND",
        parameters: {},
        confidence: 0.9
      };
    }
    if (prompt.includes("memory") || prompt.includes("remember")) {
      return {
        shouldStore: true,
        importance: 0.7,
        category: "conversation"
      };
    }
    return {
      response: await this.generateText({ prompt, ...params }),
      confidence: 0.8,
      metadata: {
        timestamp: Date.now(),
        model: "test-model"
      }
    };
  }
  makeContextual(response, prompt) {
    const keyTerms = this.extractKeyTerms(prompt);
    if (keyTerms.length > 0) {
      const term = keyTerms[0];
      return response.replace(/that|this|it/g, term.length > 20 ? `that ${term.substring(0, 20)}...` : `that ${term}`);
    }
    return response;
  }
  generateIntelligentDefault(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("?")) {
      return "That's a great question. Let me provide you with a comprehensive answer based on the available information.";
    }
    if (lowerPrompt.match(/^(please|can you|could you|would you)/)) {
      return "Of course! I'll take care of that for you right away.";
    }
    if (lowerPrompt.length > 200) {
      return "I understand this is a complex request. Let me work through this systematically and provide you with a detailed response.";
    }
    if (lowerPrompt.match(/(angry|sad|frustrated|excited|happy|worried)/)) {
      return "I understand how you're feeling. Let me help you work through this thoughtfully.";
    }
    return this.defaultResponse;
  }
  extractKeyTerms(prompt) {
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "this",
      "that",
      "these",
      "those",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "can",
      "may",
      "might",
      "must"
    ]);
    const words = prompt.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !commonWords.has(word));
    return [...new Set(words)].slice(0, 3);
  }
  simpleHash(str) {
    let hash = 0;
    for (let i = 0;i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  addToHistory(prompt, response) {
    this.contextHistory.push({ prompt, response });
    if (this.contextHistory.length > 10) {
      this.contextHistory.shift();
    }
  }
  setResponse(prompt, response) {
    this.responses.set(prompt, response);
  }
  addPattern(pattern, response) {
    this.patterns.unshift({ pattern, response });
  }
  setDefaultResponse(response) {
    this.defaultResponse = response;
  }
  clear() {
    this.responses.clear();
    this.patterns.length = 0;
    this.contextHistory.length = 0;
    this.addDefaultPatterns();
  }
  getHistory() {
    return [...this.contextHistory];
  }
}
function createTestModelProvider(scenarios = [], defaultResponse) {
  const provider = new TestModelProvider(defaultResponse);
  for (const scenario of scenarios) {
    if (scenario.prompt instanceof RegExp) {
      provider.addPattern(scenario.prompt, scenario.response);
    } else {
      provider.setResponse(scenario.prompt, scenario.response);
    }
  }
  return provider;
}
function createSpecializedModelProvider(type) {
  const provider = new TestModelProvider;
  switch (type) {
    case "conversational":
      provider.addPattern(/.*/, "That's interesting! Let me respond thoughtfully to what you've shared.");
      break;
    case "analytical":
      provider.addPattern(/.*/, "Let me analyze this systematically. Based on the data and context provided, here's my assessment.");
      break;
    case "creative":
      provider.addPattern(/.*/, "What a creative challenge! Let me think outside the box and explore innovative possibilities.");
      break;
    case "factual":
      provider.addPattern(/.*/, "Based on factual information and established knowledge, here's an accurate response.");
      break;
  }
  return provider;
}
function createModelHandler(provider) {
  return async (runtime, params) => {
    const modelType = params.modelType || "TEXT_LARGE";
    switch (modelType) {
      case "TEXT_SMALL":
      case "TEXT_LARGE":
        return await provider.generateText(params);
      case "TEXT_EMBEDDING":
        return await provider.generateEmbedding(params);
      case "OBJECT_SMALL":
      case "OBJECT_LARGE":
        return await provider.generateObject(params);
      default:
        return await provider.generateText(params);
    }
  };
}

class TestScenarioBuilder {
  scenarios = [];
  addGreeting(response = "Hello! How can I help you?") {
    this.scenarios.push({
      prompt: /^(hello|hi|hey)/i,
      response
    });
    return this;
  }
  addTaskCreation(response = "I'll create that task for you.") {
    this.scenarios.push({
      prompt: /(create|add|make).*?(todo|task)/i,
      response
    });
    return this;
  }
  addSearch(response = "Let me search for that information.") {
    this.scenarios.push({
      prompt: /(search|find|look)/i,
      response
    });
    return this;
  }
  addCustom(prompt, response) {
    this.scenarios.push({ prompt, response });
    return this;
  }
  build(defaultResponse) {
    return createTestModelProvider(this.scenarios, defaultResponse);
  }
}
function scenarios() {
  return new TestScenarioBuilder;
}

// src/realRuntime.ts
class RuntimeTestHarness {
  runtimes = new Map;
  databaseManager;
  testId;
  constructor(testId) {
    this.testId = testId || `test-${v4_default().slice(0, 8)}`;
    this.databaseManager = new TestDatabaseManager;
  }
  async createTestRuntime(config) {
    try {
      logger3.info(`Creating real test runtime for ${this.testId}`);
      const databaseAdapter = await this.databaseManager.createIsolatedDatabase(`${this.testId}-${Date.now()}`);
      const runtime = new AgentRuntime({
        character: config.character,
        adapter: databaseAdapter
      });
      for (const plugin of config.plugins) {
        if (typeof plugin === "string") {
          const loadedPlugin = await this.loadPlugin(plugin);
          await runtime.registerPlugin(loadedPlugin);
        } else {
          await runtime.registerPlugin(plugin);
        }
      }
      await runtime.initialize();
      this.runtimes.set(runtime.agentId, runtime);
      logger3.info(`Successfully created real runtime ${runtime.agentId}`);
      return runtime;
    } catch (error) {
      logger3.error(`Failed to create test runtime: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Test runtime creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async loadPlugin(pluginName) {
    try {
      logger3.info(`Attempting to load plugin: ${pluginName}`);
      let pluginModule;
      try {
        pluginModule = await import(pluginName);
      } catch (importError) {
        logger3.warn(`Could not import ${pluginName}: ${importError instanceof Error ? importError.message : String(importError)}`);
        throw importError;
      }
      const plugin = pluginModule.default || pluginModule[Object.keys(pluginModule)[0]];
      if (!plugin || typeof plugin !== "object") {
        throw new Error(`Invalid plugin export from ${pluginName}`);
      }
      logger3.info(`Successfully loaded plugin: ${pluginName}`);
      return plugin;
    } catch (error) {
      logger3.error(`Failed to load plugin ${pluginName}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Plugin ${pluginName} must be available for testing. Install it before running tests. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  createRealisticModelProvider(scenarios2) {
    const defaultScenarios = [
      {
        prompt: /hello|hi|hey/i,
        response: "Hello! How can I help you today?"
      },
      {
        prompt: /create.*todo|add.*task/i,
        response: "I'll create that todo item for you right away."
      },
      {
        prompt: /search|find|look/i,
        response: "Let me search for that information."
      },
      {
        prompt: /analyze|review/i,
        response: "I'll analyze this carefully and provide my assessment."
      }
    ];
    return createTestModelProvider(scenarios2 || defaultScenarios);
  }
  async processTestMessage(runtime, messageText, options = {}) {
    const startTime = Date.now();
    const roomId = options.roomId || stringToUuid(`test-room-${v4_default()}`);
    const entityId = options.entityId || stringToUuid(`test-user-${v4_default()}`);
    try {
      const memory = {
        id: stringToUuid(`message-${v4_default()}`),
        entityId,
        roomId,
        content: {
          text: messageText,
          source: "test"
        },
        createdAt: Date.now()
      };
      const _messageId = await runtime.createMemory(memory, "messages");
      const responses = await runtime.processActions(memory, [], undefined, undefined);
      const responseTime = Date.now() - startTime;
      const result = {
        scenarioName: `Process: "${messageText}"`,
        passed: true,
        errors: [],
        executedActions: [],
        createdMemories: Array.isArray(responses) ? responses.length : 0,
        responseTime
      };
      if (options.expectedActions && options.expectedActions.length > 0) {
        const executedActions = await this.getExecutedActions(runtime, roomId);
        const missingActions = options.expectedActions.filter((action) => !executedActions.includes(action));
        if (missingActions.length > 0) {
          result.passed = false;
          result.errors.push(`Missing expected actions: ${missingActions.join(", ")}`);
        }
        result.executedActions = executedActions;
      }
      if (options.timeoutMs && responseTime > options.timeoutMs) {
        result.passed = false;
        result.errors.push(`Response time ${responseTime}ms exceeded timeout ${options.timeoutMs}ms`);
      }
      return result;
    } catch (error) {
      return {
        scenarioName: `Process: "${messageText}"`,
        passed: false,
        errors: [`Runtime error: ${error instanceof Error ? error.message : String(error)}`],
        executedActions: [],
        createdMemories: 0,
        responseTime: Date.now() - startTime
      };
    }
  }
  async getExecutedActions(runtime, roomId) {
    try {
      const memories = await runtime.getMemories({
        roomId,
        count: 10,
        tableName: "messages"
      });
      const actions = [];
      for (const memory of memories) {
        if (memory.content.actions && Array.isArray(memory.content.actions)) {
          actions.push(...memory.content.actions);
        }
      }
      return [...new Set(actions)];
    } catch (error) {
      logger3.warn(`Could not retrieve executed actions: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  async validateRuntimeHealth(runtime) {
    const issues = [];
    const services = [];
    const plugins = [];
    try {
      if (!runtime.agentId) {
        issues.push("Runtime missing agentId");
      }
      if (!runtime.character) {
        issues.push("Runtime missing character");
      }
      try {
        const healthMemory = {
          id: stringToUuid("health-check-message"),
          entityId: stringToUuid("health-check-entity"),
          roomId: stringToUuid("health-check-room"),
          content: { text: "Health check", source: "test" },
          createdAt: Date.now()
        };
        await runtime.createMemory(healthMemory, "test");
      } catch (error) {
        issues.push(`Database not functional: ${error instanceof Error ? error.message : String(error)}`);
      }
      try {
        const serviceMap = runtime.services || new Map;
        for (const [name, service] of serviceMap) {
          services.push(name);
          if (!service) {
            issues.push(`Service ${name} is null/undefined`);
          }
        }
      } catch (error) {
        issues.push(`Services not accessible: ${error instanceof Error ? error.message : String(error)}`);
      }
      try {
        plugins.push(...runtime.plugins?.map((p) => p.name) || []);
      } catch (error) {
        issues.push(`Plugins not accessible: ${error instanceof Error ? error.message : String(error)}`);
      }
      return {
        healthy: issues.length === 0,
        issues,
        services,
        plugins
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [
          `Runtime health check failed: ${error instanceof Error ? error.message : String(error)}`
        ],
        services,
        plugins
      };
    }
  }
  async cleanup() {
    try {
      logger3.info(`Cleaning up test harness ${this.testId}`);
      for (const [runtimeId, runtime] of this.runtimes) {
        try {
          await runtime.stop();
          logger3.debug(`Stopped runtime ${runtimeId}`);
        } catch (error) {
          logger3.warn(`Error stopping runtime ${runtimeId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      this.runtimes.clear();
      await this.databaseManager.cleanup();
      logger3.info(`Successfully cleaned up test harness ${this.testId}`);
    } catch (error) {
      logger3.error(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
async function createTestRuntime(config = {}) {
  const harness = new RuntimeTestHarness;
  const defaultCharacter = {
    name: "TestAgent",
    system: "You are a helpful test agent.",
    bio: ["I am a test agent used for integration testing."],
    messageExamples: [],
    postExamples: [],
    topics: ["testing"],
    knowledge: [],
    plugins: []
  };
  const runtime = await harness.createTestRuntime({
    character: defaultCharacter,
    plugins: [],
    apiKeys: { OPENAI_API_KEY: "test-key" },
    ...config
  });
  return { runtime, harness };
}
async function runIntegrationTest(testName, testFn, config) {
  const startTime = Date.now();
  let harness;
  try {
    const { runtime, harness: testHarness } = await createTestRuntime(config);
    harness = testHarness;
    await testFn(runtime);
    return {
      scenarioName: testName,
      passed: true,
      errors: [],
      executedActions: [],
      createdMemories: 0,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      scenarioName: testName,
      passed: false,
      errors: [error instanceof Error ? error.message : String(error)],
      executedActions: [],
      createdMemories: 0,
      responseTime: Date.now() - startTime
    };
  } finally {
    if (harness) {
      await harness.cleanup();
    }
  }
}
// src/templates.ts
import { logger as logger4 } from "@elizaos/core";
class TestTemplate {
  config;
  runtime;
  constructor(config) {
    this.config = config;
  }
  async setup() {
    if (this.config.setup) {
      await this.config.setup();
    }
  }
  async teardown() {
    if (this.config.teardown) {
      await this.config.teardown();
    }
  }
  shouldSkip() {
    return this.config.skipCondition?.() ?? false;
  }
  getConfig() {
    return this.config;
  }
}

class UnitTestTemplate extends TestTemplate {
  testFunction;
  constructor(config, testFunction) {
    super(config);
    this.testFunction = testFunction;
  }
  async execute() {
    const startTime = Date.now();
    if (this.shouldSkip()) {
      return {
        name: this.config.name,
        passed: true,
        duration: 0,
        warnings: ["Test skipped due to skip condition"]
      };
    }
    try {
      await this.setup();
      await this.testFunction();
      return {
        name: this.config.name,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: this.config.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      await this.teardown();
    }
  }
}

class IntegrationTestTemplate extends TestTemplate {
  testFunction;
  character;
  constructor(config, testFunction, character) {
    super(config);
    this.testFunction = testFunction;
    this.character = character;
  }
  async execute() {
    const startTime = Date.now();
    if (this.shouldSkip()) {
      return {
        name: this.config.name,
        passed: true,
        duration: 0,
        warnings: ["Test skipped due to skip condition"]
      };
    }
    try {
      await this.setup();
      const { runtime } = await createTestRuntime({
        character: this.character
      });
      this.runtime = runtime;
      await this.testFunction(runtime);
      return {
        name: this.config.name,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: this.config.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      await this.teardown();
    }
  }
}

class PluginTestTemplate extends TestTemplate {
  plugin;
  testFunction;
  constructor(config, plugin, testFunction) {
    super(config);
    this.plugin = plugin;
    this.testFunction = testFunction;
  }
  async execute() {
    const startTime = Date.now();
    if (this.shouldSkip()) {
      return {
        name: this.config.name,
        passed: true,
        duration: 0,
        warnings: ["Test skipped due to skip condition"]
      };
    }
    try {
      await this.setup();
      const { runtime } = await createTestRuntime({
        character: {
          name: "Test Agent",
          bio: "Test agent for plugin testing",
          plugins: [this.plugin.name]
        },
        plugins: [this.plugin]
      });
      await this.testFunction(runtime, this.plugin);
      return {
        name: this.config.name,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: this.config.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      await this.teardown();
    }
  }
}

class ErrorTestTemplate extends TestTemplate {
  testFunction;
  expectedError;
  constructor(config, testFunction, expectedError) {
    super(config);
    this.testFunction = testFunction;
    this.expectedError = expectedError;
  }
  async execute() {
    const startTime = Date.now();
    if (this.shouldSkip()) {
      return {
        name: this.config.name,
        passed: true,
        duration: 0,
        warnings: ["Test skipped due to skip condition"]
      };
    }
    try {
      await this.setup();
      await this.testFunction();
      return {
        name: this.config.name,
        passed: false,
        duration: Date.now() - startTime,
        error: new Error(`Expected ${this.expectedError} error but test completed successfully`)
      };
    } catch (error) {
      const passed = error.category === this.expectedError;
      return {
        name: this.config.name,
        passed,
        duration: Date.now() - startTime,
        error: passed ? undefined : error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      await this.teardown();
    }
  }
}

class PerformanceTestTemplate extends TestTemplate {
  testFunction;
  maxDuration;
  maxMemoryMB;
  constructor(config, testFunction, maxDuration, maxMemoryMB) {
    super(config);
    this.testFunction = testFunction;
    this.maxDuration = maxDuration;
    this.maxMemoryMB = maxMemoryMB;
  }
  async execute() {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    if (this.shouldSkip()) {
      return {
        name: this.config.name,
        passed: true,
        duration: 0,
        warnings: ["Test skipped due to skip condition"]
      };
    }
    try {
      await this.setup();
      await this.testFunction();
      const duration = Date.now() - startTime;
      const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / (1024 * 1024);
      const warnings = [];
      let passed = true;
      if (duration > this.maxDuration) {
        warnings.push(`Test exceeded max duration: ${duration}ms > ${this.maxDuration}ms`);
        passed = false;
      }
      if (memoryUsed > this.maxMemoryMB) {
        warnings.push(`Test exceeded max memory: ${memoryUsed.toFixed(2)}MB > ${this.maxMemoryMB}MB`);
        passed = false;
      }
      return {
        name: this.config.name,
        passed,
        duration,
        warnings,
        metadata: {
          memoryUsedMB: memoryUsed,
          maxDurationMs: this.maxDuration,
          maxMemoryMB: this.maxMemoryMB
        }
      };
    } catch (error) {
      return {
        name: this.config.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      await this.teardown();
    }
  }
}

class TestSuite {
  tests = [];
  name;
  constructor(name) {
    this.name = name;
  }
  addTest(test) {
    this.tests.push(test);
  }
  async run() {
    const startTime = Date.now();
    const results = [];
    logger4.info(`Running test suite: ${this.name}`);
    for (const test of this.tests) {
      try {
        const result = await test.execute();
        results.push(result);
        if (result.passed) {
          logger4.info(`✓ ${result.name} (${result.duration}ms)`);
        } else {
          logger4.error(`✗ ${result.name} (${result.duration}ms): ${result.error?.message}`);
        }
      } catch (error) {
        const errorResult = {
          name: `${test.getConfig().name} (execution error)`,
          passed: false,
          duration: 0,
          error: error instanceof Error ? error : new Error(String(error))
        };
        results.push(errorResult);
        logger4.error(`✗ ${errorResult.name}: ${errorResult.error?.message}`);
      }
    }
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const duration = Date.now() - startTime;
    logger4.info(`Test suite ${this.name} completed: ${passed}/${results.length} passed (${duration}ms)`);
    return {
      suiteName: this.name,
      totalTests: results.length,
      passed,
      failed,
      duration,
      results
    };
  }
}
function createUnitTest(name, testFunction, options = {}) {
  return new UnitTestTemplate({ name, timeout: 5000, ...options }, testFunction);
}
function createIntegrationTest(name, testFunction, character, options = {}) {
  return new IntegrationTestTemplate({ name, timeout: 30000, ...options }, testFunction, character);
}
function createPluginTest(name, plugin, testFunction, options = {}) {
  return new PluginTestTemplate({ name, timeout: 30000, ...options }, plugin, testFunction);
}
function createErrorTest(name, testFunction, expectedError, options = {}) {
  return new ErrorTestTemplate({ name, timeout: 5000, ...options }, testFunction, expectedError);
}
function createPerformanceTest(name, testFunction, maxDurationMs, maxMemoryMB, options = {}) {
  return new PerformanceTestTemplate({ name, timeout: maxDurationMs * 2, ...options }, testFunction, maxDurationMs, maxMemoryMB);
}

class TestDataGenerator {
  static generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  static generateMemory(overrides = {}) {
    return {
      id: this.generateUUID(),
      entityId: this.generateUUID(),
      agentId: this.generateUUID(),
      roomId: this.generateUUID(),
      content: {
        text: "Test message content",
        source: "test"
      },
      ...overrides
    };
  }
  static generateCharacter(overrides = {}) {
    return {
      name: "Test Agent",
      bio: "A test agent for automated testing",
      ...overrides
    };
  }
  static generateContent(overrides = {}) {
    return {
      text: "Test content",
      source: "test",
      ...overrides
    };
  }
}
// src/mocks/mockUtils.ts
function mock(implementation) {
  const calls = [];
  let mockImplementationFn = implementation;
  let mockReturnValueValue;
  let mockResolvedValueValue;
  let mockRejectedValueValue;
  let shouldResolve = false;
  let shouldReject = false;
  const fn = function(...args) {
    calls.push(args);
    if (mockImplementationFn) {
      return mockImplementationFn(...args);
    }
    if (shouldReject) {
      return Promise.reject(mockRejectedValueValue);
    }
    if (shouldResolve) {
      return Promise.resolve(mockResolvedValueValue);
    }
    return mockReturnValueValue;
  };
  fn.calls = calls;
  fn.mock = {
    calls,
    results: []
  };
  fn.mockReturnValue = (value) => {
    mockReturnValueValue = value;
    shouldResolve = false;
    shouldReject = false;
    return fn;
  };
  fn.mockResolvedValue = (value) => {
    mockResolvedValueValue = value;
    shouldResolve = true;
    shouldReject = false;
    return fn;
  };
  fn.mockRejectedValue = (error) => {
    mockRejectedValueValue = error;
    shouldReject = true;
    shouldResolve = false;
    return fn;
  };
  fn.mockImplementation = (implementation2) => {
    mockImplementationFn = implementation2;
    return fn;
  };
  return fn;
}

// src/mocks/runtime.ts
function createMockRuntime(overrides = {}) {
  const defaultCharacter = {
    id: "test-character-id",
    name: "Test Character",
    username: "test_character",
    system: "You are a helpful test assistant.",
    bio: ["A character designed for testing purposes"],
    messageExamples: [],
    postExamples: [],
    topics: ["testing", "development"],
    knowledge: [],
    plugins: [],
    settings: {
      model: "gpt-4",
      secrets: {}
    },
    style: {
      all: ["be helpful", "be concise"],
      chat: ["respond quickly"],
      post: ["be engaging"]
    }
  };
  const mockDb = {
    execute: mock().mockResolvedValue([]),
    query: mock().mockResolvedValue([]),
    run: mock().mockResolvedValue({ changes: 1 }),
    all: mock().mockResolvedValue([]),
    get: mock().mockResolvedValue(null)
  };
  const stateCache = overrides.stateCache || new Map;
  const baseRuntime = {
    agentId: "test-agent-id",
    character: overrides.character || defaultCharacter,
    messageService: overrides.messageService ?? null,
    providers: overrides.providers || [],
    actions: overrides.actions || [],
    evaluators: overrides.evaluators || [],
    plugins: overrides.plugins || [],
    services: overrides.services || new Map,
    events: overrides.events || {},
    fetch: overrides.fetch || null,
    routes: overrides.routes || [],
    logger: overrides.logger || {
      level: "info",
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      success: () => {},
      progress: () => {},
      log: () => {},
      clear: () => {},
      child: () => ({})
    },
    stateCache,
    db: overrides.db || mockDb,
    registerPlugin: mock().mockResolvedValue(undefined),
    initialize: mock().mockResolvedValue(undefined),
    getConnection: mock().mockResolvedValue(mockDb),
    getService: mock().mockReturnValue(null),
    getServicesByType: mock().mockReturnValue([]),
    getAllServices: mock().mockReturnValue(new Map),
    registerService: mock().mockResolvedValue(undefined),
    getServiceLoadPromise: mock().mockResolvedValue(null),
    getRegisteredServiceTypes: mock().mockReturnValue([]),
    hasService: mock().mockReturnValue(false),
    hasElizaOS() {
      return false;
    },
    registerDatabaseAdapter: mock(),
    setSetting: mock(),
    getSetting: mock((key) => {
      const defaultSettings = {
        TEST_API_KEY: "test-api-key",
        ...overrides.character?.settings
      };
      return defaultSettings[key];
    }),
    getConversationLength: mock().mockReturnValue(10),
    getActionResults: (messageId) => {
      const cachedState = stateCache?.get(`${messageId}_action_results`);
      return cachedState?.data?.actionResults || [];
    },
    processActions: mock().mockResolvedValue(undefined),
    evaluate: mock().mockResolvedValue([]),
    registerProvider: mock(),
    registerAction: mock(),
    registerEvaluator: mock(),
    ensureConnection: mock().mockResolvedValue(undefined),
    ensureConnections: mock().mockResolvedValue(undefined),
    ensureParticipantInRoom: mock().mockResolvedValue(undefined),
    ensureWorldExists: mock().mockResolvedValue(undefined),
    ensureRoomExists: mock().mockResolvedValue(undefined),
    composeState: mock().mockResolvedValue({
      values: {},
      data: {},
      text: ""
    }),
    useModel: mock().mockResolvedValue("Mock response"),
    registerModel: mock(),
    getModel: mock().mockReturnValue(undefined),
    registerEvent: mock(),
    getEvent: mock().mockReturnValue(undefined),
    emitEvent: mock().mockResolvedValue(undefined),
    registerTaskWorker: mock(),
    getTaskWorker: mock().mockReturnValue(undefined),
    stop: mock().mockResolvedValue(undefined),
    addEmbeddingToMemory: mock().mockImplementation((memory) => Promise.resolve(memory)),
    queueEmbeddingGeneration: mock().mockResolvedValue(undefined),
    createRunId: mock().mockReturnValue("test-run-id"),
    startRun: mock().mockReturnValue("test-run-id"),
    endRun: mock(),
    getCurrentRunId: mock().mockReturnValue("test-run-id"),
    registerSendHandler: mock(),
    sendMessageToTarget: mock().mockResolvedValue(undefined),
    init: mock().mockResolvedValue(undefined),
    isReady: mock().mockResolvedValue(true),
    close: mock().mockResolvedValue(undefined),
    getAgent: mock().mockResolvedValue(null),
    getAgents: mock().mockResolvedValue([]),
    createAgent: mock().mockResolvedValue(true),
    updateAgent: mock().mockResolvedValue(true),
    deleteAgent: mock().mockResolvedValue(true),
    getEntityById: mock().mockResolvedValue(null),
    getEntitiesByIds: mock().mockResolvedValue([]),
    getEntitiesForRoom: mock().mockResolvedValue([]),
    createEntity: mock().mockResolvedValue("test-entity-id"),
    createEntities: mock().mockResolvedValue(true),
    updateEntity: mock().mockResolvedValue(undefined),
    getComponent: mock().mockResolvedValue(null),
    getComponents: mock().mockResolvedValue([]),
    createComponent: mock().mockResolvedValue("test-component-id"),
    updateComponent: mock().mockResolvedValue(undefined),
    deleteComponent: mock().mockResolvedValue(undefined),
    getMemories: mock().mockResolvedValue([]),
    getAllMemories: overrides.getAllMemories || mock().mockResolvedValue([]),
    clearAllAgentMemories: mock().mockResolvedValue(undefined),
    getMemoryById: mock().mockResolvedValue(null),
    getMemoriesByIds: mock().mockResolvedValue([]),
    getMemoriesByRoomIds: mock().mockResolvedValue([]),
    getMemoriesByWorldId: mock().mockResolvedValue([]),
    getCachedEmbeddings: mock().mockResolvedValue([]),
    log: mock().mockResolvedValue(undefined),
    getLogs: mock().mockResolvedValue([]),
    deleteLog: mock().mockResolvedValue(undefined),
    searchMemories: mock().mockResolvedValue([]),
    createMemory: mock().mockResolvedValue("test-memory-id"),
    updateMemory: mock().mockResolvedValue(true),
    deleteMemory: mock().mockResolvedValue(undefined),
    deleteManyMemories: mock().mockResolvedValue(undefined),
    deleteAllMemories: mock().mockResolvedValue(undefined),
    countMemories: mock().mockResolvedValue(0),
    ensureEmbeddingDimension: mock().mockResolvedValue(undefined),
    createWorld: mock().mockResolvedValue("test-world-id"),
    getWorld: mock().mockResolvedValue(null),
    removeWorld: mock().mockResolvedValue(undefined),
    getAllWorlds: mock().mockResolvedValue([]),
    updateWorld: mock().mockResolvedValue(undefined),
    getRoom: mock().mockResolvedValue(null),
    getRooms: mock().mockResolvedValue([]),
    getRoomsByIds: mock().mockResolvedValue([]),
    createRoom: mock().mockResolvedValue("test-room-id"),
    createRooms: mock().mockResolvedValue([]),
    deleteRoom: mock().mockResolvedValue(undefined),
    deleteRoomsByWorldId: mock().mockResolvedValue(undefined),
    updateRoom: mock().mockResolvedValue(undefined),
    getRoomsForParticipant: mock().mockResolvedValue([]),
    getRoomsForParticipants: mock().mockResolvedValue([]),
    getRoomsByWorld: mock().mockResolvedValue([]),
    addParticipant: mock().mockResolvedValue(true),
    removeParticipant: mock().mockResolvedValue(true),
    addParticipantsRoom: mock().mockResolvedValue(true),
    getParticipantsForEntity: mock().mockResolvedValue([]),
    getParticipantsForRoom: mock().mockResolvedValue([]),
    getParticipantUserState: mock().mockResolvedValue(null),
    setParticipantUserState: mock().mockResolvedValue(undefined),
    createRelationship: mock().mockResolvedValue(true),
    updateRelationship: mock().mockResolvedValue(undefined),
    getRelationship: mock().mockResolvedValue(null),
    getRelationships: mock().mockResolvedValue([]),
    getCache: mock().mockResolvedValue(undefined),
    setCache: mock().mockResolvedValue(true),
    deleteCache: mock().mockResolvedValue(true),
    createTask: mock().mockResolvedValue("test-task-id"),
    getTasks: mock().mockResolvedValue([]),
    getTask: mock().mockResolvedValue(null),
    getTasksByName: mock().mockResolvedValue([]),
    updateTask: mock().mockResolvedValue(undefined),
    deleteTask: mock().mockResolvedValue(undefined),
    generateText: mock().mockResolvedValue("Mock generated text"),
    ...overrides
  };
  return baseRuntime;
}

// src/mocks/memory.ts
import { ContentType } from "@elizaos/core";
function createMockMemory(overrides = {}) {
  const defaultContent = {
    text: "Test message content",
    source: "test",
    ...overrides.content
  };
  const defaultMetadata = {
    type: "message",
    source: "test",
    timestamp: Date.now(),
    ...overrides.metadata
  };
  const baseMemory = {
    id: "test-memory-id",
    entityId: "test-entity-id",
    agentId: "test-agent-id",
    roomId: "test-room-id",
    worldId: "test-world-id",
    content: defaultContent,
    embedding: undefined,
    createdAt: Date.now(),
    unique: true,
    similarity: 1,
    metadata: defaultMetadata,
    ...overrides
  };
  return baseMemory;
}
function createMockContent(overrides = {}) {
  const baseContent = {
    text: "Mock content text",
    thought: "Mock internal thought",
    actions: [],
    providers: [],
    source: "test",
    target: undefined,
    url: undefined,
    inReplyTo: undefined,
    attachments: [],
    channelType: "DM",
    ...overrides
  };
  return baseContent;
}
function createMockUserMessage(text, overrides = {}) {
  return createMockMemory({
    content: {
      text,
      source: "user"
    },
    metadata: {
      type: "message",
      source: "user"
    },
    ...overrides
  });
}
function createMockAgentResponse(text, thought, actions = [], overrides = {}) {
  return createMockMemory({
    entityId: "test-agent-id",
    content: {
      text,
      thought,
      actions,
      source: "agent"
    },
    metadata: {
      type: "message",
      source: "agent"
    },
    ...overrides
  });
}
function createMockFact(fact, confidence = 0.9, overrides = {}) {
  return createMockMemory({
    content: {
      text: fact,
      source: "fact_extraction"
    },
    metadata: {
      type: "fact",
      confidence,
      source: "evaluator"
    },
    ...overrides
  });
}
function createMockMemoryWithEmbedding(text, dimension = 1536, overrides = {}) {
  const embedding = new Array(dimension).fill(0).map(() => Math.random());
  return createMockMemory({
    content: { text },
    embedding,
    ...overrides
  });
}
function createMockConversation(count = 5, roomId) {
  const memories = [];
  const actualRoomId = roomId || "test-room-id";
  for (let i = 0;i < count; i++) {
    const isUserMessage = i % 2 === 0;
    const memory = isUserMessage ? createMockUserMessage(`User message ${i + 1}`, { roomId: actualRoomId }) : createMockAgentResponse(`Agent response ${i + 1}`, `Thinking about response ${i + 1}`, [], {
      roomId: actualRoomId
    });
    memory.createdAt = Date.now() - (count - i) * 1000;
    memories.push(memory);
  }
  return memories;
}
function createMockMedia(type = "image", url = "https://example.com/test.jpg", overrides = {}) {
  const baseContentTypes = {
    image: ContentType.IMAGE,
    video: ContentType.VIDEO,
    audio: ContentType.AUDIO,
    document: ContentType.DOCUMENT
  };
  return {
    id: "test-media-id",
    url,
    title: `Test ${type}`,
    source: "test",
    description: `Mock ${type} for testing`,
    text: `Alt text for ${type}`,
    contentType: baseContentTypes[type],
    ...overrides
  };
}

// src/mocks/state.ts
function createMockState(overrides = {}) {
  const baseState = {
    values: {
      currentTime: new Date().toISOString(),
      agentName: "Test Agent",
      roomId: "test-room-id",
      entityId: "test-entity-id",
      userName: "TestUser",
      conversationLength: 10,
      lastMessage: "Hello, how can I help you?",
      ...overrides.values
    },
    data: {
      providers: {
        TIME: { currentTime: new Date().toISOString() },
        CHARACTER: { agentName: "Test Agent", bio: "A helpful test assistant" },
        RECENT_MESSAGES: { messageCount: 5, lastSpeaker: "user" }
      },
      actionResults: [],
      context: "test conversation",
      ...overrides.data
    },
    text: `[CONTEXT]
Current Time: ${new Date().toISOString()}
Agent: Test Agent
User: TestUser
Room: test-room-id
Recent conversation context available.
[/CONTEXT]`,
    ...overrides
  };
  if (overrides.text) {
    baseState.text = overrides.text;
  }
  return baseState;
}
function createMockProviderResult(overrides = {}) {
  const baseResult = {
    values: {
      mockValue: "test-value",
      timestamp: Date.now(),
      ...overrides.values
    },
    data: {
      source: "mock-provider",
      processed: true,
      ...overrides.data
    },
    text: `[MOCK PROVIDER]
Mock provider context information
[/MOCK PROVIDER]`,
    ...overrides
  };
  return baseResult;
}
function createMockActionResult(overrides = {}) {
  const baseResult = {
    success: true,
    values: {
      success: true,
      actionId: "test-action-id",
      timestamp: Date.now(),
      ...overrides.values
    },
    data: {
      executionTime: 150,
      metadata: { source: "mock-action" },
      ...overrides.data
    },
    text: "Mock action executed successfully",
    ...overrides
  };
  return baseResult;
}
function createMockStateWithProvider(providerName, providerData, overrides = {}) {
  return createMockState({
    data: {
      providers: {
        [providerName]: providerData,
        ...overrides.data?.providers
      },
      ...overrides.data
    },
    text: `[${providerName}]
${JSON.stringify(providerData, null, 2)}
[/${providerName}]`,
    ...overrides
  });
}
function createMockStateWithActions(actionResults, overrides = {}) {
  return createMockState({
    data: {
      actionResults,
      ...overrides.data
    },
    values: {
      lastActionSuccess: actionResults.length > 0 ? actionResults[actionResults.length - 1].values?.success : undefined,
      actionCount: actionResults.length,
      ...overrides.values
    },
    ...overrides
  });
}
function createMockConversationState(conversationHistory = ["Hello", "Hi there!", "How are you?"], currentUser = "TestUser", overrides = {}) {
  const recentContext = conversationHistory.slice(-3).join(" | ");
  return createMockState({
    values: {
      userName: currentUser,
      conversationLength: conversationHistory.length,
      lastMessage: conversationHistory[conversationHistory.length - 1],
      recentContext,
      ...overrides.values
    },
    data: {
      providers: {
        RECENT_MESSAGES: {
          messages: conversationHistory,
          count: conversationHistory.length,
          lastSpeaker: conversationHistory.length % 2 === 0 ? "agent" : "user"
        },
        ...overrides.data?.providers
      },
      ...overrides.data
    },
    text: `[CONVERSATION CONTEXT]
User: ${currentUser}
Recent messages: ${recentContext}
Message count: ${conversationHistory.length}
[/CONVERSATION CONTEXT]`,
    ...overrides
  });
}

// src/mocks/character.ts
function createMockCharacter(overrides = {}) {
  const baseCharacter = {
    id: "test-character-id",
    name: "TestAgent",
    username: "test_agent",
    system: "You are a helpful test assistant designed for automated testing scenarios. Respond concisely and clearly.",
    bio: [
      "A test agent designed for comprehensive testing scenarios",
      "Provides consistent, predictable responses for test validation",
      "Supports all core ElizaOS features and plugin interactions",
      "Maintains conversation context and handles complex workflows",
      "Optimized for both unit and integration testing environments"
    ],
    messageExamples: [
      [
        {
          name: "{{user}}",
          content: {
            text: "Hello, how are you?"
          }
        },
        {
          name: "TestAgent",
          content: {
            text: "Hello! I'm doing well, thank you for asking. How can I help you today?"
          }
        }
      ],
      [
        {
          name: "{{user}}",
          content: {
            text: "Can you help me test this feature?"
          }
        },
        {
          name: "TestAgent",
          content: {
            text: "Absolutely! I'm designed specifically to help with testing. What feature would you like to test?"
          }
        }
      ],
      [
        {
          name: "{{user}}",
          content: {
            text: "What capabilities do you have?"
          }
        },
        {
          name: "TestAgent",
          content: {
            text: "I can assist with testing various ElizaOS features including actions, providers, services, and plugin functionality."
          }
        }
      ]
    ],
    postExamples: [
      "Testing new ElizaOS features today - everything looking good!",
      "Just validated another plugin integration - the ecosystem keeps growing",
      "Reminder: always test your agents thoroughly before deployment",
      "Quality assurance is key to reliable AI agent systems"
    ],
    topics: [
      "software testing",
      "quality assurance",
      "test automation",
      "agent behavior validation",
      "plugin integration",
      "system reliability",
      "debugging",
      "performance testing"
    ],
    knowledge: [
      "ElizaOS architecture and patterns",
      "Test-driven development practices",
      "Quality assurance methodologies",
      "Plugin system integration",
      "Agent behavior patterns",
      "Debugging and troubleshooting"
    ],
    plugins: ["@elizaos/plugin-sql", "@elizaos/plugin-bootstrap"],
    settings: {
      model: "gpt-4",
      temperature: 0.1,
      maxTokens: 1000,
      secrets: {},
      voice: {
        model: "en_US-hfc_female-medium"
      },
      embeddingModel: "text-embedding-ada-002",
      ...overrides.settings
    },
    secrets: {
      TEST_API_KEY: "test-api-key-value",
      MOCK_SECRET: "mock-secret-value",
      ...overrides.secrets
    },
    style: {
      all: [
        "be helpful and supportive",
        "provide clear and concise responses",
        "maintain professional tone",
        "focus on testing and quality assurance",
        "be thorough in explanations"
      ],
      chat: [
        "respond promptly",
        "ask clarifying questions when needed",
        "provide actionable guidance",
        "maintain conversational flow"
      ],
      post: [
        "share testing insights",
        "promote quality practices",
        "be informative and educational",
        "encourage best practices"
      ]
    },
    ...overrides
  };
  return baseCharacter;
}
function createMinimalMockCharacter(name = "MinimalTestAgent", overrides = {}) {
  return createMockCharacter({
    name,
    bio: [`${name} - A minimal test agent`],
    messageExamples: [
      [
        { name: "{{user}}", content: { text: "Hello" } },
        { name, content: { text: "Hi there!" } }
      ]
    ],
    topics: ["testing"],
    plugins: [],
    ...overrides
  });
}
function createPluginTestCharacter(pluginName, overrides = {}) {
  return createMockCharacter({
    name: `${pluginName}TestAgent`,
    bio: [`Agent designed to test ${pluginName} plugin functionality`],
    plugins: [pluginName],
    topics: [`${pluginName} testing`, "plugin integration"],
    knowledge: [`${pluginName} plugin documentation and usage`],
    ...overrides
  });
}
function createRichConversationCharacter(overrides = {}) {
  const additionalExamples = [
    [
      { name: "{{user}}", content: { text: "Can you perform an action?" } },
      {
        name: "TestAgent",
        content: {
          text: "I can perform various actions based on available plugins.",
          actions: ["TEST_ACTION"]
        }
      }
    ],
    [
      { name: "{{user}}", content: { text: "What do you think about that?" } },
      {
        name: "TestAgent",
        content: {
          text: "Based on our conversation, I think this is a good approach.",
          thought: "The user is asking for my analysis of the previous topic."
        }
      }
    ],
    [
      { name: "{{user}}", content: { text: "Remember this important fact: X equals Y" } },
      {
        name: "TestAgent",
        content: {
          text: "I'll remember that X equals Y. This has been noted for future reference."
        }
      }
    ]
  ];
  return createMockCharacter({
    messageExamples: [...createMockCharacter().messageExamples || [], ...additionalExamples],
    postExamples: [
      "Just had an interesting conversation about X and Y relationships",
      "Learning new facts every day through conversations",
      "Testing advanced conversation patterns",
      "Exploring the depths of agent-user interactions"
    ],
    ...overrides
  });
}
function createMultipleCharacters(count = 3, baseName = "TestAgent", overrides = {}) {
  const characters = [];
  for (let i = 1;i <= count; i++) {
    const character = createMockCharacter({
      name: `${baseName}${i}`,
      username: `${baseName.toLowerCase()}${i}`,
      id: `test-character-${i}-id`,
      bio: [`${baseName}${i} - Agent ${i} in a multi-agent test scenario`],
      ...overrides
    });
    characters.push(character);
  }
  return characters;
}

// src/factories.ts
function createTestEnvironment(options = {}) {
  const {
    characterName = "TestAgent",
    conversationLength = 5,
    roomId = "test-room-id",
    plugins = [],
    runtimeOverrides = {},
    characterOverrides = {}
  } = options;
  const character = createMockCharacter({
    name: characterName,
    plugins,
    ...characterOverrides
  });
  const runtime = createMockRuntime({
    character,
    ...runtimeOverrides
  });
  const conversation = createMockConversation(conversationLength, roomId);
  const state = createMockConversationState(conversation.map((m) => m.content.text || ""), "TestUser");
  return {
    runtime,
    character,
    conversation,
    state,
    roomId
  };
}
function createTestAction(name, options = {}) {
  const {
    description = `Test action: ${name}`,
    validateResult = true,
    handlerResult = { text: `${name} executed successfully`, success: true },
    examples = []
  } = options;
  return {
    name,
    similes: [`${name.toLowerCase()}`, `${name.replace("_", " ").toLowerCase()}`],
    description,
    examples,
    validate: mock().mockResolvedValue(validateResult),
    handler: mock(async (runtime, message, state, options2, callback) => {
      if (callback) {
        await callback({
          text: handlerResult.text || `${name} action executed`,
          thought: `Executing ${name} action`,
          actions: [name]
        });
      }
      return handlerResult;
    })
  };
}
function createTestProvider(name, options = {}) {
  const {
    description = `Test provider: ${name}`,
    text = `[${name}]
Provider context information
[/${name}]`,
    values = { [`${name.toLowerCase()}Data`]: "test-value" },
    data = { source: name, timestamp: Date.now() },
    dynamic = false,
    isPrivate = false
  } = options;
  return {
    name,
    description,
    dynamic,
    private: isPrivate,
    get: mock().mockResolvedValue({
      text,
      values,
      data
    })
  };
}
function createTestEvaluator(name, options = {}) {
  const {
    description = `Test evaluator: ${name}`,
    alwaysRun = false,
    validateResult = true,
    handlerResult = { success: true }
  } = options;
  return {
    name,
    description,
    alwaysRun,
    examples: [],
    validate: mock().mockResolvedValue(validateResult),
    handler: mock(async (_runtime, _message, _state) => {
      return handlerResult;
    })
  };
}
function createPluginTestScenario(pluginName, options = {}) {
  const {
    actions = ["TEST_ACTION"],
    providers = ["TEST_PROVIDER"],
    evaluators = ["TEST_EVALUATOR"],
    conversationSteps = ["Hello", "How can I test this plugin?"]
  } = options;
  const { runtime, character, state, roomId } = createTestEnvironment({
    characterName: `${pluginName}TestAgent`,
    plugins: [pluginName]
  });
  const testActions = actions.map((name) => createTestAction(name));
  const testProviders = providers.map((name) => createTestProvider(name));
  const testEvaluators = evaluators.map((name) => createTestEvaluator(name));
  const conversation = conversationSteps.map((text, index) => createMockMemory({
    content: { text },
    entityId: index % 2 === 0 ? "user-id" : runtime.agentId,
    roomId
  }));
  return {
    runtime,
    character,
    state,
    roomId,
    conversation,
    components: {
      actions: testActions,
      providers: testProviders,
      evaluators: testEvaluators
    },
    helpers: {
      executeAction: async (actionName, message) => {
        const action = testActions.find((a) => a.name === actionName);
        const testMessage = message || conversation[0];
        return action?.handler(runtime, testMessage, state);
      },
      getProviderData: async (providerName, message) => {
        const provider = testProviders.find((p) => p.name === providerName);
        const testMessage = message || conversation[0];
        return provider?.get(runtime, testMessage, state);
      },
      runEvaluator: async (evaluatorName, message) => {
        const evaluator = testEvaluators.find((e) => e.name === evaluatorName);
        const testMessage = message || conversation[0];
        return evaluator?.handler(runtime, testMessage, state);
      }
    }
  };
}
function createMultiAgentScenario(agentCount = 2, options = {}) {
  const {
    sharedRoomId = "shared-room-id",
    agentNames = Array.from({ length: agentCount }, (_, i) => `Agent${i + 1}`),
    conversationSteps = [
      { agentIndex: 0, message: "Hello from Agent 1" },
      { agentIndex: 1, message: "Hello from Agent 2" }
    ]
  } = options;
  const agents = agentNames.map((name, index) => {
    const { runtime, character } = createTestEnvironment({
      characterName: name,
      roomId: sharedRoomId
    });
    return { runtime, character, index };
  });
  const conversation = conversationSteps.map((step) => createMockMemory({
    content: { text: step.message },
    entityId: agents[step.agentIndex].runtime.agentId,
    roomId: sharedRoomId
  }));
  return {
    agents,
    sharedRoomId,
    conversation,
    helpers: {
      sendMessage: (agentIndex, text) => {
        const message = createMockMemory({
          content: { text },
          entityId: agents[agentIndex].runtime.agentId,
          roomId: sharedRoomId
        });
        conversation.push(message);
        return message;
      },
      getAgentByName: (name) => {
        return agents.find((agent) => agent.character.name === name);
      }
    }
  };
}
// src/mocks/database.ts
function createMockDatabase(overrides = {}) {
  const mockConnection = {
    execute: mock().mockResolvedValue([]),
    query: mock().mockResolvedValue([]),
    run: mock().mockResolvedValue({ changes: 1 }),
    all: mock().mockResolvedValue([]),
    get: mock().mockResolvedValue(null)
  };
  const baseDatabaseAdapter = {
    db: overrides.db || mockConnection,
    init: mock().mockResolvedValue(undefined),
    initialize: mock().mockResolvedValue(undefined),
    isReady: mock().mockResolvedValue(true),
    close: mock().mockResolvedValue(undefined),
    getConnection: mock().mockResolvedValue(mockConnection),
    getAgent: mock().mockResolvedValue(null),
    getAgents: mock().mockResolvedValue([]),
    createAgent: mock().mockResolvedValue(true),
    updateAgent: mock().mockResolvedValue(true),
    deleteAgent: mock().mockResolvedValue(true),
    getEntitiesByIds: mock().mockResolvedValue([]),
    getEntitiesForRoom: mock().mockResolvedValue([]),
    createEntities: mock().mockResolvedValue(true),
    updateEntity: mock().mockResolvedValue(undefined),
    getComponent: mock().mockResolvedValue(null),
    getComponents: mock().mockResolvedValue([]),
    createComponent: mock().mockResolvedValue(true),
    updateComponent: mock().mockResolvedValue(undefined),
    deleteComponent: mock().mockResolvedValue(undefined),
    getMemories: mock().mockResolvedValue([]),
    getMemoryById: mock().mockResolvedValue(null),
    getMemoriesByIds: mock().mockResolvedValue([]),
    getMemoriesByRoomIds: mock().mockResolvedValue([]),
    getMemoriesByWorldId: mock().mockResolvedValue([]),
    getCachedEmbeddings: mock().mockResolvedValue([]),
    searchMemories: mock().mockResolvedValue([]),
    createMemory: mock().mockResolvedValue("test-memory-id"),
    updateMemory: mock().mockResolvedValue(true),
    deleteMemory: mock().mockResolvedValue(undefined),
    deleteManyMemories: mock().mockResolvedValue(undefined),
    deleteAllMemories: mock().mockResolvedValue(undefined),
    countMemories: mock().mockResolvedValue(0),
    ensureEmbeddingDimension: mock().mockResolvedValue(undefined),
    log: mock().mockResolvedValue(undefined),
    getLogs: mock().mockResolvedValue([]),
    deleteLog: mock().mockResolvedValue(undefined),
    createWorld: mock().mockResolvedValue("test-world-id"),
    getWorld: mock().mockResolvedValue(null),
    removeWorld: mock().mockResolvedValue(undefined),
    getAllWorlds: mock().mockResolvedValue([]),
    updateWorld: mock().mockResolvedValue(undefined),
    getRoomsByIds: mock().mockResolvedValue([]),
    createRooms: mock().mockResolvedValue([]),
    deleteRoom: mock().mockResolvedValue(undefined),
    deleteRoomsByWorldId: mock().mockResolvedValue(undefined),
    updateRoom: mock().mockResolvedValue(undefined),
    getRoomsForParticipant: mock().mockResolvedValue([]),
    getRoomsForParticipants: mock().mockResolvedValue([]),
    getRoomsByWorld: mock().mockResolvedValue([]),
    removeParticipant: mock().mockResolvedValue(true),
    addParticipantsRoom: mock().mockResolvedValue(true),
    getParticipantsForEntity: mock().mockResolvedValue([]),
    getParticipantsForRoom: mock().mockResolvedValue([]),
    getParticipantUserState: mock().mockResolvedValue(null),
    setParticipantUserState: mock().mockResolvedValue(undefined),
    createRelationship: mock().mockResolvedValue(true),
    updateRelationship: mock().mockResolvedValue(undefined),
    getRelationship: mock().mockResolvedValue(null),
    getRelationships: mock().mockResolvedValue([]),
    getCache: mock().mockResolvedValue(undefined),
    setCache: mock().mockResolvedValue(true),
    deleteCache: mock().mockResolvedValue(true),
    createTask: mock().mockResolvedValue("test-task-id"),
    getTasks: mock().mockResolvedValue([]),
    getTask: mock().mockResolvedValue(null),
    getTasksByName: mock().mockResolvedValue([]),
    updateTask: mock().mockResolvedValue(undefined),
    deleteTask: mock().mockResolvedValue(undefined),
    ...overrides
  };
  return baseDatabaseAdapter;
}
function createMockDbConnection(overrides = {}) {
  return {
    execute: mock().mockResolvedValue([]),
    query: mock().mockResolvedValue([]),
    run: mock().mockResolvedValue({ changes: 1 }),
    all: mock().mockResolvedValue([]),
    get: mock().mockResolvedValue(null),
    prepare: mock().mockReturnValue({
      get: mock().mockReturnValue(null),
      all: mock().mockReturnValue([]),
      run: mock().mockReturnValue({ changes: 1 })
    }),
    ...overrides
  };
}
// src/mocks/services.ts
import { ServiceType } from "@elizaos/core";
function createMockService(serviceType = ServiceType.UNKNOWN, overrides = {}) {
  const baseService = {
    serviceType,
    capabilityDescription: `Mock service for testing`,
    config: {
      enabled: true,
      mockData: true,
      ...overrides.config
    },
    stop: mock().mockResolvedValue(undefined),
    start: mock().mockResolvedValue(undefined),
    initialize: mock().mockResolvedValue(undefined),
    isReady: mock().mockReturnValue(true),
    getStatus: mock().mockReturnValue("active"),
    restart: mock().mockResolvedValue(undefined),
    runtime: null,
    ...overrides
  };
  return baseService;
}
function createMockDatabaseService(overrides = {}) {
  return createMockService(ServiceType.UNKNOWN, {
    capabilityDescription: "Provides database connectivity and operations",
    ...overrides
  });
}
function createMockCacheService(overrides = {}) {
  const cache = new Map;
  return createMockService(ServiceType.UNKNOWN, {
    capabilityDescription: "Provides in-memory caching capabilities",
    ...overrides
  });
}
function createMockHttpService(overrides = {}) {
  return createMockService(ServiceType.UNKNOWN, {
    capabilityDescription: "Provides HTTP client capabilities",
    ...overrides
  });
}
function createMockBlockchainService(overrides = {}) {
  return createMockService("WALLET", {
    capabilityDescription: "Provides blockchain wallet and transaction capabilities",
    ...overrides
  });
}
function createMockModelService(overrides = {}) {
  return createMockService(ServiceType.UNKNOWN, {
    capabilityDescription: "Provides AI model inference capabilities",
    ...overrides
  });
}
function createMockMessagingService(overrides = {}) {
  return createMockService(ServiceType.UNKNOWN, {
    capabilityDescription: "Provides messaging platform integration",
    ...overrides
  });
}
function createMockServiceMap(services = []) {
  const serviceMap = new Map;
  if (services.length === 0) {
    services = [
      { name: "database", type: ServiceType.UNKNOWN },
      { name: "cache", type: ServiceType.UNKNOWN },
      { name: "http", type: ServiceType.UNKNOWN }
    ];
  }
  services.forEach(({ name, type = ServiceType.UNKNOWN, overrides = {} }) => {
    const service = createMockService(type, overrides);
    serviceMap.set(name, service);
  });
  return serviceMap;
}
function registerMockServices(runtime, services = []) {
  const serviceMap = createMockServiceMap(services);
  runtime.getService = mock().mockImplementation((serviceName) => {
    return serviceMap.get(serviceName) || null;
  });
  runtime.services = serviceMap;
  return runtime;
}
export {
  scenarios,
  runIntegrationTest,
  registerMockServices,
  mock,
  createUnitTest,
  createTestRuntime,
  createTestProvider,
  createTestModelProvider,
  createTestEvaluator,
  createTestEnvironment,
  createTestDatabase,
  createTestAction,
  createSpecializedModelProvider,
  createRichConversationCharacter,
  createPluginTestScenario,
  createPluginTestCharacter,
  createPluginTest,
  createPerformanceTest,
  createMultipleCharacters,
  createMultiAgentScenario,
  createModelHandler,
  createMockUserMessage,
  createMockStateWithProvider,
  createMockStateWithActions,
  createMockState,
  createMockServiceMap,
  createMockService,
  createMockRuntime,
  createMockProviderResult,
  createMockModelService,
  createMockMessagingService,
  createMockMemoryWithEmbedding,
  createMockMemory,
  createMockMedia,
  createMockHttpService,
  createMockFact,
  createMockDbConnection,
  createMockDatabaseService,
  createMockDatabase,
  createMockConversationState,
  createMockConversation,
  createMockContent,
  createMockCharacter,
  createMockCacheService,
  createMockBlockchainService,
  createMockAgentResponse,
  createMockActionResult,
  createMinimalMockCharacter,
  createIntegrationTest,
  createErrorTest,
  UnitTestTemplate,
  TestTemplate,
  TestSuite,
  TestScenarioBuilder,
  TestModelProvider,
  TestDatabaseManager,
  TestDataGenerator,
  RuntimeTestHarness,
  PluginTestTemplate,
  PerformanceTestTemplate,
  IntegrationTestTemplate,
  ErrorTestTemplate
};

//# debugId=6D013BFD7523690664756E2164756E21
//# sourceMappingURL=index.js.map
