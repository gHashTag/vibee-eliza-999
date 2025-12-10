/**
 * Bot API Adapter
 *
 * Реализация ITelegramAdapter через Bot API (Fallback #1)
 * Используется когда MTProto недоступен
 */
import {
  ITelegramAdapter,
  ITelegramMessage,
  ITelegramDialog,
  ITelegramUser,
  ISendMessageResult,
} from '../../types/telegram.types'
import { logger } from '@elizaos/core'

/**
 * Логгер для BotApiAdapter
 */
const log = {
  info: (msg: string) => logger.info(`[BotApiAdapter] ${msg}`),
  warn: (msg: string) => logger.warn(`[BotApiAdapter] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[BotApiAdapter] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[BotApiAdapter] ${msg}`),
}

/**
 * Pre-checkout query от Telegram
 */
export interface PreCheckoutQuery {
  id: string
  from: {
    id: number
    first_name: string
    last_name?: string
    username?: string
  }
  currency: string
  total_amount: number
  invoice_payload: string
}

/**
 * Successful payment от Telegram
 */
export interface SuccessfulPayment {
  currency: string
  total_amount: number
  invoice_payload: string
  telegram_payment_charge_id: string
  provider_payment_charge_id: string
}

/**
 * Обработчики платежных событий
 */
export interface PaymentHandlers {
  onPreCheckout: (query: PreCheckoutQuery) => Promise<void>
  onSuccessfulPayment: (chatId: number, payment: SuccessfulPayment) => Promise<void>
}

export class BotApiAdapter implements ITelegramAdapter {
  private connected = false
  private messageHandler: ((message: ITelegramMessage) => void) | null = null
  private pollingActive = false
  private pollingOffset = 0

  /** Обработчики платежных событий */
  private onPreCheckoutQuery?: (query: PreCheckoutQuery) => Promise<void>
  private onSuccessfulPayment?: (chatId: number, payment: SuccessfulPayment) => Promise<void>

  constructor(private botToken: string) {}

  async connect(): Promise<boolean> {
    // Bot API doesn't require persistent connection
    // Just validate the token
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      this.connected = data.ok === true
      return this.connected
    } catch {
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async sendMessage(chatId: string | number, text: string): Promise<ISendMessageResult> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      const data = await response.json()
      if (data.ok) {
        return { success: true, messageId: data.result.message_id }
      }
      return { success: false, error: data.description }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getDialogs(_limit = 20): Promise<ITelegramDialog[]> {
    // Bot API doesn't support getting dialogs list
    // This would need to be implemented via getUpdates or webhook
    console.warn('[BotApiAdapter] getDialogs not supported in Bot API mode')
    return []
  }

  onMessage(handler: (message: ITelegramMessage) => void): void {
    this.messageHandler = handler
    // In real implementation, this would set up long polling or webhook
    console.warn('[BotApiAdapter] Message handling requires webhook setup')
  }

  async getMe(): Promise<ITelegramUser | null> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      if (data.ok) {
        return {
          id: data.result.id,
          firstName: data.result.first_name,
          lastName: data.result.last_name,
          username: data.result.username,
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Send invoice for Telegram Stars payment
   * @param chatId - ID чата (только личные чаты)
   * @param params - параметры инвойса
   */
  async sendInvoice(
    chatId: string | number,
    params: {
      title: string
      description: string
      payload: string
      currency: string // 'XTR' for Telegram Stars
      prices: Array<{ label: string; amount: number }>
      providerToken?: string // пустая строка для Telegram Stars
    }
  ): Promise<ISendMessageResult> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendInvoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          title: params.title,
          description: params.description,
          payload: params.payload,
          provider_token: params.providerToken || '', // пусто для Telegram Stars
          currency: params.currency,
          prices: params.prices,
        }),
      })
      const data = await response.json()
      if (data.ok) {
        return { success: true, messageId: data.result.message_id }
      }
      return { success: false, error: data.description }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Answer pre-checkout query (must respond within 10 seconds!)
   * @param preCheckoutQueryId - ID запроса
   * @param ok - подтвердить или отклонить
   * @param errorMessage - сообщение об ошибке (если ok=false)
   */
  async answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {
        pre_checkout_query_id: preCheckoutQueryId,
        ok,
      }
      if (!ok && errorMessage) {
        body.error_message = errorMessage
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return data.ok === true
    } catch {
      return false
    }
  }

  /**
   * Create invoice link for sharing
   * @param params - параметры инвойса
   * @returns URL инвойса или null
   */
  async createInvoiceLink(params: {
    title: string
    description: string
    payload: string
    currency: string
    prices: Array<{ label: string; amount: number }>
    providerToken?: string
  }): Promise<string | null> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          payload: params.payload,
          provider_token: params.providerToken || '',
          currency: params.currency,
          prices: params.prices,
        }),
      })
      const data = await response.json()
      if (data.ok) {
        return data.result
      }
      log.error('createInvoiceLink error:', data.description)
      return null
    } catch (error) {
      log.error('createInvoiceLink error:', error)
      return null
    }
  }

  // ============================================
  // PAYMENT POLLING: Long Polling для платежей
  // ============================================

  /**
   * Установить обработчики платежных событий
   * @param handlers - обработчики pre_checkout_query и successful_payment
   */
  setPaymentHandlers(handlers: PaymentHandlers): void {
    this.onPreCheckoutQuery = handlers.onPreCheckout
    this.onSuccessfulPayment = handlers.onSuccessfulPayment
    log.info('Payment handlers registered')
  }

  /**
   * Получить обновления от Bot API
   * @param offset - смещение для получения новых обновлений
   * @param allowedUpdates - типы обновлений для получения
   * @param timeout - таймаут long polling в секундах
   */
  async getUpdates(
    offset: number = 0,
    allowedUpdates: string[] = ['pre_checkout_query', 'message'],
    timeout: number = 30
  ): Promise<any[]> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset,
          timeout,
          allowed_updates: allowedUpdates,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        return data.result || []
      }

      log.error('getUpdates error:', data.description)
      return []
    } catch (error) {
      log.error('getUpdates fetch error:', error)
      return []
    }
  }

  /**
   * Запустить Long Polling для получения платежных событий
   * ВАЖНО: pre_checkout_query ДОЛЖЕН быть обработан в течение 10 СЕКУНД!
   */
  async startPaymentPolling(): Promise<void> {
    if (this.pollingActive) {
      log.warn('Payment polling already active')
      return
    }

    this.pollingActive = true
    log.info('Starting payment polling...')

    while (this.pollingActive && this.connected) {
      try {
        const updates = await this.getUpdates(
          this.pollingOffset,
          ['pre_checkout_query', 'message'],
          30 // long polling timeout
        )

        for (const update of updates) {
          this.pollingOffset = update.update_id + 1

          // Обработка pre_checkout_query (КРИТИЧНО: ответить за 10 сек!)
          if (update.pre_checkout_query) {
            log.info(`Received pre_checkout_query: ${update.pre_checkout_query.id}`)

            if (this.onPreCheckoutQuery) {
              // Запускаем асинхронно чтобы не блокировать polling
              this.onPreCheckoutQuery(update.pre_checkout_query).catch((err) => {
                log.error('Pre-checkout handler error:', err)
              })
            } else {
              // Если обработчик не установлен - автоматически подтверждаем
              log.warn('No pre_checkout handler, auto-confirming...')
              await this.answerPreCheckoutQuery(update.pre_checkout_query.id, true)
            }
          }

          // Обработка successful_payment (приходит как часть message)
          if (update.message?.successful_payment) {
            const payment = update.message.successful_payment as SuccessfulPayment
            const chatId = update.message.chat.id

            log.info(`Received successful_payment: ${payment.telegram_payment_charge_id}`)

            if (this.onSuccessfulPayment) {
              this.onSuccessfulPayment(chatId, payment).catch((err) => {
                log.error('Successful payment handler error:', err)
              })
            } else {
              log.warn('No successful_payment handler registered')
            }
          }
        }
      } catch (error) {
        log.error('Payment polling error:', error)
        // Ждём перед повторной попыткой
        await this.sleep(5000)
      }
    }

    log.info('Payment polling stopped')
  }

  /**
   * Остановить Long Polling
   */
  stopPaymentPolling(): void {
    this.pollingActive = false
    log.info('Stopping payment polling...')
  }

  /**
   * Проверить активен ли polling
   */
  isPollingActive(): boolean {
    return this.pollingActive
  }

  /**
   * Вспомогательная функция для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
