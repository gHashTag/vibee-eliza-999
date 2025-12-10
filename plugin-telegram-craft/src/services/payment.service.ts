// @ts-nocheck
/**
 * PaymentService
 * Сервис для работы с Telegram Payments (Telegram Stars)
 *
 * Поток оплаты:
 * 1. Бот отправляет фото с кнопкой "Хочу такое же! (50 Stars)"
 * 2. Пользователь нажимает → sendInvoice
 * 3. Telegram показывает нативный UI оплаты Stars
 * 4. pre_checkout_query → бот подтверждает
 * 5. successful_payment → бот генерирует персональное фото
 *
 * ВАЖНО: Telegram Payments работают ТОЛЬКО через Bot API, не MTProto!
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core'
import {
  BotApiAdapter,
  PreCheckoutQuery,
  SuccessfulPayment,
} from './adapters/botapi.adapter'

/**
 * Логгер для PaymentService
 */
const log = {
  info: (msg: string) => logger.info(`[PaymentService] ${msg}`),
  warn: (msg: string) => logger.warn(`[PaymentService] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[PaymentService] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[PaymentService] ${msg}`),
}

/**
 * Статус платежа
 */
export type PaymentStatus = 'pending' | 'confirmed' | 'completed' | 'failed' | 'refunded'

/**
 * Информация о платеже
 */
export interface PaymentInfo {
  id: string
  userId: string
  chatId: string
  amount: number
  currency: string
  status: PaymentStatus
  payload: string
  createdAt: Date
  completedAt?: Date
  metadata?: Record<string, unknown>
}

/**
 * Параметры инвойса
 */
export interface InvoiceParams {
  title: string
  description: string
  payload: string
  amount: number
  currency?: string // По умолчанию 'XTR' (Telegram Stars)
  providerToken?: string // Пусто для Telegram Stars
}

// Типы PreCheckoutQuery и SuccessfulPayment импортированы из botapi.adapter.ts
export type { PreCheckoutQuery, SuccessfulPayment } from './adapters/botapi.adapter'

/**
 * Цены на услуги в Telegram Stars
 */
export const PRICES = {
  /** Персональное AI-фото */
  PERSONAL_PHOTO: 50,
  /** Премиум фото (высокое разрешение) */
  PREMIUM_PHOTO: 100,
  /** Пакет 5 фото */
  PHOTO_PACK_5: 200,
  /** Пакет 10 фото */
  PHOTO_PACK_10: 350,
}

/**
 * Лимит бесплатных фото для freemium модели
 */
export const FREE_PHOTOS_LIMIT = 5

/**
 * PaymentService - обработка платежей через Telegram Stars
 */
export class PaymentService extends Service {
  static serviceType = 'payment'
  serviceType = 'payment'

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info('STATIC start() called')
    const instance = new PaymentService()
    await instance.initialize(runtime)
    await instance.start()
    return instance
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info('STATIC stop() called')
    const instance = runtime.getService('payment') as PaymentService
    if (instance) {
      await instance.stop()
    }
  }

  capabilityDescription = 'Telegram Payments через Telegram Stars (XTR)'

  /** Bot API адаптер для платежей */
  private botApi: BotApiAdapter | null = null

  /** Runtime агента */
  private runtime: IAgentRuntime | null = null

  /** Флаг инициализации */
  private isInitialized = false

  /** Кэш активных платежей (payload -> PaymentInfo) */
  private pendingPayments: Map<string, PaymentInfo> = new Map()

  /** Счётчик бесплатных фото (userId -> count) */
  private freePhotosUsed: Map<string, number> = new Map()

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      log.warn('Service already initialized')
      return
    }

    this.runtime = runtime

    // Получаем Bot Token из секретов
    const botToken =
      runtime.getSetting('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      log.error('TELEGRAM_BOT_TOKEN not found - payments disabled')
      throw new Error('TELEGRAM_BOT_TOKEN is required for PaymentService')
    }

    // Создаём Bot API адаптер для платежей
    this.botApi = new BotApiAdapter(botToken)

    // Проверяем подключение
    const connected = await this.botApi.connect()
    if (!connected) {
      log.error('Failed to connect Bot API adapter')
      throw new Error('Failed to connect to Telegram Bot API')
    }

    this.isInitialized = true
    log.info('Service initialized successfully')
  }

  /**
   * Запуск сервиса
   * NOTE: Bot API Long Polling ОТКЛЮЧЕН чтобы не конфликтовать с @elizaos/plugin-telegram
   * Крипто-платежи детектятся через MTProto в TelegramService.checkAndHandleCryptoPayment()
   * Stars платежи будут обрабатываться через webhook когда будет настроен
   */
  async start(): Promise<void> {
    // Регистрируем обработчики платежей (для прямых вызовов из TelegramService)
    if (this.botApi) {
      this.botApi.setPaymentHandlers({
        onPreCheckout: async (query: PreCheckoutQuery) => {
          await this.handlePreCheckout(query)
        },
        onSuccessfulPayment: async (chatId: number, payment: SuccessfulPayment) => {
          const paymentInfo = await this.handleSuccessfulPayment(chatId, payment)

          if (paymentInfo) {
            // Сброс счётчика бесплатных фото после успешной оплаты
            this.resetFreePhotos(paymentInfo.userId)

            // Запуск генерации персонального фото
            await this.triggerPhotoGeneration(paymentInfo)
          }
        },
      })

      // ОТКЛЮЧЕНО: Bot API polling конфликтует с @elizaos/plugin-telegram
      // Крипто-платежи детектятся через MTProto в TelegramService
      // this.botApi.startPaymentPolling().catch((err) => {
      //   log.error('Payment polling error', err)
      // })

      log.info('Service started (polling disabled - using MTProto for crypto detection)')
    } else {
      log.warn('Service started without BotApi - payments disabled')
    }
  }

  /**
   * Запуск генерации фото после успешной оплаты
   * @param paymentInfo - информация о платеже
   */
  private async triggerPhotoGeneration(paymentInfo: PaymentInfo): Promise<void> {
    try {
      // Импортируем ProactiveAvatarService для генерации фото
      // Используем динамический импорт чтобы избежать циклических зависимостей
      const { ProactiveAvatarService } = await import('./proactiveAvatar.service')

      if (this.runtime) {
        const proactiveService = this.runtime.getService<ProactiveAvatarService>('proactive-avatar')

        if (proactiveService) {
          log.info(`Triggering photo generation for user ${paymentInfo.userId} after payment`)

          // Запускаем генерацию для оплатившего пользователя
          // chatId берём из paymentInfo
          const chatId = paymentInfo.metadata?.chatId as string || paymentInfo.chatId

          // Вызываем метод генерации для конкретного пользователя (если есть)
          if (typeof proactiveService.generateForPaidUser === 'function') {
            await proactiveService.generateForPaidUser(chatId, paymentInfo.userId)
          } else {
            log.warn('ProactiveAvatarService.generateForPaidUser not implemented yet')
            // TODO: Добавить метод generateForPaidUser в ProactiveAvatarService
          }
        } else {
          log.warn('ProactiveAvatarService not found - cannot generate photo after payment')
        }
      }
    } catch (error) {
      log.error('Failed to trigger photo generation', error)
    }
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    // Останавливаем Long Polling
    if (this.botApi) {
      this.botApi.stopPaymentPolling()
      await this.botApi.disconnect()
    }
    this.botApi = null
    this.isInitialized = false
    this.pendingPayments.clear()
    log.info('Service stopped')
  }

  /**
   * Создать инвойс для покупки персонального фото
   * @param chatId - ID чата (только личные чаты!)
   * @param userId - ID пользователя
   * @param amount - Сумма в Stars (по умолчанию 50)
   * @param metadata - Дополнительные данные (для генерации фото после оплаты)
   */
  async createPhotoInvoice(
    chatId: string | number,
    userId: string,
    amount: number = PRICES.PERSONAL_PHOTO,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.botApi) {
      return { success: false, error: 'Payment service not initialized' }
    }

    try {
      // Генерируем уникальный payload
      const payload = `photo_${userId}_${Date.now()}`

      // Сохраняем информацию о платеже
      const paymentInfo: PaymentInfo = {
        id: payload,
        userId,
        chatId: String(chatId),
        amount,
        currency: 'XTR',
        status: 'pending',
        payload,
        createdAt: new Date(),
        metadata,
      }
      this.pendingPayments.set(payload, paymentInfo)

      // Отправляем инвойс
      const result = await this.botApi.sendInvoice(chatId, {
        title: 'Персональное AI-фото',
        description: 'Уникальное фото сгенерированное специально для вас на основе вашего аватара и стиля общения',
        payload,
        currency: 'XTR', // Telegram Stars
        prices: [{ label: 'AI Photo', amount }],
        providerToken: '', // Пусто для Telegram Stars!
      })

      if (result.success) {
        log.info(`Invoice sent to chat ${chatId}, payload: ${payload}, amount: ${amount} Stars`)
        return { success: true }
      } else {
        this.pendingPayments.delete(payload)
        log.error(`Failed to send invoice: ${result.error}`)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error('Failed to create invoice', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Создать ссылку на инвойс (для шаринга)
   * @param amount - Сумма в Stars
   * @param userId - ID пользователя (для payload)
   */
  async createInvoiceLink(
    amount: number = PRICES.PERSONAL_PHOTO,
    userId?: string
  ): Promise<string | null> {
    if (!this.botApi) {
      log.error('Payment service not initialized')
      return null
    }

    const payload = `photo_${userId || 'shared'}_${Date.now()}`

    const link = await this.botApi.createInvoiceLink({
      title: 'Персональное AI-фото',
      description: 'Уникальное AI-фото на основе вашего аватара',
      payload,
      currency: 'XTR',
      prices: [{ label: 'AI Photo', amount }],
      providerToken: '',
    })

    if (link) {
      log.info(`Invoice link created: ${link}`)
    }

    return link
  }

  /**
   * Обработка pre_checkout_query (должен ответить в течение 10 секунд!)
   * @param query - Pre-checkout query от Telegram
   */
  async handlePreCheckout(query: PreCheckoutQuery): Promise<boolean> {
    if (!this.botApi) {
      log.error('Cannot handle pre-checkout: service not initialized')
      return false
    }

    try {
      log.info(`Pre-checkout query: ${query.id}, payload: ${query.invoice_payload}, amount: ${query.total_amount} ${query.currency}`)

      // Проверяем что платёж есть в нашем кэше (опционально)
      const paymentInfo = this.pendingPayments.get(query.invoice_payload)
      if (paymentInfo) {
        paymentInfo.status = 'confirmed'
        log.info(`Payment ${query.invoice_payload} confirmed`)
      }

      // Всегда подтверждаем (можно добавить валидацию)
      const ok = await this.botApi.answerPreCheckoutQuery(query.id, true)

      if (ok) {
        log.info(`Pre-checkout ${query.id} answered successfully`)
      } else {
        log.error(`Failed to answer pre-checkout ${query.id}`)
      }

      return ok
    } catch (error) {
      log.error('Failed to handle pre-checkout', error)
      // Пытаемся отклонить с ошибкой
      try {
        await this.botApi.answerPreCheckoutQuery(query.id, false, 'Internal error, please try again')
      } catch {
        // Игнорируем
      }
      return false
    }
  }

  /**
   * Обработка successful_payment
   * @param chatId - ID чата
   * @param payment - Данные об успешном платеже
   * @returns PaymentInfo или null
   */
  async handleSuccessfulPayment(
    chatId: string | number,
    payment: SuccessfulPayment
  ): Promise<PaymentInfo | null> {
    try {
      log.info(`Successful payment: ${payment.telegram_payment_charge_id}, payload: ${payment.invoice_payload}, amount: ${payment.total_amount} ${payment.currency}`)

      // Получаем информацию о платеже из кэша
      const paymentInfo = this.pendingPayments.get(payment.invoice_payload)

      if (paymentInfo) {
        paymentInfo.status = 'completed'
        paymentInfo.completedAt = new Date()

        // Удаляем из pending
        this.pendingPayments.delete(payment.invoice_payload)

        log.info(`Payment ${payment.invoice_payload} completed for user ${paymentInfo.userId}`)

        // TODO: Здесь нужно запустить генерацию персонального фото
        // Это делается через callback в ProactiveAvatarService

        return paymentInfo
      } else {
        // Платёж не найден в кэше - возможно, из другой сессии
        log.warn(`Payment ${payment.invoice_payload} not found in cache, but payment was successful`)

        // Создаём PaymentInfo из данных платежа
        const newPaymentInfo: PaymentInfo = {
          id: payment.telegram_payment_charge_id,
          userId: 'unknown', // Нужно получить из chatId
          chatId: String(chatId),
          amount: payment.total_amount,
          currency: payment.currency,
          status: 'completed',
          payload: payment.invoice_payload,
          createdAt: new Date(),
          completedAt: new Date(),
        }

        return newPaymentInfo
      }
    } catch (error) {
      log.error('Failed to handle successful payment', error)
      return null
    }
  }

  /**
   * Отменить/рефанд платежа (если поддерживается)
   * @param payload - Payload платежа
   */
  async refundPayment(payload: string): Promise<boolean> {
    const paymentInfo = this.pendingPayments.get(payload)
    if (paymentInfo) {
      paymentInfo.status = 'refunded'
      log.info(`Payment ${payload} marked as refunded`)
      return true
    }
    log.warn(`Payment ${payload} not found for refund`)
    return false
  }

  /**
   * Получить информацию о платеже
   * @param payload - Payload платежа
   */
  getPaymentInfo(payload: string): PaymentInfo | undefined {
    return this.pendingPayments.get(payload)
  }

  /**
   * Получить все pending платежи
   */
  getPendingPayments(): PaymentInfo[] {
    return Array.from(this.pendingPayments.values()).filter(
      (p) => p.status === 'pending' || p.status === 'confirmed'
    )
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    return this.isInitialized && this.botApi !== null
  }

  /**
   * Получить Bot API адаптер (для прямых вызовов)
   */
  getBotApi(): BotApiAdapter | null {
    return this.botApi
  }

  // ============================================
  // FREEMIUM: Счётчик бесплатных фото
  // ============================================

  /**
   * Проверить есть ли у пользователя бесплатные фото
   * @param userId - ID пользователя
   * @returns true если есть бесплатные фото
   */
  hasFreePhotosRemaining(userId: string): boolean {
    const used = this.freePhotosUsed.get(userId) || 0
    return used < FREE_PHOTOS_LIMIT
  }

  /**
   * Получить количество оставшихся бесплатных фото
   * @param userId - ID пользователя
   */
  getFreePhotosRemaining(userId: string): number {
    const used = this.freePhotosUsed.get(userId) || 0
    return Math.max(0, FREE_PHOTOS_LIMIT - used)
  }

  /**
   * Получить количество использованных бесплатных фото
   * @param userId - ID пользователя
   */
  getFreePhotosUsed(userId: string): number {
    return this.freePhotosUsed.get(userId) || 0
  }

  /**
   * Увеличить счётчик использованных бесплатных фото
   * @param userId - ID пользователя
   */
  incrementFreePhotos(userId: string): void {
    const used = this.freePhotosUsed.get(userId) || 0
    this.freePhotosUsed.set(userId, used + 1)
    log.info(`User ${userId} used free photo: ${used + 1}/${FREE_PHOTOS_LIMIT}`)
  }

  /**
   * Сбросить счётчик бесплатных фото (после оплаты)
   * @param userId - ID пользователя
   */
  resetFreePhotos(userId: string): void {
    this.freePhotosUsed.set(userId, 0)
    log.info(`User ${userId} free photos reset to 0/${FREE_PHOTOS_LIMIT}`)
  }

  /**
   * Добавить бонусные бесплатные фото (например, после оплаты пакета)
   * @param userId - ID пользователя
   * @param count - Количество бонусных фото
   */
  addBonusPhotos(userId: string, count: number): void {
    const used = this.freePhotosUsed.get(userId) || 0
    const newUsed = Math.max(0, used - count)
    this.freePhotosUsed.set(userId, newUsed)
    log.info(`User ${userId} got ${count} bonus photos, now ${FREE_PHOTOS_LIMIT - newUsed}/${FREE_PHOTOS_LIMIT} remaining`)
  }

  // ============================================
  // PAID PHOTOS: Счётчик оплаченных фото
  // ============================================

  /** Счётчик оплаченных фото (userId -> count) - in-memory до интеграции с PostgreSQL */
  private paidPhotos: Map<string, number> = new Map()

  /**
   * Добавить фото-кредиты пользователю (после крипто или Stars платежа)
   * @param userId - Telegram ID пользователя
   * @param credits - Количество кредитов
   * @param source - Источник платежа: 'stars' | 'crypto'
   * @param metadata - Дополнительные данные о платеже
   */
  addPhotoCredits(
    userId: string,
    credits: number,
    source: 'stars' | 'crypto',
    metadata?: {
      currency?: string
      amount?: number
      transactionId?: string
    }
  ): void {
    const current = this.paidPhotos.get(userId) || 0
    this.paidPhotos.set(userId, current + credits)

    // Сбрасываем счётчик бесплатных фото после оплаты
    this.resetFreePhotos(userId)

    log.info(
      `User ${userId} credited ${credits} photos via ${source}` +
      (metadata?.currency ? ` (${metadata.amount} ${metadata.currency})` : '') +
      `. Total paid photos: ${current + credits}`
    )

    // TODO: Сохранить в PostgreSQL когда будет интеграция
    // await db.insert(paymentHistory).values({...})
  }

  /**
   * Получить количество оплаченных фото
   * @param userId - ID пользователя
   */
  getPaidPhotos(userId: string): number {
    return this.paidPhotos.get(userId) || 0
  }

  /**
   * Использовать оплаченное фото
   * @param userId - ID пользователя
   * @returns true если было оплаченное фото
   */
  usePaidPhoto(userId: string): boolean {
    const paid = this.paidPhotos.get(userId) || 0
    if (paid > 0) {
      this.paidPhotos.set(userId, paid - 1)
      log.info(`User ${userId} used paid photo, ${paid - 1} remaining`)
      return true
    }
    return false
  }

  /**
   * Проверить есть ли доступные фото (бесплатные или оплаченные)
   * @param userId - ID пользователя
   */
  hasAvailablePhotos(userId: string): boolean {
    return this.hasFreePhotosRemaining(userId) || this.getPaidPhotos(userId) > 0
  }

  /**
   * Использовать фото (сначала бесплатные, потом оплаченные)
   * @param userId - ID пользователя
   * @returns 'free' | 'paid' | null
   */
  usePhoto(userId: string): 'free' | 'paid' | null {
    // Сначала пробуем бесплатные
    if (this.hasFreePhotosRemaining(userId)) {
      this.incrementFreePhotos(userId)
      return 'free'
    }

    // Потом оплаченные
    if (this.usePaidPhoto(userId)) {
      return 'paid'
    }

    return null
  }

  /**
   * Получить полный статус квоты пользователя
   * @param userId - ID пользователя
   */
  getQuotaStatus(userId: string): {
    freeUsed: number
    freeLimit: number
    freeRemaining: number
    paidPhotos: number
    totalAvailable: number
  } {
    const freeUsed = this.getFreePhotosUsed(userId)
    const freeRemaining = this.getFreePhotosRemaining(userId)
    const paidPhotos = this.getPaidPhotos(userId)

    return {
      freeUsed,
      freeLimit: FREE_PHOTOS_LIMIT,
      freeRemaining,
      paidPhotos,
      totalAvailable: freeRemaining + paidPhotos,
    }
  }

  /**
   * Форматирование сообщения о балансе (централизованная логика)
   * @param userId - ID пользователя
   * @returns Строка с информацией о балансе
   */
  formatBalanceMessage(userId: string): string {
    const quota = this.getQuotaStatus(userId)

    if (quota.paidPhotos > 0) {
      // Есть оплаченные фото
      return `\n\n💰 Баланс: ${quota.paidPhotos} фото`
    } else if (quota.freeRemaining > 0) {
      // Остались бесплатные фото
      return `\n\n🎁 Бесплатных фото: ${quota.freeRemaining}/${quota.freeLimit}`
    } else {
      // Лимит исчерпан
      return `\n\n⚠️ Бесплатный лимит исчерпан (${quota.freeUsed}/${quota.freeLimit})`
    }
  }

  /**
   * Форматирование сообщения об успешной оплате
   * @param credits - Количество зачисленных фото
   * @param currency - Валюта оплаты
   * @param amount - Сумма оплаты
   * @param bonus - Бонус за крупную сумму
   * @param userId - ID пользователя
   * @returns Строка с информацией об оплате
   */
  formatPaymentSuccessMessage(
    credits: number,
    currency: string,
    amount: number,
    bonus: number,
    userId: string
  ): string {
    const quota = this.getQuotaStatus(userId)
    const bonusText = bonus > 0 ? ` (+${bonus} бонус!)` : ''

    return `✅ Оплата получена!

💰 Сумма: ${amount} ${currency}
📸 Зачислено: ${credits} фото${bonusText}
💳 Баланс: ${quota.paidPhotos} фото

Теперь можешь генерировать! Просто напиши что хочешь увидеть.`
  }
}

export default PaymentService
