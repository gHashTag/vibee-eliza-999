/**
 * KOLS Plugin - Централизованная конфигурация
 *
 * Все настройки плагина экспортируются из этого файла.
 * Импортируйте конфигурацию отсюда: import { ... } from '../config';
 */

// ============================================
// ЦЕНТРАЛИЗОВАННАЯ КОНФИГУРАЦИЯ АГЕНТОВ
// ============================================
export {
  AGENTS_CONFIG,
  getAgentConfig,
  getAllTargetChats,
  getAllTargetChatIds,
  getTargetChatsForAgent,
  isChatTargetForAgent,
  shouldRespondInChat,
  getKnowledgeSources,
  getStyleConfig,
  getSalesConfig,
  getAllAgents,
  getAllAgentIds,
  type AgentConfig,
  type ChatTarget,
  type TriggerConfig,
  type StyleConfig,
  type ResponseExample,
  type KnowledgeConfig,
  type KnowledgeSourceConfig,
  type AgentSalesConfig,
  type BehaviorConfig,
} from './agents.config';

// Telegram Credentials
export {
  getCredentials,
  hasValidCredentials,
  type KolsCredentials
} from './credentials';

// Целевые чаты (обратная совместимость)
export {
  TARGET_CHATS,
  isTargetChat,
  isPrivateChat,
  shouldProcessChat,
  getTargetChats,
  getTargetChatsAsNumbers,
  type TargetChatId
} from './targetChats';

// Триггерные слова
export {
  TRIGGER_WORDS,
  TRIGGER_CATEGORIES,
  containsTrigger,
  findTriggers,
  getTriggerCategory
} from './triggers';

// Проактивное обучение
export {
  PROACTIVE_CONFIG,
  PROACTIVE_TIMING,
  PROACTIVE_LLM,
  PROACTIVE_MESSAGE,
  CONTENT_TYPES,
  getRandomInterval,
  getRandomContentType,
  type ContentType
} from './proactive';

/**
 * Объединённая конфигурация KOLS плагина
 */
export const KOLS_CONFIG = {
  /** Версия плагина */
  VERSION: '2.0.0',

  /** Название плагина */
  NAME: 'kols-userbot',

  /** Описание */
  DESCRIPTION: 'KOLS USERBOT - Изолированный плагин для проактивного обучения VibeCoding'
} as const;
