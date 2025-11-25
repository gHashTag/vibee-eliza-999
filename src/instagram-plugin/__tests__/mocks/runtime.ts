import { IAgentRuntime, Memory } from '@elizaos/core';

/**
 * Мок для IAgentRuntime
 */
export function createMockRuntime(): IAgentRuntime {
  return {
    agentId: 'test-agent-id',
    characterName: 'VIBEE',
    databaseAdapter: {} as any,
    ensureUserExists: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      name: 'Test User',
    }),
    getService: jest.fn().mockReturnValue({
      publishPost: jest.fn().mockResolvedValue({ id: 'post-123' }),
      validateToken: jest.fn().mockResolvedValue(true),
    }),
    addMemory: jest.fn().mockResolvedValue(undefined),
    getMemories: jest.fn().mockResolvedValue([]),
    createMemory: jest.fn().mockResolvedValue(undefined),
    composeState: jest.fn().mockImplementation(async (message: Memory) => ({
      message: message.content.text,
      currentContext: [],
    })),
    isClientConnected: jest.fn().mockReturnValue(true),
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any,
  } as unknown as IAgentRuntime;
}

/**
 * Мок для сообщения Telegram
 */
export function createTelegramMessage(text: string, attachments?: any[]): Memory {
  return {
    id: 'test-message-id',
    entityId: 'test-user-id',
    roomId: 'test-room-id',
    content: {
      text,
      source: 'telegram',
      attachments: attachments || [],
    },
    createdAt: Date.now(),
  };
}
