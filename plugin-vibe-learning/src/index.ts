import { Plugin } from '@elizaos/core';
import { proactiveLearningAction } from './actions/proactiveLearningAction';
import { VibeLearningService } from './services/vibeLearningService';
import { vibeLearningProvider } from './providers/vibeLearningProvider';

export const vibeLearningPlugin: Plugin = {
  name: 'vibe-learning',
  description: 'Проактивный плагин обучения VibeCoding для KOLS агента',
  services: [VibeLearningService],
  actions: [proactiveLearningAction],
  providers: [vibeLearningProvider],
};

export default vibeLearningPlugin;
