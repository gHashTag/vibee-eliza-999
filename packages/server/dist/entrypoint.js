/**
 * Safe entry point that wraps server initialization in error handling
 *
 * ⚠️ ВАЖНО: Использует централизованный сервис загрузки секретов
 * @see packages/server/src/services/infisicalSecretLoader.ts
 */
import { config } from 'dotenv';
// 🔧 FIX: Import AgentServer AFTER environment variables are loaded
// import { AgentServer } from '../dist/index.js';
import { loadInfisicalSecrets } from './services/infisicalSecretLoader.js';
// ⚠️ КРИТИЧНО: Загружаем переменные из .env ПЕРЕД началом работы
// Используем абсолютный путь для надежности
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 🔧 FIX: Use absolute path for .env file
// In production, .env is at /app/.env (copied by Dockerfile)
// In development, it's at project root
const envPath = process.env.ENV_PATH || join('/app', '.env');
console.log(`[DOTENV] Loading .env from: ${envPath}`);
config({ path: envPath });
// 🔍 DEBUG: Check environment variables after dotenv load
console.log('[DEBUG] Environment variables after dotenv:');
console.log('[DEBUG] TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('[DEBUG] TELEGRAM_BOT_ID:', process.env.TELEGRAM_BOT_ID ? 'SET' : 'NOT SET');
console.log('[DEBUG] POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
console.log('[DEBUG] OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
// Dynamic import using module URL resolution - works in both dev and production
const vibeeAgentsModulePath = new URL('../../../packages/vibee-agents/dist/src/index.js', import.meta.url).href;
console.log('[ENTRYPOINT] Loading vibee-agents from:', vibeeAgentsModulePath);
const { default: vibeeAgents } = await import(vibeeAgentsModulePath);
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
            console.error('\x1b[31m❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить секреты из Infisical!\x1b[0m');
            console.error('Ошибки:', secretsResult.errors.join(', '));
            console.error('\x1b[33m⚠️  Приложение продолжит работу, но могут возникнуть проблемы!\x1b[0m\n');
        }
        // Проверяем критичные секреты
        const missingCritical = Object.entries(secretsResult.criticalSecrets)
            .filter(([_, status]) => status === 'missing')
            .map(([key]) => key);
        if (missingCritical.length > 0) {
            console.log(`\x1b[33m⚠️  ВНИМАНИЕ: Критичные секреты не найдены: ${missingCritical.join(', ')}\x1b[0m`);
            console.log(`\x1b[33m⚠️  Приложение может не работать корректно!\x1b[0m\n`);
        }
        // Временно перенаправляем POSTGRES_URL на существующую базу "neondb"
        // чтобы избежать ошибки "database playra does not exist"
        if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('/playra?')) {
            process.env.POSTGRES_URL = process.env.POSTGRES_URL.replace('/playra?', '/neondb?');
            console.log('🔄 Временно перенаправляем на базу "neondb" для разработки');
        }
        // 🔧 Инициализация базы данных - создаем сервер по умолчанию
        const { initializeDatabase } = await import('./database-init.js');
        await initializeDatabase();
        // Ensure SERVER_PORT matches Fly.io PORT (default 4000)
        process.env.SERVER_PORT = process.env.PORT || '4000';
        // 🔧 FIX: Import AgentServer dynamically AFTER env vars are loaded
        const { AgentServer } = await import('./index.js');
        const server = new AgentServer();
        // 🔧 CRITICAL: Ensure default server exists before starting agents
        // This works with both PostgreSQL and PGLite
        console.log('[ENTRYPOINT] Ensuring default server exists in database...');
        try {
            const { ensureDefaultServerViaAdapter } = await import('./services/defaultServerCreator.js');
            await ensureDefaultServerViaAdapter(server);
            console.log('[ENTRYPOINT] ✅ Default server ensured');
        }
        catch (error) {
            console.error('[ENTRYPOINT] ⚠️  Failed to ensure default server:', error);
            console.error('[ENTRYPOINT] This may cause agent registration to fail!');
        }
        // 🔥 ЗАГРУЖАЕМ ВСЕХ АГЕНТОВ с плагинами!
        console.log('[ENTRYPOINT] 🚀 Loading agents with plugins:', vibeeAgents.agents.map(a => a.character.name));
        await server.start({
            agents: vibeeAgents.agents
        });
        // 🔐 Регистрируем дополнительные роуты ПОСЛЕ запуска сервера
        // Когда сервер запущен, server.app уже существует
        console.log('[ENTRYPOINT] Registering additional routes after server start...');
        console.log('[ENTRYPOINT] DIAGNOSTIC: server object type:', typeof server);
        console.log('[ENTRYPOINT] DIAGNOSTIC: server.app type:', typeof server.app);
        console.log('[ENTRYPOINT] DIAGNOSTIC: server.app exists:', server.app !== null && server.app !== undefined);
        console.log('[ENTRYPOINT] DIAGNOSTIC: server.app constructor:', server.app?.constructor?.name);
        try {
            if (server.app) {
                // 🔧 Роуты теперь регистрируются в API роутере (api/index.ts)
                // /api/debug-log - для логирования с клиента
                // /api/auth/telegram - для авторизации через Telegram
                console.log('✅ [ENTRYPOINT] All API routes are registered in the API router');
            }
            else {
                console.error('❌ [ENTRYPOINT] server.app still not available after start!');
            }
        }
        catch (middlewareError) {
            console.error('❌ Failed to register additional routes:', middlewareError);
        }
    }
    catch (error) {
        console.error('❌ Fatal error starting server:', error);
        process.exit(1);
    }
};
// Only start if this file is being run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}
export { start };
