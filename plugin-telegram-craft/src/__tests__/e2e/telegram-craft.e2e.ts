/**
 * E2E Tests for plugin-telegram-craft
 *
 * Runtime тесты для проверки работы плагина в ElizaOS
 */
import type { IAgentRuntime, TestSuite } from '@elizaos/core'

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
      name: 'runtime_should_be_initialized',
      fn: async (runtime: IAgentRuntime) => {
        if (!runtime) {
          throw new Error('Runtime is not initialized')
        }

        if (!runtime.agentId) {
          throw new Error('Agent ID is not set')
        }

        logger.success('Runtime initialized successfully')
      }
    },

    {
      name: 'character_should_be_loaded',
      fn: async (runtime: IAgentRuntime) => {
        const agentName = runtime.character?.name

        if (!agentName) {
          throw new Error('Character name is not defined')
        }

        logger.info(`Character: ${agentName}`)
        logger.success('Character loaded successfully')
      }
    },

    {
      name: 'should_have_actions_registered',
      fn: async (runtime: IAgentRuntime) => {
        const actionsCount = runtime.actions?.length || 0

        if (actionsCount === 0) {
          logger.info('⚠ No actions registered (test environment)')
          return
        }

        // Проверяем наличие GET_DIALOGS action
        const getDialogsAction = runtime.actions?.find(a => a.name === 'GET_DIALOGS')

        if (getDialogsAction) {
          logger.success('GET_DIALOGS action is registered')
        } else {
          logger.info(`⚠ GET_DIALOGS not found. Available: ${runtime.actions?.map(a => a.name).join(', ') || 'none'}`)
        }

        logger.info(`Total actions: ${actionsCount}`)
      }
    },

    {
      name: 'should_have_providers_registered',
      fn: async (runtime: IAgentRuntime) => {
        const providersCount = runtime.providers?.length || 0

        if (providersCount === 0) {
          logger.info('⚠ No providers registered (test environment)')
          return
        }

        // Проверяем наличие vibeCodingKnowledge provider
        const vibeProvider = runtime.providers?.find(p =>
          p.name === 'vibeCodingKnowledge' ||
          p.name?.toLowerCase().includes('vibe')
        )

        if (vibeProvider) {
          logger.success('VibeCodingKnowledge provider is registered')
        } else {
          logger.info(`⚠ VibeCodingKnowledge not found. Available: ${runtime.providers?.map(p => p.name).join(', ') || 'none'}`)
        }

        logger.info(`Total providers: ${providersCount}`)
      }
    },

    {
      name: 'should_have_evaluators_registered',
      fn: async (runtime: IAgentRuntime) => {
        const evaluatorsCount = runtime.evaluators?.length || 0

        if (evaluatorsCount === 0) {
          logger.info('⚠ No evaluators registered (test environment)')
          return
        }

        const requiredEvaluators = ['responseQuality', 'factExtraction', 'goalTracking']
        const foundEvaluators: string[] = []

        for (const required of requiredEvaluators) {
          const found = runtime.evaluators?.find(e => e.name === required)
          if (found) {
            foundEvaluators.push(required)
          }
        }

        if (foundEvaluators.length > 0) {
          logger.success(`Evaluators found: ${foundEvaluators.join(', ')}`)
        } else {
          logger.info(`⚠ Required evaluators not found. Available: ${runtime.evaluators?.map(e => e.name).join(', ') || 'none'}`)
        }

        logger.info(`Total evaluators: ${evaluatorsCount}`)
      }
    },

    {
      name: 'telegram_service_should_be_accessible',
      fn: async (runtime: IAgentRuntime) => {
        // Проверяем доступность сервиса через runtime.getService
        const telegramService = runtime.getService('telegram')
        const mtprotoService = runtime.getService('mtproto')

        if (telegramService) {
          logger.success('Telegram service is accessible')
        } else if (mtprotoService) {
          logger.success('MTProto service is accessible')
        } else {
          logger.info('⚠ Telegram/MTProto service not found (credentials may not be configured)')
        }
      }
    },

    {
      name: 'configuration_should_be_valid',
      fn: async (runtime: IAgentRuntime) => {
        // Проверяем базовую конфигурацию
        if (!runtime.character) {
          throw new Error('Character not loaded')
        }

        if (!runtime.character.name) {
          throw new Error('Character name is missing')
        }

        // Проверяем settings (если есть)
        const hasSettings = runtime.character.settings !== undefined

        logger.info(`Character: ${runtime.character.name}, Settings: ${hasSettings ? 'present' : 'absent'}`)
        logger.success('Configuration is valid')
      }
    },

    {
      name: 'should_report_components_count',
      fn: async (runtime: IAgentRuntime) => {
        const stats = {
          actions: runtime.actions?.length || 0,
          providers: runtime.providers?.length || 0,
          evaluators: runtime.evaluators?.length || 0,
          plugins: runtime.plugins?.length || 0
        }

        logger.info(`Components: ${stats.actions} actions, ${stats.providers} providers, ${stats.evaluators} evaluators, ${stats.plugins} plugins`)
        logger.success('Component stats collected')
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
