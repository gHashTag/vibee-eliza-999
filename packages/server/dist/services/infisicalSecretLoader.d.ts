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
export declare class InfisicalSecretLoader {
    private static instance;
    private loaded;
    private loadPromise;
    /**
     * Получить singleton экземпляр загрузчика
     */
    static getInstance(): InfisicalSecretLoader;
    /**
     * Загрузить секреты из Infisical Cloud
     *
     * @param config - Опциональная конфигурация (если не указана, берется из process.env)
     * @param forceReload - Принудительная перезагрузка (по умолчанию false - загружает только один раз)
     * @returns Результат загрузки секретов
     */
    loadSecrets(config?: Partial<InfisicalConfig>, forceReload?: boolean): Promise<SecretLoadResult>;
    /**
     * Внутренняя реализация загрузки секретов
     */
    private _loadSecretsInternal;
    /**
     * Получить конфигурацию Infisical из process.env или переданной конфигурации
     */
    private _getConfig;
    /**
     * Проверить, загружены ли секреты
     */
    isLoaded(): boolean;
    /**
     * Сбросить состояние загрузчика (для тестов)
     */
    reset(): void;
}
/**
 * Удобная функция для загрузки секретов (использует singleton)
 */
export declare function loadInfisicalSecrets(config?: Partial<InfisicalConfig>, forceReload?: boolean): Promise<SecretLoadResult>;
