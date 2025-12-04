/**
 * KOLS USERBOT Plugin - Главный индексный файл
 *
 * Плагин для проактивного обучения VibeCoding с использованием
 * книги "Agentic Vibecoding" и LLM генерации.
 */
export { kolsUserbotPlugin as default } from './kolsUserbotPlugin';
export { kolsUserbotPlugin } from './kolsUserbotPlugin';

// Сервисы
export { KolsTelegramService } from './services/KolsTelegramService';
export { KolsLearningService } from './services/KolsLearningService';
export { KolsProactiveService } from './services/KolsProactiveService';

// Провайдеры
export { kolsLearningProvider } from './providers/KolsLearningProvider';
export { 
  VibeCodingKnowledgeProvider, 
  vibeCodingKnowledgeProvider,
  type KnowledgeChunk,
  type BookSection 
} from './providers/VibeCodingKnowledgeProvider';

// Действия
export { proactiveLearningAction } from './actions/ProactiveLearningAction';
export { startGroupMonitoringAction } from './actions/StartGroupMonitoringAction';
export { addGroupToMonitorAction } from './actions/AddGroupToMonitorAction';

// Типы
export * from './types';
export type { ProactiveConfig, MessageType } from './services/KolsProactiveService';
