import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import { character } from './character.ts';
import { instagramAgent } from '../characters/instagram.ts';

const initVIBEECharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing VIBEE character');
  logger.info({ name: character.name }, 'Name:');
};

const initInstagramCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing Instagram Expert character');
  logger.info({ name: instagramAgent.name }, 'Name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initVIBEECharacter({ runtime }),
  // plugins: [starterPlugin], <-- Import custom plugins here
};

export const instagramProjectAgent: ProjectAgent = {
  character: instagramAgent,
  init: async (runtime: IAgentRuntime) => await initInstagramCharacter({ runtime }),
};

const project: Project = {
  agents: [projectAgent, instagramProjectAgent],
};

export { character } from './character.ts';
export { instagramAgent } from '../characters/instagram.ts';

export default project;
