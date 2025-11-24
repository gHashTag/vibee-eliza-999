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

    // Commands (legacy support)
    if (text.includes('/face train') || text.includes('/face add')) {
      return true;
    }

    // Natural language intents for training
    const trainingIntents = [
      'обучить модель',
      'создать модель',
      'сделать модель',
      'создай модель',
      'создай лора',
      'обучить лора',
      'train model',
      'create model',
      'make model',
      'i want to train',
      'want to train',
      'create my model',
      'make my model',
    ];

    return trainingIntents.some((intent) => text.includes(intent));
  },

  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    const telegramId = message.entityId || message.id;
    const text = message.content.text;

    try {
      // Parse model name from various formats
      const modelName = extractModelName(text);

      if (!modelName) {
        await callback({
          text: '❌ Пожалуйста, укажите имя модели.\n\n**Как создать модель:**\nПросто скажите "обучить модель МОЯ_МОДЕЛЬ" и приложите фото.\n\nПример: "обучить модель Alex"',
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
          text: `❌ **Имя модели должно содержать от 2 до 50 символов**\n\nВы указали: "${modelName}"\nДлина: ${sanitizedName.length} символов\n\nПопробуйте короче: "Alex", "John", "MyModel"`,
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
    [
      { name: 'user', content: { text: 'обучить модель Alex' } },
      { name: 'assistant', content: { text: 'Модель "Alex" создана! Загрузите фотографии для обучения.', action: 'FACE_TRAIN' } },
    ],
  ] as ActionExample[][],
};

/**
 * Extract model name from various text formats
 */
function extractModelName(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Format: /face train MODEL_NAME
  if (lowerText.includes('/face train') || lowerText.includes('/face add')) {
    const parts = text.split(' ');
    const modelName = parts.slice(2).join(' ').trim();
    return modelName || null;
  }

  // Format: "обучить модель NAME", "create model NAME", etc.
  const patterns = [
    /обучить\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /создать\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /сделать\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /создай\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /train\s+model\s+([a-zA-Z0-9_\s-]+)/i,
    /create\s+model\s+([a-zA-Z0-9_\s-]+)/i,
    /make\s+model\s+([a-zA-Z0-9_\s-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}
