/**
 * @fileoverview Avatar Face Plugin - Service Pricing Configuration
 *
 * Centralized pricing configuration for Avatar Face services
 *
 * @author Vibe Team
 * @version 1.0.0
 */

/**
 * Конфигурация стоимости услуг
 */
export const SERVICE_PRICING = {
  /** Стоимость обучения модели Portrait Trainer */
  PORTRAIT_TRAINER: {
    stars: 550,
    description: 'Portrait Trainer (Premium Quality)',
    estimatedTimeMinutes: '15-30',
    steps: 2500,
  },

  /** Стоимость обучения модели Fast Training */
  FAST_TRAINING: {
    stars: 220,
    description: 'Fast Training (Quick)',
    estimatedTimeMinutes: '10-15',
    steps: 1000,
  },

  /** Стоимость генерации изображения */
  NEUROPHOTO: {
    stars: 7.5,
    description: 'AI Image Generation',
    descriptionRu: 'Генерация изображения',
  },
} as const

/**
 * Централизованная функция расчета стоимости
 */
export function calculateServiceCost(
  serviceType: 'train_portrait' | 'train_fast' | 'neuro_photo',
  params: { num_images?: number } = {}
): number {
  switch (serviceType) {
    case 'train_portrait':
      return SERVICE_PRICING.PORTRAIT_TRAINER.stars

    case 'train_fast':
      return SERVICE_PRICING.FAST_TRAINING.stars

    case 'neuro_photo':
      const numImages = params.num_images || 1
      return SERVICE_PRICING.NEUROPHOTO.stars * numImages

    default:
      throw new Error(`Unknown service type: ${serviceType}`)
  }
}

/**
 * Получение информации о стоимости услуги
 */
export function getServicePricingInfo(serviceType: 'train_portrait' | 'train_fast' | 'neuro_photo') {
  switch (serviceType) {
    case 'train_portrait':
      return SERVICE_PRICING.PORTRAIT_TRAINER

    case 'train_fast':
      return SERVICE_PRICING.FAST_TRAINING

    case 'neuro_photo':
      return SERVICE_PRICING.NEUROPHOTO

    default:
      throw new Error(`Unknown service type: ${serviceType}`)
  }
}
