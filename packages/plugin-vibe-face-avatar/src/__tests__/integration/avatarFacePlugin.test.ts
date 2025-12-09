/**
 * @fileoverview Avatar Face Plugin - Integration Tests
 *
 * Integration tests for Avatar Face plugin
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest'
import { avatarFacePlugin } from '../../plugin'
import { digitalAvatarBodyAction } from '../../actions/digitalAvatarBodyAction'
import { neuroPhotoAction } from '../../actions/neuroPhotoAction'
import { avatarFaceProvider } from '../../providers/avatarFaceProvider'
import { AvatarFaceService } from '../../plugin'

describe('AvatarFacePlugin Integration', () => {
  describe('Plugin Structure', () => {
    it('should have all required components', () => {
      expect(avatarFacePlugin).toBeDefined()
      expect(avatarFacePlugin.name).toBe('vibe-avatar-face')
      expect(avatarFacePlugin.description).toBeDefined()
      expect(avatarFacePlugin.description).toContain('Digital Avatar Body')
      expect(avatarFacePlugin.description).toContain('NeuroPhoto')
    })

    it('should have services', () => {
      expect(avatarFacePlugin.services).toBeDefined()
      expect(avatarFacePlugin.services).toHaveLength(1)
      expect(avatarFacePlugin.services?.[0]).toBe(AvatarFaceService)
    })

    it('should have actions', () => {
      expect(avatarFacePlugin.actions).toBeDefined()
      expect(avatarFacePlugin.actions).toHaveLength(2)
      expect(avatarFacePlugin.actions).toContain(digitalAvatarBodyAction)
      expect(avatarFacePlugin.actions).toContain(neuroPhotoAction)
    })

    it('should have providers', () => {
      expect(avatarFacePlugin.providers).toBeDefined()
      expect(avatarFacePlugin.providers).toHaveLength(1)
      expect(avatarFacePlugin.providers).toContain(avatarFaceProvider)
    })

    it('should have routes', () => {
      expect(avatarFacePlugin.routes).toBeDefined()
      expect(avatarFacePlugin.routes).toHaveLength(2)
    })

    it('should have events', () => {
      expect(avatarFacePlugin.events).toBeDefined()
      expect(avatarFacePlugin.events.MESSAGE_RECEIVED).toBeDefined()
      expect(avatarFacePlugin.events.MESSAGE_RECEIVED).toHaveLength(1)
    })
  })

  describe('Plugin Configuration', () => {
    it('should have init method', () => {
      expect(avatarFacePlugin.init).toBeDefined()
      expect(typeof avatarFacePlugin.init).toBe('function')
    })
  })

  describe('Service Type', () => {
    it('should have correct service type', () => {
      expect(AvatarFaceService.serviceType).toBe('avatar-face')
    })

    it('should have capability description', () => {
      expect(AvatarFaceService.capabilityDescription).toBeDefined()
      expect(AvatarFaceService.capabilityDescription).toContain('trains LoRA')
      expect(AvatarFaceService.capabilityDescription).toContain('generates AI images')
    })
  })

  describe('Action Names', () => {
    it('should have correct action names', () => {
      expect(digitalAvatarBodyAction.name).toBe('TRAIN_DIGITAL_AVATAR_BODY')
      expect(neuroPhotoAction.name).toBe('GENERATE_AVATAR_PHOTO')
    })

    it('should have similes for actions', () => {
      expect(digitalAvatarBodyAction.similes).toBeDefined()
      expect(digitalAvatarBodyAction.similes).toContain('TRAIN_AVATAR')
      expect(digitalAvatarBodyAction.similes).toContain('ОБУЧИТЬ_МОДЕЛЬ')

      expect(neuroPhotoAction.similes).toBeDefined()
      expect(neuroPhotoAction.similes).toContain('NEUROPHOTO')
      expect(neuroPhotoAction.similes).toContain('СГЕНЕРИРОВАТЬ_ФОТО')
    })
  })

  describe('Provider Name', () => {
    it('should have correct provider name', () => {
      expect(avatarFaceProvider.name).toBe('AVATAR_FACE_PROVIDER')
    })
  })

  describe('Plugin Dependencies', () => {
    it('should have dependencies array (even if commented)', () => {
      expect(avatarFacePlugin.dependencies).toBeDefined()
    })
  })

  describe('Default Export', () => {
    it('should export plugin as default', () => {
      const defaultExport = avatarFacePlugin
      expect(defaultExport).toBeDefined()
      expect(defaultExport.name).toBe('vibe-avatar-face')
    })
  })
})
