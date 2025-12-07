// @ts-nocheck
/**
 * Telegram Sanitizer
 *
 * Утилиты безопасности для обработки данных Telegram
 */
export class TelegramSanitizer {
  /**
   * Санитизирует текст перед отправкой в Telegram
   * - Обрезает по лимиту Telegram (4096 символов)
   * - Удаляет опасные теги
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .slice(0, 4096) // Telegram message limit
  }

  /**
   * Валидирует Telegram Chat ID
   */
  static isValidChatId(chatId: string | number): boolean {
    const id = typeof chatId === 'string' ? parseInt(chatId) : chatId
    // Telegram chat IDs are signed 64-bit integers
    return !isNaN(id) && id !== 0
  }

  /**
   * Проверяет на SQL injection и другие атаки
   */
  static isSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      // SQL injection
      /(\b(UNION|SELECT|DROP|DELETE|INSERT|UPDATE|CREATE)\b.*FROM\b)/i,
      /(--|#|\/\*.*\*\/)/,
      /(\bOR\b\s+\d+\s*=\s*\d+)/i,
      // XSS
      /<script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      // Command injection
      /rm\s+-rf/i,
      /\|\s*bash/i,
      /eval\s*\(/i,
    ]
    return suspiciousPatterns.some((pattern) => pattern.test(text))
  }

  /**
   * Экранирует Markdown для Telegram
   */
  static escapeMarkdown(text: string): string {
    const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    let escaped = text
    for (const char of escapeChars) {
      escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`)
    }
    return escaped
  }

  /**
   * Валидирует username Telegram
   */
  static isValidUsername(username: string): boolean {
    // Telegram usernames: 5-32 chars, alphanumeric and underscores
    return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username)
  }

  /**
   * Очищает HTML теги из текста
   */
  static stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '')
  }
}

/**
 * Валидатор входных данных
 */
export class InputValidator {
  /**
   * Валидирует параметры отправки сообщения
   */
  static validateSendMessage(chatId: unknown, text: unknown): { valid: boolean; error?: string } {
    if (!chatId) {
      return { valid: false, error: 'chatId is required' }
    }

    if (!TelegramSanitizer.isValidChatId(chatId as string | number)) {
      return { valid: false, error: 'Invalid chatId format' }
    }

    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'text is required and must be a string' }
    }

    if (text.length === 0) {
      return { valid: false, error: 'text cannot be empty' }
    }

    if (TelegramSanitizer.isSuspiciousContent(text)) {
      return { valid: false, error: 'Suspicious content detected' }
    }

    return { valid: true }
  }

  /**
   * Валидирует лимит для запроса диалогов
   */
  static validateDialogsLimit(limit: unknown): number {
    const parsed = typeof limit === 'string' ? parseInt(limit) : limit
    if (typeof parsed !== 'number' || isNaN(parsed)) {
      return 20 // default
    }
    return Math.min(Math.max(parsed, 1), 100) // clamp 1-100
  }
}
