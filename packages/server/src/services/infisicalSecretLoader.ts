/**
 * 🕉️ ЦЕНТРАЛИЗОВАННЫЙ СЕРВИС ЗАГРУЗКИ СЕКРЕТОВ ИЗ INFISICAL CLOUD
 *
 * ⚠️ КРИТИЧЕСКИ ВАЖНО: Этот сервис должен быть ЕДИНСТВЕННЫМ местом загрузки секретов!
 *
 * Правила использования:
 * 1. ВСЕГДА используйте этот сервис для загрузки секретов
 * 2. НИКОГДА не создавайте дублирующие функции загрузки секретов
 * 3. Вызывайте loadSecrets() ОДИН РАЗ при старте приложения
 * 4. После загрузки секреты доступны через process.env
 */

export interface InfisicalConfig {
    clientId: string;
    clientSecret: string;
    projectId: string;
    environment: string;
    siteUrl?: string;
}

export interface SecretLoadResult {
    success: boolean;
    secretsLoaded: number;
    errors: string[];
    criticalSecrets: {
        [key: string]: 'loaded' | 'missing' | 'error';
    };
}

/**
 * Централизованный сервис для загрузки секретов из Infisical Cloud
 *
 * Использование:
 * ```typescript
 * import { InfisicalSecretLoader } from './services/infisicalSecretLoader';
 *
 * const loader = new InfisicalSecretLoader();
 * const result = await loader.loadSecrets();
 *
 * if (!result.success) {
 *   console.error('Failed to load secrets:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export class InfisicalSecretLoader {
    private static instance: InfisicalSecretLoader;
    private loaded: boolean = false;
    private loadPromise: Promise<SecretLoadResult> | null = null;

    /**
     * Получить singleton экземпляр загрузчика
     */
    static getInstance(): InfisicalSecretLoader {
        if (!InfisicalSecretLoader.instance) {
            InfisicalSecretLoader.instance = new InfisicalSecretLoader();
        }
        return InfisicalSecretLoader.instance;
    }

    /**
     * Загрузить секреты из Infisical Cloud
     *
     * @param config - Опциональная конфигурация (если не указана, берется из process.env)
     * @param forceReload - Принудительная перезагрузка (по умолчанию false - загружает только один раз)
     * @returns Результат загрузки секретов
     */
    async loadSecrets(config?: Partial<InfisicalConfig>, forceReload?: boolean): Promise<SecretLoadResult> {
        if (this.loaded && !forceReload) {
            return {
                success: true,
                secretsLoaded: 0,
                errors: [],
                criticalSecrets: {}
            };
        }

        if (this.loadPromise && !forceReload) {
            return this.loadPromise;
        }

        this.loadPromise = this._loadSecretsInternal(config);
        const result = await this.loadPromise;
        this.loaded = true;
        return result;
    }

    /**
     * Внутренняя реализация загрузки секретов
     */
    private async _loadSecretsInternal(config?: Partial<InfisicalConfig>): Promise<SecretLoadResult> {
        const finalConfig = this._getConfig(config);
        const errors: string[] = [];
        let secretsLoaded = 0;

        try {
            // Check if Infisical is configured
            if (!finalConfig.clientId || !finalConfig.clientSecret || !finalConfig.projectId) {
                errors.push('Infisical configuration incomplete. Using environment variables directly.');
                return this._loadFromEnv();
            }

            // Load secrets from Infisical Cloud
            console.log('[INFISICAL] Loading secrets from Infisical Cloud...');
            console.log(`[INFISICAL] Project: ${finalConfig.projectId}, Environment: ${finalConfig.environment}`);

            const secrets = await this._fetchSecretsFromInfisical(finalConfig);
            secretsLoaded = secrets.size;

            // Set secrets to process.env
            for (const [key, value] of secrets.entries()) {
                process.env[key] = value;
            }

            console.log(`[INFISICAL] ✅ Loaded ${secretsLoaded} secrets from Infisical`);

            return {
                success: true,
                secretsLoaded,
                errors,
                criticalSecrets: {
                    TELEGRAM_BOT_TOKEN: secrets.has('TELEGRAM_BOT_TOKEN') ? 'loaded' : 'missing',
                    OPENROUTER_API_KEY: secrets.has('OPENROUTER_API_KEY') ? 'loaded' : 'missing',
                    POSTGRES_URL: secrets.has('POSTGRES_URL') ? 'loaded' : 'missing'
                }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Error loading secrets from Infisical: ${errorMessage}`);
            console.error('[INFISICAL] ❌ Failed to load secrets from Infisical:', error);
            console.log('[INFISICAL] 🔄 Falling back to environment variables...');

            // Fallback to environment variables
            return this._loadFromEnv();
        }
    }

    /**
     * Загрузка секретов из локальных переменных окружения
     */
    private _loadFromEnv(): SecretLoadResult {
        console.log('[INFISICAL] Loading secrets from environment variables...');

        const envVars = [
            'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_BOT_ID',
            'OPENROUTER_API_KEY',
            'FAL_KEY',
            'SECRET_SALT',
            'POSTGRES_URL',
            'DATABASE_URL'
        ];

        let secretsLoaded = 0;
        const secrets = new Map<string, string>();

        for (const key of envVars) {
            const value = process.env[key];
            if (value && value.trim() !== '' && !value.includes('your_')) {
                secrets.set(key, value);
                secretsLoaded++;
                console.log(`[ENV] ✅ Loaded ${key}`);
            } else if (value && value.includes('your_')) {
                console.log(`[ENV] ⚠️  Skipping ${key} (placeholder value)`);
            }
        }

        // Set to process.env
        for (const [key, value] of secrets.entries()) {
            process.env[key] = value;
        }

        console.log(`[ENV] ✅ Loaded ${secretsLoaded} secrets from environment`);

        return {
            success: secretsLoaded > 0,
            secretsLoaded,
            errors: [],
            criticalSecrets: {
                TELEGRAM_BOT_TOKEN: secrets.has('TELEGRAM_BOT_TOKEN') ? 'loaded' : 'missing',
                OPENROUTER_API_KEY: secrets.has('OPENROUTER_API_KEY') ? 'loaded' : 'missing',
                POSTGRES_URL: secrets.has('POSTGRES_URL') ? 'loaded' : (process.env.POSTGRES_URL ? 'loaded' : 'missing')
            }
        };
    }

    /**
     * Fetch secrets from Infisical Cloud API
     */
    private async _fetchSecretsFromInfisical(config: InfisicalConfig): Promise<Map<string, string>> {
        const secrets = new Map<string, string>();

        try {
            // Get access token
            const tokenResponse = await fetch('https://api.infisical.com/api/v2/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: config.clientId,
                    clientSecret: config.clientSecret,
                    token: 'infisical-pat', // Using PAT authentication
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.accessToken;

            if (!accessToken) {
                throw new Error('No access token received from Infisical');
            }

            // Fetch secrets
            const secretsResponse = await fetch(`https://api.infisical.com/api/v2/secrets?environmentId=${config.projectId}&environment=${config.environment}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!secretsResponse.ok) {
                throw new Error(`Failed to fetch secrets: ${secretsResponse.statusText}`);
            }

            const secretsData = await secretsResponse.json();
            const secretList = secretsData.secrets || [];

            // Process secrets
            for (const secret of secretList) {
                if (secret.key && secret.value !== undefined) {
                    secrets.set(secret.key, secret.value);
                }
            }

            return secrets;
        } catch (error) {
            console.error('[INFISICAL] API Error:', error);
            throw error;
        }
    }

    /**
     * Получить конфигурацию Infisical из process.env или переданной конфигурации
     */
    private _getConfig(config?: Partial<InfisicalConfig>): InfisicalConfig {
        return {
            clientId: config?.clientId || process.env.INFISICAL_CLIENT_ID || '',
            clientSecret: config?.clientSecret || process.env.INFISICAL_CLIENT_SECRET || '',
            projectId: config?.projectId || process.env.INFISICAL_PROJECT_ID || '',
            environment: config?.environment || process.env.INFISICAL_ENVIRONMENT || 'dev',
            siteUrl: config?.siteUrl || 'https://app.infisical.com'
        };
    }

    /**
     * Проверить, загружены ли секреты
     */
    isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Сбросить состояние загрузчика (для тестов)
     */
    reset(): void {
        this.loaded = false;
        this.loadPromise = null;
    }
}

/**
 * Удобная функция для загрузки секретов (использует singleton)
 */
export async function loadInfisicalSecrets(config?: Partial<InfisicalConfig>, forceReload?: boolean): Promise<SecretLoadResult> {
    return InfisicalSecretLoader.getInstance().loadSecrets(config, forceReload);
}