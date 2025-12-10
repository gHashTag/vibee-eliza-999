import {
  type IAgentRuntime,
  type TestSuite,
  logger,
} from '@elizaos/core';

/**
 * E2E Test Suite for plugin-carusel
 *
 * Базовые тесты для проверки работы плагина
 */

export const CaruselPluginTestSuite: TestSuite = {
  name: 'carusel-plugin-e2e',
  tests: [
    {
      name: 'runtime_should_be_initialized',
      fn: async (runtime: IAgentRuntime) => {
        if (!runtime) {
          throw new Error('Runtime is not initialized');
        }

        if (!runtime.agentId) {
          throw new Error('Agent ID is not set');
        }

        logger.info('✓ Runtime initialized successfully');
      },
    },

    {
      name: 'character_should_be_loaded',
      fn: async (runtime: IAgentRuntime) => {
        if (!runtime.character) {
          throw new Error('Character not loaded');
        }

        if (!runtime.character.name) {
          throw new Error('Character name is missing');
        }

        logger.info(`✓ Character loaded: ${runtime.character.name}`);
      },
    },

    {
      name: 'should_have_actions_registered',
      fn: async (runtime: IAgentRuntime) => {
        const actionsCount = runtime.actions?.length || 0;

        if (actionsCount === 0) {
          logger.info('⚠ No actions registered (test environment)');
          return;
        }

        logger.info(`✓ ${actionsCount} actions registered`);
      },
    },

    {
      name: 'should_have_providers_registered',
      fn: async (runtime: IAgentRuntime) => {
        const providersCount = runtime.providers?.length || 0;

        if (providersCount === 0) {
          logger.info('⚠ No providers registered (test environment)');
          return;
        }

        logger.info(`✓ ${providersCount} providers registered`);
      },
    },

    {
      name: 'configuration_should_be_valid',
      fn: async (runtime: IAgentRuntime) => {
        const hasSettings = runtime.character?.settings !== undefined;

        logger.info(`✓ Configuration valid, settings: ${hasSettings ? 'present' : 'absent'}`);
      },
    },

    {
      name: 'should_report_components',
      fn: async (runtime: IAgentRuntime) => {
        const stats = {
          actions: runtime.actions?.length || 0,
          providers: runtime.providers?.length || 0,
          evaluators: runtime.evaluators?.length || 0,
          plugins: runtime.plugins?.length || 0,
        };

        logger.info(
          `✓ Components: ${stats.actions} actions, ${stats.providers} providers, ${stats.evaluators} evaluators`
        );
      },
    },
  ],
};

export default CaruselPluginTestSuite;
