/**
 * Component Tests for plugin-telegram-craft
 *
 * Проверка конфигурации и структуры плагина
 */
import { describe, it, expect, beforeAll } from 'bun:test'
import { telegramCraftPlugin } from '../plugin'
import { getDialogsAction } from '../actions/getDialogs.action'
import { vibeCodingKnowledgeProvider } from '../providers/VibeCodingKnowledgeProvider'
import { responseQualityEvaluator } from '../evaluators/ResponseQualityEvaluator'
import { factExtractionEvaluator } from '../evaluators/FactExtractionEvaluator'
import { goalTrackingEvaluator } from '../evaluators/GoalTrackingEvaluator'
import { TelegramSanitizer, InputValidator } from '../security/sanitizer'

describe('plugin-telegram-craft configuration', () => {

  describe('Plugin Structure', () => {
    it('plugin is defined with correct name', () => {
      expect(telegramCraftPlugin).toBeDefined()
      expect(telegramCraftPlugin.name).toBe('telegram-craft')
    })

    it('plugin has required components', () => {
      expect(telegramCraftPlugin.actions).toBeDefined()
      expect(telegramCraftPlugin.providers).toBeDefined()
      expect(telegramCraftPlugin.evaluators).toBeDefined()
      expect(telegramCraftPlugin.routes).toBeDefined()
      expect(telegramCraftPlugin.services).toBeDefined()
    })

    it('plugin has init function', () => {
      expect(typeof telegramCraftPlugin.init).toBe('function')
    })
  })

  describe('Actions', () => {
    it('getDialogsAction is defined', () => {
      expect(getDialogsAction).toBeDefined()
      expect(getDialogsAction.name).toBe('GET_TELEGRAM_DIALOGS')
    })

    it('getDialogsAction has required properties', () => {
      expect(getDialogsAction.description).toBeDefined()
      expect(getDialogsAction.validate).toBeDefined()
      expect(getDialogsAction.handler).toBeDefined()
      expect(getDialogsAction.examples).toBeDefined()
    })

    it('getDialogsAction has valid examples', () => {
      expect(Array.isArray(getDialogsAction.examples)).toBe(true)
      expect(getDialogsAction.examples.length).toBeGreaterThan(0)
    })
  })

  describe('Providers', () => {
    it('vibeCodingKnowledgeProvider is defined', () => {
      expect(vibeCodingKnowledgeProvider).toBeDefined()
      expect(vibeCodingKnowledgeProvider.name).toBe('vibecoding-knowledge')
    })

    it('provider has get function', () => {
      expect(typeof vibeCodingKnowledgeProvider.get).toBe('function')
    })
  })

  describe('Evaluators', () => {
    it('responseQualityEvaluator is defined', () => {
      expect(responseQualityEvaluator).toBeDefined()
      expect(responseQualityEvaluator.name).toBe('TELEGRAM_RESPONSE_QUALITY')
    })

    it('factExtractionEvaluator is defined', () => {
      expect(factExtractionEvaluator).toBeDefined()
      expect(factExtractionEvaluator.name).toBe('TELEGRAM_FACT_EXTRACTION')
    })

    it('goalTrackingEvaluator is defined', () => {
      expect(goalTrackingEvaluator).toBeDefined()
      expect(goalTrackingEvaluator.name).toBe('TELEGRAM_GOAL_TRACKING')
    })

    it('evaluators have required methods', () => {
      const evaluators = [
        responseQualityEvaluator,
        factExtractionEvaluator,
        goalTrackingEvaluator
      ]

      evaluators.forEach(evaluator => {
        expect(typeof evaluator.validate).toBe('function')
        expect(typeof evaluator.handler).toBe('function')
        // examples may be optional
      })
    })
  })

  describe('Security Utilities', () => {
    it('TelegramSanitizer is defined', () => {
      expect(TelegramSanitizer).toBeDefined()
    })

    it('InputValidator is defined', () => {
      expect(InputValidator).toBeDefined()
    })
  })
})

describe('Security Sanitizer Tests', () => {
  describe('TelegramSanitizer.sanitizeText', () => {
    it('removes script tags', () => {
      const result = TelegramSanitizer.sanitizeText('hello <script>alert(1)</script> world')
      expect(result).toBe('hello  world')
    })

    it('limits text length to 4096 characters', () => {
      const longText = 'a'.repeat(5000)
      const result = TelegramSanitizer.sanitizeText(longText)
      expect(result.length).toBeLessThanOrEqual(4096)
    })

    it('handles empty string', () => {
      const result = TelegramSanitizer.sanitizeText('')
      expect(result).toBe('')
    })

    it('removes javascript: URLs', () => {
      const result = TelegramSanitizer.sanitizeText('test javascript:alert(1) test')
      expect(result).not.toContain('javascript:')
    })
  })

  describe('TelegramSanitizer.isValidChatId', () => {
    it('accepts valid numeric chat ID', () => {
      const result = TelegramSanitizer.isValidChatId('123456789')
      expect(result).toBe(true)
    })

    it('accepts numeric chat ID', () => {
      const result = TelegramSanitizer.isValidChatId(123456789)
      expect(result).toBe(true)
    })

    it('rejects invalid chat ID', () => {
      const result = TelegramSanitizer.isValidChatId('invalid')
      expect(result).toBe(false)
    })

    it('rejects zero chat ID', () => {
      const result = TelegramSanitizer.isValidChatId(0)
      expect(result).toBe(false)
    })
  })

  describe('TelegramSanitizer.isSuspiciousContent', () => {
    it('detects SQL injection', () => {
      expect(TelegramSanitizer.isSuspiciousContent('SELECT * FROM users')).toBe(true)
    })

    it('detects XSS attempts', () => {
      expect(TelegramSanitizer.isSuspiciousContent('<script>alert(1)</script>')).toBe(true)
    })

    it('allows normal text', () => {
      expect(TelegramSanitizer.isSuspiciousContent('Hello, World!')).toBe(false)
    })
  })

  describe('TelegramSanitizer.isValidUsername', () => {
    it('validates correct username', () => {
      expect(TelegramSanitizer.isValidUsername('username')).toBe(true)
    })

    it('rejects short username', () => {
      expect(TelegramSanitizer.isValidUsername('abc')).toBe(false)
    })

    it('rejects username starting with number', () => {
      expect(TelegramSanitizer.isValidUsername('1username')).toBe(false)
    })
  })

  describe('InputValidator.validateSendMessage', () => {
    it('validates correct message', () => {
      const result = InputValidator.validateSendMessage('123456789', 'Hello!')
      expect(result.valid).toBe(true)
    })

    it('rejects empty chatId', () => {
      const result = InputValidator.validateSendMessage('', 'Hello!')
      expect(result.valid).toBe(false)
    })

    it('rejects empty text', () => {
      const result = InputValidator.validateSendMessage('123456789', '')
      expect(result.valid).toBe(false)
    })

    it('rejects suspicious content', () => {
      const result = InputValidator.validateSendMessage('123456789', '<script>alert(1)</script>')
      expect(result.valid).toBe(false)
    })
  })

  describe('InputValidator.validateDialogsLimit', () => {
    it('returns default for invalid input', () => {
      expect(InputValidator.validateDialogsLimit('invalid')).toBe(20)
    })

    it('clamps value to max 100', () => {
      expect(InputValidator.validateDialogsLimit(200)).toBe(100)
    })

    it('clamps value to min 1', () => {
      expect(InputValidator.validateDialogsLimit(0)).toBe(1)
    })

    it('accepts valid limit', () => {
      expect(InputValidator.validateDialogsLimit(50)).toBe(50)
    })
  })
})
