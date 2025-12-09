export * from './schemas.js'
export type { UserModel } from './schemas.js'

/**
 * Конфигурация сервиса обучения аватара
 */
export interface AvatarBodyTrainingServiceConfig {
  falApiKey: string
  falModelUrl: string
  timeout: number
  maxRetries: number
}

/**
 * Конфигурация сервиса генерации фото
 */
export interface AvatarPhotoGenerationServiceConfig {
  modelUrl: string
  triggerWord: string
  defaultSteps: number
  defaultGuidanceScale: number
}

/**
 * Опции обучения аватара
 */
export interface TrainAvatarBodyOptions {
  modelName: string
  modelType: 'flux-lora-portrait-trainer' | 'flux-lora-fast-training'
  gender: 'male' | 'female'
  imageUrls: string[]
}

/**
 * Результат обучения аватара
 */
export interface AvatarBodyTrainingResult {
  success: boolean
  modelId: string
  status: 'training' | 'completed' | 'failed'
  estimatedTime: number
  error?: string
}

/**
 * Опции генерации фото аватара
 */
export interface GenerateAvatarPhotoOptions {
  prompt: string
  modelId: string
  numImages?: number
  negativePrompt?: string
  steps?: number
  guidanceScale?: number
}

/**
 * Результат генерации фото аватара
 */
export interface AvatarPhotoGenerationResult {
  success: boolean
  imageUrls: string[]
  modelInfo: {
    modelId: string
    modelName: string
    triggerWord: string
  }
  metadata: {
    prompt: string
    generationTime: number
    cost: number
  }
  error?: string
}

/**
 * Информация о статусе обучения
 */
export interface TrainingStatus {
  modelId: string
  status: 'training' | 'completed' | 'failed'
  progress: number
  estimatedTimeRemaining: number
  error?: string
}

/**
 * Стоимость услуг
 */
export interface ServiceCost {
  stars: number
  currency: 'stars'
}

/**
 * Интерфейс сервиса базы данных пользовательских моделей
 */
export interface UserModelService {
  /**
   * Получение активных моделей пользователя
   */
  getActiveUserModels(
    telegramId: number,
    botName: string
  ): Promise<import('./schemas').UserModel[]>

  /**
   * Получение модели по ID
   */
  getUserModelById(modelId: string): Promise<import('./schemas').UserModel | null>

  /**
   * Создание новой записи о модели
   */
  createUserModel(model: Omit<import('./schemas').UserModel, 'id' | 'created_at' | 'updated_at'>): Promise<import('./schemas').UserModel>

  /**
   * Обновление статуса модели
   */
  updateModelStatus(
    modelId: string,
    status: 'training' | 'completed' | 'failed'
  ): Promise<void>

  /**
   * Активация/деактивация модели
   */
  setModelActive(modelId: string, isActive: boolean): Promise<void>
}
