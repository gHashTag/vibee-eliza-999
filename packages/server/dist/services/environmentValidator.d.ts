/**
 * Система валидации переменных окружения
 * Предотвращает ошибки конфигурации и обеспечивает корректную загрузку всех компонентов
 */
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    missingCritical: string[];
}
export declare class EnvironmentValidator {
    private static instance;
    private validationResults;
    private readonly envSpecs;
    private constructor();
    static getInstance(): EnvironmentValidator;
    /**
     * Валидация всех переменных окружения
     */
    validate(): ValidationResult;
    /**
     * Проверка подключения к Infisical
     */
    private checkInfisicalConnection;
    /**
     * Проверяет, может ли переменная быть загружена из Infisical
     */
    private canLoadFromInfisical;
    /**
     * Получить переменную с fallback
     */
    getVar(name: string, defaultValue?: string): string | undefined;
    /**
     * Получить обязательную переменную (выбросит ошибку если не найдена)
     */
    getRequiredVar(name: string): string;
    /**
     * Проверяет, все ли критические переменные загружены
     */
    areCriticalVarsLoaded(): boolean;
    /**
     * Получить детальный отчет о состоянии переменных
     */
    getDetailedReport(): string;
}
export declare const envValidator: EnvironmentValidator;
export {};
