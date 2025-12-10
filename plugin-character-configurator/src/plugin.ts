// @ts-nocheck
/**
 * Character Configurator Plugin
 *
 * ElizaOS плагин для создания Character через пошаговый диалог в Telegram
 */

import type { Plugin } from '@elizaos/core'
import { configWizardActions } from './actions/configWizard.action.ts'

/**
 * Character Configurator Plugin
 */
export const characterConfiguratorPlugin: Plugin = {
  name: 'plugin-character-configurator',
  description: 'Telegram бот-конфигуратор Character для ElizaOS',
  actions: configWizardActions,
  evaluators: [],
  providers: [],
}

export default characterConfiguratorPlugin
