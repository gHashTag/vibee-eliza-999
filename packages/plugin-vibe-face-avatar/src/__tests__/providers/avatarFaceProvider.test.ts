/**
 * @fileoverview Avatar Face Plugin - AvatarFaceProvider Tests
 *
 * Tests for Avatar Face Provider
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import { describe, it, expect, vi } from 'vitest'
import type { IAgentRuntime, Memory, State } from '@elizaos/core'
import { avatarFaceProvider } from '../../providers/avatarFaceProvider'

describe('AvatarFaceProvider', () => {
  let mockRuntime: IAgentRuntime

  beforeEach(() => {
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        if (key === 'DEFAULT_MODEL') {
          return 'custom-lora'
        }
        return null
      }),
    } as any
  })

  describe('get', () => {
    it('should return provider context', async () => {
      const message: Memory = {
        content: { text: 'test message' },
        userId: '12345',
      } as Memory

      const state: State = {}

      const result = await avatarFaceProvider.get(mockRuntime, message, state)

      expect(result).toBeDefined()
      expect(result.text).toBeDefined()
      expect(result.text).toContain('Avatar Face')
      expect(result.text).toContain('Цифровое Тело Аватара')
      expect(result.text).toContain('Digital Avatar Body')
      expect(result.text).toContain('NeuroPhoto')
      expect(result.values).toBeDefined()
      expect(result.values.defaultModel).toBe('custom-lora')
      expect(result.values.supportedCommands).toBeDefined()
      expect(result.values.supportedCommands).toContain('🤖 Цифровое тело аватара')
      expect(result.values.supportedCommands).toContain('📸 NeuroPhoto')
      expect(result.values.pricing).toBeDefined()
      expect(result.values.pricing.portraitTrainer).toBe(550)
      expect(result.values.pricing.fastTraining).toBe(220)
      expect(result.values.pricing.neuroPhoto).toBe(7.5)
      expect(result.values.currency).toBe('stars')
    })

    it('should use default model from settings', async () => {
      mockRuntime.getSetting = vi.fn((key: string) => {
        if (key === 'DEFAULT_MODEL') {
          return 'my-custom-model'
        }
        return null
      })

      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.values.defaultModel).toBe('my-custom-model')
    })

    it('should handle missing default model setting', async () => {
      mockRuntime.getSetting = vi.fn(() => null)

      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.values.defaultModel).toBe('custom-lora')
    })

    it('should include all supported commands', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      const commands = result.values.supportedCommands
      expect(commands).toContain('🤖 Цифровое тело аватара')
      expect(commands).toContain('📸 NeuroPhoto')
      expect(commands).toContain('обучить модель')
      expect(commands).toContain('сгенерировать фото')
    })

    it('should include pricing information', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      const pricing = result.values.pricing
      expect(pricing.portraitTrainer).toBeGreaterThan(0)
      expect(pricing.fastTraining).toBeGreaterThan(0)
      expect(pricing.neuroPhoto).toBeGreaterThan(0)
      expect(pricing.portraitTrainer).toBeGreaterThan(pricing.fastTraining)
    })

    it('should include description and features', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.text).toContain('Обучение Модели')
      expect(result.text).toContain('Генерация Фото')
      expect(result.text).toContain('Важные моменты')
      expect(result.text).toContain('Только ваши модели')
      expect(result.text).toContain('Персонализация')
      expect(result.text).toContain('Качество')
      expect(result.text).toContain('Безопасность')
      expect(result.text).toContain('Требования')
      expect(result.text).toContain('Примеры команд')
    })

    it('should include wizard flow steps', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.text).toContain('Шаг 1')
      expect(result.text).toContain('Шаг 2')
      expect(result.text).toContain('Шаг 3')
      expect(result.text).toContain('Шаг 4')
      expect(result.text).toContain('Шаг 5')
    })

    it('should include technical specifications', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.text).toContain('Время обучения')
      expect(result.text).toContain('Время генерации')
      expect(result.text).toContain('Формат изображений')
      expect(result.text).toContain('Фото')
      expect(result.text).toContain('Размер фото')
      expect(result.text).toContain('Формат вывода')
    })

    it('should include examples and requirements', async () => {
      const message: Memory = {
        content: { text: 'test' },
      } as Memory

      const result = await avatarFaceProvider.get(mockRuntime, message)

      expect(result.text).toContain('Примеры команд')
      expect(result.text).toContain('Обучение')
      expect(result.text).toContain('Генерация')
    })
  })

  describe('provider metadata', () => {
    it('should have correct name', () => {
      expect(avatarFaceProvider.name).toBe('AVATAR_FACE_PROVIDER')
    })

    it('should have correct description', () => {
      expect(avatarFaceProvider.description).toBe('Provides context for Avatar Face plugin (Digital Avatar Body + NeuroPhoto)')
    })
  })
})
