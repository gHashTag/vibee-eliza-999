/**
 * Sales Agent Plugin
 *
 * ElizaOS плагин для создания AI-агентов продаж услуг по подписке
 */

import type { Plugin } from '@elizaos/core'
import { salesWizardActions } from './actions/salesWizard.action.ts'

/**
 * Sales Agent Plugin
 *
 * Добавляет команду /create_sales_agent для пошагового создания
 * Character файла продавца услуг по подписке
 */
export const salesAgentPlugin: Plugin = {
  name: 'plugin-sales-agent',
  description: 'Wizard для создания AI-агента продаж услуг по подписке через Telegram',
  actions: salesWizardActions,
  evaluators: [],
  providers: [],
}

export default salesAgentPlugin
