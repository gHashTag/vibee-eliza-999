/**
 * Safe entry point that wraps server initialization in error handling
 *
 * ⚠️ ВАЖНО: Использует централизованный сервис загрузки секретов
 * @see packages/server/src/services/infisicalSecretLoader.ts
 */

import { AgentServer } from './index.js';
import { loadInfisicalSecrets } from './services/infisicalSecretLoader.js';
// Use require to load from compiled JS file to avoid TypeScript rootDir issues
const { vibeeAgent } = require('../../../packages/agents/vibeeAgent.js');

/**
 * ⚠️ ВАЖНО: Секреты загружаются централизованно через InfisicalSecretLoader
 * @see packages/server/src/services/infisicalSecretLoader.ts
 * @see .cursor/rules/infisical_secrets_centralized.mdc
 */

const start = async () => {
  try {
    console.log('🚀 Starting ElizaOS Agent Server...');
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`📋 Infisical Config: ${process.env.INFISICAL_PROJECT_ID ? 'SET' : 'NOT SET'}`);

    // ⚠️ КРИТИЧНО: Загружаем секреты из Infisical ПЕРЕД инициализацией сервера
    // Используем централизованный сервис загрузки секретов
    const secretsResult = await loadInfisicalSecrets();

    if (!secretsResult.success) {
      console.error(
        '\x1b[31m❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить секреты из Infisical!\x1b[0m'
      );
      console.error('Ошибки:', secretsResult.errors.join(', '));
      console.error(
        '\x1b[33m⚠️  Приложение продолжит работу, но могут возникнуть проблемы!\x1b[0m\n'
      );
    }

    // Проверяем критичные секреты
    const missingCritical = Object.entries(secretsResult.criticalSecrets)
      .filter(([_, status]) => status === 'missing')
      .map(([key]) => key);

    if (missingCritical.length > 0) {
      console.log(
        `\x1b[33m⚠️  ВНИМАНИЕ: Критичные секреты не найдены: ${missingCritical.join(', ')}\x1b[0m`
      );
      console.log(`\x1b[33m⚠️  Приложение может не работать корректно!\x1b[0m\n`);
    }

    // Временно перенаправляем POSTGRES_URL на существующую базу "neondb"
    // чтобы избежать ошибки "database playra does not exist"
    if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('/playra?')) {
      process.env.POSTGRES_URL = process.env.POSTGRES_URL.replace('/playra?', '/neondb?');
      console.log('🔄 Временно перенаправляем на базу "neondb" для разработки');
    }

    const server = new AgentServer();
    await server.start({
      agents: [
        {
          character: vibeeAgent,
          plugins: [],
        }
      ]
    });
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
};

// Only start if this file is being run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { start };
