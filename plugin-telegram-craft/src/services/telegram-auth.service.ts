// @ts-nocheck
/**
 * Telegram Auth Service
 *
 * Сервис для авторизации пользователей через GramJS MTProto
 * Позволяет пользователям привязать свой Telegram аккаунт к боту
 */

import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { eq, and, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import {
  telegramUserAccounts,
  telegramAuthSessions,
  type TelegramAuthState,
  type TelegramUserAccountRecord,
} from '../db/schema'

/**
 * Результат операции авторизации
 */
export interface AuthResult {
  success: boolean
  error?: string
  requiresCode?: boolean
  requires2FA?: boolean
  sessionString?: string
  attemptsLeft?: number
  user?: {
    id: string
    firstName?: string
    lastName?: string
    username?: string
    phone?: string
  }
}

/**
 * Статус авторизации
 */
export interface AuthStatus {
  state: TelegramAuthState | null
  phone?: string
}

/**
 * Auth State type alias
 */
export type AuthState = 'pending_code' | 'pending_2fa' | 'completed' | 'expired' | 'failed'

/**
 * Pending auth data (в памяти для GramJS клиентов)
 */
interface PendingAuth {
  client: TelegramClient
  phone: string
  phoneCodeHash: string
  createdAt: number
  attempts: number
}

/**
 * Telegram Auth Service
 *
 * Управляет процессом авторизации пользователей:
 * 1. requestCode(chatId, phone) - отправляет код
 * 2. verifyCode(chatId, userId, code) - проверяет код
 * 3. verify2FA(chatId, userId, password) - проверяет 2FA
 */
export class TelegramAuthService {
  private db: ReturnType<typeof drizzle> | null = null

  // In-memory storage для активных GramJS клиентов (не сериализуются в БД)
  private pendingAuths: Map<string, PendingAuth> = new Map()

  // Credentials
  private apiId: number
  private apiHash: string

  // Timeout для сессий авторизации (5 минут)
  private readonly AUTH_TIMEOUT_MS = 5 * 60 * 1000
  private readonly MAX_CODE_ATTEMPTS = 3

  constructor(apiId: number, apiHash: string, databaseUrl?: string) {
    this.apiId = apiId
    this.apiHash = apiHash

    // Инициализируем БД если URL предоставлен
    if (databaseUrl) {
      try {
        const pool = new Pool({ connectionString: databaseUrl })
        this.db = drizzle(pool)
        console.log('[TelegramAuthService] Database connected')
      } catch (error) {
        console.warn('[TelegramAuthService] Failed to connect to database:', error)
      }
    }

    console.log('[TelegramAuthService] Initialized')
  }

  /**
   * Шаг 1: Запрос кода авторизации
   * Пользователь вводит номер телефона, Telegram отправляет код
   */
  async requestCode(chatId: string, phone: string): Promise<AuthResult> {
    try {
      console.log(`[TelegramAuth] Requesting code for phone: ${phone.substring(0, 5)}***, chatId: ${chatId}`)

      // Валидация номера
      const normalizedPhone = phone.replace(/[^+0-9]/g, '')
      if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
        return {
          success: false,
          error: 'Неверный формат номера телефона. Используй формат +79991234567',
        }
      }

      // Закрываем старую сессию если есть
      const existingAuth = this.pendingAuths.get(chatId)
      if (existingAuth) {
        try {
          await existingAuth.client.disconnect()
        } catch (e) {
          // ignore
        }
        this.pendingAuths.delete(chatId)
      }

      // Создаём новый GramJS клиент
      const session = new StringSession('')
      const client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      })

      await client.connect()

      // Запрашиваем код
      const result = await client.sendCode(
        { apiId: this.apiId, apiHash: this.apiHash },
        normalizedPhone
      )

      // Сохраняем pending auth в память
      this.pendingAuths.set(chatId, {
        client,
        phone: normalizedPhone,
        phoneCodeHash: result.phoneCodeHash,
        createdAt: Date.now(),
        attempts: 0,
      })

      // Сохраняем сессию в БД
      if (this.db) {
        const expiresAt = new Date(Date.now() + this.AUTH_TIMEOUT_MS)
        try {
          // Сначала удаляем старую сессию
          await this.db.delete(telegramAuthSessions)
            .where(eq(telegramAuthSessions.chatId, chatId))

          // Создаём новую
          await this.db.insert(telegramAuthSessions).values({
            chatId,
            phone: normalizedPhone,
            phoneCodeHash: result.phoneCodeHash,
            authState: 'pending_code',
            codeAttempts: 0,
            expiresAt,
          })
        } catch (dbError) {
          console.warn('[TelegramAuth] DB error (non-critical):', dbError)
        }
      }

      console.log(`[TelegramAuth] Code sent to ${normalizedPhone.substring(0, 5)}***`)

      return {
        success: true,
        requiresCode: true,
      }
    } catch (error: any) {
      console.error('[TelegramAuth] Error requesting code:', error)

      if (error.message?.includes('PHONE_NUMBER_INVALID')) {
        return {
          success: false,
          error: 'Неверный номер телефона. Проверь и попробуй снова.',
        }
      }

      if (error.message?.includes('PHONE_NUMBER_BANNED')) {
        return {
          success: false,
          error: 'Этот номер заблокирован в Telegram.',
        }
      }

      if (error.message?.includes('FLOOD')) {
        return {
          success: false,
          error: 'Слишком много попыток. Подожди несколько минут.',
        }
      }

      return {
        success: false,
        error: `Ошибка: ${error.message}`,
      }
    }
  }

  /**
   * Шаг 2: Проверка кода
   * Пользователь вводит код из SMS/Telegram
   */
  async verifyCode(chatId: string, userId: string, code: string): Promise<AuthResult> {
    try {
      console.log(`[TelegramAuth] Verifying code for chatId: ${chatId}`)

      const pendingAuth = this.pendingAuths.get(chatId)
      if (!pendingAuth) {
        return {
          success: false,
          error: 'Сессия авторизации не найдена или истекла. Начни заново.',
        }
      }

      // Проверяем timeout
      if (Date.now() - pendingAuth.createdAt > this.AUTH_TIMEOUT_MS) {
        this.pendingAuths.delete(chatId)
        try {
          await pendingAuth.client.disconnect()
        } catch (e) {
          // ignore
        }
        return {
          success: false,
          error: 'Сессия авторизации истекла. Начни заново.',
        }
      }

      // Проверяем количество попыток
      if (pendingAuth.attempts >= this.MAX_CODE_ATTEMPTS) {
        this.pendingAuths.delete(chatId)
        try {
          await pendingAuth.client.disconnect()
        } catch (e) {
          // ignore
        }
        return {
          success: false,
          error: 'Превышено количество попыток. Начни заново.',
          attemptsLeft: 0,
        }
      }

      // Нормализуем код
      const normalizedCode = code.replace(/[^0-9]/g, '')
      if (normalizedCode.length !== 5) {
        pendingAuth.attempts++
        return {
          success: false,
          error: 'Код должен состоять из 5 цифр.',
          attemptsLeft: this.MAX_CODE_ATTEMPTS - pendingAuth.attempts,
        }
      }

      try {
        // Пробуем авторизоваться с кодом
        await pendingAuth.client.invoke(
          new Api.auth.SignIn({
            phoneNumber: pendingAuth.phone,
            phoneCodeHash: pendingAuth.phoneCodeHash,
            phoneCode: normalizedCode,
          })
        )

        // Успех! Получаем информацию о пользователе
        const me = await pendingAuth.client.getMe()
        const sessionString = pendingAuth.client.session.save() as string

        // Сохраняем в БД
        await this.saveUserAccount(chatId, userId, {
          telegramUserId: me.id.toString(),
          phone: pendingAuth.phone,
          sessionString,
          firstName: me.firstName,
          lastName: me.lastName || undefined,
          username: me.username || undefined,
        })

        // Очищаем pending auth (но НЕ отключаем клиент - он может понадобиться)
        this.pendingAuths.delete(chatId)

        console.log(`[TelegramAuth] User ${me.id} authorized successfully`)

        return {
          success: true,
          sessionString,
          user: {
            id: me.id.toString(),
            firstName: me.firstName,
            lastName: me.lastName || undefined,
            username: me.username || undefined,
            phone: pendingAuth.phone,
          },
        }
      } catch (error: any) {
        // Проверяем нужна ли 2FA
        if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
          // Обновляем состояние в БД
          if (this.db) {
            try {
              await this.db.update(telegramAuthSessions)
                .set({ authState: 'pending_2fa' })
                .where(eq(telegramAuthSessions.chatId, chatId))
            } catch (e) {
              // ignore
            }
          }

          return {
            success: true, // Не ошибка, просто нужен следующий шаг
            requires2FA: true,
          }
        }

        if (error.message?.includes('PHONE_CODE_INVALID')) {
          pendingAuth.attempts++

          // Обновляем в БД
          if (this.db) {
            try {
              await this.db.update(telegramAuthSessions)
                .set({ codeAttempts: pendingAuth.attempts })
                .where(eq(telegramAuthSessions.chatId, chatId))
            } catch (e) {
              // ignore
            }
          }

          const attemptsLeft = this.MAX_CODE_ATTEMPTS - pendingAuth.attempts
          if (attemptsLeft <= 0) {
            this.pendingAuths.delete(chatId)
            try {
              await pendingAuth.client.disconnect()
            } catch (e) {
              // ignore
            }
            return {
              success: false,
              error: 'Превышено количество попыток. Начни заново.',
              attemptsLeft: 0,
            }
          }

          return {
            success: false,
            error: 'Неверный код.',
            attemptsLeft,
          }
        }

        if (error.message?.includes('PHONE_CODE_EXPIRED')) {
          this.pendingAuths.delete(chatId)
          return {
            success: false,
            error: 'Код истёк. Начни заново.',
          }
        }

        throw error
      }
    } catch (error: any) {
      console.error('[TelegramAuth] Error verifying code:', error)
      return {
        success: false,
        error: `Ошибка: ${error.message}`,
      }
    }
  }

  /**
   * Шаг 3: Проверка 2FA пароля
   */
  async verify2FA(chatId: string, userId: string, password: string): Promise<AuthResult> {
    try {
      console.log(`[TelegramAuth] Verifying 2FA for chatId: ${chatId}`)

      const pendingAuth = this.pendingAuths.get(chatId)
      if (!pendingAuth) {
        return {
          success: false,
          error: 'Сессия авторизации не найдена. Начни заново.',
        }
      }

      // Получаем информацию о 2FA
      const passwordInfo = await pendingAuth.client.invoke(new Api.account.GetPassword())

      // Проверяем пароль
      await pendingAuth.client.invoke(
        new Api.auth.CheckPassword({
          password: await pendingAuth.client.computePassword(passwordInfo, password),
        })
      )

      // Успех!
      const me = await pendingAuth.client.getMe()
      const sessionString = pendingAuth.client.session.save() as string

      // Сохраняем в БД
      await this.saveUserAccount(chatId, userId, {
        telegramUserId: me.id.toString(),
        phone: pendingAuth.phone,
        sessionString,
        firstName: me.firstName,
        lastName: me.lastName || undefined,
        username: me.username || undefined,
      })

      // Очищаем pending auth
      this.pendingAuths.delete(chatId)

      console.log(`[TelegramAuth] User ${me.id} authorized with 2FA`)

      return {
        success: true,
        sessionString,
        user: {
          id: me.id.toString(),
          firstName: me.firstName,
          lastName: me.lastName || undefined,
          username: me.username || undefined,
          phone: pendingAuth.phone,
        },
      }
    } catch (error: any) {
      console.error('[TelegramAuth] Error verifying 2FA:', error)

      if (error.message?.includes('PASSWORD_HASH_INVALID')) {
        return {
          success: false,
          error: 'Неверный пароль 2FA.',
          requires2FA: true,
        }
      }

      return {
        success: false,
        error: `Ошибка: ${error.message}`,
      }
    }
  }

  /**
   * Сохранение аккаунта пользователя в БД
   */
  private async saveUserAccount(chatId: string, elizaUserId: string, data: {
    telegramUserId: string
    phone: string
    sessionString: string
    firstName?: string
    lastName?: string
    username?: string
  }): Promise<void> {
    if (!this.db) {
      console.warn('[TelegramAuth] No database connection, skipping save')
      return
    }

    try {
      // Проверяем существует ли аккаунт
      const existing = await this.db.select()
        .from(telegramUserAccounts)
        .where(eq(telegramUserAccounts.telegramUserId, data.telegramUserId))
        .limit(1)

      if (existing.length > 0) {
        // Обновляем существующий
        await this.db.update(telegramUserAccounts)
          .set({
            elizaUserId,
            chatId,
            sessionString: data.sessionString,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            isActive: true,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(telegramUserAccounts.telegramUserId, data.telegramUserId))
      } else {
        // Создаём новый
        await this.db.insert(telegramUserAccounts).values({
          telegramUserId: data.telegramUserId,
          elizaUserId,
          chatId,
          phone: data.phone,
          sessionString: data.sessionString,  // TODO: зашифровать
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          isActive: true,
          lastUsedAt: new Date(),
        })
      }

      // Обновляем auth session как completed
      await this.db.update(telegramAuthSessions)
        .set({ authState: 'completed', telegramUserId: data.telegramUserId })
        .where(eq(telegramAuthSessions.chatId, chatId))

      console.log(`[TelegramAuth] User account saved for ${data.telegramUserId}`)
    } catch (error) {
      console.error('[TelegramAuth] Error saving user account:', error)
      throw error
    }
  }

  /**
   * Получение аккаунта пользователя по elizaUserId
   */
  async getUserAccount(elizaUserId: string): Promise<TelegramUserAccountRecord | null> {
    if (!this.db) return null

    try {
      const result = await this.db.select()
        .from(telegramUserAccounts)
        .where(and(
          eq(telegramUserAccounts.elizaUserId, elizaUserId),
          eq(telegramUserAccounts.isActive, true)
        ))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error('[TelegramAuth] Error getting user account:', error)
      return null
    }
  }

  /**
   * Деактивация аккаунта пользователя
   */
  async disconnectAccount(elizaUserId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'База данных недоступна' }
    }

    try {
      const result = await this.db.update(telegramUserAccounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(telegramUserAccounts.elizaUserId, elizaUserId))

      console.log(`[TelegramAuth] User ${elizaUserId} disconnected`)
      return { success: true }
    } catch (error: any) {
      console.error('[TelegramAuth] Error disconnecting account:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Проверка статуса авторизации для чата
   */
  async getAuthStatus(chatId: string): Promise<AuthStatus | null> {
    // Проверяем pending auth в памяти
    const pendingAuth = this.pendingAuths.get(chatId)
    if (pendingAuth) {
      // Проверяем не истекла ли сессия
      if (Date.now() - pendingAuth.createdAt > this.AUTH_TIMEOUT_MS) {
        this.pendingAuths.delete(chatId)
        try {
          await pendingAuth.client.disconnect()
        } catch (e) {
          // ignore
        }
        return null
      }

      return {
        state: 'pending_code',
        phone: pendingAuth.phone,
      }
    }

    // Проверяем в БД
    if (this.db) {
      try {
        const session = await this.db.select()
          .from(telegramAuthSessions)
          .where(and(
            eq(telegramAuthSessions.chatId, chatId),
            gt(telegramAuthSessions.expiresAt, new Date())
          ))
          .limit(1)

        if (session[0]) {
          return {
            state: session[0].authState as TelegramAuthState,
            phone: session[0].phone,
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return null
  }
}
