import { z } from "zod";

/**
 * Схема входных данных для генерации изображения
 */
export const GenerateImageInputSchema = z.object({
  prompt: z.string().min(3, "Промпт должен быть минимум 3 символа"),
  modelId: z.string().uuid().optional(), // ID модели пользователя (если есть)
  modelUrl: z.string().url().optional(), // URL модели Replicate (если общая)
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:3"]).default("9:16"),
  numImages: z.number().int().min(1).max(4).default(1),
  negativePrompt: z.string().optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

/**
 * Схема результата генерации
 */
export const GenerateImageOutputSchema = z.object({
  success: z.boolean(),
  imageUrls: z.array(z.string().url()),
  metadata: z.object({
    prompt: z.string(),
    model: z.string(),
    generationTime: z.number(),
    loraUsed: z.boolean().optional(),
    triggerWord: z.string().optional(),
  }),
  error: z.string().optional(),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Схема контекста действия
 */
export const NeuroPhotoActionContextSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string(),
  prompt: z.string().min(3),
  modelId: z.string().uuid().optional(),
  modelUrl: z.string().url().optional(),
  userId: z.string().uuid(),
});

export type NeuroPhotoActionContext = z.infer<
  typeof NeuroPhotoActionContextSchema
>;
