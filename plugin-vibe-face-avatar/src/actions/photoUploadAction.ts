import { Action, ActionResult, ActionExample } from '@elizaos/core';
import { db, userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { startFalTraining } from '../services/falTrainingService';

/**
 * PHOTO_UPLOAD Action
 * Обрабатывает загруженные пользователем фотографии и запускает обучение LoRA
 */
export const photoUploadAction: Action = {
  name: 'PHOTO_UPLOAD',
  description: 'Обрабатывает загруженные фотографии и запускает обучение LoRA модели',

  validate: async (runtime, message) => {
    // Проверяем, есть ли в сообщении вложения (файлы/изображения)
    const hasAttachments = message.content.attachments && message.content.attachments.length > 0;

    // Проверяем, есть ли у пользователя модель в статусе "training"
    const telegramId = message.entityId || message.id;
    const trainingModels = await (db as any)
      .select()
      .from(userModels)
      .where(
        and(
          eq(userModels.telegram_id, parseInt(telegramId, 10)),
          eq(userModels.status, 'training'),
          eq(userModels.is_active, true)
        )
      );

    const hasTrainingModel = trainingModels.length > 0;

    console.log(`[PHOTO_UPLOAD] Validation: hasAttachments=${hasAttachments}, hasTrainingModel=${hasTrainingModel}`);

    return hasAttachments && hasTrainingModel;
  },

  handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
    const telegramId = message.entityId || message.id;
    const attachments = message.content.attachments || [];

    try {
      console.log(`[PHOTO_UPLOAD] Processing ${attachments.length} attachments for user ${telegramId}`);

      // Находим модель пользователя в статусе "training"
      const trainingModels = await (db as any)
        .select()
        .from(userModels)
        .where(
          and(
            eq(userModels.telegram_id, parseInt(telegramId, 10)),
            eq(userModels.status, 'training'),
            eq(userModels.is_active, true)
          )
        );

      if (trainingModels.length === 0) {
        await callback({
          text: '❌ У вас нет модели в процессе обучения. Сначала выполните команду /face train.',
          error: true,
        });

        return {
          success: false,
          text: 'No training model found',
          data: { actionName: 'PHOTO_UPLOAD', error: 'No training model' },
        };
      }

      // Берем первую модель (или можем добавить логику выбора)
      const model = trainingModels[0];
      console.log(`[PHOTO_UPLOAD] Found training model: ${model.model_name} (${model.id})`);

      // Проверяем количество фотографий
      if (attachments.length < 5) {
        await callback({
          text: `❌ Нужно минимум 5 фотографий для обучения. Вы загрузили только ${attachments.length}.`,
          error: true,
        });

        return {
          success: false,
          text: 'Too few photos',
          data: { actionName: 'PHOTO_UPLOAD', error: 'Minimum 5 photos required' },
        };
      }

      if (attachments.length > 25) {
        await callback({
          text: `❌ Максимум 25 фотографий для обучения. Вы загрузили ${attachments.length}.`,
          error: true,
        });

        return {
          success: false,
          text: 'Too many photos',
          data: { actionName: 'PHOTO_UPLOAD', error: 'Maximum 25 photos allowed' },
        };
      }

      // Извлекаем URL фотографий из вложений
      const photoUrls = attachments
        .filter((att: any) => att?.url || att?.filePath || att?.content)
        .map((att: any) => att.url || att.filePath || att.content);

      console.log(`[PHOTO_UPLOAD] Extracted ${photoUrls.length} photo URLs`);

      // Подтверждаем получение фотографий
      await callback({
        text: `✅ Получено ${attachments.length} фотографий для модели "${model.model_name}". Начинаю обучение...`,
        action: 'PHOTO_UPLOAD',
      });

      // Запускаем обучение в фоне
      startFalTraining({
        modelId: model.id,
        trigger_word: model.trigger_word,
        photo_urls: photoUrls,
        steps: 500, // Экономичный режим
        lora_rank: 16,
      }).catch((error) => {
        console.error(`[PHOTO_UPLOAD] Background training error for model ${model.id}:`, error);
      });

      return {
        success: true,
        text: 'Photo upload completed, training started',
        values: {
          model_id: model.id,
          model_name: model.model_name,
          photo_count: attachments.length,
          status: 'training_started',
        },
        data: {
          actionName: 'PHOTO_UPLOAD',
          modelId: model.id,
          photoCount: attachments.length,
        },
      };

    } catch (error) {
      console.error('[PHOTO_UPLOAD] Error:', error);

      await callback({
        text: '❌ Произошла ошибка при обработке фотографий. Попробуйте позже.',
        error: true,
      });

      return {
        success: false,
        text: 'Failed to process photos',
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          actionName: 'PHOTO_UPLOAD',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: {
          text: 'Вот мои фотографии',
          attachments: [
            { url: 'https://example.com/photo1.jpg' },
            { url: 'https://example.com/photo2.jpg' },
          ],
        },
      },
      {
        name: 'assistant',
        content: {
          text: 'Получено 2 фотографии. Начинаю обучение...',
          action: 'PHOTO_UPLOAD',
        },
      },
    ],
  ] as ActionExample[][],
};
