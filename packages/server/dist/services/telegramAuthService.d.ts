export interface TelegramUserData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}
/**
 * Сервис для аутентификации через Telegram
 */
export declare class TelegramAuthService {
    private botToken;
    private jwtSecret;
    constructor();
    /**
     * Верификация данных авторизации от Telegram
     */
    verifyTelegramAuth(userData: TelegramUserData): {
        valid: boolean;
        error?: string;
    };
    /**
     * Создать или найти пользователя
     */
    findOrCreateUser(telegramData: TelegramUserData): Promise<{
        id: number;
        telegramId: number;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        photoUrl: string | null;
    }>;
    /**
     * Создать JWT токен для пользователя
     */
    createJWTToken(user: {
        id: number;
        telegramId: number;
    }): string;
    /**
     * Проверить JWT токен
     */
    verifyJWTToken(token: string): {
        valid: boolean;
        payload?: any;
        error?: string;
    };
    /**
     * Создать сессию пользователя
     */
    createUserSession(userId: number, jwtToken: string, ipAddress?: string, userAgent?: string): Promise<{
        id: number;
        expiresAt: Date;
    }>;
    /**
     * Найти сессию по JWT токену
     */
    findSessionByToken(jwtToken: string): Promise<{
        id: number;
        jwt_token: string;
        expires_at: Date;
        user_id: number;
        users: {
            id: number;
            username: string | null;
            telegram_id: number;
            first_name: string | null;
            last_name: string | null;
            photo_url: string | null;
        };
    }>;
    /**
     * Удалить сессию (logout)
     */
    deleteSession(sessionId: number): Promise<void>;
    /**
     * Обновить время последнего использования сессии
     */
    updateSessionLastUsed(sessionId: number): Promise<void>;
    /**
     * Логирование доступа к секретам
     */
    logSecretAccess(userId: number, secretPath: string, action: 'read' | 'write' | 'delete', ipAddress?: string, userAgent?: string): Promise<void>;
}
