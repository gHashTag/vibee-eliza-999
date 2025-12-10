// @ts-nocheck
/**
 * Character Configurator Plugin - Entry Point
 */

export { characterConfiguratorPlugin, characterConfiguratorPlugin as default } from './plugin.ts'

// Types - use 'export type' for type-only exports
export { ConfigStep } from './types/session.types.ts'
export type {
  ConfigSession,
  CharacterData,
  AgentArchetype,
  ToneSettings,
  ModelSettings,
} from './types/session.types.ts'

// Services
export { ConfiguratorService, configuratorService } from './services/configurator.service.ts'

// Utils
export {
  buildCharacter,
  generatePreview,
  generateInstructions,
  exportCharacterJson,
} from './utils/characterBuilder.ts'

// Actions
export { configWizardActions } from './actions/configWizard.action.ts'
