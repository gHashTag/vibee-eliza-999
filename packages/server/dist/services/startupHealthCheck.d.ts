/**
 * Система проверки здоровья приложения при запуске
 * Предотвращает запуск с некорректной конфигурацией
 */
interface HealthCheckResult {
    status: 'healthy' | 'warning' | 'unhealthy';
    timestamp: string;
    checks: {
        environment: {
            status: 'ok' | 'warning' | 'error';
            message: string;
            details?: any;
        };
        database: {
            status: 'ok' | 'warning' | 'error';
            message: string;
            details?: any;
        };
        infisical: {
            status: 'ok' | 'warning' | 'error';
            message: string;
            details?: any;
        };
    };
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        warnings: number;
    };
}
export declare class StartupHealthCheck {
    private static instance;
    private healthResult;
    private constructor();
    static getInstance(): StartupHealthCheck;
    /**
     * Выполнить полную проверку здоровья приложения при запуске
     */
    performStartupChecks(): Promise<HealthCheckResult>;
    /**
     * Проверка переменных окружения
     */
    private checkEnvironment;
    /**
     * Проверка подключения к базе данных
     */
    private checkDatabase;
    /**
     * Проверка Infisical подключения
     */
    private checkInfisical;
    /**
     * Отображение результатов проверки
     */
    private displayResults;
    /**
     * Получить текущие результаты проверки
     */
    getHealthResult(): HealthCheckResult | null;
    /**
     * Проверить, можно ли запускать приложение
     */
    canStartApplication(): boolean;
    /**
     * Получить отчет в JSON формате
     */
    getHealthReport(): string;
}
export declare const startupHealthCheck: StartupHealthCheck;
export {};
