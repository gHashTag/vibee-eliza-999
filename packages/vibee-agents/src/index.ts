import { type Project } from '@elizaos/core';
import { vibeeAgent, kolsAgent, neuroPhotoAgent, instagramExpertAgent } from './agents/index.ts';

/**
 * VIBEE Agents Project
 * 
 * Все production агенты проекта VIBEE
 */
const project: Project = {
  agents: [
    vibeeAgent,
    kolsAgent,
    neuroPhotoAgent,
    instagramExpertAgent,
  ],
};

export default project;

// Экспортируем отдельных агентов для удобства
export { vibeeAgent, kolsAgent, neuroPhotoAgent, instagramExpertAgent } from './agents/index.ts';



