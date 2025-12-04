import { logger, type IAgentRuntime } from '@elizaos/core';
import { instagramAgent } from '../characters/instagram';
import { instagramPlugin } from './instagram-plugin/index';

const initInstagramCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing Instagram Expert character');
  logger.info({ name: instagramAgent.name }, 'Name:');
};

/**
 * Instagram Expert Entry Point
 * Запускает только Instagram Expert агента с plugin
 */
export const instagramProjectAgent = {
  character: instagramAgent,
  init: async (runtime: IAgentRuntime) => await initInstagramCharacter({ runtime }),
  plugins: [instagramPlugin],
};

const project = {
  agents: [instagramProjectAgent],
};

export default project;
