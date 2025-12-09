/**
 * @fileoverview Avatar Face Plugin - NeuroPhotoAction Tests
 *
 * Tests for NeuroPhoto Action
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import { describe, it, expect, vi } from 'vitest'
import type { IAgentRuntime, Memory } from '@elizaos/core'
import { neuroPhotoAction } from '../../actions/neuroPhotoAction'

describe('NeuroPhotoAction', () => {
  let mockRuntime: IAgentRuntime

  beforeEach(() => {
    mockRuntime = {
      getSetting: vi.fn(),
      getService: vi.fn(),
    } as any
  })

  describe('validate', () => {
    it('should return true for "📸 NeuroPhoto" command', async () => {
      const message: Memory = {
        content: { text: '📸 NeuroPhoto красивый закат' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "сгенерировать фото" intent', async () => {
      const message: Memory = {
        content: { text: 'Сгенерируй фото кота' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "нарисуй" intent', async () => {
      const message: Memory = {
        content: { text: 'Нарисуй футуристический город' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "create image" command', async () => {
      const message: Memory = {
        content: { text: 'Create image of a cat' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return true for "avatar image" intent', async () => {
      const message: Memory = {
        content: { text: 'Generate avatar image' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(true)
    })

    it('should return false for unrelated message', async () => {
      const message: Memory = {
        content: { text: 'привет как дела' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })

    it('should return false for empty text', async () => {
      const message: Memory = {
        content: { text: '' },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })

    it('should return false for null text', async () => {
      const message: Memory = {
        content: { text: null },
      } as Memory

      const result = await neuroPhotoAction.validate(mockRuntime, message)
      expect(result).toBe(false)
    })
  })

  describe('handler', () => {
    it('should start generation with valid prompt', async () => {
      const message: Memory = {
        content: { text: '📸 NeuroPhoto красивый закат над океаном', source: 'telegram' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await neuroPhotoAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(true)
      expect(result.text).toContain('NeuroPhoto action completed')
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('📸')
      expect(mockCallback.mock.calls[0][0].text).toContain('Генерирую изображение')
    })

    it('should handle short prompt', async () => {
      const message: Memory = {
        content: { text: '📸 NeuroPhoto к' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await neuroPhotoAction.handler(
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
      expect(mockCallback.mock.calls[0][0].text).toContain('Минимальная длина описания')
    })

    it('should handle missing user ID', async () => {
      const message: Memory = {
        content: { text: '📸 NeuroPhoto красивый закат' },
        userId: null,
      } as Memory

      const mockCallback = vi.fn()

      const result = await neuroPhotoAction.handler(
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

    it('should handle natural language prompts', async () => {
      const message: Memory = {
        content: { text: 'Сгенерируй изображение моего аватара в стиле киберпанк' },
        userId: '12345',
      } as Memory

      const mockCallback = vi.fn()

      const result = await neuroPhotoAction.handler(
        mockRuntime,
        message,
        undefined,
        {},
        mockCallback
      )

      expect(result.success).toBe(true)
      expect(mockCallback).toHaveBeenCalled()
      expect(mockCallback.mock.calls[0][0].text).toContain('📸')
    })
  })

  describe('examples', () => {
    it('should have valid examples structure', () => {
      expect(neuroPhotoAction.examples).toBeDefined()
      expect(neuroPhotoAction.examples).toHaveLength(2)

      neuroPhotoAction.examples.forEach((example, index) => {
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
