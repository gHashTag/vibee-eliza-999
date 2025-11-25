import { Action, ActionResult, ActionExample } from '@elizaos/core';
import { db, userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * FACE_TRAIN Action
 * Обучает LoRA модель через Fal.ai
 */
export const faceTrainAction: Action = {
  name: 'FACE_TRAIN',
  description: 'Обучает персональную LoRA модель из фотографий пользователя',

  validate: async (runtime, message) => {
    const text = message.content.text.toLowerCase();
    return text.includes('/face train') || text.includes('/face add');
  },

  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    const telegramId = message.entityId || message.id;
    const text = message.content.text;

    try {
      // Parse command: /face train MODEL_NAME
      const parts = text.split(' ');
      const modelName = parts.slice(2).join(' ').trim(); // Everything after "/face train"

      if (!modelName) {
        await callback({
          text: '❌ Пожалуйста, укажите имя модели. Пример: `/face train MyModel`',
          error: true,
        });

        return {
          success: false,
          text: 'Model name is required',
          data: { actionName: 'FACE_TRAIN', error: 'Model name missing' },
        };
      }

      // Sanitize model name
      const sanitizedName = modelName.replace(/[^a-zA-Z0-9_\s-]/g, '').trim();
      if (sanitizedName.length < 2 || sanitizedName.length > 50) {
        await callback({
          text: '❌ Имя модели должно содержать от 2 до 50 символов',
          error: true,
        });

        return {
          success: false,
          text: 'Model name length invalid',
          data: { actionName: 'FACE_TRAIN', error: 'Name length 2-50 required' },
        };
      }

      // Generate trigger word (sanitized model name + random suffix)
      const triggerWord = `${sanitizedName.toUpperCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // Check if user already has too many models
      const existingModels = await (db as any)
        .select()
        .from(userModels)
        .where(eq(userModels.telegram_id, parseInt(telegramId, 10)));

      if (existingModels.length >= 10) {
        await callback({
          text: '❌ У вас уже максимальное количество моделей (10). Удалите старые модели, чтобы создать новые.',
          error: true,
        });

        return {
          success: false,
          text: 'Max models limit reached',
          data: { actionName: 'FACE_TRAIN', error: 'Limit 10 models' },
        };
      }

      // Create model record in database
      const modelId = randomUUID();
      const now = new Date().toISOString();

      await (db as any).insert(userModels).values({
        id: modelId,
        telegram_id: parseInt(telegramId, 10),
        bot_name: runtime.character?.name || 'neuro_face_bot',
        model_name: sanitizedName,
        model_url: '', // Will be updated after training
        trigger_word: triggerWord,
        gender: 'person',
        status: 'training',
        is_active: true,
        metadata: JSON.stringify({ created_by: 'face_train_action' }),
        created_at: now,
        updated_at: now,
      });

      console.log(`[FACE_TRAIN] Created model record: ${modelId} for user ${telegramId}`);

      // Notify user to upload photos
      await callback({
        text: `✅ Модель "${sanitizedName}" создана! (trigger: ${triggerWord})\n\n📸 Теперь загрузите от 10 до 25 фотографий для обучения.\n\n💰 Стоимость обучения: ⭐ 200 звезд\n\nЯ начну обучение, как только получу фотографии!`,
        action: 'FACE_TRAIN',
      });

      return {
        success: true,
        text: `Model created: ${modelName}`,
        values: {
          model_id: modelId,
          model_name: sanitizedName,
          trigger_word: triggerWord,
          status: 'training',
        },
        data: {
          actionName: 'FACE_TRAIN',
          modelId,
          modelName: sanitizedName,
          triggerWord,
        },
      };

    } catch (error) {
      console.error('[FACE_TRAIN] Error:', error);

      await callback({
        text: '❌ Произошла ошибка при создании модели. Попробуйте позже.',
        error: true,
      });

      return {
        success: false,
        text: 'Failed to create model',
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          actionName: 'FACE_TRAIN',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },

  examples: [
    [
      { name: 'user', content: { text: '/face train MyFaceModel' } },
      { name: 'assistant', content: { text: 'Модель "MyFaceModel" создана! Загрузите фотографии для обучения.', action: 'FACE_TRAIN' } },
    ],
  ] as ActionExample[][],
};
