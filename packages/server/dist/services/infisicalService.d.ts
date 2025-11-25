export interface UserSecret {
    key: string;
    value: string;
    updatedAt: string;
}
export interface UserSecrets {
    telegramId: string;
    secrets: UserSecret[];
}
/**
 * Сервис для работы с пользовательскими секретами через Infisical
 * Временно упрощенная реализация для совместимости сборки
 */
export declare class InfisicalService {
    private client;
    constructor();
    /**
     * Получить секреты пользователя по Telegram ID
     */
    getUserSecrets(telegramId: string, environment?: string): Promise<UserSecret[]>;
    /**
     * Получить конкретный секрет пользователя
     */
    getUserSecret(telegramId: string, secretName: string, environment?: string): Promise<string | null>;
    /**
     * Создать/обновить секрет пользователя
     */
    setUserSecret(telegramId: string, secretName: string, secretValue: string, environment?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Удалить секрет пользователя
     */
    deleteUserSecret(telegramId: string, secretName: string, environment?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Получить все пути секретов пользователя (для UI)
     */
    getUserSecretPaths(telegramId: string, environment?: string): Promise<UserSecret[]>;
}
