import {
  logger,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from "@elizaos/core";
import { character } from "./character.ts";
import { instagramAgent } from "../characters/instagram.ts";
import { instagramPlugin } from "./instagram-plugin/index.ts";

const initVIBEECharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info("Initializing VIBEE character");
  logger.info({ name: character.name }, "Name:");
};

const initInstagramCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info("Initializing Instagram Expert character");
  logger.info({ name: instagramAgent.name }, "Name:");
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initVIBEECharacter({ runtime }),
  // plugins: [starterPlugin], <-- Import custom plugins here
};

export const instagramProjectAgent: ProjectAgent = {
  character: instagramAgent,
  init: async (runtime: IAgentRuntime) =>
    await initInstagramCharacter({ runtime }),
  plugins: [instagramPlugin],
};

// Выбираем агентов в зависимости от переменной окружения AGENT_TYPE
const agentType = process.env.AGENT_TYPE || "all";
const agents: ProjectAgent[] = [];

if (agentType === "instagram") {
  agents.push(instagramProjectAgent);
  logger.info("🐝 Запускаем только Instagram Expert");
} else if (agentType === "vibee") {
  agents.push(projectAgent);
  logger.info("🐝 Запускаем только VIBEE");
} else {
  // По умолчанию запускаем всех агентов
  agents.push(projectAgent, instagramProjectAgent);
  logger.info("🐝 Запускаем всех агентов (VIBEE + Instagram Expert)");
}

const project: Project = {
  agents,
};

export { character } from "./character.ts";
export { instagramAgent } from "../characters/instagram.ts";

// E2E Tests export for elizaos test runner
export { ProjectStarterTestSuite } from "./__tests__/e2e/project-starter.e2e.ts";
export { InstagramPluginTestSuite } from "./instagram-plugin/__tests__/e2e/instagramPlugin.e2e.ts";

// Plugin E2E Tests - тесты для плагинов (elizaos test не может тестировать плагины напрямую)
export { NeuroPhotoTestSuite } from "../plugin-vibe-face-avatar/src/__tests__/e2e/plugin-starter.e2e.ts";
export { TelegramCraftTestSuite } from "../plugin-telegram-craft/src/__tests__/e2e/telegram-craft.e2e.ts";
export { CaruselPluginTestSuite } from "../plugin-carusel/src/__tests__/e2e/plugin-starter.e2e.ts";

export default project;
