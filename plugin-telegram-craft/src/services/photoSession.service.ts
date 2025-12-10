/**
 * PhotoSessionService
 * Сервис для накопления фото между сообщениями
 *
 * Пользователь может отправить 1-14 фото, потом написать промпт
 * Все фото накапливаются в сессии и используются для генерации
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core'

/**
 * Логгер для PhotoSessionService
 */
const log = {
  info: (msg: string) => logger.info(`[PhotoSession] ${msg}`),
  warn: (msg: string) => logger.warn(`[PhotoSession] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[PhotoSession] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[PhotoSession] ${msg}`),
}

/**
 * Фото в сессии
 */
export interface SessionPhoto {
  /** Base64 data URL (data:image/jpeg;base64,...) */
  url: string
  /** Время добавления */
  addedAt: number
  /** ID сообщения с этим фото */
  messageId?: number
}

/**
 * Сессия накопления фото
 */
export interface PhotoSession {
  /** ID чата */
  chatId: string
  /** ID пользователя */
  userId: string
  /** Накопленные фото */
  photos: SessionPhoto[]
  /** Время создания сессии */
  createdAt: number
  /** Время истечения (TTL) */
  expiresAt: number
}

/** TTL сессии в миллисекундах (30 минут) */
const SESSION_TTL_MS = 30 * 60 * 1000

/** Максимум фото в сессии */
const MAX_PHOTOS = 14

/**
 * PhotoSessionService - накопление фото для генерации
 */
export class PhotoSessionService extends Service {
  static serviceType = 'photo-session'
  serviceType = 'photo-session'

  capabilityDescription = 'Накопление фото между сообщениями для генерации изображений'

  /** Карта сессий: ключ = `${chatId}:${userId}` */
  private sessions: Map<string, PhotoSession> = new Map()

  /** Интервал очистки истёкших сессий */
  private cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info('STATIC start() called')
    const instance = new PhotoSessionService()
    await instance.initialize(runtime)
    await instance.start()
    return instance
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info('STATIC stop() called')
    const instance = runtime.getService('photo-session') as PhotoSessionService
    if (instance) {
      await instance.stop()
    }
  }

  constructor() {
    super()
    log.debug('PhotoSessionService создан')
  }

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime
    log.info('PhotoSessionService инициализирован')
  }

  /**
   * Запуск сервиса
   */
  async start(): Promise<void> {
    // Запускаем периодическую очистку истёкших сессий (каждые 5 минут)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)

    log.info('PhotoSessionService запущен')
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.sessions.clear()
    log.info('PhotoSessionService остановлен')
  }

  /**
   * Генерация ключа сессии
   */
  private getSessionKey(chatId: string, userId: string): string {
    return `${chatId}:${userId}`
  }

  /**
   * Добавить фото в сессию
   * @returns количество фото в сессии после добавления
   */
  addPhoto(chatId: string, userId: string, photoUrl: string, messageId?: number): number {
    const key = this.getSessionKey(chatId, userId)
    const now = Date.now()

    let session = this.sessions.get(key)

    // Создаём новую сессию если нет или истекла
    if (!session || session.expiresAt < now) {
      session = {
        chatId,
        userId,
        photos: [],
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS,
      }
      this.sessions.set(key, session)
      log.debug(`Создана новая сессия для ${key}`)
    }

    // Проверяем лимит
    if (session.photos.length >= MAX_PHOTOS) {
      log.warn(`Сессия ${key} достигла лимита ${MAX_PHOTOS} фото`)
      return session.photos.length
    }

    // Добавляем фото
    session.photos.push({
      url: photoUrl,
      addedAt: now,
      messageId,
    })

    // Продлеваем TTL
    session.expiresAt = now + SESSION_TTL_MS

    log.info(`Добавлено фото в сессию ${key}: ${session.photos.length}/${MAX_PHOTOS}`)
    return session.photos.length
  }

  /**
   * Добавить несколько фото в сессию
   * @returns количество фото в сессии после добавления
   */
  addPhotos(chatId: string, userId: string, photoUrls: string[], messageId?: number): number {
    let count = 0
    for (const url of photoUrls) {
      count = this.addPhoto(chatId, userId, url, messageId)
      if (count >= MAX_PHOTOS) break
    }
    return count
  }

  /**
   * Получить фото из сессии
   */
  getPhotos(chatId: string, userId: string): string[] {
    const key = this.getSessionKey(chatId, userId)
    const session = this.sessions.get(key)

    if (!session) {
      return []
    }

    // Проверяем не истекла ли сессия
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(key)
      return []
    }

    return session.photos.map(p => p.url)
  }

  /**
   * Проверить есть ли фото в сессии
   */
  hasPhotos(chatId: string, userId: string): boolean {
    return this.getPhotos(chatId, userId).length > 0
  }

  /**
   * Получить информацию о сессии
   */
  getSessionInfo(chatId: string, userId: string): { count: number; ttl: number; maxPhotos: number } | null {
    const key = this.getSessionKey(chatId, userId)
    const session = this.sessions.get(key)

    if (!session) {
      return null
    }

    const now = Date.now()
    if (session.expiresAt < now) {
      this.sessions.delete(key)
      return null
    }

    return {
      count: session.photos.length,
      ttl: Math.round((session.expiresAt - now) / 1000), // в секундах
      maxPhotos: MAX_PHOTOS,
    }
  }

  /**
   * Очистить сессию (после использования фото)
   */
  clearSession(chatId: string, userId: string): void {
    const key = this.getSessionKey(chatId, userId)
    this.sessions.delete(key)
    log.info(`Сессия ${key} очищена`)
  }

  /**
   * Очистка истёкших сессий
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      log.info(`Очищено ${cleaned} истёкших сессий`)
    }
  }

  /**
   * Получить ВСЕ фото из чата (от всех пользователей)
   * Для групповых сессий где фото кидают разные участники
   */
  getAllPhotosFromChat(chatId: string): { photos: string[]; userIds: string[] } {
    const photos: string[] = []
    const userIds: string[] = []
    const now = Date.now()

    for (const [key, session] of this.sessions.entries()) {
      // Ключ формата: chatId:userId
      if (key.startsWith(`${chatId}:`)) {
        // Проверяем не истекла ли сессия
        if (session.expiresAt >= now) {
          photos.push(...session.photos.map(p => p.url))
          userIds.push(session.userId)
        }
      }
    }

    log.info(`getAllPhotosFromChat(${chatId}): ${photos.length} фото от ${userIds.length} пользователей`)
    return { photos, userIds }
  }

  /**
   * Проверить есть ли фото в чате (от любого пользователя)
   */
  hasAnyPhotosInChat(chatId: string): boolean {
    const { photos } = this.getAllPhotosFromChat(chatId)
    return photos.length > 0
  }

  /**
   * Очистить ВСЕ сессии чата (после групповой генерации)
   */
  clearAllSessionsInChat(chatId: string): void {
    const now = Date.now()
    let cleared = 0

    for (const [key] of this.sessions.entries()) {
      if (key.startsWith(`${chatId}:`)) {
        this.sessions.delete(key)
        cleared++
      }
    }

    log.info(`Очищено ${cleared} сессий в чате ${chatId}`)
  }

  /**
   * Статистика
   */
  getStats(): { activeSessions: number; totalPhotos: number } {
    let totalPhotos = 0
    for (const session of this.sessions.values()) {
      totalPhotos += session.photos.length
    }

    return {
      activeSessions: this.sessions.size,
      totalPhotos,
    }
  }
}

export default PhotoSessionService
