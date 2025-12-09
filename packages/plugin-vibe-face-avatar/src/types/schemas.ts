import { z } from 'zod'

/**
 * Схема входных данных для обучения модели
 */
export const TrainAvatarBodyInputSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string().min(1),
  modelName: z.string().min(2).max(50),
  modelType: z.enum(['flux-lora-portrait-trainer', 'flux-lora-fast-training']),
  gender: z.enum(['male', 'female']),
  imageUrls: z.array(z.string().url()).min(10).max(25),
})

export type TrainAvatarBodyInput = z.infer<typeof TrainAvatarBodyInputSchema>

/**
 * Схема результата обучения модели
 */
export const TrainAvatarBodyOutputSchema = z.object({
  success: z.boolean(),
  modelId: z.string().uuid(),
  status: z.enum(['training', 'completed', 'failed']),
  estimatedTime: z.number().int().positive(),
  error: z.string().optional(),
})

export type TrainAvatarBodyOutput = z.infer<typeof TrainAvatarBodyOutputSchema>

/**
 * Схема входных данных для генерации изображения
 */
export const GenerateAvatarPhotoInputSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string().min(1),
  prompt: z.string().min(3).max(500),
  modelId: z.string().uuid().optional(),
  numImages: z.number().int().min(1).max(4).default(1),
  negativePrompt: z.string().optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
})

export type GenerateAvatarPhotoInput = z.infer<typeof GenerateAvatarPhotoInputSchema>

/**
 * Схема результата генерации изображения
 */
export const GenerateAvatarPhotoOutputSchema = z.object({
  success: z.boolean(),
  imageUrls: z.array(z.string().url()),
  modelInfo: z.object({
    modelId: z.string(),
    modelName: z.string(),
    triggerWord: z.string(),
  }),
  metadata: z.object({
    prompt: z.string(),
    generationTime: z.number(),
    cost: z.number(),
  }),
  error: z.string().optional(),
})

export type GenerateAvatarPhotoOutput = z.infer<typeof GenerateAvatarPhotoOutputSchema>

/**
 * Схема пользовательской модели
 */
export const UserModelSchema = z.object({
  id: z.string().uuid(),
  telegram_id: z.number().int(),
  bot_name: z.string(),
  model_name: z.string(),
  model_url: z.string().url(),
  trigger_word: z.string(),
  gender: z.enum(['male', 'female', 'person']),
  status: z.enum(['training', 'completed', 'failed']),
  training_steps: z.number().int().optional(),
  training_model: z.enum(['flux-lora-portrait-trainer', 'flux-lora-fast-training']).optional(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  completed_at: z.date().optional(),
})

export type UserModel = z.infer<typeof UserModelSchema>

/**
 * Схема контекста действия
 */
export const AvatarFaceActionContextSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string(),
  action: z.enum(['train', 'generate']),
  userId: z.string(),
})

export type AvatarFaceActionContext = z.infer<typeof AvatarFaceActionContextSchema>
