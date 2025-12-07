import { IAgentRuntime, Memory, type UUID } from '@elizaos/core';
import { mock } from 'bun:test';

/**
 * Мок для IAgentRuntime
 */
export function createMockRuntime(): IAgentRuntime {
  return {
    agentId: '00000000-0000-0000-0000-000000000001' as UUID,
    characterName: 'VIBEE',
    databaseAdapter: {} as any,
    ensureUserExists: mock().mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002' as UUID,
      name: 'Test User',
    }),
    getService: mock().mockReturnValue({
      publishPost: mock().mockResolvedValue({ id: 'post-123' }),
      validateToken: mock().mockResolvedValue(true),
    }),
    addMemory: mock().mockResolvedValue(undefined),
    getMemories: mock().mockResolvedValue([]),
    createMemory: mock().mockResolvedValue(undefined),
    composeState: mock().mockImplementation(async (message: Memory) => ({
      values: {},
      data: {},
      text: message.content.text || '',
      message: message.content.text,
      currentContext: [],
    })),
    isClientConnected: mock().mockReturnValue(true),
    logger: {
      info: mock(),
      error: mock(),
      warn: mock(),
      debug: mock(),
      level: 'info',
      trace: mock(),
      fatal: mock(),
      success: mock(),
      progress: mock(),
      log: mock(),
    } as any,
  } as unknown as IAgentRuntime;
}

/**
 * Мок для сообщения Telegram
 */
export function createTelegramMessage(text: string, attachments?: any[]): Memory {
  return {
    id: '00000000-0000-0000-0000-000000000003' as UUID,
    entityId: '00000000-0000-0000-0000-000000000002' as UUID,
    roomId: '00000000-0000-0000-0000-000000000004' as UUID,
    content: {
      text,
      source: 'telegram',
      attachments: attachments || [],
    },
    createdAt: Date.now(),
  };
}
