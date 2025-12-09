/**
 * @fileoverview Avatar Face Plugin - DigitalAvatarBodyAction Tests
 *
 * Tests for Digital Avatar Body Action
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import { describe, it, expect, vi } from 'vitest'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import { digitalAvatarBodyAction } from '../../actions/digitalAvatarBodyAction'

describe('DigitalAvatarBodyAction', () => {
  let mockRuntime: IAgentRuntime

  beforeEach(() => {
    mockRuntime = {
      getSetting: vi.fn(),
      getService: vi.fn(),
    } as any
  })

  describe('validate', () => {
    it('should return true for "🤖 Цифровое тело аватара" command', async () => {
      const message: Memory = {
        content: { text: '🤖 Цифровое тело аватара' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "обучить модель" intent', async () => {
      const message: Memory = {
        content: { text: 'Хочу обучить свою модель' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "create lora" command', async () => {
      const message: Memory = {
        content: { text: 'Создать LoRA модель' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "lora training" intent', async () => {
      const message: Memory = {
        content: { text: 'Нужно LoRA обучение' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return false for unrelated message', async () => {
      const message: Memory = {
        content: { text: 'привет как дела' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })

    it('should return false for empty text', async () => {
      const message: Memory = {
        content: { text: '' },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })

    it('should return false for null text', async () => {
      const message: Memory = {
        content: { text: null },
      } as Memory

      const result = await digitalAvatarBodyAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })
  })

  describe('handler', () => {
    it('should start wizard flow for new user', async () => {
      const message: Memory = {
        content: { text: '🤖 Цифровое тело аватара', source: 'telegram' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await digitalAvatarBodyAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(true)
      expect(result.text).toBe('Digital Avatar Body wizard started')
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('🎨')
      expect(mockCallback.mock.calls[0][0].text).toContain('Выберите тип обучения')
    })

    it('should handle model type selection', async () => {
      const message: Memory = {
        content: { text: 'Хочу Portrait Trainer' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await digitalAvatarBodyAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(true)
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('♂️♀️')
      expect(mockCallback.mock.calls[0][0].text).toContain('Выберите пол аватара')
    })

    it('should handle gender selection', async () => {
      const message: Memory = {
        content: { text: 'Выбираю мужской пол' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await digitalAvatarBodyAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(true)
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('📝')
      expect(mockCallback.mock.calls[0][0].text).toContain('Введите название модели')
    })

    it('should handle missing user ID', async () => {
      const message: Memory = {
        content: { text: '🤖 Цифровое тело аватара' },
        userId: null,
      } as Memory

      const mockCallback = vi.fn()

      const result = await digitalAvatarBodyAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('❌')
      expect(mockCallback.mock.calls[0][0].text).toContain('Не удалось определить пользователя')
    })
  })

  describe('examples', () => {
    it('should have valid examples structure', () => {
      expect(digitalAvatarBodyAction.examples).toBeDefined()
      expect(digitalAvatarBodyAction.examples).toHaveLength(2)

      digitalAvatarBodyAction.examples.forEach((example, index) => {
        expect(example).toHaveLength(2)

        const [userExample, assistantExample] = example

        expect(userExample.name).toBe('user')
        expect(userExample.content).toBeDefined()
        expect(userExample.content.text).toBeDefined()

        expect(assistantExample.name).toBe('assistant')
        expect(assistantExample.content).toBeDefined()
        expect(assistantExample.content.text).toBeDefined()
      })
    })
  })
})
