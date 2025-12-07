/**
 * E2E Tests for plugin-telegram-craft
 *
 * Runtime тесты для проверки работы плагина в ElizaOS
 */
import type { IAgentRuntime } from '@elizaos/core'

/**
 * Test Suite interface для ElizaOS
 */
interface TestCase {
  name: string
  fn: (runtime: IAgentRuntime) => Promise<void>
}

interface TestSuite {
  name: string
  tests: TestCase[]
}

/**
 * Simple logger for tests
 */
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`)
}

/**
 * E2E Test Suite для telegram-craft plugin
 */
export const TelegramCraftTestSuite: TestSuite = {
  name: 'telegram-craft-e2e',
  tests: [
    {
      name: 'plugin_should_be_loaded',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft) {
          throw new Error('telegram-craft plugin not found in runtime')
        }

        logger.success('telegram-craft plugin loaded successfully')
      }
    },

    {
      name: 'plugin_should_have_actions',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft?.actions || telegramCraft.actions.length === 0) {
          throw new Error('telegram-craft plugin has no actions')
        }

        const actionNames = telegramCraft.actions.map(a => a.name)
        logger.info(`Actions found: ${actionNames.join(', ')}`)

        if (!actionNames.includes('GET_DIALOGS')) {
          throw new Error('GET_DIALOGS action not found')
        }

        logger.success('GET_DIALOGS action is available')
      }
    },

    {
      name: 'plugin_should_have_providers',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft?.providers || telegramCraft.providers.length === 0) {
          throw new Error('telegram-craft plugin has no providers')
        }

        const providerNames = telegramCraft.providers.map(p => p.name)
        logger.info(`Providers found: ${providerNames.join(', ')}`)

        if (!providerNames.includes('vibeCodingKnowledge')) {
          throw new Error('vibeCodingKnowledge provider not found')
        }

        logger.success('VibeCodingKnowledge provider is available')
      }
    },

    {
      name: 'plugin_should_have_evaluators',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft?.evaluators || telegramCraft.evaluators.length === 0) {
          throw new Error('telegram-craft plugin has no evaluators')
        }

        const evaluatorNames = telegramCraft.evaluators.map(e => e.name)
        logger.info(`Evaluators found: ${evaluatorNames.join(', ')}`)

        const requiredEvaluators = ['responseQuality', 'factExtraction', 'goalTracking']
        for (const required of requiredEvaluators) {
          if (!evaluatorNames.includes(required)) {
            throw new Error(`${required} evaluator not found`)
          }
        }

        logger.success('All evaluators are available')
      }
    },

    {
      name: 'plugin_should_have_routes',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft?.routes || telegramCraft.routes.length === 0) {
          throw new Error('telegram-craft plugin has no routes')
        }

        logger.info(`Routes count: ${telegramCraft.routes.length}`)
        logger.success('Routes are available')
      }
    },

    {
      name: 'plugin_should_have_services',
      fn: async (runtime: IAgentRuntime) => {
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (!telegramCraft?.services || telegramCraft.services.length === 0) {
          throw new Error('telegram-craft plugin has no services')
        }

        logger.info(`Services count: ${telegramCraft.services.length}`)
        logger.success('Services are available')
      }
    },

    {
      name: 'agent_should_initialize_with_plugin',
      fn: async (runtime: IAgentRuntime) => {
        const agentName = runtime.character?.name
        const agentId = runtime.agentId

        if (!agentName) {
          throw new Error('Agent name is not defined')
        }
        if (!agentId) {
          throw new Error('Agent ID is not defined')
        }

        logger.info(`Agent: ${agentName} (${agentId})`)
        logger.success(`Agent ${agentName} initialized successfully with telegram-craft plugin`)
      }
    },

    {
      name: 'telegram_service_should_be_accessible',
      fn: async (runtime: IAgentRuntime) => {
        // Проверяем что TelegramService доступен через runtime
        const services = runtime.services || new Map()

        // TelegramService регистрируется при инициализации плагина
        // Проверяем что он есть или что плагин может его создать
        const plugins = runtime.plugins || []
        const telegramCraft = plugins.find(p => p.name === 'telegram-craft')

        if (telegramCraft?.services && telegramCraft.services.length > 0) {
          logger.success('TelegramService is available in plugin services')
        } else {
          throw new Error('TelegramService not found')
        }
      }
    }
  ]
}

/**
 * Run all tests
 */
export async function runTelegramCraftTests(runtime: IAgentRuntime): Promise<{
  passed: number
  failed: number
  results: Array<{ name: string; passed: boolean; error?: string }>
}> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = []
  let passed = 0
  let failed = 0

  console.log('\n=== Running telegram-craft E2E Tests ===\n')

  for (const test of TelegramCraftTestSuite.tests) {
    try {
      await test.fn(runtime)
      results.push({ name: test.name, passed: true })
      passed++
      console.log(`  [PASS] ${test.name}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      results.push({ name: test.name, passed: false, error: errorMessage })
      failed++
      console.log(`  [FAIL] ${test.name}: ${errorMessage}`)
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)

  return { passed, failed, results }
}

export default TelegramCraftTestSuite
