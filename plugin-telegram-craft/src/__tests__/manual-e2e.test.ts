
import { describe, it, expect, mock } from "bun:test";
import { TelegramCraftTestSuite } from "./e2e/telegram-craft.e2e";
import type { IAgentRuntime, Character, Action, Provider, Evaluator, Service, Plugin } from "@elizaos/core";

// Mock Runtime
const mockRuntime = {
  agentId: "test-agent-id",
  character: {
    name: "Test Character",
    settings: {}
  } as Character,
  actions: [
    { name: "GET_DIALOGS", handler: async () => {}, description: "mock", similes: [], examples: [], validate: async () => true }
  ] as Action[],
  providers: [
    { name: "vibeCodingKnowledge", get: async () => "mock" }
  ] as Provider[],
  evaluators: [
    { name: "responseQuality", handler: async () => {}, validate: async () => true, description: "mock", examples: [], similes: [] },
    { name: "factExtraction", handler: async () => {}, validate: async () => true, description: "mock", examples: [], similes: [] },
    { name: "goalTracking", handler: async () => {}, validate: async () => true, description: "mock", examples: [], similes: [] }
  ] as Evaluator[],
  plugins: [] as Plugin[],
  services: new Map(),
  getService: (name: string) => {
    if (name === "telegram") return { start: async () => {} };
    return null;
  }
} as unknown as IAgentRuntime;

describe("Telegram Craft Manual E2E", () => {
  for (const testCase of TelegramCraftTestSuite.tests) {
    it(testCase.name, async () => {
      console.log(`Running test: ${testCase.name}`);
      await testCase.fn(mockRuntime);
    });
  }
});
