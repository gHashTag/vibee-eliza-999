import { describe, it, expect, beforeEach, mock } from "bun:test";
import { generateImageAction } from "../../actions/generateImage";
import type { IAgentRuntime, Memory, HandlerCallback } from "@elizaos/core";

describe("generateImageAction", () => {
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    mockRuntime = {
      getSetting: mock(() => 'test-key'),
      getService: mock(),
      agentId: 'test-agent-id',
      character: {
        name: 'Test Agent',
      },
    } as any;
  });

  describe("validate", () => {
    it("should return true for /neurophoto command", async () => {
      const message: Memory = {
        content: { text: "/neurophoto beautiful sunset" },
        userId: 'test-user-id',
        agentId: 'test-agent-id',
        roomId: 'test-room-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it('should return true for "нарисуй" intent', async () => {
      const message: Memory = {
        content: { text: "нарисуй кота" },
        userId: 'test-user-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it('should return true for "покажи" intent', async () => {
      const message: Memory = {
        content: { text: "покажи как выглядит закат" },
        userId: 'test-user-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it('should return true for "create image" intent', async () => {
      const message: Memory = {
        content: { text: "create image of a sunset" },
        userId: 'test-user-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it("should return false for unrelated message", async () => {
      const message: Memory = {
        content: { text: "привет как дела" },
        userId: 'test-user-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(false);
    });

    it("should return false for empty text", async () => {
      const message: Memory = {
        content: { text: "" },
        userId: 'test-user-id',
      } as Memory;

      const result = await generateImageAction.validate(mockRuntime, message);
      expect(result).toBe(false);
    });
  });

  describe("handler - Error Cases", () => {
    it("should fail if userId is missing", async () => {
      const message: Memory = {
        content: { text: "нарисуй закат" },
        userId: undefined as any,
      } as Memory;

      const callback = mock<HandlerCallback>();

      const result = await generateImageAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        callback as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Не удалось определить пользователя'),
        })
      );
    });

    it("should fail if prompt is too short", async () => {
      const message: Memory = {
        content: { text: "/neurophoto ab" }, // only 2 chars
        userId: 'test-user-id',
      } as Memory;

      const callback = mock<HandlerCallback>();

      const result = await generateImageAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        callback as any
      );

      expect(result.success).toBe(false);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Минимальная длина'),
        })
      );
    });

    it("should fail if prompt is missing", async () => {
      const message: Memory = {
        content: { text: "/neurophoto" },
        userId: 'test-user-id',
      } as Memory;

      const callback = mock<HandlerCallback>();

      const result = await generateImageAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        callback as any
      );

      expect(result.success).toBe(false);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('опишите какое изображение'),
        })
      );
    });
  });

  describe("Action Metadata", () => {
    it("should have correct action name", () => {
      expect(generateImageAction.name).toBe('GENERATE_NEUROPHOTO');
    });

    it("should have similes", () => {
      expect(generateImageAction.similes).toBeDefined();
      expect(generateImageAction.similes?.length).toBeGreaterThan(0);
      expect(generateImageAction.similes).toContain('CREATE_PHOTO');
    });

    it("should have description", () => {
      expect(generateImageAction.description).toBeDefined();
      expect(generateImageAction.description).toContain('Генерирует AI-изображения');
    });
  });
});
