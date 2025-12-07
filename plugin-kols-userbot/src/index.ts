/**
 * KOLS USERBOT Plugin - Главный индексный файл
 *
 * Изолированный плагин для проактивного обучения VibeCoding.
 * Все зависимости встроены - никаких внешних файлов!
 *
 * Credentials загружаются из character.settings.secrets
 */

// Плагин
export { kolsUserbotPlugin as default } from './kolsUserbotPlugin';
export { kolsUserbotPlugin } from './kolsUserbotPlugin';

// Конфигурация
export {
  getCredentials,
  hasValidCredentials,
  type KolsCredentials
} from './config/credentials';
export {
  TARGET_CHATS,
  isTargetChat,
  getTargetChats,
  getTargetChatsAsNumbers
} from './config/targetChats';
export {
  TRIGGER_WORDS,
  TRIGGER_CATEGORIES,
  containsTrigger,
  findTriggers,
  getTriggerCategory
} from './config/triggers';
export {
  PROACTIVE_CONFIG,
  PROACTIVE_TIMING,
  PROACTIVE_LLM,
  PROACTIVE_MESSAGE,
  CONTENT_TYPES,
  getRandomInterval,
  getRandomContentType,
  type ContentType
} from './config/proactive';
export { KOLS_CONFIG } from './config';

// Сервисы
export { KolsTelegramService } from './services/KolsTelegramService';
export { KolsLearningService } from './services/KolsLearningService';
export { KolsProactiveService } from './services/KolsProactiveService';

// Провайдеры
export { kolsLearningProvider } from './providers/KolsLearningProvider';
export {
  KolsKnowledgeProvider,
  kolsKnowledgeProvider,
  kolsKnowledgeElizaProvider
} from './providers/KolsKnowledgeProvider';

// Knowledge Base
export {
  KnowledgeLoader,
  knowledgeLoader,
  type KnowledgeChunk,
  type KnowledgeMetadata
} from './knowledge';

// Character
export { kolsCharacter, createKolsCharacter } from './character';

// Действия
export { proactiveLearningAction } from './actions/ProactiveLearningAction';
export { startGroupMonitoringAction } from './actions/StartGroupMonitoringAction';
export { addGroupToMonitorAction } from './actions/AddGroupToMonitorAction';

// Типы
export * from './types';
export type { ProactiveConfig, MessageType } from './services/KolsProactiveService';

// Deprecated exports (для обратной совместимости)
// VibeCodingKnowledgeProvider заменён на KolsKnowledgeProvider
// TELEGRAM_CREDENTIALS заменён на getCredentials(runtime)
