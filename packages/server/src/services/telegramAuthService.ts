import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db, usersTable, userSessionsTable, secretAccessLogsTable } from './drizzle';
import { eq } from 'drizzle-orm';

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
export class TelegramAuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.SECRET_SALT || crypto.randomBytes(64).toString('hex');

    // botToken получаем динамически из process.env, который заполняется из Infisical
    const botToken = this.getBotToken();
    if (!botToken) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Telegram auth will not work!');
    }
  }

  /**
   * Получить bot token из переменных окружения (загружается из Infisical при старте)
   */
  private getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  /**
   * Верификация данных авторизации от Telegram
   */
  verifyTelegramAuth(userData: TelegramUserData): { valid: boolean; error?: string } {
    // 1. Проверяем auth_date (не старше 24 часов)
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 часа

    if (now - userData.auth_date > maxAge) {
      return { valid: false, error: 'Auth data expired' };
    }

    // 2. Получаем bot token из переменных окружения (загружен из Infisical)
    const botToken = this.getBotToken();
    if (!botToken) {
      return { valid: false, error: 'Bot token not configured' };
    }

    // 3. Проверяем hash
    const { hash, ...data } = userData;

    const dataCheckString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key as keyof TelegramUserData]}`)
      .join('\n');

    // Создаем secret_key как SHA256 от bot_token
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();

    // Вычисляем HMAC-SHA256
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем с полученным hash
    if (computedHash !== userData.hash) {
      return { valid: false, error: 'Invalid hash' };
    }

    return { valid: true };
  }

  /**
   * Создать или найти пользователя
   */
  async findOrCreateUser(telegramData: TelegramUserData) {
    // Ищем пользователя
    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.telegram_id, telegramData.id));

    let user = existingUsers[0];

    if (!user) {
      // Создаем нового пользователя
      const newUsers = await db
        .insert(usersTable)
        .values({
          telegram_id: telegramData.id,
          username: telegramData.username,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          photo_url: telegramData.photo_url,
        })
        .returning();

      user = newUsers[0];
    } else {
      // Обновляем данные пользователя
      const updatedUsers = await db
        .update(usersTable)
        .set({
          username: telegramData.username,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          photo_url: telegramData.photo_url,
          last_login_at: new Date(),
        })
        .where(eq(usersTable.id, user.id))
        .returning();

      user = updatedUsers[0];
    }

    return {
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
    };
  }

  /**
   * Создать JWT токен для пользователя
   */
  createJWTToken(user: { id: number; telegramId: number }): string {
    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId,
      },
      this.jwtSecret,
      { expiresIn: '30d' }
    );

    return token;
  }

  /**
   * Проверить JWT токен
   */
  verifyJWTToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      return { valid: true, payload };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Создать сессию пользователя
   */
  async createUserSession(
    userId: number,
    jwtToken: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // JWT токен истекает через 30 дней
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sessions = await db
      .insert(userSessionsTable)
      .values({
        user_id: userId,
        jwt_token: jwtToken,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .returning();

    return {
      id: sessions[0].id,
      expiresAt: sessions[0].expires_at,
    };
  }

  /**
   * Найти сессию по JWT токену
   */
  async findSessionByToken(jwtToken: string) {
    const sessions = await db
      .select({
        id: userSessionsTable.id,
        jwt_token: userSessionsTable.jwt_token,
        expires_at: userSessionsTable.expires_at,
        user_id: userSessionsTable.user_id,
        users: {
          id: usersTable.id,
          telegram_id: usersTable.telegram_id,
          username: usersTable.username,
          first_name: usersTable.first_name,
          last_name: usersTable.last_name,
          photo_url: usersTable.photo_url,
        }
      })
      .from(userSessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, userSessionsTable.user_id))
      .where(eq(userSessionsTable.jwt_token, jwtToken));

    return sessions[0] || null;
  }

  /**
   * Удалить сессию (logout)
   */
  async deleteSession(sessionId: number): Promise<void> {
    await db
      .delete(userSessionsTable)
      .where(eq(userSessionsTable.id, sessionId));
  }

  /**
   * Обновить время последнего использования сессии
   */
  async updateSessionLastUsed(sessionId: number): Promise<void> {
    await db
      .update(userSessionsTable)
      .set({ last_used_at: new Date() })
      .where(eq(userSessionsTable.id, sessionId));
  }

  /**
   * Логирование доступа к секретам
   */
  async logSecretAccess(
    userId: number,
    secretPath: string,
    action: 'read' | 'write' | 'delete',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await db
      .insert(secretAccessLogsTable)
      .values({
        user_id: userId,
        secret_path: secretPath,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
  }
}
