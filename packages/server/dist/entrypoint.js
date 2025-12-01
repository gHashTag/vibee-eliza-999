/**
 * Safe entry point that wraps server initialization in error handling
 *
 * ⚠️ ВАЖНО: Использует централизованный сервис загрузки секретов
 * @see packages/server/src/services/infisicalSecretLoader.ts
 */
import { createRequire } from 'module';
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
const envPath = join(__dirname, '../../../.env');
console.log(`[DOTENV] Loading .env from: ${envPath}`);
config({ path: envPath });
// 🔍 DEBUG: Check environment variables after dotenv load
console.log('[DEBUG] Environment variables after dotenv:');
console.log('[DEBUG] TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('[DEBUG] TELEGRAM_BOT_ID:', process.env.TELEGRAM_BOT_ID ? 'SET' : 'NOT SET');
console.log('[DEBUG] POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
console.log('[DEBUG] OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
const require = createRequire(import.meta.url);
// Use require to load from compiled JS file to avoid TypeScript rootDir issues
const { vibeeAgent } = require('../../../packages/vibee-agents/dist/src/index.js');
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
        const { AgentServer } = require('./index.js');
        const server = new AgentServer();
        // 🔐 Добавляем роут для Telegram Login Widget ПОСЛЕ создания сервера
        // Это нужно делать ДО await server.start(), но ПОСЛЕ new AgentServer()
        try {
            // Проверяем, что server.app существует (должен быть создан в конструкторе или initializeServer)
            if (server.app) {
                // Добавляем middleware для /api/auth/telegram
                server.app.post('/api/auth/telegram', (req, res) => {
                    console.log('🔐 Telegram auth request:', req.body);
                    res.status(200).json({
                        ok: true,
                        user: req.body
                    });
                    console.log('✅ Telegram auth response sent');
                });
                console.log('✅ Registered: POST /api/auth/telegram');
            }
        }
        catch (middlewareError) {
            console.error('❌ Failed to register Telegram auth route:', middlewareError);
        }
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
        // ВРЕМЕННО: Отключаем агентов для тестирования логина
        // Из-за проблем с PGLite и отсутствующими таблицами
        console.log('[ENTRYPOINT] ⚠️  Skipping agent registration (temporary for login testing)');
        await server.start({
            agents: []
        });
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
