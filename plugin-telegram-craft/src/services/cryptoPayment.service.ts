// @ts-nocheck
/**
 * CryptoPaymentService
 * Сервис для обработки крипто-платежей через @push/@Wallet
 *
 * Поддерживаемые криптовалюты:
 * - TON - нативный токен Telegram
 * - USDT - стейблкоин на сети TON
 * - NOT - Notcoin
 *
 * Флоу:
 * 1. Пользователь отправляет @push 50 руб или @push 1 TON
 * 2. @push/@Wallet бот отправляет подтверждение в чат
 * 3. Этот сервис парсит сообщение и зачисляет баланс
 */

import { Service, IAgentRuntime, logger } from '@elizaos/core'

/**
 * Логгер для CryptoPaymentService
 */
const log = {
  info: (msg: string) => logger.info(`[CryptoPaymentService] ${msg}`),
  warn: (msg: string) => logger.warn(`[CryptoPaymentService] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[CryptoPaymentService] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[CryptoPaymentService] ${msg}`),
}

/**
 * Поддерживаемые криптовалюты
 */
export type CryptoCurrency = 'TON' | 'USDT' | 'NOT' | 'RUB'

/**
 * Курсы конвертации в фото-кредиты
 * Наценка 150%: себестоимость ~4₽/фото, продаём по ~6₽/фото
 * Курсы: 1 TON ≈ 500₽, 1 USDT ≈ 100₽
 */
export const CRYPTO_RATES: Record<CryptoCurrency, number> = {
  TON: 83.33,   // 1 TON = 500₽ / 6₽ = 83 фото (но используем лесенку)
  USDT: 16.67,  // 1 USDT = 100₽ / 6₽ = 16 фото (но используем лесенку)
  NOT: 0,       // NOT пока не поддерживаем
  RUB: 0.167,   // 1 RUB / 6₽ = 0.167 фото (но используем лесенку)
}

/**
 * Минимальные суммы для зачисления
 */
export const MIN_AMOUNTS: Record<CryptoCurrency, number> = {
  TON: 0.1,    // Минимум 0.1 TON (~50₽ ≈ 8 фото)
  USDT: 0.5,   // Минимум 0.5 USDT (~50₽ ≈ 8 фото)
  NOT: 0,      // NOT не поддерживаем
  RUB: 30,     // Минимум 30 RUB (5 фото)
}

/**
 * Информация о крипто-платеже
 */
export interface CryptoPayment {
  amount: number
  currency: CryptoCurrency
  fromUserId?: string
  fromUsername?: string
  transactionId?: string
  rawMessage: string
  detectedAt: Date
}

/**
 * Боты которые отправляют подтверждения платежей
 */
const PAYMENT_BOTS = ['push', 'wallet', 'cryptobot', 'tonrocketbot', 'cryptopayhub_bot']

/**
 * CryptoPaymentService - обработка крипто-платежей
 */
export class CryptoPaymentService extends Service {
  static serviceType = 'crypto-payment'
  serviceType = 'crypto-payment'

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info('STATIC start() called')
    const instance = new CryptoPaymentService()
    await instance.initialize(runtime)
    return instance
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info('STATIC stop() called')
    const instance = runtime.getService('crypto-payment') as CryptoPaymentService
    if (instance) {
      await instance.stop()
    }
  }

  capabilityDescription = 'Обработка крипто-платежей через @push/@Wallet (TON/USDT/NOT)'

  /** Runtime агента */
  private runtime: IAgentRuntime | null = null

  /** Флаг инициализации */
  private isInitialized = false

  /** Кэш обработанных платежей (для дедупликации) */
  private processedPayments: Set<string> = new Set()

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      log.warn('Service already initialized')
      return
    }

    this.runtime = runtime
    this.isInitialized = true
    log.info('Service initialized successfully')
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    this.runtime = null
    this.isInitialized = false
    this.processedPayments.clear()
    log.info('Service stopped')
  }

  /**
   * Проверка, является ли сообщение подтверждением крипто-платежа
   * @param message - сообщение из Telegram
   * @returns CryptoPayment или null если не платёж
   */
  checkForCryptoPayment(message: {
    text?: string
    fromId?: string
    fromUsername?: string
    messageId?: number
  }): CryptoPayment | null {
    if (!message.text) return null

    // Проверяем отправителя (@push, @Wallet, @CryptoBot и др.)
    const senderUsername = (message.fromUsername || '').toLowerCase().replace('@', '')

    if (!PAYMENT_BOTS.includes(senderUsername)) {
      return null
    }

    log.debug(`Payment bot detected: @${senderUsername}`)

    // Парсим сумму и валюту из текста
    const payment = this.parsePaymentMessage(message.text, senderUsername)

    if (payment) {
      // Генерируем уникальный ID для дедупликации
      const paymentKey = `${senderUsername}_${payment.amount}_${payment.currency}_${message.messageId || Date.now()}`

      if (this.processedPayments.has(paymentKey)) {
        log.warn(`Duplicate payment detected, skipping: ${paymentKey}`)
        return null
      }

      this.processedPayments.add(paymentKey)

      // Очищаем старые записи (храним последние 1000)
      if (this.processedPayments.size > 1000) {
        const entries = Array.from(this.processedPayments)
        entries.slice(0, 500).forEach(key => this.processedPayments.delete(key))
      }

      log.info(`Crypto payment detected: ${payment.amount} ${payment.currency} from @${senderUsername}`)
      return payment
    }

    return null
  }

  /**
   * Парсинг сообщения о платеже
   * Поддерживает различные форматы от @push/@Wallet/@CryptoBot
   */
  private parsePaymentMessage(text: string, botUsername: string): CryptoPayment | null {
    const normalizedText = text.trim()

    // Паттерны для разных ботов и форматов
    // @push формат: "✅ Перевод выполнен\n💰 Сумма: 1 TON"
    // @Wallet формат: "Received 1.5 TON"
    // @CryptoBot формат: "You received 5 USDT"

    const patterns = [
      // Русские форматы
      /Сумма[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT|RUB|руб)/i,
      /Получено[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT|RUB|руб)/i,
      /Перевод[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT|RUB|руб)/i,
      /💰\s*(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT|RUB|руб)/i,

      // Английские форматы
      /Amount[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)/i,
      /Received[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)/i,
      /You received[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)/i,
      /Payment[:\s]+(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)/i,

      // Универсальные (число + валюта)
      /(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)\s*(?:transferred|sent|received)/i,
      /(?:transferred|sent|received)\s*(\d+(?:[.,]\d+)?)\s*(TON|USDT|NOT)/i,
    ]

    for (const pattern of patterns) {
      const match = normalizedText.match(pattern)
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'))
        let currency = match[2].toUpperCase() as CryptoCurrency

        // Нормализация "руб" -> "RUB"
        if (currency === 'РУБ' || match[2].toLowerCase() === 'руб') {
          currency = 'RUB'
        }

        // Проверяем минимальную сумму
        const minAmount = MIN_AMOUNTS[currency] || 0
        if (amount < minAmount) {
          log.warn(`Amount ${amount} ${currency} is below minimum ${minAmount}`)
          return null
        }

        return {
          amount,
          currency,
          rawMessage: normalizedText,
          detectedAt: new Date(),
        }
      }
    }

    // Специальная обработка для @push с рублями (автоконверт)
    // Формат: "@push 50 руб" или "50 ₽"
    const rubPattern = /(\d+(?:[.,]\d+)?)\s*(?:руб|₽|rub)/i
    const rubMatch = normalizedText.match(rubPattern)
    if (rubMatch) {
      const amount = parseFloat(rubMatch[1].replace(',', '.'))
      if (amount >= MIN_AMOUNTS.RUB) {
        return {
          amount,
          currency: 'RUB',
          rawMessage: normalizedText,
          detectedAt: new Date(),
        }
      }
    }

    return null
  }

  /**
   * Расчёт фото-кредитов по платежу с учётом бонусов за крупные суммы
   * @param payment - информация о платеже
   * @returns количество фото-кредитов
   */
  calculatePhotoCredits(payment: CryptoPayment): number {
    const { amount, currency } = payment
    let credits = 0
    let bonus = 0

    // Наценка 150%: себестоимость ~4₽/фото, продаём по ~6₽/фото
    // Курсы: 1 TON ≈ 500₽, 1 USDT ≈ 100₽

    switch (currency) {
      case 'RUB':
        // Лесенка цен для рублей (6₽ за фото)
        if (amount >= 1200) {
          credits = 200
          bonus = 40
        } else if (amount >= 600) {
          credits = 100
          bonus = 15
        } else if (amount >= 300) {
          credits = 50
          bonus = 5
        } else if (amount >= 150) {
          credits = 25
        } else if (amount >= 60) {
          credits = 10
        } else {
          // Минимум: 6₽ за фото
          credits = Math.floor(amount / 6)
        }
        break

      case 'TON':
        // Лесенка цен для TON (1 TON ≈ 500₽, 0.12 TON ≈ 60₽ = 10 фото)
        if (amount >= 1.2) {
          credits = 100
          bonus = 15
        } else if (amount >= 0.6) {
          credits = 50
          bonus = 5
        } else if (amount >= 0.3) {
          credits = 25
        } else if (amount >= 0.12) {
          credits = 10
        } else {
          // Минимум: 0.012 TON за фото (≈6₽)
          credits = Math.floor(amount / 0.012)
        }
        break

      case 'USDT':
        // Лесенка цен для USDT (1 USDT ≈ 100₽, 0.6 USDT ≈ 60₽ = 10 фото)
        if (amount >= 6) {
          credits = 100
          bonus = 15
        } else if (amount >= 3) {
          credits = 50
          bonus = 5
        } else if (amount >= 1.5) {
          credits = 25
        } else if (amount >= 0.6) {
          credits = 10
        } else {
          // Минимум: 0.06 USDT за фото (≈6₽)
          credits = Math.floor(amount / 0.06)
        }
        break

      case 'NOT':
        // NOT пока не поддерживаем (слишком волатильный)
        credits = 0
        break

      default:
        credits = 0
    }

    const totalCredits = credits + bonus
    log.info(`Calculated ${totalCredits} photo credits for ${amount} ${currency} (base: ${credits}, bonus: ${bonus})`)
    return totalCredits
  }

  /**
   * Генерация инструкции для крипто-оплаты
   * Показывается пользователю когда закончились бесплатные фото
   */
  generatePaymentInstructions(photosNeeded: number = 10): string {
    // Рассчитываем суммы для каждой валюты
    const tonAmount = Math.ceil(photosNeeded / CRYPTO_RATES.TON * 10) / 10  // 1 TON = 10 фото
    const usdtAmount = Math.ceil(photosNeeded / CRYPTO_RATES.USDT)           // 5 USDT = 10 фото
    const notAmount = Math.ceil(photosNeeded / CRYPTO_RATES.NOT)             // 1000 NOT = 10 фото
    const rubAmount = Math.ceil(photosNeeded / CRYPTO_RATES.RUB)             // 100 RUB = 10 фото

    return `💎 Крипто-оплата за ${photosNeeded} фото:

Отправь в этот чат одно из:
• @push ${rubAmount} руб (автоконверт в TON)
• @push ${tonAmount} TON
• @push ${usdtAmount} USDT
• @push ${notAmount} NOT

После оплаты баланс пополнится автоматически!

💡 Как это работает:
1. Напиши @push и сумму
2. Подтверди перевод в @Wallet
3. Бот увидит подтверждение и зачислит фото`
  }

  /**
   * Генерация сообщения об успешном зачислении
   */
  generateSuccessMessage(payment: CryptoPayment, credits: number): string {
    return `✅ Оплата получена!

💰 Сумма: ${payment.amount} ${payment.currency}
📸 Зачислено: ${credits} фото

Теперь можешь генерировать! Просто напиши что хочешь увидеть.`
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    return this.isInitialized
  }

  /**
   * Получить курсы конвертации
   */
  getRates(): Record<CryptoCurrency, number> {
    return { ...CRYPTO_RATES }
  }

  /**
   * Получить минимальные суммы
   */
  getMinAmounts(): Record<CryptoCurrency, number> {
    return { ...MIN_AMOUNTS }
  }
}

export default CryptoPaymentService
