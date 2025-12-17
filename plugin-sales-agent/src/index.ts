/**
 * Sales Agent Plugin - Entry Point
 *
 * Экспорты плагина для ElizaOS
 */

// Plugin
export { salesAgentPlugin, salesAgentPlugin as default } from './plugin.ts'

// Service
export { SalesConfiguratorService, salesConfiguratorService } from './services/salesConfigurator.service.ts'

// Types
export {
  SalesAgentStep,
  type SalesSession,
  type SalesAgentData,
  type ServiceType,
  type PaymentMethod,
  type TargetSegment,
  type ToneLevel,
  type ToneSettings,
  type DialogExample,
  type SalesScripts,
  type Triggers,
  SERVICE_TYPES,
  PAYMENT_METHODS,
  TARGET_SEGMENTS,
  CURRENCIES,
  BASE_PLUGINS,
} from './types/session.types.ts'

// Utils
export {
  buildSalesCharacter,
  generatePreview,
  generateInstructions,
  exportCharacterJson,
} from './utils/salesCharacterBuilder.ts'

// Actions
export { salesWizardActions } from './actions/salesWizard.action.ts'

// Templates
export {
  SALES_QUESTIONS,
  SALES_VALIDATION_ERRORS,
  SALES_PROGRESS_MESSAGES,
  SALES_COMMANDS,
  SALES_HELP_TEXT,
} from './templates/questions.ts'
