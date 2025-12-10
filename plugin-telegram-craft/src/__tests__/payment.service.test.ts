/**
 * Unit Tests for PaymentService
 *
 * Тестирование freemium модели (5 бесплатных фото)
 */
import { describe, it, expect, beforeEach } from 'bun:test'
import { PaymentService, FREE_PHOTOS_LIMIT, PRICES } from '../services/payment.service'

describe('PaymentService', () => {
  let service: PaymentService

  beforeEach(() => {
    service = new PaymentService()
  })

  describe('Freemium Photo Counter', () => {
    it('new user has all free photos available', () => {
      expect(service.hasFreePhotosRemaining('user1')).toBe(true)
      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT)
      expect(service.getFreePhotosUsed('user1')).toBe(0)
    })

    it('incrementFreePhotos decreases remaining count', () => {
      service.incrementFreePhotos('user1')
      expect(service.getFreePhotosUsed('user1')).toBe(1)
      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT - 1)
    })

    it('user loses free photos after limit', () => {
      // Use all free photos
      for (let i = 0; i < FREE_PHOTOS_LIMIT; i++) {
        expect(service.hasFreePhotosRemaining('user1')).toBe(true)
        service.incrementFreePhotos('user1')
      }

      // After limit - no more free photos
      expect(service.hasFreePhotosRemaining('user1')).toBe(false)
      expect(service.getFreePhotosRemaining('user1')).toBe(0)
      expect(service.getFreePhotosUsed('user1')).toBe(FREE_PHOTOS_LIMIT)
    })

    it('resetFreePhotos restores all free photos', () => {
      // Use all free photos
      for (let i = 0; i < FREE_PHOTOS_LIMIT; i++) {
        service.incrementFreePhotos('user1')
      }

      expect(service.hasFreePhotosRemaining('user1')).toBe(false)

      // Reset
      service.resetFreePhotos('user1')

      expect(service.hasFreePhotosRemaining('user1')).toBe(true)
      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT)
      expect(service.getFreePhotosUsed('user1')).toBe(0)
    })

    it('addBonusPhotos adds free photos', () => {
      // Use 3 photos
      service.incrementFreePhotos('user1')
      service.incrementFreePhotos('user1')
      service.incrementFreePhotos('user1')

      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT - 3)

      // Add 2 bonus photos
      service.addBonusPhotos('user1', 2)

      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT - 1)
      expect(service.getFreePhotosUsed('user1')).toBe(1)
    })

    it('addBonusPhotos does not go below 0 used', () => {
      // User has 0 used photos
      expect(service.getFreePhotosUsed('user1')).toBe(0)

      // Add 10 bonus photos (more than possible)
      service.addBonusPhotos('user1', 10)

      // Should not go below 0
      expect(service.getFreePhotosUsed('user1')).toBe(0)
      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT)
    })

    it('different users have independent counters', () => {
      // User1 uses 3 photos
      service.incrementFreePhotos('user1')
      service.incrementFreePhotos('user1')
      service.incrementFreePhotos('user1')

      // User2 uses 1 photo
      service.incrementFreePhotos('user2')

      expect(service.getFreePhotosUsed('user1')).toBe(3)
      expect(service.getFreePhotosUsed('user2')).toBe(1)

      expect(service.getFreePhotosRemaining('user1')).toBe(FREE_PHOTOS_LIMIT - 3)
      expect(service.getFreePhotosRemaining('user2')).toBe(FREE_PHOTOS_LIMIT - 1)
    })
  })

  describe('Configuration Constants', () => {
    it('FREE_PHOTOS_LIMIT is 5', () => {
      expect(FREE_PHOTOS_LIMIT).toBe(5)
    })

    it('PRICES are correctly defined', () => {
      expect(PRICES.PERSONAL_PHOTO).toBe(50)
      expect(PRICES.PREMIUM_PHOTO).toBe(100)
      expect(PRICES.PHOTO_PACK_5).toBe(200)
      expect(PRICES.PHOTO_PACK_10).toBe(350)
    })
  })

  describe('Service Properties', () => {
    it('has correct serviceType', () => {
      expect(service.serviceType).toBe('payment')
      expect(PaymentService.serviceType).toBe('payment')
    })

    it('isAvailable returns false before initialization', () => {
      expect(service.isAvailable()).toBe(false)
    })

    it('getBotApi returns null before initialization', () => {
      expect(service.getBotApi()).toBeNull()
    })
  })

  describe('Payment Info Management', () => {
    it('getPendingPayments returns empty array initially', () => {
      expect(service.getPendingPayments()).toEqual([])
    })

    it('getPaymentInfo returns undefined for unknown payload', () => {
      expect(service.getPaymentInfo('unknown')).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty userId', () => {
      expect(service.hasFreePhotosRemaining('')).toBe(true)
      service.incrementFreePhotos('')
      expect(service.getFreePhotosUsed('')).toBe(1)
    })

    it('handles numeric-like userId', () => {
      const userId = '123456789'
      service.incrementFreePhotos(userId)
      expect(service.getFreePhotosUsed(userId)).toBe(1)
      expect(service.hasFreePhotosRemaining(userId)).toBe(true)
    })

    it('handles very long userId', () => {
      const longUserId = 'a'.repeat(1000)
      service.incrementFreePhotos(longUserId)
      expect(service.getFreePhotosUsed(longUserId)).toBe(1)
    })
  })
})
